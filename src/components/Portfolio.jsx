import React, { useState, useEffect } from 'react';
import { Briefcase, Lock, User, LogIn, UserPlus, RefreshCw, CheckCircle2 } from 'lucide-react';

const Portfolio = ({ user, onLogin, authMode, setAuthMode }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Silakan masukkan username dan password');
      return;
    }

    if (authMode === 'register' && !email) {
      setLoginError('Silakan masukkan email');
      return;
    }

    const endpoint = authMode === 'register' ? '/api/register' : '/api/login';
    const bodyData =
      authMode === 'register' ? { username, password, email } : { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        const errData = await response.json();
        setLoginError(errData.error || `Gagal ${authMode === 'register' ? 'mendaftar' : 'login'}`);
      }
    } catch (err) {
      setLoginError('Gagal terhubung ke server');
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] py-6">
        <div className="rt-card max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'register' ? 'Daftar Akun Paper' : 'Akses Portofolio Paper'}
            </h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              {authMode === 'register'
                ? 'Buat akun untuk simulasi investasi virtual (Saldo awal Rp 100.000.000)'
                : 'Login untuk mengakses watchlist kustom dan simulasi order paper trading Anda'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl text-center font-medium">
                {loginError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-xl py-2 pl-10 pr-3 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-xl py-2 pl-10 pr-3 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500 rounded-xl py-2 pl-10 pr-3 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/20 cursor-pointer"
            >
              {authMode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" /> Daftar Sekarang
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Masuk Portofolio
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-gray-500">
              {authMode === 'register' ? 'Sudah memiliki akun? ' : 'Belum memiliki akun? '}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                className="text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                {authMode === 'register' ? 'Masuk di sini' : 'Daftar di sini'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        <span>Memuat portofolio paper...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-800 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rt-badge rt-badge-live mb-2">SIMULASI PAPER TRADING</span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              💼 Portofolio Kepemilikan Saham
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Catatan aset saham virtual Anda (User: {user.username}) • Saldo: Rp{' '}
              {parseFloat(user.balance || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {portfolio.length === 0 ? (
        <div className="rt-card text-center py-12 px-4 space-y-3">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Kepemilikan Saham</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Anda belum melakukan order beli pada simulasi. Buka tab <strong>Saham &amp; IHSG</strong> untuk memulai transaksi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((item) => {
            const totalInvested = item.qty * item.avg_price;
            return (
              <div key={item.symbol} className="rt-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-mono">{item.symbol}</h3>
                  <span className="rt-badge rt-badge-buy font-mono">{item.qty} Lembar</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-gray-800">
                  <div className="flex justify-between text-gray-400">
                    <span>Harga Rata-rata:</span>
                    <span className="text-gray-200">
                      Rp {parseFloat(item.avg_price).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Total Modal:</span>
                    <span className="text-cyan-400 font-bold">
                      Rp {totalInvested.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
