import React from 'react';

export const LongQuestionPhase = ({
  phase,
  setPhase,
  question,
  setCalculatedScore,
  setEvalMethod,
  onComplete,
  t
}) => {
  if (phase === "long_question") {
    return (
      <div className="flex justify-center mt-6">
        <button 
          onClick={() => setPhase("long_rubric")} 
          className="neu-btn px-8 py-4 font-black uppercase tracking-widest text-[var(--accent)] rounded-xl sm:rounded-2xl w-full sm:w-auto text-xs sm:text-sm"
        >
          Show Rubric / Answer
        </button>
      </div>
    );
  }

  if (phase === "long_rubric") {
    return (
      <div className="space-y-4 sm:space-y-6 mt-4">
        <div className="neu-flat p-4 sm:p-6 rounded-xl sm:rounded-2xl text-[var(--text-main)] font-medium text-xs sm:text-base border border-white/5">
          <h3 className="font-black text-[var(--accent)] mb-2 uppercase tracking-widest text-[10px] sm:text-xs">
            Rubric / Expected Answer:
          </h3>
          <p className="whitespace-pre-wrap leading-relaxed">
            {question.hint || (question.correctAnswers && question.correctAnswers.length > 0 ? question.correctAnswers[0] : "No specific answer provided. Use your best judgement.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={() => { 
              setCalculatedScore(10); 
              setEvalMethod("skip"); 
              setPhase("success"); 
              onComplete(question.id, 10, true, false); 
            }} 
            className="neu-btn py-3.5 sm:py-4 text-[color:var(--color-success)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm"
          >
            {t.longFinished || "I finished it (100%)"}
          </button>

          <button 
            onClick={() => { 
              setCalculatedScore(5); 
              setEvalMethod("skip"); 
              setPhase("success"); 
              onComplete(question.id, 5, true, false); 
            }} 
            className="neu-btn py-3.5 sm:py-4 text-[color:var(--color-warning)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm"
          >
            {t.longWorkedOn || "I worked on it (50%)"}
          </button>

          <button 
            onClick={() => { 
              setCalculatedScore(0); 
              setEvalMethod("skip"); 
              setPhase("success"); 
              onComplete(question.id, 0, false, false); 
            }} 
            className="neu-btn py-3.5 sm:py-4 text-[color:var(--color-danger)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm sm:col-span-2"
          >
            {t.longGaveUp || "I gave up (0%)"}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
