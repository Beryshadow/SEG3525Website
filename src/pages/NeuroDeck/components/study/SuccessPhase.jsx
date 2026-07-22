import React from 'react';
import { CheckIcon } from '../Icons';

export const SuccessPhase = ({
  calculatedScore,
  handleNext,
  nextBtnRef,
  evalMethod,
  question,
  userInput,
  hasUserInput,
  skippedToMCQ,
  handleIWasRight,
  wasRightClicked,
  debugData,
  t
}) => {
  const expectedAnswer = question?.correctAnswer || (question?.correctAnswers && question.correctAnswers.join(', ')) || (question?.answer || null);

  return (
    <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4 animate-fade-in text-center">
      <div className="p-4 sm:p-8 neu-pressed rounded-2xl sm:rounded-3xl border border-emerald-500/20 flex flex-col items-center relative overflow-hidden">
        {/* Soft Neumorphic Success Icon Badge */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl neu-flat flex items-center justify-center text-emerald-500 text-xl sm:text-3xl shadow-md border border-emerald-500/30">
          <CheckIcon />
        </div>

        <h3 className="font-black text-lg sm:text-2xl text-emerald-500 mb-1 sm:mb-2 uppercase tracking-widest">
          {t.correct || "Correct!"}
        </h3>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl neu-flat mb-3 sm:mb-4 border border-emerald-500/20">
          <span className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{t.scoreLabel || "Score:"}</span>
          <span className="font-mono text-emerald-500 text-sm sm:text-lg font-black">{calculatedScore}/10</span>
        </div>

        {/* Neumorphic Answer Comparison Panels */}
        <div className="w-full max-w-xl my-2 sm:my-3 space-y-3 sm:space-y-4 text-left">
          {userInput && userInput.trim() && (
            <div className="neu-flat p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-white/5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                <i className="fas fa-user-edit text-[var(--accent)]"></i>
                {t.yourInput || "Your Answer"}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] leading-relaxed break-words">
                {userInput}
              </p>
            </div>
          )}

          {expectedAnswer && (
            <div className="neu-flat p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 mb-1.5">
                <i className="fas fa-check-circle"></i>
                {t.expectedAnswer || "Actual Answer"}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] leading-relaxed break-words">
                {expectedAnswer}
              </p>
            </div>
          )}

          {question?.explanation && (
            <div className="neu-flat p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-1.5 mb-1">
                <i className="fas fa-info-circle"></i>
                {t.explanation || "Explanation"}
              </span>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {hasUserInput && skippedToMCQ && !wasRightClicked && (
          <div className="my-3 sm:my-4">
            <button
              onClick={handleIWasRight}
              className="neu-btn px-6 py-3 sm:px-8 sm:py-3.5 font-black uppercase tracking-widest text-[color:var(--color-success)] hover:text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mx-auto"
            >
              <i className="fas fa-thumbs-up text-sm"></i>
              <span>{t?.overrideTune || t?.iWasRight || "Wait, my typed answer was right! (Tune AI)"}</span>
            </button>
          </div>
        )}

        <button
          ref={nextBtnRef}
          onClick={handleNext}
          className="neu-btn px-8 sm:px-12 py-3.5 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] text-xs sm:text-base rounded-xl sm:rounded-2xl w-full sm:w-auto shadow-lg active:scale-95 transition-all mt-3"
        >
          <span>{t.nextQuestion || "Next Question"}</span>
          <i className="fas fa-chevron-right ml-2"></i>
        </button>
      </div>

      {debugData && (typeof localStorage !== 'undefined' && localStorage.getItem('neurodeck-debug') === 'true') && (
        <div className="mt-4 rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <details>
            <summary className="p-3 sm:p-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500 cursor-pointer flex items-center gap-2">
              <i className="fas fa-bug"></i> AI Debug Telemetry (Success)
            </summary>
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
              <table className="w-full text-[9px] sm:text-xs font-mono">
                <tbody>
                  {Object.entries(debugData).map(([key, val]) => (
                    <tr key={key} className="border-t border-white/5">
                      <td className="py-1 pr-3 font-bold text-[var(--text-muted)] whitespace-nowrap">{key}</td>
                      <td className="py-1 font-bold text-[var(--text-main)] break-all">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? 'null')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

