import React from 'react';
import { ActivityIcon } from './Icons';
import { cosineSimilarity } from '../../../utilities/shared';

export const GraphPreviewPanel = ({
  previewFocalNode,
  setPreviewFocalNode,
  previewMode,
  setPreviewMode,
  previewThreshold,
  setPreviewThreshold,
  previewTopN,
  setPreviewTopN,
  cardEmbeddings,
  deck,
  myDecks,
  t,
  setFocusMode,
  onStartFocusStudy
}) => {
  if (!previewFocalNode) return null;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(10); } catch (e) {}
    }
  };

  const anchorNodeRef = React.useRef(previewFocalNode);
  if (!anchorNodeRef.current || (previewFocalNode && !deck?.some(d => d.id === previewFocalNode.id))) {
     anchorNodeRef.current = previewFocalNode;
  }

  // Reset anchor if previewFocalNode changes to a node outside current cluster
  const isCurrentFocalInAnchorCluster = React.useMemo(() => {
    if (!anchorNodeRef.current || !previewFocalNode) return false;
    if (anchorNodeRef.current.id === previewFocalNode.id) return true;
    if (!cardEmbeddings || !cardEmbeddings[anchorNodeRef.current.id] || !cardEmbeddings[previewFocalNode.id]) return false;
    const sim = cosineSimilarity(cardEmbeddings[previewFocalNode.id], cardEmbeddings[anchorNodeRef.current.id]);
    return sim >= (previewMode === 'threshold' ? previewThreshold : -1.0);
  }, [previewFocalNode, cardEmbeddings, previewMode, previewThreshold]);

  if (!isCurrentFocalInAnchorCluster && previewFocalNode) {
     anchorNodeRef.current = previewFocalNode;
  }

  const anchorNode = anchorNodeRef.current || previewFocalNode;

  const clusterCards = React.useMemo(() => {
    if (!cardEmbeddings || !deck || !anchorNode || !cardEmbeddings[anchorNode.id]) {
      return [anchorNode];
    }
    if (previewMode === 'threshold') {
      return deck.filter(q => q.id === anchorNode.id || (cardEmbeddings[q.id] && cosineSimilarity(cardEmbeddings[q.id], cardEmbeddings[anchorNode.id]) >= previewThreshold));
    } else {
      const sorted = [...deck].sort((a, b) => {
        const simA = (cardEmbeddings[a.id] && a.id !== anchorNode.id) ? cosineSimilarity(cardEmbeddings[a.id], cardEmbeddings[anchorNode.id]) : (a.id === anchorNode.id ? 2.0 : -2.0);
        const simB = (cardEmbeddings[b.id] && b.id !== anchorNode.id) ? cosineSimilarity(cardEmbeddings[b.id], cardEmbeddings[anchorNode.id]) : (b.id === anchorNode.id ? 2.0 : -2.0);
        if (simB !== simA) return simB - simA;
        return String(a.id).localeCompare(String(b.id));
      });
      return sorted.slice(0, Math.min(previewTopN, deck.length));
    }
  }, [cardEmbeddings, deck, anchorNode, previewMode, previewThreshold, previewTopN]);

  const clusterCount = clusterCards.length;
  const currentCardIdx = clusterCards.findIndex(q => q.id === previewFocalNode.id);

  const cycleCard = (dir) => {
    triggerHaptic();
    const baseIdx = currentCardIdx >= 0 ? currentCardIdx : 0;
    const targetIdx = (baseIdx + dir + clusterCards.length) % clusterCards.length;
    const targetNode = clusterCards[targetIdx];
    if (targetNode) {
      setPreviewFocalNode({
        ...targetNode,
        originalIndex: deck.findIndex(d => d.id === targetNode.id),
        score: targetNode.isMastered ? 10 : (targetNode.score || 0),
        subgroup: (targetNode._sourceDeckId && myDecks ? myDecks.find(d => d.id === targetNode._sourceDeckId)?.name : null) || targetNode.subgroup || targetNode.category || targetNode.deckId || null,
        embedding: cardEmbeddings[targetNode.id]
      });
    }
  };

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 neu-panel p-3 sm:p-4 z-30 flex flex-col pointer-events-auto animate-fade-in shadow-xl rounded-xl sm:rounded-2xl max-h-[75vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
         <div className="flex items-center gap-1.5 min-w-0">
           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] shrink-0">{t.focusPreview || "Focus Preview"}</span>
           {previewFocalNode.subgroup && (
             <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md truncate max-w-[120px] bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
               {previewFocalNode.subgroup}
             </span>
           )}
         </div>
         <div className="flex items-center gap-2 shrink-0">
           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
             {clusterCount} {t.cardsPreview || "Cards"}
           </span>
           <button 
             onClick={() => {
               triggerHaptic();
               setPreviewFocalNode(null);
             }}
             className="w-5 h-5 sm:w-6 sm:h-6 rounded-full neu-btn flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] text-[10px] sm:text-xs font-bold leading-none"
             title="Close preview"
           >
             ✕
           </button>
         </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4 bg-[var(--bg-main)]/50 p-2 rounded-lg border border-white/5">
         <button 
           onClick={() => cycleCard(-1)}
           disabled={clusterCount <= 1}
           className="neu-btn w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs disabled:opacity-30 disabled:pointer-events-none"
           title="Previous card in cluster"
         >
           ◀
         </button>
         <div className="text-xs sm:text-sm font-medium text-[var(--text-main)] line-clamp-2 text-center flex-1" title={previewFocalNode.question}>
            {previewFocalNode.question}
         </div>
         <button 
           onClick={() => cycleCard(1)}
           disabled={clusterCount <= 1}
           className="neu-btn w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs disabled:opacity-30 disabled:pointer-events-none"
           title="Next card in cluster"
         >
           ▶
         </button>
      </div>
      
      <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-4 bg-[var(--bg-main)] p-1 rounded-lg border border-white/5">
         <button 
            onClick={() => setPreviewMode('threshold')}
            className={`flex-1 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold rounded uppercase tracking-widest transition-colors ${previewMode === 'threshold' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
         >
            {t.thresholdMode || "Threshold"}
         </button>
         <button 
            onClick={() => setPreviewMode('topN')}
            className={`flex-1 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold rounded uppercase tracking-widest transition-colors ${previewMode === 'topN' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
         >
            {t.topNMode || "Top N"}
         </button>
      </div>

      {previewMode === 'threshold' ? (
        <div className="flex flex-col mb-2 sm:mb-4">
           <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)]">{t.thresholdLabel || "Similarity Threshold"}</label>
              <span className="text-[10px] sm:text-xs font-bold text-[var(--text-main)]">
                 {previewThreshold > 1.0 ? (t.onlyThisCard || "Only This Card") : (previewThreshold <= -1.0 ? (t.allCards || "All Cards") : previewThreshold.toFixed(2))}
              </span>
           </div>
           <input 
             type="range" 
             min="-1.0" 
             max="1.01" 
             step="0.01" 
             value={previewThreshold} 
             onChange={(e) => setPreviewThreshold(parseFloat(e.target.value))}
             className="w-full accent-[var(--accent)] cursor-pointer"
           />
           <div className="flex justify-between text-[8px] text-[var(--text-muted)] mt-0.5 uppercase font-bold">
              <span>{t.broadAll || "Broad (All)"}</span>
              <span>{t.strictSelf || "Strict (Self)"}</span>
           </div>
        </div>
      ) : (
        <div className="flex flex-col mb-2 sm:mb-4">
           <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)]">{t.topNLabel || "Number of Cards"}</label>
              <span className="text-[10px] sm:text-xs font-bold text-[var(--text-main)]">{previewTopN}</span>
           </div>
           <input 
             type="range" 
             min="1" 
             max={deck ? deck.length : 10} 
             step="1" 
             value={previewTopN} 
             onChange={(e) => setPreviewTopN(parseInt(e.target.value))}
             className="w-full accent-[var(--accent)] cursor-pointer"
           />
           <div className="flex justify-between text-[8px] text-[var(--text-muted)] mt-0.5 uppercase font-bold">
              <span>{t.justThis || "Just This"}</span>
              <span>{t.everything || "Everything"}</span>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-1">
         <button 
           onClick={() => {
              setPreviewFocalNode(null);
              if (setFocusMode) {
                 setFocusMode({ active: false, focalNodeId: null, threshold: 0.85 });
              }
           }} 
           className="px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
         >
           {t.clearSelection || "CLEAR SELECTION"}
         </button>
         <button 
           onClick={() => {
              if (setFocusMode) {
                 setFocusMode({ active: true, focalNodeId: previewFocalNode.id, mode: previewMode, threshold: previewThreshold, topN: previewTopN });
              }
              if (onStartFocusStudy) onStartFocusStudy();
           }}
           className="neu-btn px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--accent)] rounded-lg flex items-center"
         >
           <ActivityIcon className="mr-1.5 sm:mr-2" /> {t.studyCluster || "STUDY CLUSTER"}
         </button>
      </div>
    </div>
  );
};
