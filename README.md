# Comp-Scribe: AI-Powered Financial Comps Spreader

A modern web application for analyzing financial tickers and generating comprehensive company comparison tables with AI-powered insights and document processing capabilities.

## 🚀 Project Overview

Comp-Scribe is a financial analysis tool that helps users:
- Analyze company tickers and generate financial metrics tables
- Compare companies using key financial ratios (EV/EBITDA, P/E, etc.)
- Process financial documents (PDFs, DOCX) with AI-powered text extraction
- Chat with AI about financial data and get insights
- Export data in Excel format for further analysis

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18.3.1** - Modern React with hooks and functional components
- **TypeScript 5.8.3** - Type-safe JavaScript development
- **Vite 5.4.19** - Fast build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library built on Radix UI
- **React Router DOM 6.30.1** - Client-side routing
- **React Hook Form 7.61.1** - Performant forms with validation
- **Zod 3.25.76** - TypeScript-first schema validation
- **TanStack React Query 5.83.0** - Server state management
- **TanStack React Table 8.21.3** - Powerful table component
- **Lucide React 0.462.0** - Beautiful icon library
- **Sonner 1.7.4** - Toast notifications
- **Recharts 2.15.4** - Charting library
- **React Dropzone 14.3.8** - File upload handling
- **XLSX 0.18.5** - Excel file generation

### Backend Technologies
- **FastAPI 0.104.1** - Modern Python web framework
- **Uvicorn 0.24.0** - ASGI server for production
- **Python 3.11+** - Core runtime
- **Pydantic** - Data validation using Python type annotations
- **yfinance 0.2.65** - Yahoo Finance API integration
- **OpenAI 1.30.0** - AI-powered text analysis
- **pdfplumber 0.10.3** - PDF text extraction
- **python-docx 1.1.0** - DOCX document processing
- **python-multipart 0.0.6** - File upload support
- **requests 2.32.4** - HTTP library
- **python-dotenv 1.0.0** - Environment variable management

### Development Tools
- **ESLint 9.32.0** - Code linting and formatting
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing
- **SWC** - Fast TypeScript/JavaScript compilation
- **Tailwind CSS Typography** - Rich text styling

## 🏗️ Architecture

### Frontend Architecture
- **Component-based** - Modular React components with shadcn/ui
- **State Management** - React Query for server state, local state for UI
- **Routing** - Single-page application with React Router
- **Styling** - Tailwind CSS with custom component variants
- **Type Safety** - Full TypeScript coverage with Zod validation

### Backend Architecture
- **RESTful API** - FastAPI with automatic OpenAPI documentation
- **Service Layer** - Modular services for different functionalities
- **Data Models** - Pydantic schemas for request/response validation
- **CORS Support** - Configured for frontend development
- **Async Processing** - Non-blocking I/O operations

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Git**

### Frontend Setup
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd comp-scribe

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

### Environment Variables
Create a `.env` file in the backend directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 📁 Project Structure

```
comp-scribe/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AppSidebar.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── ModernChat.tsx
│   │   ├── PromptBar.tsx
│   │   └── ResultsTable.tsx
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main application component
├── backend/               # Backend Python code
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Data models
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI application
│   └── requirements.txt   # Python dependencies
├── public/                # Static assets
├── package.json           # Frontend dependencies
└── tailwind.config.ts     # Tailwind configuration
```

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend
- `python -m uvicorn app.main:app --reload` - Development server
- `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000` - Production server

## 🌐 API Endpoints

- `GET /` - API information and status
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `POST /api/analyze` - Analyze financial tickers
- `POST /api/upload` - Process financial documents

## 🚀 Deployment

### Frontend
The frontend can be deployed to any static hosting service:
- **Vercel** - Recommended for React apps
- **Netlify** - Great for static sites
- **GitHub Pages** - Free hosting for open source
- **AWS S3 + CloudFront** - Enterprise solution

### Backend
The backend can be deployed to:
- **Railway** - Simple Python deployment
- **Render** - Free tier available
- **Heroku** - Traditional choice
- **AWS Lambda** - Serverless option
- **DigitalOcean** - VPS hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Frontend**: Built with React + TypeScript + Vite
- **Backend**: FastAPI + Python
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
