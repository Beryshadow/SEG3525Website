import React from 'react';
import { LightbulbIcon, SparklesIcon, XIcon, PlayIcon } from '../Icons';

export const TextInputPhase = ({
  userInput,
  setUserInput,
  phase,
  handleEvaluateInput,
  feedback,
  setFeedback,
  modelStatus,
  modelError,
  progressPercent,
  hintText,
  handleShowHint,
  setPhase,
  handleOverrideAI,
  question,
  t
}) => {
  return (
    <div className="space-y-3 sm:space-y-6">
      <textarea
        className={`neu-pressed w-full h-20 sm:h-40 p-2.5 sm:p-6 border-0 rounded-xl sm:rounded-2xl resize-none transition-all bg-transparent text-[var(--text-main)] outline-none font-medium leading-relaxed text-xs sm:text-base ${
          feedback && !feedback.overridden
            ? (feedback.type === "close" ? "shadow-[inset_0_0_15px_rgba(59,130,246,0.3)]" : "shadow-[inset_0_0_15px_rgba(239,68,68,0.3)]")
            : ""
        }`}
        placeholder={t.typeAnswerPlaceholder}
        value={userInput}
        onChange={(e) => {
          setUserInput(e.target.value);
          if (feedback && !feedback.overridden) setFeedback(null);
        }}
        disabled={phase === "evaluating"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEvaluateInput();
          }
        }}
      />

      <div className="flex justify-end">
        <button
          onClick={handleEvaluateInput}
          disabled={phase === "evaluating" || modelStatus !== "ready" || !userInput.trim()}
          className="neu-btn w-full sm:w-auto px-4 sm:px-10 py-2.5 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 text-xs sm:text-base rounded-xl sm:rounded-2xl"
        >
          {phase === "evaluating" ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>{t.analyzing}</span>
            </>
          ) : (
            <>
              <span>{feedback && !feedback.overridden ? t.submitRevision : t.submitAnswer}</span>
              <PlayIcon />
            </>
          )}
        </button>
      </div>

      {modelStatus === "loading" && (
        <div className="mt-3 sm:mt-6 neu-pressed p-3 sm:p-6 rounded-xl sm:rounded-2xl">
          <p className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] flex items-center mb-2 sm:mb-4 uppercase tracking-widest">
            <i className="fas fa-cloud-download-alt mr-2 sm:mr-3 text-[var(--accent)] animate-bounce"></i>
            {t.loadingEngine}
          </p>
          <div className="w-full bg-[var(--bg-main)] rounded-full h-2 shadow-inner">
            <div
              className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {modelStatus === "error" && (
        <div className="mt-3 sm:mt-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-red-500/20 bg-red-500/5">
          <p className="text-[10px] sm:text-sm font-bold text-red-500 flex items-center mb-2 uppercase tracking-widest">
            <XIcon className="mr-2 sm:mr-3" />
            {t.aiError || "AI Engine Error"}
          </p>
          <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono overflow-auto whitespace-pre-wrap">
            {modelError}
          </p>
        </div>
      )}

      {feedback && phase === "input" && (
        <div className="mt-3 sm:mt-6 neu-pressed p-3 sm:p-6 rounded-xl sm:rounded-2xl animate-fade-in" style={{
          borderLeft: `4px solid ${feedback.type === "close" ? 'var(--color-info)' : 'var(--color-danger)'}`
        }}>
          <h3 className="font-black text-sm sm:text-lg flex items-center mb-1 sm:mb-2" style={{ color: feedback.type === "close" ? 'var(--color-info)' : 'var(--color-danger)' }}>
            {feedback.type === "close" ? <><LightbulbIcon className="mr-2" /> {t.conceptuallyClose}</> : feedback.type === "leaning_wrong" ? <><XIcon className="mr-2" /> {t.leaningWrong || "Leaning Wrong"}</> : <><XIcon className="mr-2" /> {t.notQuiteRight}</>}
          </h3>
          <p className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)] mb-3 sm:mb-6 leading-relaxed">
            {feedback.customMessage 
              ? feedback.customMessage 
              : feedback.type === "leaning_wrong" 
                  ? `${t.leaningWrongFeedback || "Careful! Your answer is closer to an incorrect choice."} (Matches: "${feedback.wrongTarget}")` 
                  : feedback.type === "close" 
                      ? t.closeFeedback 
                      : t.wrongFeedback}
          </p>

          {feedback.hotColdScore !== undefined && (
            <div className="mb-4 bg-[var(--bg-main)] rounded-xl p-3 sm:p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                 <span>Semantic Gamification (Beta)</span>
                 <span style={{ color: feedback.hotColdScore > 0.7 ? 'var(--color-danger)' : feedback.hotColdScore > 0.4 ? 'var(--color-warning)' : 'var(--color-info)' }}>
                    {feedback.hotColdScore > 0.7 ? "Boiling Hot! 🔥" : feedback.hotColdScore > 0.4 ? "Getting Warmer ☀️" : "Freezing Cold 🧊"}
                 </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 shadow-inner relative overflow-hidden">
                 <div 
                   className="h-full transition-all duration-700 ease-out absolute left-0 top-0 rounded-full" 
                   style={{ 
                      width: `${Math.max(5, Math.min(100, feedback.hotColdScore * 100))}%`,
                      background: feedback.hotColdScore > 0.7 ? 'var(--color-danger)' : feedback.hotColdScore > 0.4 ? 'var(--color-warning)' : 'var(--color-info)'
                   }}
                 />
              </div>
            </div>
          )}

          {hintText ? (
            <div className="mb-3 sm:mb-6 neu-flat p-3 sm:p-5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-mono text-[var(--text-main)]">
              <span className="font-black text-[var(--accent)] mr-2 sm:mr-3 uppercase tracking-widest block sm:inline mb-1 sm:mb-0">{t.aiHintLabel}</span>
              {hintText}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {question.hint && (
                <button
                  onClick={handleShowHint}
                  className="neu-btn flex-1 py-2 sm:py-4 px-3 sm:px-6 font-bold uppercase tracking-wider flex items-center justify-center text-[var(--accent)] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
                >
                  <SparklesIcon className="mr-2 sm:mr-3" />
                  <span>{t.getAiHint}</span>
                </button>
              )}
              <button
                onClick={() => setPhase("mcq")}
                className="neu-btn flex-1 py-2 sm:py-4 px-3 sm:px-6 font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
              >
                {t.showChoices}
              </button>
            </div>
          )}
          {hintText && (
            <button
              onClick={() => setPhase("mcq")}
              className="neu-btn w-full py-2 sm:py-4 px-3 sm:px-6 mt-2 sm:mt-4 font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
            >
              {t.showMultipleChoice}
            </button>
          )}

          {!feedback.overridden && (
            <div className="mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-white/5 text-right">
              <button
                onClick={handleOverrideAI}
                className="text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-[color:var(--color-success)] font-bold transition-colors uppercase tracking-widest"
              >
                {t.iWasRight || "I was right (Override AI)"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
