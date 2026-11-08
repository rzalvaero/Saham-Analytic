import React, { useState } from 'react';
import { User, Shield, CheckCircle, XCircle } from 'lucide-react';

const SettingsPage = ({ user }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState(null);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setStatus({ type: 'error', message: 'Harap isi semua kolom password' });
      return;
    }

    try {
      const response = await fetch(`/api/user/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Password berhasil diubah!' });
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => setShowPasswordForm(false), 2000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Gagal mengubah password' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal terhubung ke server' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rt-card bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#0c1322] border-gray-800 p-5 sm:p-6 shadow-2xl">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">⚙️ Pengaturan Akun</h1>
        <p className="text-xs text-gray-400 mt-1">Kelola preferensi akun simulasi paper trading</p>
      </div>

      <div className="rt-card max-w-xl space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.username || 'Tamu / Guest'}</h2>
            <p className="text-xs text-gray-400 font-mono">User ID: #{user?.id || '0'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Saldo Akun Simulasi
            </label>
            <div className="p-3 bg-gray-950 border border-gray-850 rounded-xl text-emerald-400 font-mono font-bold text-base">
              Rp {user ? parseFloat(user.balance).toLocaleString('id-ID') : '0'}
            </div>
          </div>

          <div className="pt-2">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-700 transition"
              >
                Ganti Password
              </button>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-3 p-4 rounded-xl bg-gray-950 border border-gray-800">
                <h4 className="text-xs font-bold text-white">Perbarui Kata Sandi</h4>
                {status && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      status.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{status.message}</span>
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    placeholder="Password Lama"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password Baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
