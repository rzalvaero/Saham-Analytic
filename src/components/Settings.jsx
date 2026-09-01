import React from 'react';
import { User, Shield } from 'lucide-react';

const SettingsPage = ({ user }) => {
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
            <button style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
              Ubah Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
