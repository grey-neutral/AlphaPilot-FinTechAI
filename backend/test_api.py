#!/usr/bin/env python3
"""
Test script for the YFinance API integration
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_analyze_endpoint():
    """Test the /api/analyze endpoint with real tickers"""
    url = f"{BASE_URL}/api/analyze"
    
    # Test data
    test_cases = [
        {
            "name": "Basic Tech Stocks",
            "text": "Generate LTM and NTM EV/EBITDA comps for AAPL, MSFT, GOOGL"
        },
        {
            "name": "Semiconductor Companies", 
            "text": "Analyze NVDA, AMD, INTC for comparison"
        },
        {
            "name": "Mixed Input",
            "text": "I want to compare TSLA and F with some revenue multiples"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print(f"Input: {test_case['text']}")
        
        try:
            response = requests.post(url, json={
                "text": test_case["text"],
                "files": []
            })
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success: {data['message']}")
                print(f"Tickers processed: {data['processed_tickers']}")
                
                # Print first ticker details if available
                if data['data']:
                    first_ticker = data['data'][0]
                    print(f"Sample data for {first_ticker['ticker']}:")
                    print(f"  Market Cap: ${first_ticker['marketCap']:,.0f}")
                    print(f"  EV: ${first_ticker['ev']:,.0f}")
                    print(f"  EV/Revenue: {first_ticker['evRevenueLTM']:.2f}")
                    print(f"  P/E: {first_ticker['peLTM']:.2f}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    print("🚀 Testing AI-Powered Comps Spreader API")
    print("=" * 50)
    
    # Test basic connectivity first
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is healthy")
        else:
            print("❌ Backend health check failed")
            exit(1)
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Make sure the backend is running on http://127.0.0.1:8000")
        exit(1)
    
    # Test the analyze endpoint
    test_analyze_endpoint()
    
    print("\n" + "=" * 50)
    print("✅ Testing complete!")