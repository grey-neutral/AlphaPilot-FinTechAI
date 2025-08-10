import os
import json
from typing import List
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Load environment variables from the backend directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for OpenAI API interactions"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.error("OPENAI_API_KEY environment variable is not found")
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Log the first few characters for debugging (security-safe)
        logger.info(f"OpenAI API key loaded: {self.api_key[:10]}...")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4.1-mini"  # Fast and cost-effective for ticker extraction
    
    def extract_tickers_from_text(self, user_input: str) -> List[str]:
        """
        Use OpenAI to extract stock ticker symbols from natural language input
        """
        try:
            ticker_extraction_prompt = self._build_ticker_extraction_prompt(user_input)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": ticker_extraction_prompt["system"]
                    },
                    {
                        "role": "user", 
                        "content": ticker_extraction_prompt["user"]
                    }
                ],
                temperature=0.1,  # Low temperature for consistent results
                max_tokens=200
            )
            
            # Extract the response content
            content = response.choices[0].message.content.strip()
            
            # Parse the JSON response
            try:
                result = json.loads(content)
                tickers = result.get("tickers", [])
                
                # Validate and clean tickers
                valid_tickers = []
                for ticker in tickers:
                    ticker = str(ticker).upper().strip()
                    if ticker and len(ticker) <= 5 and ticker.isalpha():
                        valid_tickers.append(ticker)
                
                logger.info(f"LLM extracted tickers: {valid_tickers} from input: '{user_input[:50]}...'")
                return valid_tickers[:10]  # Limit to 10 tickers
                
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse LLM response as JSON: {content}")
                return []
                
        except Exception as e:
            logger.error(f"OpenAI ticker extraction failed: {str(e)}")
            return []
    
    def _build_ticker_extraction_prompt(self, user_input: str) -> dict:
        """Build the prompt for ticker extraction"""
        system_prompt = """You are a financial analyst assistant that extracts stock ticker symbols from user queries.

Your task:
1. Identify all companies mentioned directly or indirectly in the user's text
2. Convert company names to their official stock ticker symbols traded on US exchanges
3. Return ONLY the official ticker symbols, never company names

Rules:
- Return a JSON object with a "tickers" array containing ONLY official ticker symbols
- Convert company names to tickers: Apple -> AAPL, Microsoft -> MSFT, Google -> GOOGL, etc.
- Include both explicitly mentioned tickers and company names converted to tickers
- Only return valid US stock tickers (1-5 uppercase letters)
- Maximum 10 tickers
- If no valid companies/tickers found, return {"tickers": []}

Examples:
Input: "Compare Apple and Microsoft"
Output: {"tickers": ["AAPL", "MSFT"]}

Input: "What's the valuation of NVDA vs AMD?"  
Output: {"tickers": ["NVDA", "AMD"]}

Input: "Show me FAANG stocks"
Output: {"tickers": ["META", "AAPL", "AMZN", "NFLX", "GOOGL"]}

Input: "Tesla compared to Ford and GM"
Output: {"tickers": ["TSLA", "F", "GM"]}

Input: "What's Tesla's EV/EBITDA vs Ford?"
Output: {"tickers": ["TSLA", "F"]}

IMPORTANT: Always return official ticker symbols, never company names or partial names."""

        user_prompt = f"Extract stock tickers from this text: \"{user_input}\""
        
        return {
            "system": system_prompt,
            "user": user_prompt
        }
    
    def analyze_financial_data(self, question: str, data_summaries: List[str]) -> str:
        """
        Analyze financial data and answer user questions about comps using OpenAI
        """
        try:
            # Build the financial analysis prompt
            system_prompt = """You are a financial analyst expert specializing in comparative company analysis and financial metrics.

Your role:
- Analyze financial data for multiple companies
- Answer questions about valuations, performance, ratios, and trends
- Provide clear, concise, and actionable insights
- Compare companies across key metrics when requested

Guidelines:
- Be specific with numbers and ratios
- Explain what the metrics mean in business terms
- Highlight significant differences between companies
- Use professional but accessible language
- Keep responses focused and informative"""

            # Format the financial data context
            data_context = "Financial data for analysis:\n" + "\n".join(data_summaries)
            
            user_prompt = f"""Based on the following financial data:

{data_context}

Question: {question}

Please provide a detailed analysis answering the user's question. Focus on the specific metrics they're asking about and provide context for what the numbers mean."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Better model for analysis
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Some creativity but mostly factual
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"Generated financial analysis response for question: '{question[:50]}...'")
            return content
            
        except Exception as e:
            logger.error(f"OpenAI financial analysis failed: {str(e)}")
            # Return a fallback response instead of the placeholder
            return f"I encountered an issue while analyzing the data. Based on the available information, I can see you're asking about {question}. Please try rephrasing your question or check the data in the table above."