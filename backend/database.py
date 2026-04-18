import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import time

# Fallback to SQLite if no Cloud SQL connection info is provided
connection_name = os.getenv("DB_CONNECTION_NAME")
db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")
db_user = os.getenv("DB_USER", "default") 

if connection_name and db_password:
    # Construct URL for Cloud SQL via Unix Socket
    DATABASE_URL = f"postgresql+pg8000://{db_user}:{db_password}@/{db_name}?unix_sock=/cloudsql/{connection_name}/.s.PGSQL.5432"
    print(f"Connecting to Cloud SQL database: {db_name}")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///expenses.db")
    print(f"Connecting to fallback database: {DATABASE_URL}")

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    expenses = relationship("Expense", back_populates="user")

class Expense(Base):
    __tablename__ = 'expenses'
    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    user = relationship("User", back_populates="expenses")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'amount': self.amount,
            'date': self.date.isoformat(),
            'category': self.category,
            'user_id': self.user_id
        }

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
  """Initializes the database."""
  retries = 3
  for i in range(retries + 1):
    try:
      Base.metadata.create_all(bind=engine)
      print("Database initialized successfully.")
      return
    except Exception as e:
      if i < retries:
        print(f"Database initialization failed (attempt {i+1}/{retries+1}): {e}. Retrying in 5 seconds...")
        time.sleep(5)
      else:
        print(f"Database initialization failed after {retries} retries: {e}")
        raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
