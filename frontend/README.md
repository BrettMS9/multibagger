# Multibagger Stock Screener - Frontend

A React TypeScript frontend for the Multibagger Stock Screener, implementing the Yartseva Quality Factor Model for stock analysis.

## Features

- **Single Stock Analysis**: Deep dive into individual stocks with detailed factor breakdowns
- **Bulk Screener**: Screen entire exchanges (NSE, BSE, NASDAQ, NYSE) at once
- **Yartseva Quality Factors**: Nine-factor scoring system with visual breakdowns
- **Real-time Data**: Integration with backend API for live stock data
- **Responsive Design**: Tailwind CSS for clean, professional UI

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS v4** for styling
- **TanStack Query** for data fetching and caching
- **Recharts** for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file (copy from `.env.example`):

```bash
VITE_API_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/src/
├── components/
│   ├── Header.tsx           # App header
│   ├── TickerSearch.tsx     # Search input component
│   ├── ScoreCard.tsx        # Detailed factor breakdown
│   ├── ScoreGauge.tsx       # Circular score visualization
│   └── BulkScreener.tsx     # Exchange-wide screening
├── hooks/
│   └── useStockScreen.ts    # React Query hooks
├── services/
│   └── api.ts               # API client
├── types/
│   └── index.ts             # TypeScript interfaces
├── App.tsx                  # Main app with tabs
└── main.tsx                 # Entry point
```

## Yartseva Quality Factors

1. **Free Cash Flow Yield** (Most Important) - Measures cash generation relative to price
2. **Return on Invested Capital (ROIC)** - Capital efficiency metric
3. **Earnings Quality** - Accruals-based earnings quality assessment
4. **Leverage** - Debt management (lower is better)
5. **Growth** - Revenue and earnings growth trends
6. **Earnings Surprise** - Consistency of beating estimates
7. **Price Range** (Contrarian) - 52-week price positioning
8. **Momentum** (Contrarian) - Recent price performance
9. **Size** - Market capitalization factor

## Classification System

- **STRONG BUY**: Score >= 75% of maximum
- **MODERATE BUY**: Score >= 50% of maximum
- **WEAK BUY**: Score >= 25% of maximum
- **AVOID**: Score < 25% of maximum

## API Integration

The frontend expects the backend to provide these endpoints:

- `GET /screen/{ticker}` - Single stock analysis
- `GET /bulk-screen/{exchange}` - Bulk exchange screening

## Development Notes

- Uses Tailwind CSS v4 with `@import "tailwindcss"` syntax
- Color scheme: Blue and slate for professional financial aesthetic
- Fully typed with TypeScript for type safety
- Query caching with TanStack Query for optimal performance
