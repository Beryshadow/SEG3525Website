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

  const totalQuestions = deck.length;
  const totalAttempts = useMemo(() => deck.reduce((acc, q) => acc + (q.attempts || 0), 0), [deck]);
  const studiedCards = useMemo(() => deck.filter(q => (q.attempts || 0) > 0).length, [deck]);
  const masteredCards = useMemo(() => deck.filter(q => q.isMastered || q.score >= 10).length, [deck]);
  const dueCards = useMemo(() => deck.filter(q => !q.isMastered && (q.dueTurn === undefined || q.dueTurn <= 0)).length, [deck]);
  const masteryPercent = totalQuestions > 0 ? Math.round((masteredCards / totalQuestions) * 100) : 0;

  const [leniencyBias, setLeniencyBias] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('neurodeck-leniency-bias')) || 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const defaultBias = 0.0625; // Default 75% strictness (1 - 0.75) * 0.25
    const syncBias = () => {
      try {
        const stored = localStorage.getItem('neurodeck-leniency-bias');
        const val = stored !== null && !isNaN(parseFloat(stored)) ? parseFloat(stored) : defaultBias;
        setLeniencyBias(val);
      } catch (e) {
        setLeniencyBias(defaultBias);
      }
    };
    syncBias();
    window.addEventListener('storage', syncBias);
    return () => window.removeEventListener('storage', syncBias);
  }, []);

  const maxBias = 0.25;
  const strictnessPercent = Math.max(0, Math.min(100, Math.round((1 - (leniencyBias / maxBias)) * 100)));

  const handleStrictnessChange = (newPercent) => {
    const clamped = Math.max(0, Math.min(100, newPercent));
    const newBias = (1 - (clamped / 100)) * maxBias;
    setLeniencyBias(newBias);
    try {
      localStorage.setItem('neurodeck-leniency-bias', newBias.toString());
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 sm:mb-8 gap-3 sm:gap-0">
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
            {/* Interactive Strictness Progress Bar & Slider */}
            <div 
              className="neu-pressed flex-1 lg:flex-none px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl flex flex-col justify-center min-w-[190px] sm:min-w-[230px]"
              title={`Strictness: ${strictnessPercent}% (Click or drag slider to adjust starting strictness)`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fas fa-sliders-h text-[var(--accent)] text-[10px]"></i>
                  {t.strictness || "Strictness:"}
                </span>
                <span className="font-mono font-black text-xs text-[var(--accent)]">
                  {strictnessPercent}%
                </span>
              </div>
              <div className="relative w-full flex items-center">
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={strictnessPercent}
                  onChange={(e) => handleStrictnessChange(parseInt(e.target.value))}
                  className="w-full h-2 accent-[var(--accent)] cursor-pointer bg-black/20 rounded-full neu-flat appearance-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Analytics & Metrics Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Card 1: Total Answers */}
          <div className="neu-pressed p-3.5 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest">
                {t.totalAnswered || "Total Answers"}
              </span>
              <i className="fas fa-layer-group text-purple-400 text-xs sm:text-sm"></i>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono font-black text-lg sm:text-2xl text-[var(--text-main)]">
                {totalAttempts}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-[var(--text-muted)]">
                {studiedCards}/{totalQuestions} {t.cardsStudied || "Studied"}
              </span>
            </div>
          </div>

          {/* Card 2: Mastered Cards */}
          <div className="neu-pressed p-3.5 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest">
                {t.cardsMastered || "Mastered Cards"}
              </span>
              <i className="fas fa-medal text-emerald-400 text-xs sm:text-sm"></i>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono font-black text-lg sm:text-2xl text-emerald-400">
                {masteredCards}
              </span>
              <span className="text-[9px] sm:text-xs font-black text-emerald-500">
                {masteryPercent}%
              </span>
            </div>
          </div>

          {/* Card 3: Average Score */}
          <div className="neu-pressed p-3.5 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest">
                {t.average || "Average Score"}
              </span>
              <i className="fas fa-star text-amber-400 text-xs sm:text-sm"></i>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono font-black text-lg sm:text-2xl text-amber-400">
                {averageScore}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-[var(--text-muted)]">
                /10
              </span>
            </div>
          </div>

          {/* Card 4: Due for Review */}
          <div className="neu-pressed p-3.5 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest">
                {t.dueForReview || "Due for Review"}
              </span>
              <i className="fas fa-clock text-blue-400 text-xs sm:text-sm"></i>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono font-black text-lg sm:text-2xl text-blue-400">
                {dueCards}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-[var(--text-muted)]">
                cards
              </span>
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

        {/* Mobile View: Touch-Friendly Card List (No Horizontal Scrollbar Required) */}
        <div className="block sm:hidden space-y-3">
          <div className="flex items-center justify-between p-3 neu-flat rounded-xl text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={selectedIds.size === displayedDeck.length && displayedDeck.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
              <span>Select All ({displayedDeck.length})</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => handleSort('attempts')} className="hover:text-[var(--accent)] flex items-center gap-1 select-none">
                {t.attemptsCol} {sortField === 'attempts' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </button>
              <button onClick={() => handleSort('score')} className="hover:text-[var(--accent)] flex items-center gap-1 select-none">
                {t.scoreCol} {sortField === 'score' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </button>
            </div>
          </div>

          {displayedDeck.map((q, i) => (
            <div
              key={i}
              onClick={() => onGoToCard(i)}
              className="neu-flat p-4 rounded-xl flex flex-col gap-3 border border-white/5 cursor-pointer hover:border-[var(--accent)] transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(q.id)}
                  onChange={(e) => toggleSelect(q.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 cursor-pointer flex-shrink-0"
                />
                <p className="text-xs font-semibold text-[var(--text-main)] leading-relaxed flex-1 break-words">
                  {q.question}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  {t.attemptsCol}: <strong className="text-[var(--text-main)]">{q.attempts}</strong>
                </span>

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {q.isMastered ? (
                    <span className="text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Mastered
                    </span>
                  ) : (
                    <select
                      value={q.score}
                      onChange={(e) => {
                        onUpdateCards([{ id: q.id, changes: { score: parseInt(e.target.value) } }]);
                      }}
                      className={`neu-pressed px-2 py-1 rounded text-[10px] font-black outline-none uppercase tracking-widest ${
                        q.attempts === 0 ? "text-[var(--text-muted)]" :
                        q.score <= 3 ? "text-red-500" :
                        q.score <= 7 ? "text-orange-500" :
                        "text-green-500"
                      }`}
                    >
                      {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-[var(--bg-main)]">{n}/10</option>)}
                    </select>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateCards([{ id: q.id, changes: { score: 0, attempts: 0, isMastered: false } }]); }}
                    className="neu-btn p-1.5 text-[var(--text-muted)] hover:text-orange-500 rounded-lg text-xs"
                    title="Reset Score"
                  >
                    <RefreshIcon />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteCards([q.id]); }}
                    className="neu-btn p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg text-xs"
                    title="Delete Card"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {displayedDeck.length === 0 && (
            <div className="py-8 text-center text-[var(--text-muted)] text-xs font-medium neu-flat rounded-xl">
              Deck is completely empty. Import some cards!
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto neu-pressed rounded-xl sm:rounded-3xl p-1 sm:p-2">
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
