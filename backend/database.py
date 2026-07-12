"""DB 연결 계층. 개발은 SQLite, 배포 시 DATABASE_URL만 바꿔서 RDS(PostgreSQL)로 교체."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./meeting_action.db") # ENV에 DB URL을 기본값으로 하되 , 없으면 SQLLITE의 로컬 파일을 사용 
                                                                               # 즉 , 테스트 시에는 SQLLITE를 사용하고 , 배포 시에는 DB_URL(RDS)로 교체 예정 

# FastAPI의 멀티스레드 환경(요청별 독립 세션 생성)에서 발생할 수 있는 SQLite의 단일 스레드 커넥션 제약 예외를 방지하기 위함.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args) # SQLAlchemy 엔진 생성 (DB 연결 및 커넥션 옵션 관리)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # DB세션을 생성하는 공장(SESSIONMAKER) 생성
# autocommit을 false로 설정하여 여러 트랜잭션을 묶어 작업 처리할 때 원자성을 보장하기 위함 
# autoflush를 false로 설정하여 DB버퍼에 자동 flush되는 것을 방지 
Base = declarative_base()
# 모든 DB 테이블 클래스(Meeting, ActionItem 등)가 상속받을 최상위 부모 클래스
# 하위 모델들의 구조(설계도)를 메타데이터로 관리하고 이후 engine과 결합하여 실제 물리 테이블을 생성하는 기준이 됨
