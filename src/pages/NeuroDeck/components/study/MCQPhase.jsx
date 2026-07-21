import React from 'react';

export const MCQPhase = ({
  shuffledChoices,
  isSingleAnswer,
  selectedChoices,
  shakingChoices,
  clickedWrongChoices,
  handleSingleChoiceClick,
  toggleChoice,
  handleSubmitMCQ,
  feedback,
  t
}) => {
  return (
    <div className="space-y-3 sm:space-y-6 mt-2 sm:mt-8 animate-fade-in">
      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-3 sm:mb-6">
        {shuffledChoices.map((choice, idx) => {
          const isSelected = selectedChoices.has(choice);
          const isShaking = shakingChoices.has(choice);
          const isClickedWrong = clickedWrongChoices.has(choice);

          if (isSingleAnswer) {
            let extraClass = "neu-btn text-[var(--text-main)]";
            if (isClickedWrong) extraClass = "neu-pressed opacity-50 text-[color:var(--color-danger)]";
            if (isShaking) extraClass += " animate-custom-shake text-[color:var(--color-danger)]";

            return (
              <button
                key={idx}
                disabled={isClickedWrong}
                onClick={() => handleSingleChoiceClick(choice)}
                className={`w-full text-left p-2.5 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 font-medium flex items-center text-xs sm:text-base ${extraClass}`}
              >
                <span className="inline-block flex-shrink-0 w-5 h-5 sm:w-8 sm:h-8 mr-2 sm:mr-4 text-center rounded-md sm:rounded-xl neu-flat opacity-50 text-[9px] sm:text-xs leading-5 sm:leading-8 font-black text-[var(--text-muted)]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{choice}</span>
              </button>
            );
          }

          let extraClass = isSelected ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]";
          if (isShaking) extraClass += " animate-custom-shake text-[color:var(--color-danger)]";

          return (
            <button
              key={idx}
              onClick={() => toggleChoice(choice)}
              className={`w-full text-left p-2.5 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 font-medium flex items-center text-xs sm:text-base ${extraClass}`}
            >
              <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 rounded border-2 flex items-center justify-center ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-main)]' : 'border-[var(--text-muted)]'}`}>
                {isSelected && <i className="fas fa-check text-[10px] sm:text-xs"></i>}
              </div>
              <span className="inline-block flex-shrink-0 w-5 h-5 sm:w-8 sm:h-8 mr-2 sm:mr-4 text-center rounded-md sm:rounded-xl neu-flat opacity-50 text-[9px] sm:text-xs leading-5 sm:leading-8 font-black text-[var(--text-muted)]">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{choice}</span>
            </button>
          );
        })}
      </div>

      {!isSingleAnswer && (
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {feedback?.type === "mcq_error" && (
            <p className="text-[color:var(--color-danger)] font-bold text-[10px] sm:text-sm uppercase tracking-widest text-center">
              {feedback.wrongSelected > 0 ? (t.mcqSelectedIncorrect || "You selected incorrect options. ") : ""}
              {feedback.missed > 0 ? (t.mcqMissedCorrect || "You missed some correct options.") : ""}
            </p>
          )}
          <button
            onClick={handleSubmitMCQ}
            disabled={selectedChoices.size === 0}
            className="neu-btn px-4 sm:px-8 py-3 sm:py-4 w-full font-black uppercase tracking-widest text-[var(--accent)] text-[10px] sm:text-sm rounded-lg sm:rounded-xl disabled:opacity-50"
          >
            {t.submitSelection || "Submit Selection"}
          </button>
        </div>
      )}

      <p className="text-center text-[9px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mt-4 sm:mt-6">
        {isSingleAnswer
          ? (t.pressNumberSingle ? t.pressNumberSingle.replace('{n}', shuffledChoices.length) : `Select 1 of the ${shuffledChoices.length} choices.`)
          : (t.pressNumber || "Select all that apply and submit.")}
      </p>
    </div>
  );
};
