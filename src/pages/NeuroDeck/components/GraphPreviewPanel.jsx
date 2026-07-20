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
  t,
  setFocusMode,
  onStartFocusStudy
}) => {
  if (!previewFocalNode) return null;

  let clusterCount = 1; 
  if (cardEmbeddings && deck && previewFocalNode.embedding) {
     if (previewMode === 'threshold') {
        deck.forEach(q => {
           if (q.id !== previewFocalNode.id && cardEmbeddings[q.id]) {
              if (cosineSimilarity(cardEmbeddings[q.id], previewFocalNode.embedding) >= previewThreshold) {
                 clusterCount++;
              }
           }
        });
     } else {
        clusterCount = Math.min(previewTopN, deck.length);
     }
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 neu-panel p-4 z-30 flex flex-col pointer-events-auto animate-fade-in shadow-xl">
      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2 flex justify-between">
         <span>{t.focusPreview || "Focus Preview"}</span>
         <span>{clusterCount} {t.cardsPreview || "Cards"}</span>
      </div>
      <div className="text-sm font-medium text-[var(--text-main)] mb-4 line-clamp-2" title={previewFocalNode.question}>
         {previewFocalNode.question}
      </div>
      
      <div className="flex gap-2 mb-4 bg-[var(--bg-main)] p-1 rounded-lg border border-white/5">
         <button 
            onClick={() => setPreviewMode('threshold')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase tracking-widest transition-colors ${previewMode === 'threshold' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
         >
            {t.thresholdMode || "Threshold"}
         </button>
         <button 
            onClick={() => setPreviewMode('topN')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase tracking-widest transition-colors ${previewMode === 'topN' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
         >
            {t.topNMode || "Top N"}
         </button>
      </div>

      {previewMode === 'threshold' ? (
        <div className="flex flex-col mb-4">
           <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[var(--text-muted)]">{t.thresholdLabel || "Similarity Threshold"}</label>
              <span className="text-xs font-bold text-[var(--text-main)]">
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
           <div className="flex justify-between text-[8px] text-[var(--text-muted)] mt-1 uppercase font-bold">
              <span>{t.broadAll || "Broad (All)"}</span>
              <span>{t.strictSelf || "Strict (Self)"}</span>
           </div>
        </div>
      ) : (
        <div className="flex flex-col mb-4">
           <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[var(--text-muted)]">{t.topNLabel || "Number of Cards"}</label>
              <span className="text-xs font-bold text-[var(--text-main)]">{previewTopN}</span>
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
           <div className="flex justify-between text-[8px] text-[var(--text-muted)] mt-1 uppercase font-bold">
              <span>{t.justThis || "Just This"}</span>
              <span>{t.everything || "Everything"}</span>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto">
         <button 
           onClick={() => {
              setPreviewFocalNode(null);
              if (setFocusMode) {
                 setFocusMode({ active: false, focalNodeId: null, threshold: 0.85 });
              }
           }} 
           className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
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
           className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] rounded-lg flex items-center"
         >
           <ActivityIcon className="mr-2" /> {t.studyCluster || "STUDY CLUSTER"}
         </button>
      </div>
    </div>
  );
};
