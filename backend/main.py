import json
from typing import List

import requests
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine
from openrouter_client import call_openrouter
from schemas import (
    ActionItemOut,
    ActionItemUpdateRequest,
    MeetingDetail,
    MeetingSaveRequest,
    MeetingSaveResponse,
    MeetingUpdateRequest,
)

models.Base.metadata.create_all(bind=engine) # 앱 시작 시 정의한 meetings, action_items 테이블이 없으면 생성 (존재하면 생성 x )

app = FastAPI() # FastAPI 객체 생성


def get_db(): # 요청마다 DB 세션을 오픈 
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
    # yield + try/finally를 사용하여 세션이 항상 닫히는 걸 보장


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


@app.post("/meetings", response_model=MeetingSaveResponse) # response_model로 지정한 형식에 맞춰서 meeting객체 리턴 ( id , title , created_at )
def save_meeting(req: MeetingSaveRequest, db: Session = Depends(get_db)):
    # 타입 힌트로 req는 MeetingSaveRequest()를 실행한 객체, db는 get_db()를 실행한 객체 
    # 즉 , Fast api가 save_meeting() 실행 전에 req와 db를 자동으로 생성해서 전달
    
    meeting = models.Meeting( # 사용자로부터 최종 검증 받은 회의록 데이터를 SQLAlchemy 모델 객체로 변환
        title=req.title,
        raw_text=req.raw_text,
        decisions=req.decisions,
        discussions=req.discussions,
        action_items=[ models.ActionItem(task=item.task, assignee=item.assignee, due_date=item.due_date) for item in req.action_items])
   
    db.add(meeting) # db 버퍼에 객체 추가
    db.commit() # 실제 db 반영
    db.refresh(meeting) # DB가 부여한 PK값을 객체에 반영
    return meeting # 프론트로 값을 반환


@app.get("/meetings", response_model=List[MeetingSaveResponse]) # 목록 조회: 저장 응답과 동일한 요약 형태(id, title, created_at) 재사용
                                                                # MeetingSaveResponse(BaseModel)와 동일한 구조로 기초적인 회의록 목록 조회 
                                                            
def list_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.created_at.desc()).all() # 최신 회의록이 먼저 오게 기초적인 정렬
           # Meeting 테이블의 모든 회의록 조회하여 List형태로 반환        


@app.get("/meetings/{meeting_id}", response_model=MeetingDetail) # 상세 조회: action_items까지 포함한 전체 데이터 
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
                                      # WHERE절과 동일 -> meeting_id에 해당하는 회의록이 존재하면 meeting 객체 반환, 없으면 None 반환
    if meeting is None:
        raise HTTPException(status_code=404, detail="해당 회의록이 존재하지 않습니다")
    return meeting


@app.put("/meetings/{meeting_id}", response_model=MeetingDetail) # 특정 회의록 필드 전체 교체[수정] (action_items 목록 자체는 안 건드림)
def update_meeting(meeting_id: int, req: MeetingUpdateRequest, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if meeting is None:
        raise HTTPException(status_code=404, detail="해당 회의록이 존재하지 않습니다")

    meeting.title = req.title
    meeting.raw_text = req.raw_text
    meeting.decisions = req.decisions
    meeting.discussions = req.discussions

    db.commit()
    db.refresh(meeting)
    return meeting


@app.put("/action-items/{item_id}", response_model=ActionItemOut) # 액션아이템 필드 전체 교체[수정]
def update_action_item(item_id: int, req: ActionItemUpdateRequest, db: Session = Depends(get_db)):
    action_item = db.query(models.ActionItem).filter(models.ActionItem.id == item_id).first()
    if action_item is None:
        raise HTTPException(status_code=404, detail="해당 액션아이템이 존재하지 않습니다")

    action_item.task = req.task
    action_item.assignee = req.assignee
    action_item.due_date = req.due_date
    action_item.status = req.status

    db.commit()
    db.refresh(action_item)
    return action_item
