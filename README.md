# Personal Finance Dashboard

A modern production-ready Personal Finance Dashboard built with React, Vite, Node.js, Express, Recharts, and AI-powered categorization.

## Features

- CSV upload with drag-and-drop support
- CSV validation for empty files, missing columns, invalid amounts, and malformed content
- AI-driven transaction categorization using OpenAI/Gemini API
- Responsive transaction table with manual category override
- Interactive charts: expense by category, monthly spending trend, and savings overview
- Summary cards for expenses, income, savings rate, highest spending category, and transaction count
- AI insights panel for smart spending observations
- Secure backend API with environment-based API key storage
- Deployable on Vercel (frontend) and Render (backend)

## Folder Structure

```
personal-finance-dashboard/
  backend/
    package.json
    .env.example
    src/
      index.js
      routes/
        upload.js
        categorize.js
        health.js
  frontend/
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      App.jsx
      styles.css
      components/
        Header.jsx
        CSVUpload.jsx
        DashboardCards.jsx
        TransactionTable.jsx
        CategoryEditor.jsx
        PieChartView.jsx
        TrendChart.jsx
        SavingsChart.jsx
        AIInsights.jsx
      utils/
        constants.js
        analytics.js
README.md
```

## Installation

1. Clone or copy the repository.
2. Install backend dependencies:

```bash
cd personal-finance-dashboard/backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Environment Setup

Create a `.env` file in `backend/` using `.env.example`.

```env
PORT=4000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
```

If using Gemini, configure the Gemini endpoint and key instead.

## Running Locally

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend app:

```bash
cd ../frontend
npm run dev
```

Open the Vite server URL shown in the terminal and upload a CSV to begin.

## API Configuration

- `POST /api/upload`: Upload a CSV file field named `file`
- `POST /api/categorize`: Send a JSON body with `transactions` array
- `GET /api/health`: Health check endpoint

### Example categorize request body

```json
{
  "transactions": [
    { "date": "2026-06-01", "description": "Swiggy", "amount": -350 }
  ]
}
```

## Deployment

### Backend (Render)

1. Push the backend folder to a Git repository.
2. Create a new Render Web Service with root set to `backend`.
3. Set the start command to `npm start`.
4. Add environment variables in Render:
   - `OPENAI_API_KEY`
   - `OPENAI_API_BASE`
   - `PORT` (optional)
5. Deploy.

### Frontend (Vercel)

1. Push the frontend folder to a Git repository.
2. Create a new Vercel project with root set to `frontend`.
3. Set build command to `npm run build` and output directory to `dist`.
4. Set environment variables if needed for API base URLs.
5. Deploy.

> For local use, the frontend proxies `/api` to `http://localhost:4000` while in development.

## Screenshots

> Add screenshots here after running the app locally. Example placeholders:
> - Upload screen with drag-and-drop area
> - Dashboard cards and charts
> - Transaction table with category overrides

## Notes

- API keys are stored only in the backend `.env` file.
- The AI categorization endpoint is proxied through the backend to avoid exposing secrets.
- Manual category changes immediately refresh chart summaries and insights.
