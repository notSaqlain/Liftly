import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit
} from 'firebase/firestore';
import { Search, MapPin, Plus, Check, Loader2, Building2 } from 'lucide-react';

/**
 * GymSearch — Reusable component for finding or creating a gym.
 *
 * Props:
 *   selectedGym  { id, name } | null  — currently selected gym
 *   onSelect     (gym: { id, name }) => void — called when user picks/creates a gym
 *   dark         boolean — use dark (onboarding) theme vs. light (settings) theme
 */
const GymSearch = ({ selectedGym, onSelect, dark = false }) => {
  const [searchText, setSearchText] = useState(selectedGym?.name || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  // Derived styles
  const inputBase = dark
    ? 'w-full h-13 bg-white/8 border border-white/12 rounded-2xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all font-medium'
    : 'w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 text-sm text-slate-800 font-semibold focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all';

  const iconColor = dark ? 'text-white/40' : 'text-slate-400';
  const dropdownBg = dark ? 'bg-[#001c5e] border-white/10' : 'bg-white border-slate-100';
  const itemHover = dark ? 'hover:bg-white/10' : 'hover:bg-slate-50';
  const itemText = dark ? 'text-white' : 'text-slate-800';
  const subText = dark ? 'text-white/40' : 'text-slate-400';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const text = searchText.trim();
    if (text.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Case-insensitive prefix search using Firestore range trick
        const lower = text.toLowerCase();
        const upper = lower + '\uf8ff';
        const q = query(
          collection(db, 'gyms'),
          where('nameLower', '>=', lower),
          where('nameLower', '<=', upper),
          orderBy('nameLower'),
          limit(8)
        );
        const snap = await getDocs(q);
        setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Gym search error:', e);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchText]);

  const handleCreateGym = async () => {
    const name = searchText.trim();
    if (!name) return;
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, 'gyms'), {
        name,
        nameLower: name.toLowerCase(),
        memberCount: 1,
        createdAt: serverTimestamp(),
      });
      onSelect({ id: ref.id, name });
      setShowDropdown(false);
    } catch (e) {
      console.error('Gym create error:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (gym) => {
    onSelect(gym);
    setSearchText(gym.name);
    setShowDropdown(false);
  };

  const isExactMatch = results.some(r => r.nameLower === searchText.trim().toLowerCase());

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
        <input
          type="text"
          placeholder="Search for your gym…"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          className={inputBase}
        />
        {searching && (
          <Loader2 size={14} className={`absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin ${iconColor}`} />
        )}
      </div>

      {/* Selected badge */}
      {selectedGym && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <Check size={13} className="text-liftly-teal shrink-0" />
          <span className={`text-xs font-bold ${dark ? 'text-liftly-teal' : 'text-liftly-teal'}`}>
            {selectedGym.name}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && searchText.trim().length >= 2 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-xl z-50 overflow-hidden animate-slide-up ${dropdownBg}`}>

            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto no-scrollbar">
                {results.map(gym => (
                  <button
                    key={gym.id}
                    onClick={() => handleSelect(gym)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${itemHover}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-liftly-teal/10`}>
                      <Building2 size={15} className="text-liftly-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${itemText}`}>{gym.name}</p>
                      <p className={`text-[10px] font-semibold ${subText}`}>{gym.memberCount || 1} member{gym.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    {selectedGym?.id === gym.id && <Check size={14} className="text-liftly-teal shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Create new gym option (only if no exact match) */}
            {!isExactMatch && searchText.trim().length >= 2 && (
              <button
                onClick={handleCreateGym}
                disabled={creating}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${itemHover}`}
              >
                <div className="w-8 h-8 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0">
                  {creating ? <Loader2 size={14} className="text-liftly-teal animate-spin" /> : <Plus size={14} className="text-liftly-teal" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${dark ? 'text-liftly-teal' : 'text-liftly-teal'}`}>
                    Add "{searchText.trim()}"
                  </p>
                  <p className={`text-[10px] ${subText}`}>Create this gym for everyone to join</p>
                </div>
              </button>
            )}

            {results.length === 0 && !searching && searchText.trim().length >= 2 && (
              <div className={`px-4 py-2 text-xs ${subText}`}>No gyms found for "{searchText}"</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GymSearch;
