import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIcon, RefreshIcon, TrashIcon } from './Icons';
import { cosineSimilarity } from '../../../utilities/shared';

export const DashboardView = ({ deck, t, onGoToCard, onUpdateCards, onDeleteCards, cardEmbeddings, getEmbeddings }) => {
  const averageScore = deck.length > 0 ? (deck.reduce((acc, q) => acc + (q.isMastered ? 10 : q.score), 0) / deck.length).toFixed(1) : 0;
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteConfirmState, setDeleteConfirmState] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [queryEmbedding, setQueryEmbedding] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortField(null); setSortDirection('asc'); }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    if (!searchQuery.trim() || !getEmbeddings) {
      setQueryEmbedding(null);
      return;
    }
    const handler = setTimeout(() => {
      setIsSearching(true);
      getEmbeddings([searchQuery.trim()]).then(res => {
         if (res && res.length > 0) setQueryEmbedding(res[0]);
         setIsSearching(false);
      }).catch(err => {
         console.error(err);
         setIsSearching(false);
      });
    }, 500); 
    return () => clearTimeout(handler);
  }, [searchQuery, getEmbeddings]);

  const displayedDeck = useMemo(() => {
    let result = [...deck];
    if (queryEmbedding && searchQuery.trim()) {
      result.sort((a, b) => {
         const simA = cardEmbeddings && cardEmbeddings[a.id] ? cosineSimilarity(cardEmbeddings[a.id], queryEmbedding) : 0;
         const simB = cardEmbeddings && cardEmbeddings[b.id] ? cosineSimilarity(cardEmbeddings[b.id], queryEmbedding) : 0;
         return simB - simA;
      });
    } else if (sortField) {
      result.sort((a, b) => {
         if (sortField === 'attempts') {
            return sortDirection === 'asc' ? a.attempts - b.attempts : b.attempts - a.attempts;
         } else if (sortField === 'score') {
            return sortDirection === 'asc' ? a.score - b.score : b.score - a.score;
         }
         return 0;
      });
    }
    return result;
  }, [deck, queryEmbedding, cardEmbeddings, searchQuery, sortField, sortDirection]);

  const toggleSelectAll = (e) => {
    if (selectedIds.size === displayedDeck.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedDeck.map(q => q.id)));
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchReset = () => {
    if (selectedIds.size === 0) return;
    const updates = Array.from(selectedIds).map(id => ({
      id,
      changes: { score: 0, attempts: 0, isMastered: false }
    }));
    onUpdateCards(updates);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (deleteConfirmState) {
       onDeleteCards(Array.from(selectedIds));
       setSelectedIds(new Set());
       setDeleteConfirmState(false);
    } else {
       setDeleteConfirmState(true);
       setTimeout(() => setDeleteConfirmState(false), 3000);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 sm:mb-10 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] flex items-center uppercase tracking-widest">
            <ActivityIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.dashboardTitle}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full lg:w-auto items-center">
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                 <button onClick={handleBatchReset} className="neu-btn px-4 py-2 text-[10px] sm:text-xs font-bold text-orange-500 uppercase tracking-widest rounded-lg transition-colors">
                   <RefreshIcon className="mr-2" /> Reset
                 </button>
                 <button onClick={handleBatchDelete} className={`neu-btn px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${deleteConfirmState ? 'bg-red-500 text-white' : 'text-red-500'}`}>
                   <TrashIcon className="mr-2" /> {deleteConfirmState ? "Sure?" : "Delete"}
                 </button>
              </div>
            )}
            <div className="neu-pressed flex-1 lg:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl flex items-center justify-between lg:justify-start">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest mr-2 sm:mr-3">{t.average}</span>
              <span className="font-black text-[var(--accent)] text-xs sm:text-base">{averageScore}/10</span>
            </div>
          </div>
        </div>

        <div className="mb-6 relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Semantic Search (e.g. 'mitochondria' will find 'cell power')..."
            className="w-full neu-pressed px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-xs sm:text-sm outline-none font-medium placeholder-[var(--text-muted)] text-[var(--text-main)] focus:ring-2 focus:ring-[var(--accent)] transition-all bg-transparent"
          />
          {isSearching && (
             <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}
        </div>

        <div className="overflow-x-auto neu-pressed rounded-xl sm:rounded-3xl p-1 sm:p-2">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[9px] sm:text-xs uppercase tracking-widest border-b border-white/5">
                 <th className="py-2 px-2 sm:py-5 sm:px-6 w-10 text-center">
                   <input type="checkbox" checked={selectedIds.size === displayedDeck.length && displayedDeck.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                </th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black">{t.questionCol}</th>
                <th 
                  className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-16 sm:w-24 cursor-pointer hover:text-[var(--accent)] transition-colors select-none"
                  onClick={() => handleSort('attempts')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t.attemptsCol}
                    <span className="text-[10px] w-3 flex justify-center opacity-70">
                      {sortField === 'attempts' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th 
                  className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32 cursor-pointer hover:text-[var(--accent)] transition-colors select-none"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t.scoreCol}
                    <span className="text-[10px] w-3 flex justify-center opacity-70">
                      {sortField === 'score' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDeck.map((q, i) => (
                <tr key={i} onClick={() => onGoToCard(i)} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(q.id)} onChange={(e) => toggleSelect(q.id, e)} className="cursor-pointer" />
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-[var(--text-main)] font-medium text-[10px] sm:text-sm leading-relaxed group-hover:text-[var(--accent)] transition-colors">
                    <span className="line-clamp-2">{q.question}</span>
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center text-[var(--text-muted)] font-black text-[10px] sm:text-sm">
                    {q.attempts}
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center">
                    <div className="flex justify-center items-center">
                      {q.isMastered ? (
                        <span className="text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                           Mastered
                        </span>
                      ) : (
                        <select
                           value={q.score}
                           onClick={(e) => e.stopPropagation()}
                           onChange={(e) => {
                             e.stopPropagation();
                             onUpdateCards([{ id: q.id, changes: { score: parseInt(e.target.value) } }]);
                           }}
                           className={`neu-pressed px-2 py-1 rounded text-[10px] sm:text-xs font-black outline-none cursor-pointer uppercase tracking-widest ${
                             q.attempts === 0 ? "text-[var(--text-muted)]" :
                             q.score <= 3 ? "text-red-500" :
                             q.score <= 7 ? "text-orange-500" :
                             "text-green-500"
                           }`}
                        >
                           {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-[var(--bg-main)]">{n} / 10</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center">
                     <div className="flex justify-center gap-3">
                        <button 
                           onClick={(e) => { e.stopPropagation(); onUpdateCards([{ id: q.id, changes: { score: 0, attempts: 0, isMastered: false } }]); }}
                           className="text-[var(--text-muted)] hover:text-orange-500 transition-colors p-1"
                           title="Reset Score"
                        >
                           <RefreshIcon />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteCards([q.id]); }}
                           className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                           title="Delete Card"
                        >
                           <TrashIcon />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {displayedDeck.length === 0 && (
                <tr>
                   <td colSpan="5" className="py-8 text-center text-[var(--text-muted)] font-medium text-xs sm:text-sm">
                      Deck is completely empty. Import some cards!
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
