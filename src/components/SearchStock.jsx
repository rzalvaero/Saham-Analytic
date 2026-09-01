import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';

const SearchStock = ({ onAddSymbol }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onAddSymbol(query.toUpperCase().trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ position: 'relative', width: '300px' }}>
      <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari kode saham (ex: ANTM)..." 
        style={{ 
          width: '100%', 
          background: 'rgba(255,255,255,0.05)', 
          border: '1px solid var(--border-color)', 
          padding: '10px 40px', 
          borderRadius: '99px',
          color: 'white',
          outline: 'none',
          transition: 'border-color 0.2s'
        }} 
        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
      />
      <button 
        type="submit" 
        style={{ 
          position: 'absolute', 
          right: '8px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          background: 'var(--accent-primary)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        <Plus size={16} />
      </button>
    </form>
  );
};

export default SearchStock;
