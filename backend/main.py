from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session

# Import from our app module
from database import init_db, get_db, User, Expense, Report

# Define request/response models
class UserLogin(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: Optional[datetime] = None
    username: str

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    date: datetime
    category: str
    user_id: int
    report_id: Optional[int] = None
    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    title: str
    username: str
    expense_ids: List[int]

class ReportResponse(BaseModel):
    id: int
    title: str
    status: str
    date: datetime
    user_id: int
    expenses: List[ExpenseResponse] = []
    class Config:
        from_attributes = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "gSpend API is running"}

@app.post("/api/login", response_model=UserResponse)
async def login(request: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        user = User(username=request.username)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.get("/api/expenses", response_model=List[ExpenseResponse])
async def get_expenses(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return []
    return db.query(Expense).filter(Expense.user_id == user.id).all()

@app.post("/api/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def add_expense(request: ExpenseCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_expense = Expense(
        title=request.title,
        amount=request.amount,
        category=request.category,
        user_id=user.id,
        date=request.date if request.date else datetime.utcnow()
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.put("/api/expenses/{id}", response_model=ExpenseResponse)
async def update_expense(id: int, request: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    if request.title is not None:
        expense.title = request.title
    if request.amount is not None:
        expense.amount = request.amount
    if request.category is not None:
        expense.category = request.category
    if request.date is not None:
        expense.date = request.date
        
    db.commit()
    db.refresh(expense)
    return expense

@app.delete("/api/expenses/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return None

@app.get("/api/reports", response_model=List[ReportResponse])
async def get_reports(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return []
    return db.query(Report).filter(Report.user_id == user.id).all()

@app.post("/api/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def add_report(request: ReportCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_report = Report(
        title=request.title,
        user_id=user.id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    if request.expense_ids:
        expenses = db.query(Expense).filter(Expense.id.in_(request.expense_ids), Expense.user_id == user.id).all()
        for exp in expenses:
            exp.report_id = new_report.id
        db.commit()
        db.refresh(new_report)
        
    return new_report
