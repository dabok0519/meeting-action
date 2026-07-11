import json

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from openrouter_client import call_openrouter

app = FastAPI() # FastAPI 객체 생성 


class AnalyzeRequest(BaseModel): # data 스키마의 구조 , 필수 필드 여부 , 데이터 타입을 자동 검사 
    text: str # 사용자가 입력하는 회의록은 text(str) 형식  -> 데이터 타입 지정 


@app.post("/analyze") # FastAPI에서 /analyze 경로로 POST 요청이 들어오면 analyze 함수 실행 후 결과 반환  
def analyze(req: AnalyzeRequest):
    try:
        return call_openrouter(req.text)
    except requests.exceptions.Timeout: # 응답시간 초과 시 에러 처리 
        raise HTTPException( # HTTPException을 발생시켜 사용자에게 에러 상태 코드와 메시지를 전달
            status_code=504,  
            detail="AI 응답이 시간 내에 오지 않았습니다. 잠시 후 다시 시도해주세요.",
        )
    except requests.exceptions.HTTPError as e:  # 호출과 연결은 됐지만 서버가 "처리 실패"를 반환
        raise HTTPException(status_code=502, detail=f"AI 호출 실패: {e}")
    
    except json.JSONDecodeError: #  호출과 연결은 됐지만 그게 깨진 JSON이거나 JSON이 아닌 경우
        raise HTTPException(status_code=502, detail="AI 응답을 JSON으로 파싱하지 못했습니다.")
