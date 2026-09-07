# Saham Analytic Dashboard

A modern, real-time Stock and Forex tracking dashboard built with React, Vite, and Tailwind CSS. This application provides insights into Indonesian stocks (IDX) and global Forex/Commodities like Gold (XAU/USD).

## 🚀 Features

- **Real-Time Market Data**: Fetches live stock prices and historical charts using Yahoo Finance data.
- **Stock Screener**: Discover and search for Indonesian stocks (e.g., BBCA, GOTO, BBRI).
- **Forex & Gold Tracking**: Dedicated tab for monitoring global currencies and commodities (e.g., XAUUSD=X, GBPUSD=X).
- **Interactive Charts**: Visualizes stock performance over time.
- **Responsive Design**: Clean and modern UI that works perfectly on both desktop and mobile devices.
- **Dark Mode Support**: Beautiful dark theme for better visibility and reduced eye strain.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React (Icons)
- **Backend/API Proxy**: Express.js (used to bypass CORS when fetching from Yahoo Finance)
- **Data Source**: Yahoo Finance API (`yahoo-finance2`)
- **Deployment**: Vercel

## 💻 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rzalvaero/Saham-Analytic.git
   cd Saham-Analytic
   ```

2. Install dependencies for the frontend:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 🌐 Live Demo
You can access the live application at: [https://trade.reez.my.id/](https://trade.reez.my.id/)

---
*Created and maintained by [@rzalvaero](https://reez.my.id/).*
