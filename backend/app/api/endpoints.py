from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalysisRequest, AnalysisResponse, MetricRow, ChatRequest, ChatResponse
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

@router.post("/chat", response_model=ChatResponse)
async def chat_about_data(request: ChatRequest):
    """Answer questions about financial data using LLM"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Question text is required")
        
        if not request.context:
            return ChatResponse(
                reply="I don't have any financial data to analyze yet. Please first run an analysis with some tickers (like 'analyze AAPL and MSFT') and then ask me questions about the results."
            )
        
        # Use OpenAI service if available
        if llm_enabled and openai_service:
            try:
                logger.info(f"Processing chat question: '{request.text}' with {len(request.context)} companies")
                
                # Format the financial data for better LLM understanding
                data_summary = []
                for row in request.context:
                    summary = f"{row.ticker}: Market Cap ${row.marketCap:,.0f}M, P/E {row.peLTM:.1f}x, Debt ${row.debt:,.0f}M, Cash ${row.cash:,.0f}M, Revenue ${row.revenue:,.0f}M, EBITDA ${row.ebitda:,.0f}M"
                    data_summary.append(summary)
                
                # Get LLM response about the data
                response = openai_service.analyze_financial_data(request.text, data_summary)
                return ChatResponse(reply=response)
                
            except Exception as e:
                logger.error(f"LLM chat failed: {e}")
                # Fall through to simple response
        
        # Fallback to simple data analysis
        companies = [row.ticker for row in request.context]
        response = f"I can see data for {len(companies)} companies: {', '.join(companies)}. "
        
        # Simple keyword-based responses
        question_lower = request.text.lower()
        
        if "market cap" in question_lower:
            sorted_by_cap = sorted(request.context, key=lambda x: x.marketCap, reverse=True)
            largest = sorted_by_cap[0]
            smallest = sorted_by_cap[-1]
            response += f"By market cap: {largest.ticker} is largest at ${largest.marketCap:,.0f}M, while {smallest.ticker} is smallest at ${smallest.marketCap:,.0f}M."
            
        elif "debt" in question_lower:
            debt_info = [(row.ticker, row.debt, row.cash) for row in request.context]
            response += "Debt levels: " + ", ".join([f"{ticker} has ${debt:,.0f}M debt and ${cash:,.0f}M cash" for ticker, debt, cash in debt_info])
            
        elif "revenue" in question_lower:
            sorted_by_revenue = sorted(request.context, key=lambda x: x.revenue, reverse=True)
            response += "By revenue: " + ", ".join([f"{row.ticker} ${row.revenue:,.0f}M" for row in sorted_by_revenue])
            
        elif "pe" in question_lower or "p/e" in question_lower:
            pe_info = [(row.ticker, row.peLTM) for row in request.context if row.peLTM > 0]
            if pe_info:
                sorted_pe = sorted(pe_info, key=lambda x: x[1])
                response += "P/E ratios: " + ", ".join([f"{ticker} {pe:.1f}x" for ticker, pe in sorted_pe])
            else:
                response += "P/E ratio data is not available for these companies."
                
        else:
            # Generic comparison
            response += "Here's a quick comparison:\n"
            for row in request.context:
                response += f"• {row.ticker}: ${row.marketCap:,.0f}M market cap, P/E {row.peLTM:.1f}x, ${row.revenue:,.0f}M revenue\n"
        
        return ChatResponse(reply=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return ChatResponse(
            reply=f"I encountered an error while analyzing the data: {str(e)}. Please try rephrasing your question."
        )

@router.post("/upload")
async def upload_documents():
    # TODO: Implement in Phase 3
    return {"message": "Upload endpoint - coming in Phase 3"}