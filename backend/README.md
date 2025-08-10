# AI-Powered Comps Spreader Backend

FastAPI backend for the AI-Powered Comps Spreader hackathon project.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pyenv (recommended)

### Setup & Run
```bash
# Set Python version (if using pyenv)
pyenv shell 3.11.11

# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 🌐 Endpoints

#### Core Endpoints
- **Root**: `GET /` - API info and status
- **Health**: `GET /health` - Health check
- **Docs**: `GET /docs` - Auto-generated API documentation

#### API Endpoints
- **Test**: `GET /api/test` - Test API connectivity
- **Analyze**: `POST /api/analyze` - Analyze tickers for comps (Phase 2)
- **Upload**: `POST /api/upload` - Upload & process documents (Phase 3)

### 📁 Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app with CORS
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py        # API route handlers
│   ├── services/
│   │   ├── __init__.py
│   │   ├── yfinance_service.py # Yahoo Finance integration
│   │   └── document_service.py # PDF/DOCX processing
│   └── models/
│       ├── __init__.py
│       └── schemas.py          # Pydantic models
├── requirements.txt
├── venv/                       # Virtual environment
└── README.md
```

### 🧪 Test Endpoints

```bash
# Test all endpoints
curl http://127.0.0.1:8000/
curl http://127.0.0.1:8000/health  
curl http://127.0.0.1:8000/api/test
```

Expected responses:
```json
{"message":"AI-Powered Comps Spreader API","version":"1.0.0","status":"running"}
{"status":"healthy","service":"comps-api"}
{"message":"API is working!","endpoint":"/api/test"}
```

### 📦 Dependencies
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **yfinance** - Yahoo Finance API wrapper
- **pdfplumber** - PDF text extraction
- **python-docx** - DOCX processing
- **python-multipart** - File upload support

### 🔧 CORS Configuration
Configured for frontend development:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

### 📋 Implementation Status

#### ✅ Phase 1: Core Backend Setup (COMPLETED)
- FastAPI project structure
- Virtual environment & dependencies
- CORS configuration
- Health check endpoints
- Basic API structure

#### 🚧 Phase 2: Yahoo Finance Integration (IN PROGRESS)
- YFinanceService class
- Ticker data fetching
- Financial calculations (EV, multiples)
- `/api/analyze` endpoint implementation

#### ⏳ Phase 3: Document Processing (PENDING)
- PDF/DOCX text extraction
- Financial metric parsing
- `/api/upload` endpoint

### 🎯 Development Notes
- Built for hackathon speed
- Focus on core functionality first
- Error handling kept simple but functional
- Ready for cloud deployment (Railway, Render, Vercel)

### 🔗 Frontend Integration
The frontend expects the backend to run on `http://127.0.0.1:8000` and calls:
- `POST /api/analyze` - Replace `analyzeMock()` in `src/pages/Index.tsx:98`
- `POST /api/upload` - Document processing integration

---

**Next Step**: Implement Phase 2 - Yahoo Finance Integration 🚀