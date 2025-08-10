from pydantic import BaseModel
from typing import List, Optional

class MetricRow(BaseModel):
    ticker: str
    marketCap: float
    sharesOutstanding: float
    debt: float
    cash: float
    revenue: float
    ebitda: float
    eps: float
    ev: float
    evRevenueLTM: float
    evEbitdaLTM: float
    evEbitdaNTM: float
    peLTM: float
    peNTM: float

class AnalysisRequest(BaseModel):
    text: str
    files: Optional[List[str]] = []

class AnalysisResponse(BaseModel):
    data: List[MetricRow]
    message: str
    processed_tickers: int

class ChatRequest(BaseModel):
    text: str
    context: List[MetricRow]

class ChatResponse(BaseModel):
    reply: str