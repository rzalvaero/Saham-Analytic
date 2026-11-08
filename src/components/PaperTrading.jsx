import React, { useState } from 'react';
import { Briefcase, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

const PaperTrading = ({ symbol, currentPrice = 0, user, onTrade }) => {
  const [qty, setQty] = useState(1); // in lots (1 lot = 100 lembar)
  const [loading, setLoading] = useState(false);

  const handleTrade = async (type) => {
    if (!user) return alert('Silakan login terlebih dahulu untuk simulasi');
    setLoading(true);
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          symbol,
          type,
          qty: parseInt(qty) * 100,
          price: currentPrice
        })
      });
      const result = await response.json();
      if (result.success) {
        onTrade(result.balance);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const total = qty * 100 * currentPrice;

  return (
    <div className="rt-card">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-850">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            Simulasi Eksekusi Saham (Paper)
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Latihan simulasi order {symbol} tanpa risiko modal riil
          </p>
        </div>
        <span className="text-[10px] bg-gray-900 text-gray-300 border border-gray-800 px-2 py-0.5 rounded font-mono">
          VIRTUAL
        </span>
      </div>

      {user ? (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-850 text-xs font-mono space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-sans">Saldo Virtual:</span>
              <span className="font-bold text-emerald-400">
                Rp {parseFloat(user.balance || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-sans">Harga Satuan:</span>
              <span className="text-gray-200 font-bold">
                Rp {(currentPrice || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium block mb-1">
              Jumlah Lot (1 Lot = 100 Lembar)
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-850 flex justify-between items-center text-xs">
            <span className="text-gray-400">Total Nilai Order:</span>
            <span className="font-mono font-bold text-cyan-300">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleTrade('BUY')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              Beli (Buy)
            </button>
            <button
              onClick={() => handleTrade('SELL')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              Jual (Sell)
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-gray-400 space-y-2 bg-gray-950/40 rounded-xl border border-dashed border-gray-800 p-4">
          <p>Login untuk mencoba simulasi paper trading saham {symbol}</p>
          <span className="inline-block text-[11px] text-cyan-400 font-medium">
            Gratis saldo virtual Rp 100.000.000 untuk pengujian strategi
          </span>
        </div>
      )}
    </div>
  );
};

export default PaperTrading;
