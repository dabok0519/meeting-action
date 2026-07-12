"""저장 엔드포인트 요청/응답 검증용 pydantic 스키마. SQLAlchemy 모델(models.py)과는 별개 계층."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ActionItemIn(BaseModel): #  MeetingSaveRequest내  하위 액션 아이템 리스트를 검사 스키마  
    task: str
    assignee: Optional[str] = None 
    due_date: Optional[str] = None # 타입은 문자열 + 값 Optional + 프론트엔드(최종)에서 값을 안보내는 경우 None처리 (회의 이후에 결정될 경우 대비) 


class MeetingSaveRequest(BaseModel): #  Meeting 저장 요청 데이터 스키마 : 프론트엔드가 수정한 최종 회의록 데이터를 받아 검사 
    title: str
    raw_text: str
    # Decision과 Discussion은 복수로 들어올 수 있으므로 List[str]로 정의
    decisions: List[str] 
    discussions: List[str]
    action_items: List[ActionItemIn] # 1:N 관계형 저장을 위한 하위 액션아이템 리스트


class MeetingSaveResponse(BaseModel): #  Meeting 저장 응답 데이터 스키마 : 회의록 저장 성공 시 프론트엔드로 전달할 응답 데이터
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True
    # pydantic 모델은 기본적으로 딕셔너리 형태로 읽지만, SQLAlchemy 모델을 통해 생성된 ORM 객체의 속성에서도 값을 읽어올 수 있게 허용


class ActionItemOut(BaseModel): # Actionitem 조회 응답용 스키마 :  ActionItemIn(입력)과 달리 DB가 채운 id/status/생성시각까지 포함
    id: int
    task: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingDetail(BaseModel): # 회의록 상세 조회용 스키마 :  목록 조회용(MeetingSaveResponse(BaseModel)과 달리 raw_text/decisions/discussions/action_items까지 전부 포함
    id: int
    title: str
    raw_text: str
    decisions: List[str]
    discussions: List[str]
    action_items: List[ActionItemOut] # 리스트 안의 각 액션아이템 객체도 하나하나 ActionItemOut 기준으로 같이 검사
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True