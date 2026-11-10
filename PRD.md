# PRD.md — trade.reez.my.id (Portofolio Pribadi Koko Reza / REEZ Trade)

> **Status:** AKTIF (Living Document) — Direvisi: **2026-11-10 09:05 WIB**
> **Domain Live:** [https://trade.reez.my.id/](https://trade.reez.my.id/)
> **Hosting & Deployment:** Vercel (Auto-deployed dari repository `https://github.com/rzalvaero/Saham-Analytic.git`)
> **Direktori Proyek:** `D:\Beekeper IT\analytic`
> **Koneksi Akun Broker:** Exness Real Account IDR (Login: `452****70`, Server: `Exness-MT5Real48`)
> **Identitas Portofolio:** Murni Portofolio Pribadi Koko Reza (Reez Trade) — **DILARANG** menyebut nama kantor / "Beekeeper".
> **Konversi Mata Uang Mandatori:** Nilai MT5 langsung disajikan sebagai **`IDR / Rupiah`** (angka balance ~35 juta langsung dibaca Rp 35.xxx.xxx). **DILARANG** menyebut kata "Cent", "cent", atau "IDC" di seluruh antarmuka publik.
> **Larangan Sebutan AI:** **DILARANG** menggunakan sebutan "AI" di antarmuka publik. Seluruh model analitik disebut sebagai **Algoritma Kuantitatif / Analisis Statistik & Momentum**.

---

## 1. Tujuan Produk
Platform publik transparan yang memungkinkan siapa saja memverifikasi performa transaksi live trading pribadi Koko Reza (Reez Trade) langsung dari terminal MetaTrader 5 secara real-time:
1. **Posisi Terbuka Real-Time:** Memantau seluruh order aktif (simbol/pair, BUY/SELL, ukuran lot, harga entry, harga saat ini, level SL/TP, floating PnL dalam Rupiah, durasi aktif, dan strategi bot/manual).
2. **Lima (5) Metrik Finansial Utama (Urutan Wajib):**
   - **1. Saldo:** Saldo Balance dan Equity riil akun Exness Real IDR.
   - **2. Winrate:** Akurasi persentase trade menang dan nilai Profit Factor (PF).
   - **3. Profit:** Total keuntungan kotor (*Gross Win*) transaksi menang di bulan berjalan.
   - **4. Withdrawal:** Total dana yang berhasil ditarik (*Bank WD*) ke rekening pribadi beserta bukti histori transaksi.
   - **5. PNL:** Hasil laba/rugi bersih (*Net Profit*) bulan berjalan.
   *(Catatan: Kartu "Minus Berapa / Total Loss" telah dihapus dari antarmuka publik dan hanya dipantau pribadi via Telegram).*
3. **Peringkat Performa EA & Strategi (Leaderboard):** Evaluasi performa strategi (`ReyFX-BTC`, `ReyFX-M15 Breakout`, `ReyFX-M15 EMA`, `ReyFX-M5`, `ReyFX-NewsStop`, dan `Manual Trades`).
4. **50 Transaksi Tertutup Terakhir (Deals OUT):** Rekaman riwayat eksekusi transparan.
5. **Pasar Saham Indonesia (IDX) & Screener:** Data realtime Yahoo Finance untuk emiten BEI (^JKSE, BBCA, BBRI, dll), sinyal algoritma momentum (RSI 14 & MA), sentimen berita, dan screener (Most Active, Unusual Volume, Dividen, IPO baru).
6. **Forex & Gold:** Pemantauan spot rate mata uang global dan komoditas Emas (XAU/USD).

---

## 2. Fitur & Tab Navigasi Aktif
Navigasi website disederhanakan menjadi 4 tab utama (Tab *Running Trade* telah **dihapus permanen**):
- **1. Live Trading:** Dashboard utama streaming langsung dari terminal MT5.
- **2. Saham & IHSG:** Grafik interaktif candlestick, MA 14, ringkasan bursa (IHSG level, Volume, Turnover), dan rekomendasi kuantitatif.
- **3. Forex & Gold:** Kurs nilai tukar global dan chart komoditas Emas (XAU/USD).
- **4. Discover:** Market screener terpadu untuk saham teraktif, lonjakan volume, jadwal dividen, dan evaluasi IPO baru.

---

## 3. Sistem Proteksi SL+ Khusus Bitcoin (EA ReyFX-BTC)
EA `ReyFX-BTC` (`Magic: 778899`) mengoperasikan sistem pengamanan multi-tier otomatis yang juga mengamankan posisi manual (`Magic: 0`):
1. **Fast BEP Anti-Panik (Fase 0):** Begitu harga BTC bergerak profit $\ge$ **+$150 USD** ➔ SL otomatis digeser ke **+$30 USD** (Risk-Free Trade).
2. **Multi-Tier Cuan Lock:**
   - Profit $\ge$ **+$350 USD** ➔ Kunci SL di **+$150 USD**.
   - Profit $\ge$ **+$700 USD** ➔ Kunci SL di **+$450 USD**.
   - Profit $\ge$ **+$900 USD** ➔ Kunci SL di **+$700 USD**.
3. **Pengawalan Order Manual:** Pengaturan `InpManageManual = true` memastikan order manual BTC koko dari smartphone/PC otomatis terlindungi oleh bot saat profit berjalan.

---

## 4. Arsitektur Teknis & Standar SEO
1. **Local Sync Worker (`sync_agent.py` & `START_SYNC.bat`):**
   - Menghubungkan API native Python `MetaTrader5` ke terminal trading lokal.
   - Mengirim snapshot posisi terbuka dan statistik bulanan via `POST /api/trade-live/sync`.
2. **Backend API (`server/index.js` di Vercel Serverless):**
   - Menerima payload sinkronisasi terenkripsi dengan proteksi `SYNC_SECRET`.
   - Mengelola cache in-memory cepat dan fallback timeout aman (maks 3000ms).
   - Menyediakan endpoint publik `GET /api/trade-live`.
3. **Frontend UI System (React + Tailwind CSS + Lightweight Charts):**
   - Menggunakan tema institusional terpadu `rt-card`, `rt-badge`, dan font `JetBrains Mono`.
   - Touch gestures mobile-first: Tabel dibungkus `.rt-table-scroll-x` independen dengan petunjuk geser interaktif.
4. **Standar SEO & Agentic Web:**
   - Metadata lengkap: Canonical, Robots, Theme Color, Geo ID, Author `Koko Reza (Reez Trade)`.
   - Open Graph preview banner (`public/og-image.png`, 1200x630).
   - Schema.org JSON-LD terstruktur (`WebSite`, `Person`, `WebApplication`).
   - File teknis: `public/robots.txt`, `public/sitemap.xml`, `public/manifest.json`, dan `public/llms.txt`.
