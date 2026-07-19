import React, { useState } from 'react';
import { ActivityIcon, RefreshIcon, TrashIcon } from './Icons';

export const DashboardView = ({ deck, t, onGoToCard, onUpdateCards, onDeleteCards }) => {
  const averageScore = deck.length > 0 ? (deck.reduce((acc, q) => acc + (q.isMastered ? 10 : q.score), 0) / deck.length).toFixed(1) : 0;
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteConfirmState, setDeleteConfirmState] = useState(false);

  const toggleSelectAll = (e) => {
    if (selectedIds.size === deck.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deck.map(q => q.id)));
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

        <div className="overflow-x-auto neu-pressed rounded-xl sm:rounded-3xl p-1 sm:p-2">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[9px] sm:text-xs uppercase tracking-widest border-b border-white/5">
                <th className="py-2 px-2 sm:py-5 sm:px-6 w-10 text-center">
                   <input type="checkbox" checked={selectedIds.size === deck.length && deck.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                </th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black">{t.questionCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-16 sm:w-24">{t.attemptsCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32">{t.scoreCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deck.map((q, i) => (
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
              {deck.length === 0 && (
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
