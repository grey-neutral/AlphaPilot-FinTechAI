from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalysisRequest, AnalysisResponse, MetricRow
from app.services.yfinance_service import YFinanceService
from app.services.openai_service import OpenAIService
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
yfinance_service = YFinanceService()

# Initialize OpenAI service with error handling
try:
    openai_service = OpenAIService()
    llm_enabled = True
    logger.info("✅ OpenAI service initialized successfully")
except Exception as e:
    logger.error(f"❌ OpenAI service initialization failed: {e}. Falling back to regex parsing.")
    import traceback
    logger.error(traceback.format_exc())
    openai_service = None
    llm_enabled = False

@router.get("/test")
async def test_endpoint():
    return {"message": "API is working!", "endpoint": "/api/test"}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_tickers(request: AnalysisRequest):
    """Analyze tickers from text input using LLM + Yahoo Finance"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text input is required")
        
        # Step 1: Extract tickers using LLM (with fallback to regex)
        tickers = []
        extraction_method = "regex"  # Default fallback
        
        if llm_enabled and openai_service:
            try:
                # Use OpenAI to extract tickers from natural language
                logger.info(f"Attempting LLM extraction for: '{request.text}'")
                llm_tickers = openai_service.extract_tickers_from_text(request.text)
                logger.info(f"LLM returned: {llm_tickers} (type: {type(llm_tickers)})")
                
                if llm_tickers:
                    tickers = llm_tickers
                    extraction_method = "LLM"
                    logger.info(f"✅ LLM extracted {len(tickers)} tickers: {tickers}")
                    logger.info(f"Tickers going to Yahoo Finance: {tickers}")
                else:
                    logger.warning("LLM returned empty ticker list, falling back to regex")
            except Exception as e:
                logger.error(f"❌ LLM ticker extraction failed: {e}, falling back to regex")
                import traceback
                logger.error(traceback.format_exc())
        
        # Fallback to regex parsing if LLM failed or is disabled
        if not tickers:
            tickers = yfinance_service.parse_tickers_from_text(request.text)
            extraction_method = "regex"
        
        if not tickers:
            return AnalysisResponse(
                data=[],
                message="No valid tickers found in the input text. Try mentioning specific stock symbols (like AAPL, MSFT) or company names (like Apple, Microsoft).",
                processed_tickers=0
            )
        
        logger.info(f"Using {extraction_method} extraction: found {len(tickers)} tickers")
        
        # Step 2: Get financial data from Yahoo Finance
        metric_rows = yfinance_service.process_tickers(tickers)
        
        if not metric_rows:
            error_msg = f"Failed to load data from Yahoo Finance for tickers: {', '.join(tickers)}. This may be due to rate limits or API restrictions. Please try again in a few minutes."
            raise HTTPException(status_code=429, detail=error_msg)
        
        # Build success message with extraction method info
        success_message = f"Successfully analyzed {len(metric_rows)} tickers using {extraction_method} extraction: {', '.join([r.ticker for r in metric_rows])}"
        
        return AnalysisResponse(
            data=metric_rows,
            message=success_message,
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