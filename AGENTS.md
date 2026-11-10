# AGENTS.md — Aturan & Instruksi Operasional trade.reez.my.id (Reez Trade)

> **MANDATORI:** Setiap AI agent/asisten WAJIB membaca file ini dan `PRD.md` sebelum melakukan perubahan atau analisis kode di direktori `D:\Beekeper IT\analytic`.
> **Direktori Root Proyek:** `D:\Beekeper IT\analytic\`
> **Domain Live:** [https://trade.reez.my.id/](https://trade.reez.my.id/)
> **Target Git:** `https://github.com/rzalvaero/Saham-Analytic.git` (Branch: `main` — Auto Deploy ke Vercel)
> **Terakhir Diperbarui:** **2026-11-10 09:10 WIB**

---

## 1. Aturan Brand & Privasi (CRITICAL CONSTRAINTS)

1. **IDENTITAS PERSONAL (STRICT):**
   - Website ini adalah **MURNI PORTOFOLIO PRIBADI KOKO REZA (REEZ TRADE)**.
   - **DILARANG KERAS** menyebut nama kantor / perusahaan / "Beekeeper" / "Beekeeper Ecosystem" di seluruh antarmuka publik, metadata, kode frontend, maupun dokumentasi publik.
2. **LARANGAN SEBUTAN "AI":**
   - **DILARANG KERAS** menggunakan kata "AI", "ai", atau "Artificial Intelligence" di antarmuka publik atau domain.
   - Gunakan istilah alternatif yang profesional: **"Algoritma Kuantitatif"**, **"Model Statistik"**, **"Analisis Momentum Kuantitatif"**, atau **"Sistem Algoritmik"**.
3. **MATA UANG IDR MURNI (NO CENT / IDC MENTIONS):**
   - Seluruh saldo dan transaksi bersumber dari MetaTrader 5 (akun berlabel IDC) disajikan langsung sebagai **`IDR / Rupiah`** (misalnya balance 35 juta dibaca langsung sebagai Rp 35.xxx.xxx).
   - **DILARANG KERAS** menyebut kata "Cent", "cent", atau "IDC" di antarmuka publik. Label akun publik adalah **`Exness Real Account (IDR)`**.

---

## 2. Urutan Kartu Finansial & Tampilan Dashboard (Wajib)

Tampilan ringkasan metrik finansial pada `src/components/LiveTradingDashboard.jsx` **WAJIB** mengikuti urutan 5 kartu berikut:
1. **1. Saldo:** Saldo Balance dan Equity riil akun Exness.
2. **2. Winrate:** Akurasi rasio kemenangan (% Winrate) dan Profit Factor (PF).
3. **3. Profit:** Total keuntungan kotor (*Gross Win*) transaksi menang di bulan berjalan.
4. **4. Withdrawal:** Total penarikan dana sukses ke rekening (*Bank WD*) beserta bukti histori penarikan.
5. **5. PNL:** Hasil laba/rugi bersih (*Net Profit*) bulan berjalan.

*(Catatan: Kartu "Minus Berapa / Total Loss" telah dihapus dari antarmuka publik dan hanya dipantau pribadi oleh user).*

---

## 3. Struktur Tab & Desain UI

1. **Tab Navigasi Aktif (4 Tab):**
   - `live`: Live Trading (Dashboard portofolio MT5 real-time).
   - `saham`: Saham & IHSG (Chart teknikal, rekomendasi kuantitatif, summary bursa).
   - `forex`: Forex & Gold (Spot rates dan chart XAU/USD).
   - `discover`: Screener pasar terpadu (Most Active, Unusual Volume, Dividen, IPO baru).
   *(Tab Running Trade telah **dihapus permanen**).*
2. **Sistem Desain & Tema Gelap Institusional:**
   - Gunakan palet warna gelap terpadu (`bg-gray-950`, `bg-gray-900`, `border-gray-850`, `border-gray-750`).
   - Gunakan utility class kartu `rt-card`, badge `rt-badge`, dan font `JetBrains Mono` untuk angka finansial.
   - Mobile-First: Seluruh tabel dibungkus dengan wrapper `.rt-table-scroll-x` agar dapat digeser mulus di smartphone.

---

## 4. Sistem Proteksi Otomatis BTC (EA ReyFX-BTC)

1. **Fast BEP Anti-Panik:** Begitu posisi BTC profit $\ge$ **+$150 USD**, SL otomatis digeser ke level impas aman **+$30 USD** (Risk-Free).
2. **Multi-Tier Trailing Profit:**
   - Profit $\ge$ +$350 USD ➔ Kunci SL di +$150 USD.
   - Profit $\ge$ +$700 USD ➔ Kunci SL di +$450 USD.
   - Profit $\ge$ +$900 USD ➔ Kunci SL di +$700 USD.
3. **Pengawalan Order Manual:** Pengaturan `InpManageManual = true` memastikan order BTC manual dari smartphone/PC otomatis dikawal oleh EA.

---

## 5. Prosedur Wajib Build & Deployment Git

Setiap kali melakukan perubahan kode:
1. **Uji Build Lokal:**
   ```powershell
   npm --prefix "D:\Beekeper IT\analytic" run build
   ```
   Pastikan proses build Vite menghasilkan status sukses 100% tanpa error.
2. **Commit & Push:**
   ```powershell
   git -C "D:\Beekeper IT\analytic" add .
   git -C "D:\Beekeper IT\analytic" commit -m "feat/fix: pesan deskriptif"
   git -C "D:\Beekeper IT\analytic" push origin main
   ```
3. **Verifikasi Domain:**
   Cek live domain `https://trade.reez.my.id/` untuk memastikan perubahan tampil sempurna.
