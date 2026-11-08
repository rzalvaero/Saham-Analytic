# AGENTS.md — Aturan & Instruksi Operasional analytic / trade.reez.my.id

> **Baca ini sebelum memodifikasi file di direktori `D:\Beekeper IT\analytic`.**
> **Direktori Root:** `D:\Beekeper IT\analytic\`
> **Domain Live:** `https://trade.reez.my.id/`
> **Terakhir Diperbarui:** **2026-11-09 04:40 WIB**

---

## 1. Aturan Dasar & Standar Kualitas
1. **Mandatory Pre-Flight Check:** Setiap AI agent wajib membaca `PRD.md` dan mematuhi panduan ini.
2. **Konversi Mata Uang Mandatori:**
   - Mata uang akun Exness Cent: **`IDC`**.
   - Formula konversi: **`100 IDC = Rp 1`** (`1 IDC = Rp 0.01`).
   - Seluruh nilai nominal WAJIB menyertakan estimasi Rupiah (`~Rp ...`).
3. **Keamanan & Read-Only Public Exposure:**
   - Endpoint publik `GET /api/trade-live` bersifat strictly **read-only**. Tidak ada kredensial trading atau hak eksekusi order yang diekspos ke publik.
   - Endpoint `POST /api/trade-live/sync` dilindungi token rahasia `SYNC_SECRET`.
4. **Verifikasi Build Sebelum Push/Deploy:**
   - Selalu jalankan `npm run build` sebelum push ke git origin/main untuk memastikan Vercel build berhasil 100%.

---

## 2. Peta File Utama
- `PRD.md`: Spesifikasi produk dan arsitektur data.
- `AGENTS.md`: Aturan operasional agent.
- `server/index.js`: Express serverless backend untuk Vercel.
- `src/components/LiveTradingDashboard.jsx`: Komponen dashboard trading live.
- `src/App.jsx`: Main routing & layout container.
- `sync_agent.py`: Worker background lokal untuk sync MT5 -> `https://trade.reez.my.id/`.
- `START_SYNC.bat`: Skrip 1-klik untuk menjalankan worker sync di Windows.
