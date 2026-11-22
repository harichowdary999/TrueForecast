# TrueForecast — RevOps & Revenue Forecasting Platform

A full-stack B2B Revenue Operations, Sales Pipeline, and Predictive ML Forecasting platform built with **React, JavaScript, Vite, Tailwind CSS, FastAPI, Scikit-Learn, and Neon PostgreSQL**.

---

## Project Structure

```text
TrueForecast/
├── backend/
│   ├── main.py                  # FastAPI REST endpoints & CORS configuration
│   ├── database.py              # SQLAlchemy engine & Neon PostgreSQL session setup
│   ├── models.py                # ORM models (Accounts, SalesReps, Deals, Tasks)
│   ├── ingest_crm.py            # Bulk CSV ingestion via psycopg2 execute_values
│   ├── ml_engine.py             # Vectorized deal closure probability inference
│   ├── train_model.py           # Calibrated Scikit-Learn Gradient Boosting trainer
│   ├── seed.py                  # Initial database seeding script
│   ├── model.pkl                # Serialized calibrated ML model artifact
│   └── requirements.txt         # Python backend dependencies
├── public/
│   ├── favicon.png              # Brand favicon
│   └── favicon.svg              # Vector favicon fallback
├── src/
│   ├── views/
│   │   ├── DashboardView.jsx    # Executive KPIs, pipeline health & team pulse
│   │   ├── PipelineView.jsx     # Interactive Kanban board & deal stage tracking
│   │   ├── ForecastView.jsx     # Weighted revenue pacing & quarterly forecast
│   │   ├── CustomersView.jsx    # Account directory with owner & status filters
│   │   ├── CustomerProfileView.jsx # Detailed customer account profile
│   │   ├── SalesRepsView.jsx    # Rep quota attainment & contact directory
│   │   ├── TasksView.jsx        # Activities, follow-ups & overdue tracking
│   │   ├── CrmAnalysisView.jsx  # Dynamic CSV upload & batch ML scoring
│   │   └── LoginView.jsx        # Admin authentication screen
│   ├── components/
│   │   ├── TopHeader.jsx        # Warm editorial navigation bar
│   │   ├── Footer.jsx           # Application footer
│   │   ├── CreateDealModal.jsx  # Modal form for creating live deals
│   │   ├── InteractiveDealsTable.jsx # Searchable, sortable pipeline table
│   │   └── DealDetailPage.jsx   # Full deal dossier & ML probability breakdown
│   ├── services/
│   │   └── api.js               # Centralized FastAPI client (VITE_API_URL)
│   ├── utils/
│   │   └── formatCurrency.js    # Indian Rupee (₹) formatting utilities
│   ├── App.jsx                  # Client routing & global state orchestration
│   ├── main.jsx                 # React entry point
│   └── index.css                # Warm editorial theme tokens (#eee6da palette)
├── index.html                   # HTML shell & favicon metadata
├── package.json                 # Frontend scripts & dependencies
├── vite.config.js               # Vite build configuration
└── vercel.json                  # SPA rewrite rules for Vercel deployment
```
