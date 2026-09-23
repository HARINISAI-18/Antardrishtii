import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

export default function GeocoderSearch({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (e) {
        console.warn('Geocoding search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePick = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    onSelectLocation(lat, lon, item.display_name);
    setQuery(item.display_name.split(',')[0]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 border border-slate-200/90 shadow-lg bg-white/95 focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20 transition-all">
        <Search className="h-4 w-4 text-accent-600 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search city, region, or landmark..."
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {isSearching && <Loader2 className="h-4 w-4 text-accent-500 animate-spin shrink-0" />}
        {query && !isSearching && (
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel rounded-xl border border-slate-200/90 shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 bg-white/95">
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handlePick(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-xs group"
            >
              <MapPin className="h-4 w-4 text-slate-400 group-hover:text-accent-600 mt-0.5 shrink-0 transition-colors" />
              <div className="truncate">
                <div className="font-semibold text-slate-800 group-hover:text-primary-900 truncate">
                  {item.display_name.split(',')[0]}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {item.display_name.split(',').slice(1).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
