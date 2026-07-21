import React from 'react';
import { CheckIcon } from '../Icons';

export const SuccessPhase = ({
  calculatedScore,
  handleNext,
  nextBtnRef,
  evalMethod,
  question,
  userInput,
  t
}) => {
  const expectedAnswer = question?.correctAnswer || (question?.correctAnswers && question.correctAnswers.join(', ')) || (question?.answer || null);

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 animate-fade-in text-center">
      <div className="p-4 sm:p-8 neu-pressed rounded-2xl border-2 border-green-500/20 bg-green-500/5 flex flex-col items-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-green-500/10 flex items-center justify-center border-2 border-green-500 text-green-500 text-xl sm:text-3xl">
          <CheckIcon />
        </div>

        <h3 className="font-black text-lg sm:text-2xl text-green-500 mb-1 sm:mb-2 uppercase tracking-widest">
          {t.correct || "Correct!"}
        </h3>

        <p className="text-xs sm:text-base font-bold text-[var(--text-main)] mb-2">
          {t.scoreLabel || "Score:"} <span className="font-mono text-green-500 text-sm sm:text-xl font-black">{calculatedScore}/10</span>
        </p>

        {/* Answer comparison section */}
        <div className="w-full max-w-md my-3 p-3.5 rounded-xl bg-black/20 dark:bg-white/5 border border-white/10 text-left space-y-2">
          {userInput && userInput.trim() && evalMethod === 'text' && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-0.5">
                {t.yourInput || "Your Answer:"}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] bg-black/30 p-2 rounded-lg break-words">
                {userInput}
              </p>
            </div>
          )}

          {expectedAnswer && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-400 block mb-0.5">
                {t.expectedAnswer || "Actual Answer:"}
              </span>
              <p className="text-xs sm:text-sm font-bold text-green-300 bg-green-950/40 border border-green-500/30 p-2 rounded-lg break-words">
                {expectedAnswer}
              </p>
            </div>
          )}

          {question?.explanation && (
            <div className="pt-1 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] block mb-0.5">
                {t.explanation || "Explanation:"}
              </span>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        <button
          ref={nextBtnRef}
          onClick={handleNext}
          className="neu-btn px-8 sm:px-12 py-3.5 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] text-xs sm:text-base rounded-xl sm:rounded-2xl w-full sm:w-auto shadow-lg active:scale-95 transition-all mt-2"
        >
          <span>{t.nextQuestion || "Next Question"}</span>
          <i className="fas fa-chevron-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};
