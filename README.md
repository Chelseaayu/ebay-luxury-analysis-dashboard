# eBay Luxury Sales Analytics Dashboard

> **Data Analyst Project** — End-to-end analysis of a luxury goods eBay seller covering 250+ transactions across Jan–Dec 2024.

**[Live Demo →](https://your-project.vercel.app)**

---

## Overview

This project demonstrates a complete data pipeline from raw eBay export data to a production-ready interactive dashboard, built to answer three core business questions:

1. Which brands and product categories drive the most revenue?
2. Who are the highest-value buyers and how loyal are they?
3. What geographic and seasonal patterns exist in luxury goods sales?

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data Cleaning | Python, Pandas |
| Feature Engineering | Regex, custom brand/category extraction |
| Database | Supabase (PostgreSQL) |
| API | Supabase auto-generated REST API |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Map | react-simple-maps + d3-scale |
| Styling | Custom CSS (light mode, gold aesthetic) |
| Deployment | Vercel |

---

## Features

- **9 interactive charts** — area chart, stacked bar, horizontal bar, donut pie, choropleth map
- **US Revenue Heatmap** — hover any state to see exact revenue and order count
- **Bilingual** — full English / Bahasa Indonesia toggle (all chart labels, KPIs, titles)
- **Live data** — fetched directly from Supabase at runtime, no static JSON
- **KPI cards** — total revenue, AOV, repeat buyer rate, auth pass rate, international %
- **Detailed pipeline** — 6-step analysis pipeline with per-step breakdown

---

## Dashboard Sections

| Section | Charts |
|---|---|
| KPI Overview | 7 metric cards |
| Revenue Over Time | Area chart (revenue + orders) |
| Brand & Category | 2× horizontal bar charts |
| Stacked Monthly | Stacked bar by brand |
| Geographic | US choropleth map + top 10 states bar |
| Buyer Behaviour | 2× donut pie + domestic vs international bar |
| Operational | Auth verification avg price + fulfilment speed |
| Key Insights | 6 annotated business insight cards |

---

## Project Structure

```
luxury-dashboard/
├── public/
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase client init
│   │   └── queries.js       # Data fetching + aggregation logic
│   ├── App.jsx              # Main dashboard component
│   ├── main.jsx             # React entry point
│   └── index.css            # All styles
├── .env.example             # Environment variable template
├── .env.local               # Your credentials (not committed)
├── .gitignore
├── vercel.json              # Vercel deployment config
├── index.html
├── package.json
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project with the `sales` table (see setup below)

### 1. Clone the repository
```bash
git clone https://github.com/Chelseaayu/ebay-luxury-analysis-dashboard.git
cd luxury-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## Supabase Setup

### Create the table
Run this in **Supabase → SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS sales (
  id                    BIGSERIAL PRIMARY KEY,
  sales_record_number   TEXT,
  order_number          TEXT,
  buyer_username        TEXT,
  buyer_city            TEXT,
  buyer_state           TEXT,
  buyer_country         TEXT,
  item_title            TEXT,
  brand                 TEXT,
  category              TEXT,
  price                 NUMERIC,
  shipping              NUMERIC,
  tax                   NUMERIC,
  total                 NUMERIC,
  sale_date             DATE,
  shipped_date          DATE,
  ship_by_date          DATE,
  month_num             DATE,
  auth_passed           BOOLEAN,
  is_promoted           BOOLEAN,
  is_intl               BOOLEAN,
  processing_days       NUMERIC,
  auth_status           TEXT,
  shipping_service      TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON sales FOR SELECT USING (true);
```

### Upload data
From the project root (where `alizt.csv` is located):
```bash
pip install supabase pandas
python upload_to_supabase.py
```

---

## Deployment to Vercel

### Option A — Vercel CLI (recommended)
```bash
npm install -g vercel
vercel
```
Follow the prompts. When asked about environment variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Framework: **Vite** (auto-detected)
4. Add environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

> ⚠️ Never commit `.env.local` — it's in `.gitignore`. Always set credentials via Vercel's dashboard environment variables.

---

## Data Pipeline

```
eBay CSV Export
     ↓
Python + Pandas (cleaning, dedup, type normalization)
     ↓
Regex Feature Engineering (brand extraction, category classification)
     ↓
Supabase PostgreSQL (upload via supabase-py, RLS policies)
     ↓
React + Recharts Dashboard (live REST API queries)
     ↓
Vercel (CI/CD deployment)
```

---

## Key Insights

- **Hermès** dominates revenue through ultra-high AOV items (Birkin, Kelly)
- **Q4 (Oct–Dec)** is peak season — inventory should be secured by September
- **CA, NY, FL** account for the majority of domestic revenue
- Items with **authentication verification** command measurably higher average prices
- A small group of **VIP buyers (3+ orders)** generates disproportionate lifetime value

---

## License

This project is for portfolio purposes. Data has been anonymized — seller identity is redacted.

---

*Built by [Chelsea and Kiro AI] · [LinkedIn](https://www.linkedin.com/in/chelseaayu) · [Portfolio](https://chelsea-ayu.vercel.app/)*
