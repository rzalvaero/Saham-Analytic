# PRD.md — trade.reez.my.id (Live Trading Portfolio & Analytic Ecosystem)

> **Status:** AKTIF (Living Document) — Direvisi: **2026-11-09 04:40 WIB**
> **Domain Live:** [https://trade.reez.my.id/](https://trade.reez.my.id/)
> **Hosting & Deployment:** Vercel (Auto-deployed dari repository `https://github.com/rzalvaero/Saham-Analytic.git`)
> **Direktori Proyek:** `D:\Beekeper IT\analytic`
> **Koneksi Akun Broker:** Exness Real Cent (Login: `452003470`, Server: `Exness-MT5Real48`, Mata Uang: `IDC`)
> **Konversi Mata Uang Mandatori:** **`100 IDC = Rp 1`** (`10,000,000 IDC = Rp 100.000`)

---

## 1. Tujuan Produk
Platform publik yang memungkinkan siapa saja (investor, komunitas, mitra, dan publik) untuk memverifikasi dan melihat secara transparan trading live Koko Reza / Beekeeper Ecosystem secara langsung dari MetaTrader 5:
1. **Posisi Terbuka Real-Time:** Mengetahui posisi apa saja yang sedang aktif (pair/simbol, BUY/SELL, ukuran lot, harga entry, harga saat ini, SL/TP, floating profit/loss dalam Rupiah dan IDC, serta nama strategi EA/Manual).
2. **Statistik Finansial Bulanan Transparan:**
   - **Bulan Ini Dapat Berapa:** Total *Gross Profit* dari seluruh trade yang menang di bulan berjalan.
   - **Minus Berapa:** Total *Gross Loss* dari trade yang ditutup merugi di bulan berjalan.
   - **Udah WD Berapa:** Total dana yang berhasil ditarik (*Withdrawal*) dari broker ke rekening bank beserta bukti riwayat transaksinya.
   - **Net PnL:** Laba/rugi bersih bulan berjalan.
   - **Saldo & Ketahanan Modal:** Saldo Balance dan Equity riil akun.
   - **Win Rate & Profit Factor:** Efektivitas statistik strategi.
3. **Peringkat Performa EA (Leaderboard):** Evaluasi performa masing-masing EA (`ReyFX-BTC`, `ReyFX-M15 Breakout`, `ReyFX-M15 EMA`, `ReyFX-M5`, `ReyFX-NewsStop`, dan `Manual Trades`).
4. **Riwayat 50 Transaksi Tertutup:** Bukti rekaman transaksi transparan.

---

## 2. Arsitektur Data & Integrasi Cloud
1. **Local Sync Worker (`sync_agent.py`):**
   - Berjalan di mesin lokal Windows tempat MetaTrader 5 aktif.
   - Mengambil data memori akun, posisi aktif, dan transaksi menggunakan modul `MetaTrader5`.
   - Mengunggah snapshot data terenkripsi via `POST /api/trade-live/sync` ke `https://trade.reez.my.id/`.
2. **Backend API (`server/index.js` on Vercel):**
   - Menerima payload sync dan menyimpannya di memory cache serta tabel database MySQL `mt5_live_state` (`194.233.65.45`).
   - Menyediakan endpoint publik `GET /api/trade-live` dengan CORS terbuka dan caching cepat.
3. **Frontend Dashboard (`src/` with React 19 + Tailwind CSS + Lucide Icons):**
   - Komponen utama `LiveTradingDashboard.jsx` menampilkan tampilan *Institutional Dark Glassmorphic*.
   - Auto-refresh setiap 2 detik tanpa flicker.
   - Toggle mata uang: Rupiah (`Rp`), Cent (`IDC`), atau Dual (`Keduanya`).
