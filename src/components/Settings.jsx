import React, { useState } from 'react';
import { User, Shield, CheckCircle, XCircle } from 'lucide-react';

const SettingsPage = ({ user }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

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
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Pengaturan</h1>
        <p className="text-muted">Kelola preferensi akun dan aplikasi</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>{user?.username || 'Guest'}</h2>
            <p className="text-muted">Administrator</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Saldo Tersedia (Virtual)</label>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1.25rem', fontWeight: '600', color: 'var(--positive)' }}>
              Rp {user ? parseFloat(user.balance).toLocaleString('id-ID') : '0'}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-accent-primary" /> Keamanan
            </h3>
            
            {!showPasswordForm ? (
              <button 
                onClick={() => setShowPasswordForm(true)}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
              >
                Ubah Password
              </button>
            ) : (
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {status && (
                  <div style={{ padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--positive)' : 'var(--negative)' }}>
                    {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {status.message}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password Lama</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password Baru</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan</button>
                  <button type="button" onClick={() => setShowPasswordForm(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
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
