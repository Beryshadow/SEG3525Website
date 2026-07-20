import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LightbulbIcon, SparklesIcon, CheckIcon, XIcon, PlayIcon } from './Icons';
import { escapeRegExp, getCorrectAnswers, shuffleArray } from '../utils/helpers';
import { useAIEvaluation } from '../hooks/useAIEvaluation';

export const StudyView = ({
  question, currentIndex, totalCards, model, modelStatus, modelError, progressPercent, onComplete,
  onNavigate, t, showToast, currentLangKey, getEmbeddings, focusMode, setFocusMode
}) => {
  const [phase, setPhase] = useState("input");
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  
  const [tempSimScore, setTempSimScore] = useState(0);

  const [hintText, setHintText] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);

  const [evalMethod, setEvalMethod] = useState(null); 
  const [wrongClicks, setWrongClicks] = useState(0);
  const [clickedWrongChoices, setClickedWrongChoices] = useState(new Set()); 
  const [skippedToMCQ, setSkippedToMCQ] = useState(false); 

  const [selectedChoices, setSelectedChoices] = useState(new Set());
  const [shakingChoices, setShakingChoices] = useState(new Set());
  const [calculatedScore, setCalculatedScore] = useState(0);

  const nextBtnRef = useRef(null);

  const shuffledChoices = useMemo(() => {
    if (!question) return [];
    return shuffleArray(question.choices);
  }, [question]);

  const correctAnswersArray = useMemo(() => getCorrectAnswers(question), [question]);
  const isSingleAnswer = correctAnswersArray.length === 1;

  const isLongQuestion = useMemo(() => {
    return question && (question.type === "long" || !question.choices || question.choices.length === 0);
  }, [question]);

  useEffect(() => {
    setPhase(isLongQuestion ? "long_question" : "input");
    setUserInput("");
    setFeedback(null);
    setTempSimScore(0);
    setHintText(null);
    setHintUsed(false);

    setEvalMethod(null);
    setWrongClicks(0);
    setClickedWrongChoices(new Set());
    setSkippedToMCQ(false);
    setSelectedChoices(new Set());
    setShakingChoices(new Set());
    setCalculatedScore(0);
  }, [question]);

  useEffect(() => {
    if (phase === "success" && nextBtnRef.current) {
      setTimeout(() => {
        nextBtnRef.current?.focus();
      }, 50);
    }
  }, [phase]);

  const calculateNewScore = useCallback((method, mistakes = 0) => {
    let currentScore = question.score || 0;
    if (method === "skip") {
      return currentScore === 0 ? 10 : Math.min(10, currentScore + 1);
    }
    if (method === "text") {
      return currentScore === 0 ? 10 : Math.min(10, currentScore + 1);
    }
    if (method === "mcq") {
      if (mistakes === 0) {
        if (skippedToMCQ) {
          return currentScore === 0 ? 5 : currentScore;
        } else {
          return currentScore === 0 ? 5 : Math.min(10, currentScore + 1);
        }
      } else {
        return currentScore === 0 ? 0 : Math.max(0, currentScore - 1);
      }
    }
    return currentScore;
  }, [question, skippedToMCQ]);

  const handleSingleChoiceClick = useCallback((choice) => {
    if (phase === "success") return;
    const correctSet = new Set(correctAnswersArray);

    if (correctSet.has(choice)) {
      setPhase("success");
      setEvalMethod("mcq");
      setCalculatedScore(calculateNewScore("mcq", wrongClicks));
    } else {
      setWrongClicks(prev => prev + 1);
      setShakingChoices(new Set([choice]));
      setClickedWrongChoices(prev => {
        const next = new Set(prev);
        next.add(choice);
        return next;
      });
      setTimeout(() => setShakingChoices(new Set()), 500);
    }
  }, [phase, correctAnswersArray, calculateNewScore, wrongClicks]);

  const toggleChoice = useCallback((choice) => {
    setSelectedChoices(prevSelected => {
      const newSet = new Set(prevSelected);
      if (newSet.has(choice)) {
        newSet.delete(choice);
      } else {
        newSet.add(choice);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase !== "mcq") return;
      const key = parseInt(e.key);
      if (key >= 1 && key <= shuffledChoices.length) {
        const choice = shuffledChoices[key - 1];
        if (isSingleAnswer) {
          if (!clickedWrongChoices.has(choice)) handleSingleChoiceClick(choice);
        } else {
          toggleChoice(choice);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, shuffledChoices, isSingleAnswer, clickedWrongChoices, handleSingleChoiceClick, toggleChoice]);

  const handleSkip = () => {
    const newScore = calculateNewScore("skip");
    onComplete(question.id, newScore, true, true);
  };

  const { evaluateInput } = useAIEvaluation({ model, getEmbeddings, t, currentLangKey });

  const handleEvaluateInput = async () => {
    if (!userInput.trim()) return;

    if (!model) {
      showToast(t.alertLoading || "Engine is loading...");
      return;
    }
    setPhase("evaluating");
    setFeedback(null);

    const result = await evaluateInput(userInput, question, correctAnswersArray);

    if (!result) {
      setPhase("input");
      return;
    }

    if (result.status === "error") {
      showToast(t.alertError || "Error evaluating input.");
      setPhase("input");
      return;
    }

    if (result.status === "loading") {
      showToast(t.alertLoading || "Engine is loading...");
      setPhase("input");
      return;
    }

    if (result.status === "success") {
      setTempSimScore(result.score);
      setEvalMethod("text");
      setPhase("success");
      setCalculatedScore(calculateNewScore("text"));
    } else if (result.status === "close") {
      setTempSimScore(result.score);
      setEvalMethod("text");
      setPhase("input");
      setFeedback({
        type: "close",
        sim: result.score,
        hotColdScore: result.hotColdScore,
        overridden: false,
        customMessage: result.customMessage
      });
    } else if (result.status === "leaning_wrong") {
      setTempSimScore(result.score);
      setEvalMethod("text");
      setPhase("input");
      setFeedback({
        type: "leaning_wrong",
        sim: result.score,
        hotColdScore: result.hotColdScore,
        wrongSim: result.wrongSim,
        wrongTarget: result.wrongTarget,
        overridden: false
      });
    } else if (result.status === "wrong") {
      setTempSimScore(result.score);
      setEvalMethod("text");
      setPhase("input");
      setFeedback({
        type: "wrong",
        sim: result.score,
        hotColdScore: result.hotColdScore,
        overridden: false,
      });
    }
  };

  const handleOverrideAI = () => {
    setPhase("success");
    setEvalMethod("text");
    setCalculatedScore(calculateNewScore("text"));
    setFeedback(null);
  };

  const handleShowHint = () => {
    if (question && question.hint) {
      setHintText(question.hint);
      setHintUsed(true);
    }
  };

  const handleSubmitMCQ = () => {
    const correctSet = new Set(correctAnswersArray);
    let correctCount = 0;
    let wrongCount = 0;
    const currentShakes = new Set();

    selectedChoices.forEach(c => {
      if (correctSet.has(c)) correctCount++;
      else { wrongCount++; currentShakes.add(c); }
    });

    const missedCount = correctSet.size - correctCount;

    if (correctCount === correctSet.size && wrongCount === 0) {
      setPhase("success");
      setEvalMethod("mcq");
      setCalculatedScore(calculateNewScore("mcq", wrongClicks));
    } else {
      setWrongClicks(prev => prev + 1);
      setShakingChoices(currentShakes);
      setTimeout(() => setShakingChoices(new Set()), 500);
      setFeedback({ type: "mcq_error", correctSelected: correctCount, missed: missedCount, wrongSelected: wrongCount });
    }
  };

  const handleNext = () => {
    const firstTry = (wrongClicks === 0 && !hintUsed && phase === "success");
    onComplete(question.id, calculatedScore, firstTry, false);
  };

  if (!question) {
     return (
       <div className="flex flex-col items-center justify-center p-12 text-center mt-12 animate-fade-in">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 rounded-full bg-purple-500/10 flex items-center justify-center border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
             <i className="fas fa-medal text-4xl sm:text-6xl text-purple-500"></i>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-purple-500 mb-4 uppercase tracking-widest">Deck Mastered!</h2>
          <p className="text-[var(--text-muted)] font-medium mb-8 max-w-md">
             You have successfully mastered every card in this deck. Add new cards or reset your dashboard scores to keep studying.
          </p>
       </div>
     )
  }

  return (
    <div className="w-full flex flex-col space-y-4 sm:space-y-6">

      <div className="flex justify-between items-center w-full px-2 text-[var(--text-muted)] font-bold text-xs sm:text-sm tracking-widest uppercase">
        <button onClick={() => onNavigate(-1)} className="hover:text-[var(--accent)] transition-colors flex items-center">
          <i className="fas fa-chevron-left mr-2"></i> {t.prevCard || "Prev"}
        </button>
        <span className="flex items-center gap-2">
           {t.cardLabel || "Card"} {currentIndex + 1} {t.ofLabel || "of"} {totalCards}
           {question.isMastered && <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 text-[9px] font-black tracking-widest">MASTERED</span>}
        </span>
        <button onClick={() => onNavigate(1)} className="hover:text-[var(--accent)] transition-colors flex items-center">
          {t.nextCard || "Next"} <i className="fas fa-chevron-right ml-2"></i>
        </button>
      </div>

      {focusMode?.active && (
        <div className="w-full flex items-center justify-between neu-panel px-4 py-3 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-l-4 border-[var(--accent)]">
           <div className="flex items-center text-left">
              <i className="fas fa-bullseye mr-2 sm:mr-3 animate-pulse text-sm sm:text-base"></i> 
              Focus Mode Active (Threshold: {focusMode.threshold.toFixed(2)})
           </div>
           <button 
              onClick={() => setFocusMode({ ...focusMode, active: false })}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors ml-2 sm:ml-4 whitespace-nowrap"
           >
              CLEAR
           </button>
        </div>
      )}

      <div className="neu-panel p-4 sm:p-8 md:p-12 relative overflow-hidden transition-all">
        <div className="flex justify-between items-center mb-4 sm:mb-8 text-[10px] sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
          <span>{t.mastery} {question.attempts > 0 ? `${question.score}/10` : t.newStatus}</span>
          {(feedback || phase === "success") && evalMethod === "text" && phase !== "mcq" && (
            <span className={`px-2 sm:px-3 py-1 rounded-full ${phase === "success" ? "text-green-500 bg-green-500/10"
              : feedback?.type === "close" ? "text-blue-500 bg-blue-500/10"
                : "text-red-500 bg-red-500/10"
              }`}>
              {t.match || "AI Match:"} {tempSimScore.toFixed(1)} / 10
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-10 gap-4">
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-main)] leading-tight flex-1">
            {question.question}
          </h2>
          {phase !== "success" && !isLongQuestion && (
            <div className="flex items-center gap-2 self-end sm:self-start">
              <button onClick={() => { setSkippedToMCQ(true); setPhase("mcq"); }} className="neu-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap transition-colors hover:text-[var(--accent)]">
                {t.showChoicesDirect || "Choices"}
              </button>
              <button onClick={handleSkip} className="neu-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] whitespace-nowrap transition-colors hover:text-[var(--text-main)]">
                {t.skipKnowIt || "Skip (+1)"}
              </button>
            </div>
          )}
          {phase !== "success" && isLongQuestion && (
            <div className="flex items-center gap-2 self-end sm:self-start">
              <button onClick={handleSkip} className="neu-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] whitespace-nowrap transition-colors hover:text-[var(--text-main)]">
                {t.longSkip || "Skip"}
              </button>
            </div>
          )}
        </div>

        {phase === "long_question" && (
           <div className="flex justify-center mt-8">
             <button onClick={() => setPhase("long_rubric")} className="neu-btn px-8 py-4 font-black uppercase tracking-widest text-[var(--accent)] rounded-xl sm:rounded-2xl w-full sm:w-auto">
               Show Rubric / Answer
             </button>
           </div>
        )}
        {phase === "long_rubric" && (
           <div className="space-y-6 mt-4">
             <div className="neu-flat p-4 sm:p-6 rounded-xl sm:rounded-2xl text-[var(--text-main)] font-medium text-sm sm:text-base border border-white/5">
                <h3 className="font-black text-[var(--accent)] mb-2 uppercase tracking-widest text-xs">Rubric / Expected Answer:</h3>
                <p className="whitespace-pre-wrap">{question.hint || (question.correctAnswers && question.correctAnswers.length > 0 ? question.correctAnswers[0] : "No specific answer provided. Use your best judgement.")}</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button onClick={() => { setCalculatedScore(10); setEvalMethod("skip"); setPhase("success"); onComplete(question.id, 10, true, false); }} className="neu-btn py-4 text-[color:var(--color-success)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm">
                 {t.longFinished || "I finished it (100%)"}
               </button>
               <button onClick={() => { setCalculatedScore(5); setEvalMethod("skip"); setPhase("success"); onComplete(question.id, 5, true, false); }} className="neu-btn py-4 text-[color:var(--color-warning)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm">
                 {t.longWorkedOn || "I worked on it (50%)"}
               </button>
               <button onClick={() => { setCalculatedScore(0); setEvalMethod("skip"); setPhase("success"); onComplete(question.id, 0, false, false); }} className="neu-btn py-4 text-[color:var(--color-danger)] font-black uppercase tracking-widest rounded-xl text-xs sm:text-sm sm:col-span-2">
                 {t.longGaveUp || "I gave up (0%)"}
               </button>
             </div>
           </div>
        )}

        {(phase === "input" || phase === "evaluating") && !isLongQuestion && (
          <div className="space-y-4 sm:space-y-6">
            <textarea
              className={`neu-pressed w-full h-24 sm:h-40 p-3 sm:p-6 border-0 rounded-xl sm:rounded-2xl resize-none transition-all bg-transparent text-[var(--text-main)] outline-none font-medium leading-relaxed text-sm sm:text-base ${feedback && !feedback.overridden
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
                className="neu-btn w-full sm:w-auto px-4 sm:px-10 py-2 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 text-xs sm:text-base rounded-xl sm:rounded-2xl"
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
        )}

        {phase === "mcq" && (
          <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
                      className={`w-full text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 font-medium flex items-center text-xs sm:text-base ${extraClass}`}
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
                    className={`w-full text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 font-medium flex items-center text-xs sm:text-base ${extraClass}`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 rounded border-2 flex items-center justify-center ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-main)]' : 'border-[var(--text-muted)]'}`}>
                      {isSelected && <i className="fas fa-check text-[10px] sm:text-xs"></i>}
                    </div>
                    <span className="inline-block flex-shrink-0 w-5 h-5 sm:w-8 sm:h-8 mr-2 sm:mr-4 text-center rounded-md sm:rounded-xl neu-flat opacity-50 text-[9px] sm:text-xs leading-5 sm:leading-8 font-black text-[var(--text-muted)]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{choice}</span>
                  </button>
                )
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

            {feedback && !feedback.overridden && !skippedToMCQ && wrongClicks === 0 && (
              <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-white/5 text-center">
                <button
                  onClick={handleOverrideAI}
                  className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] hover:text-[color:var(--color-success)] transition-colors uppercase tracking-widest"
                >
                  {t.iWasRight || "I was right (Override AI)"}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "success" && (
          <div className="mt-4 sm:mt-8 animate-fade-in">
            <div className="mb-4 sm:mb-8 neu-pressed p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center justify-between" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <div className="mb-3 sm:mb-0 text-center sm:text-left">
                <h3 className="font-black text-base sm:text-xl text-[color:var(--color-success)] flex items-center justify-center sm:justify-start uppercase tracking-widest">
                  <CheckIcon className="mr-2 sm:mr-3 text-lg sm:text-2xl" /> {t.correct}
                </h3>
                <p className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] mt-1 sm:mt-2 uppercase tracking-widest">
                  {t.scoreLabel} <strong className="text-sm sm:text-lg text-[var(--text-main)]">{calculatedScore}</strong>/10
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                <button
                  ref={nextBtnRef}
                  onClick={handleNext}
                  className="neu-btn w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-4 font-black uppercase tracking-widest text-[color:var(--color-success)] mb-2 sm:mb-3 text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
                >
                  {t.nextQuestion} <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 opacity-70">
              {question.choices.map((choice, idx) => {
                const isCorrect = correctAnswersArray.includes(choice);
                if (!isCorrect) return null;
                return (
                  <div key={idx} className="w-full text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl font-medium flex items-center text-xs sm:text-base neu-pressed" style={{ color: 'var(--color-success)', borderLeft: '4px solid var(--color-success)' }}>
                    <i className="fas fa-check text-lg mr-3 sm:mr-4"></i> <span className="leading-relaxed">{choice}</span>
                  </div>
                );
              })}
            </div>

            {feedback && !feedback.overridden && !skippedToMCQ && wrongClicks === 0 && (
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <button
                  onClick={handleOverrideAI}
                  className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] hover:text-[color:var(--color-success)] transition-colors uppercase tracking-widest"
                >
                  {t.iWasRight || "I was right (Override AI)"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
