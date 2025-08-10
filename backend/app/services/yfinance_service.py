import yfinance as yf
import re
import time
from typing import List, Dict, Any, Optional
from app.models.schemas import MetricRow
import logging

logger = logging.getLogger(__name__)

class YFinanceService:
    """Service for fetching and calculating financial data from Yahoo Finance"""
    
    def __init__(self):
        self.cache = {}  # Simple in-memory cache for demo
    
    def parse_tickers_from_text(self, text: str) -> List[str]:
        """Extract ticker symbols from input text"""
        # Common patterns for tickers: 1-5 capital letters
        ticker_pattern = r'\b[A-Z]{1,5}\b'
        potential_tickers = re.findall(ticker_pattern, text.upper())
        
        # Filter out common false positives
        exclude_words = {
            'AND', 'OR', 'THE', 'FOR', 'WITH', 'FROM', 'TO', 'OF', 'IN', 'ON', 
            'AT', 'BY', 'IS', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING',
            'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID', 'WILL', 'WOULD', 'COULD',
            'SHOULD', 'MAY', 'MIGHT', 'CAN', 'SHALL', 'MUST', 'LTM', 'NTM',
            'EV', 'PE', 'EBITDA', 'COMPS'
        }
        
        # Only keep likely tickers (2-5 chars, not in exclude list)
        tickers = []
        for ticker in potential_tickers:
            if len(ticker) >= 2 and ticker not in exclude_words:
                tickers.append(ticker)
        
        # Remove duplicates and limit to 10 tickers
        return list(dict.fromkeys(tickers))[:10]
    
    def get_stock_data(self, tickers: List[str]) -> Dict[str, Any]:
        """Fetch basic stock data from Yahoo Finance"""
        stock_data = {}
        
        for ticker in tickers:
            try:
                # Check cache first
                if ticker in self.cache:
                    stock_data[ticker] = self.cache[ticker]
                    continue
                
                # Add small delay to avoid rate limits
                time.sleep(0.5)
                
                # Fetch from Yahoo Finance
                stock = yf.Ticker(ticker)
                info = stock.info
                history = stock.history(period="1d")
                
                if info and 'marketCap' in info and history is not None and not history.empty:
                    data = {
                        'ticker': ticker,
                        'marketCap': info.get('marketCap', 0),
                        'sharesOutstanding': info.get('sharesOutstanding', 0),
                        'totalDebt': info.get('totalDebt', 0),
                        'totalCash': info.get('totalCash', 0),
                        'revenue': info.get('totalRevenue', 0),
                        'ebitda': info.get('ebitda', 0),
                        'trailingEps': info.get('trailingEps', 0),
                        'forwardEps': info.get('forwardEps', 0),
                        'currentPrice': info.get('currentPrice', 0),
                        'currency': info.get('currency', 'USD')
                    }
                    
                    # Cache the result
                    self.cache[ticker] = data
                    stock_data[ticker] = data
                else:
                    logger.warning(f"Insufficient data for ticker: {ticker}")
                    
            except Exception as e:
                logger.error(f"Error fetching data for {ticker}: {str(e)}")
                continue
        
        return stock_data
    
    def calculate_ev(self, market_cap: float, debt: float, cash: float) -> float:
        """Calculate Enterprise Value: Market Cap + Debt - Cash"""
        return max(0, market_cap + debt - cash)
    
    def calculate_multiples(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate various financial multiples"""
        market_cap = data.get('marketCap', 0)
        debt = data.get('totalDebt', 0) 
        cash = data.get('totalCash', 0)
        revenue = data.get('revenue', 0)
        ebitda = data.get('ebitda', 0)
        trailing_eps = data.get('trailingEps', 0)
        forward_eps = data.get('forwardEps', 0)
        shares_outstanding = data.get('sharesOutstanding', 0)
        
        # Calculate EV
        ev = self.calculate_ev(market_cap, debt, cash)
        
        # Calculate multiples
        multiples = {
            'ev': ev,
            'evRevenueLTM': ev / revenue if revenue > 0 else 0,
            'evEbitdaLTM': ev / ebitda if ebitda > 0 else 0,
            'evEbitdaNTM': ev / ebitda if ebitda > 0 else 0,  # Using LTM for now
            'peLTM': market_cap / (trailing_eps * shares_outstanding) if trailing_eps > 0 and shares_outstanding > 0 else 0,
            'peNTM': market_cap / (forward_eps * shares_outstanding) if forward_eps > 0 and shares_outstanding > 0 else 0
        }
        
        return multiples
    
    def process_tickers(self, tickers: List[str]) -> List[MetricRow]:
        """Process multiple tickers and return MetricRow objects"""
        stock_data = self.get_stock_data(tickers)
        metric_rows = []
        
        for ticker, data in stock_data.items():
            try:
                multiples = self.calculate_multiples(data)
                
                metric_row = MetricRow(
                    ticker=ticker,
                    marketCap=data.get('marketCap', 0),
                    sharesOutstanding=data.get('sharesOutstanding', 0),
                    debt=data.get('totalDebt', 0),
                    cash=data.get('totalCash', 0),
                    revenue=data.get('revenue', 0),
                    ebitda=data.get('ebitda', 0),
                    eps=data.get('trailingEps', 0),
                    ev=multiples['ev'],
                    evRevenueLTM=multiples['evRevenueLTM'],
                    evEbitdaLTM=multiples['evEbitdaLTM'],
                    evEbitdaNTM=multiples['evEbitdaNTM'],
                    peLTM=multiples['peLTM'],
                    peNTM=multiples['peNTM']
                )
                
                metric_rows.append(metric_row)
                
            except Exception as e:
                logger.error(f"Error processing ticker {ticker}: {str(e)}")
                continue
        
        return metric_rows
    
    def analyze_text_input(self, text: str) -> List[MetricRow]:
        """Main method to analyze text input and return financial metrics"""
        # Extract tickers from text
        tickers = self.parse_tickers_from_text(text)
        
        if not tickers:
            return []
        
        # Process tickers and return metric rows
        return self.process_tickers(tickers)