"""meetings(회의록) : action_items(액션아이템) = 1 : N 관계 모델."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Meeting(Base): # BASE를 상속받아 테이블 CLASS 설계 
    __tablename__ = "meetings" # 테이블 명 지정 

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False) # 제목 필수 -> 회의록 관리 서비스이기에 이후 목록관리에서 어려움 
    raw_text = Column(Text, nullable=False)
    
    # decisions/discussions는 AI가 뽑아주는 문자열 배열이라 JSON으로 저장
    decisions = Column(JSON, nullable=False, default=list)
    discussions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # SERVER_DEFAULT를 통해 모든 시간 기준을 데이터베이스(DB Server)로 통일 
                                                                            # 즉 , 서버 시계와 상관없이 DB 서버 시계 기준으로 시간 기록 (서버마다 미세한 시간차이 )
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) # 회의록 업데이트(수정)시에 자동으로 시간 갱신 

    action_items = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan" # back_populates를 통해 상호 참조 설정  
    )                                                                        # cascade 옵션을 통해 회의록 삭제 시 관련 액션아이템도 함께 삭제되도록 설정


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    task = Column(String, nullable=False)
    assignee = Column(String, nullable=True) 
    # 사용자가 입력한 비정형 텍스트("다음주 금요일" 등) 수용 및 DB 저장 에러 방지를 위함 
    # 사용자가 화면에서 직접 검토 및 수정하여 저장할 수 있게 설정 예정 
    due_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default="대기")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    meeting = relationship("Meeting", back_populates="action_items")
