import React from 'react';

export const StudyHeader = ({
  question,
  currentIndex,
  totalCards,
  onNavigate,
  t,
  tempSimScore,
  evalMethod,
  feedback,
  phase,
  focusMode,
  setFocusMode
}) => {
  return (
    <div className="w-full flex flex-col gap-2 mb-3 sm:mb-6">
      {/* Navigation & Score Info Bar */}
      <div className="flex justify-between items-center w-full text-[var(--text-muted)] font-bold text-[10px] sm:text-sm tracking-wider uppercase">
        <button 
          onClick={() => onNavigate(-1)} 
          className="hover:text-[var(--accent)] transition-colors flex items-center py-1 px-1.5 sm:px-2 rounded-lg neu-btn"
        >
          <i className="fas fa-chevron-left mr-1 sm:mr-2"></i> 
          <span>{t.prevCard || "Prev"}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center">
          <span className="font-mono text-xs sm:text-sm text-[var(--text-main)] font-extrabold">
            {currentIndex + 1}/{totalCards}
          </span>

          <span className="px-2 py-0.5 rounded-full neu-pressed text-[var(--text-main)] text-[9px] sm:text-xs font-bold">
            {t.mastery || "Mastery:"} {question.attempts > 0 ? `${question.score}/10` : (t.newStatus || "New")}
          </span>

          {(feedback || phase === "success") && evalMethod === "text" && phase !== "mcq" && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold ${
              phase === "success" 
                ? "text-green-500 bg-green-500/10 border border-green-500/20"
                : feedback?.type === "close" 
                  ? "text-blue-500 bg-blue-500/10 border border-blue-500/20"
                  : "text-red-500 bg-red-500/10 border border-red-500/20"
            }`}>
              {t.match || "Match:"} {tempSimScore.toFixed(1)}/10
            </span>
          )}

          {question.isMastered && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 text-[9px] font-black tracking-widest border border-purple-500/30">
              MASTERED
            </span>
          )}
        </div>

        <button 
          onClick={() => onNavigate(1)} 
          className="hover:text-[var(--accent)] transition-colors flex items-center py-1 px-1.5 sm:px-2 rounded-lg neu-btn"
        >
          <span>{t.nextCard || "Next"}</span> 
          <i className="fas fa-chevron-right ml-1 sm:ml-2"></i>
        </button>
      </div>

      {/* Focus Mode Banner */}
      {focusMode?.active && (
        <div className="w-full flex items-center justify-between neu-pressed px-3 py-1.5 sm:py-2 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[var(--accent)] rounded-xl">
          <div className="flex items-center text-left">
            <i className="fas fa-bullseye mr-2 animate-pulse text-xs sm:text-base"></i> 
            <span>
              {t.focusModeActive || "Focus Mode"} (
              {focusMode.mode === 'topN' 
                ? `${t.topNMode || "Top N"}: ${focusMode.topN}` 
                : (focusMode.threshold > 1.0 
                    ? (t.onlyThisCard || 'Single Card') 
                    : (focusMode.threshold <= -1.0 
                        ? (t.allCards || 'All Cards') 
                        : `${t.thresholdMode || 'Threshold'}: ${focusMode.threshold.toFixed(2)}`))}
              )
            </span>
          </div>
          <button 
            onClick={() => setFocusMode({ ...focusMode, active: false })}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors ml-2 whitespace-nowrap"
          >
            {t.clearBtn || "CLEAR"}
          </button>
        </div>
      )}
    </div>
  );
};
