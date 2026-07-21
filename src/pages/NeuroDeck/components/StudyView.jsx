import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getCorrectAnswers, shuffleArray } from '../utils/helpers';
import { useAIEvaluation } from '../hooks/useAIEvaluation';
import { StudyHeader } from './study/StudyHeader';
import { TextInputPhase } from './study/TextInputPhase';
import { MCQPhase } from './study/MCQPhase';
import { LongQuestionPhase } from './study/LongQuestionPhase';
import { SuccessPhase } from './study/SuccessPhase';

export const StudyView = ({
  question, currentIndex, totalCards, model, modelStatus, modelError, progressPercent, onComplete,
  onNavigate, t, showToast, currentLangKey, getEmbeddings, focusMode, setFocusMode, servingMode
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
    let initialPhase = "input";
    if (isLongQuestion) {
      initialPhase = "long_question";
    } else if (servingMode === "mcq") {
      initialPhase = "mcq";
    } else if (servingMode === "pass") {
      initialPhase = "pass";
    }

    setPhase(initialPhase);
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
    setCalculatedScore(initialPhase === "pass" ? (question?.score || 0) : 0);
  }, [question, servingMode, isLongQuestion]);

  useEffect(() => {
    if (phase === "success" && nextBtnRef.current) {
      setTimeout(() => {
        nextBtnRef.current?.focus();
      }, 50);
    }
  }, [phase]);

  const calculateNewScore = useCallback((method, mistakes = 0) => {
    let currentScore = question?.score || 0;
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
    );
  }

  return (
    <div className="w-full">
      {/* Unified Neumorphic Card Container */}
      <div className="neu-panel p-3.5 sm:p-8 md:p-12 relative overflow-hidden transition-all">
        {/* Unified Card Header */}
        <StudyHeader
          question={question}
          currentIndex={currentIndex}
          totalCards={totalCards}
          onNavigate={onNavigate}
          t={t}
          tempSimScore={tempSimScore}
          evalMethod={evalMethod}
          feedback={feedback}
          phase={phase}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
        />

        {/* Question Title & Action Header Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-8 gap-2 sm:gap-4">
          <h2 className="text-base sm:text-3xl font-black text-[var(--text-main)] leading-snug sm:leading-tight flex-1">
            {question.question}
          </h2>
          {phase !== "success" && !isLongQuestion && (
            <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-start">
              <button 
                onClick={() => { setSkippedToMCQ(true); setPhase("mcq"); }} 
                className="neu-btn px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] sm:whitespace-nowrap transition-colors hover:text-[var(--accent)]"
              >
                {t.showChoicesDirect || "Choices"}
              </button>
              <button 
                onClick={handleSkip} 
                className="neu-btn px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] sm:whitespace-nowrap transition-colors hover:text-[var(--text-main)]"
              >
                {t.skipKnowIt || "Skip (+1)"}
              </button>
            </div>
          )}
          {phase !== "success" && isLongQuestion && (
            <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-start">
              <button 
                onClick={handleSkip} 
                className="neu-btn px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] sm:whitespace-nowrap transition-colors hover:text-[var(--text-main)]"
              >
                {t.longSkip || "Skip"}
              </button>
            </div>
          )}
        </div>

        {/* Phase Renderers */}
        {phase === "success" ? (
          <SuccessPhase
            calculatedScore={calculatedScore}
            handleNext={handleNext}
            nextBtnRef={nextBtnRef}
            evalMethod={evalMethod}
            t={t}
          />
        ) : isLongQuestion ? (
          <LongQuestionPhase
            phase={phase}
            setPhase={setPhase}
            question={question}
            setCalculatedScore={setCalculatedScore}
            setEvalMethod={setEvalMethod}
            onComplete={onComplete}
            t={t}
          />
        ) : phase === "mcq" ? (
          <MCQPhase
            shuffledChoices={shuffledChoices}
            isSingleAnswer={isSingleAnswer}
            selectedChoices={selectedChoices}
            shakingChoices={shakingChoices}
            clickedWrongChoices={clickedWrongChoices}
            handleSingleChoiceClick={handleSingleChoiceClick}
            toggleChoice={toggleChoice}
            handleSubmitMCQ={handleSubmitMCQ}
            feedback={feedback}
            t={t}
          />
        ) : (
          <TextInputPhase
            userInput={userInput}
            setUserInput={setUserInput}
            phase={phase}
            handleEvaluateInput={handleEvaluateInput}
            feedback={feedback}
            setFeedback={setFeedback}
            modelStatus={modelStatus}
            modelError={modelError}
            progressPercent={progressPercent}
            hintText={hintText}
            handleShowHint={handleShowHint}
            setPhase={setPhase}
            handleOverrideAI={handleOverrideAI}
            question={question}
            t={t}
          />
        )}
      </div>
    </div>
  );
};
