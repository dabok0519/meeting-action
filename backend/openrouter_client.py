"""OpenRouter 호출 + 회의록 구조화 로직. test_openrouter.py, main.py에서 공용으로 사용."""
import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["OPENROUTER_API_KEY"]
MODEL = os.environ["OPENROUTER_MODEL"]

SYSTEM_PROMPT = """너는 회의록을 구조화하는 어시스턴트다.
아래 JSON 스키마를 정확히 지켜서, 다른 설명 없이 JSON만 출력해라.

{
  "decisions": ["문자열", ...],
  "action_items": [
    {"task": "문자열", "assignee": "문자열 또는 null", "due_date": "문자열 또는 null"}
  ],
  "discussions": ["문자열", ...]
}

규칙:
- decisions: 회의에서 확정된 결정사항만.
- action_items: 실제로 누군가 하기로 한 작업. 원문에 담당자(assignee)나 기한(due_date)이 명시되지 않았으면
  반드시 null로 두고, 절대로 지어내지 마라.
- discussions: 결정되지 않고 논의만 되었거나 다음으로 미룬 사항.
- 원문에 없는 내용을 추가하지 마라.
- 회의 내용이 아니거나 추출할 내용이 없으면, 모든 배열(decisions, action_items, discussions)을 빈 배열로 반환하라.
"""
# 1차 방지  : 이때 빈 배열은 할루시네이션 방지 


def call_openrouter(meeting_text: str, max_retries: int = 3) -> dict: 
    # OpenRouter 무료 모델은 업스트림(Google AI Studio 등)에서 자주 429 에러가 발생해 max_retires를 통해 최대 재시도 횟수를 3번으로 설정 ( 백오프 설정 )
    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": meeting_text},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0,
                },
                timeout=30, # 최대 대기 시간 설정 
            )
            if response.status_code == 429: # 1. 429 에러 재시도 
                last_error = requests.exceptions.HTTPError(response.text, response=response) # 발생한 예외 저장 
                time.sleep(5 * (attempt + 1)) # 재시도 횟수가 늘어날 수록 대기 시간 증대 ( 선형 백오프 )
                continue
            response.raise_for_status() # 2. 429 외 다른 에러 발생 시 재시도 없이 함수 종료 ( 그 외 에러는 발생한 적이 없지만 혹시 모르니 대비 ) 
            break
        except requests.exceptions.Timeout as e: # 3. Timeout 발생 시 예외 처리 (재시도)
            last_error = e
            time.sleep(5 * (attempt + 1))
    else:
        raise last_error # 호출 실패 시 결과 전달 

    content = response.json()["choices"][0]["message"]["content"]

    # 일부 모델이 ```json ... ``` 코드블록으로 감싸서 줄 때 대비 -> 무료 모델이 여러 번 429 에러를 발생시켜 여러 모델을 사용하다 보니 예방책 설정 
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    parsed = json.loads(content)

    # 회의에 따라 결정사항/액션아이템/논의사항 중 일부가 실제로 없을 수 있기 때문에 모델이 해당 키 자체를 빼고 줄 경우(빈 {}만 온 적도 있음) 빈 배열로 보정
    for key in ("decisions", "action_items", "discussions"):
        parsed.setdefault(key, []) # 2차 방지 : 모델이 해당 키를 빼고 줄 경우 빈 배열로 보정

    return parsed
