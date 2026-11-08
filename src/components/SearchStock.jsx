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
    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari kode saham (ex: BBCA, ANTM)..."
        className="w-full bg-gray-950/80 border border-gray-800 hover:border-gray-700 focus:border-cyan-500 rounded-xl py-2 pl-10 pr-11 text-xs text-white placeholder-gray-500 outline-none transition font-sans shadow-inner"
      />
      <button
        type="submit"
        aria-label="Tambah Saham"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white flex items-center justify-center transition shadow-md shadow-cyan-600/30 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>
    </form>
  );
};

export default SearchStock;
