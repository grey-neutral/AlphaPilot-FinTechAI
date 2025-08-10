from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalysisRequest, AnalysisResponse, MetricRow
from app.services.yfinance_service import YFinanceService
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize YFinance service
yfinance_service = YFinanceService()

@router.get("/test")
async def test_endpoint():
    return {"message": "API is working!", "endpoint": "/api/test"}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_tickers(request: AnalysisRequest):
    """Analyze tickers from text input and return financial metrics"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text input is required")
        
        logger.info(f"Analyzing text: {request.text[:100]}...")
        
        # Extract tickers first to provide better feedback
        tickers = yfinance_service.parse_tickers_from_text(request.text)
        
        if not tickers:
            return AnalysisResponse(
                data=[],
                message="No valid tickers found in the input text",
                processed_tickers=0
            )
        
        logger.info(f"Found tickers: {tickers}")
        
        # Use YFinanceService to analyze the text
        metric_rows = yfinance_service.process_tickers(tickers)
        
        if not metric_rows:
            # Check if it's a rate limit issue
            error_msg = f"Failed to load data from Yahoo Finance for tickers: {', '.join(tickers)}. This may be due to rate limits or API restrictions. Please try again in a few minutes or with fewer tickers."
            raise HTTPException(status_code=429, detail=error_msg)
        
        return AnalysisResponse(
            data=metric_rows,
            message=f"Successfully analyzed {len(metric_rows)} tickers: {', '.join([r.ticker for r in metric_rows])}",
            processed_tickers=len(metric_rows)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_tickers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/upload")
async def upload_documents():
    # TODO: Implement in Phase 3
    return {"message": "Upload endpoint - coming in Phase 3"}