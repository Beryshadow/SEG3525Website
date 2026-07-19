import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LightbulbIcon, SparklesIcon, CheckIcon, XIcon, PlayIcon } from './Icons';
import { escapeRegExp, getCorrectAnswers, shuffleArray } from '../utils/helpers';
import { cosineSimilarity } from '../../../utilities/shared';
export const StudyView = ({
  question, currentIndex, totalCards, model, modelStatus, modelError, progressPercent, onComplete,
  onNavigate, t, showToast, currentLangKey, getEmbeddings
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



  useEffect(() => {
    setPhase("input");
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

  const getEntailmentScores = (output, debugContext = "") => {
    const classes = Array.isArray(output) && Array.isArray(output[0]) ? output[0] : (Array.isArray(output) ? output : [output]);
    if (!classes || classes.length === 0 || !classes[0].label) {
      return { entailment: 0, isEntailment: false };
    }
    
    let entailmentScore = 0;
    let topLabel = "";
    let maxScore = -1;

    for (const c of classes) {
      const labelStr = c.label.toUpperCase();
      if (c.score > maxScore) {
        maxScore = c.score;
        topLabel = labelStr;
      }
      if (labelStr.includes('ENTAIL') || labelStr === 'LABEL_1' || labelStr === 'LABEL_0') {
         if (labelStr.includes('ENTAIL')) {
             entailmentScore = c.score;
         } else if (entailmentScore === 0) {
             entailmentScore = c.score; 
         }
      }
    }
    
    const isEntailment = topLabel.includes('ENTAIL') || topLabel === 'LABEL_1' || topLabel === 'LABEL_0';
    return { entailment: entailmentScore, isEntailment };
  };

  const handleEvaluateInput = async () => {
    if (!userInput.trim()) return;
    
    const cleanInput = userInput.trim().toLowerCase();
    const isPerfectSingleAnswer = correctAnswersArray.length === 1 && cleanInput === correctAnswersArray[0].trim().toLowerCase();
    
    if (isPerfectSingleAnswer) {
        setTempSimScore(10.0);
        setEvalMethod("text");
        setPhase("success");
        setCalculatedScore(calculateNewScore("text"));
        return;
    }

    if (!model) {
      showToast(t.alertLoading || "Engine is loading...");
      return;
    }
    setPhase("evaluating");
    setFeedback(null);

    try {
      const truthTexts = correctAnswersArray;
      const incorrectTexts = question.choices.filter(c => !correctAnswersArray.includes(c));
      const sepToken = model?.tokenizer?.sep_token || "[SEP]";
      const questionContext = currentLangKey === 'FR' ? `Question: ${question.question} Réponse:` : `Question: ${question.question} Answer:`;
      const statementUser = `${questionContext} ${userInput.trim()}`;
      
      const compositeDistractor = incorrectTexts.join(". ");
      const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d.trim());
      const validTruths = truthTexts.filter(t => t.trim());

      const pairsToEvaluate = [];
      const mapping = []; 

      let hits = 0;
      let totalEntailment = 0;

      for (const dist of distractorField) {
        const statementChoice = `${questionContext} ${dist.trim()}`;
        pairsToEvaluate.push(`${statementUser} ${sepToken} ${statementChoice}`);
        mapping.push({ type: 'distractor', dir: 'forward', text: dist });
        pairsToEvaluate.push(`${statementChoice} ${sepToken} ${statementUser}`);
        mapping.push({ type: 'distractor', dir: 'backward', text: dist });
      }

      for (const truth of validTruths) {
        const cleanTruth = truth.trim().toLowerCase();
        if (cleanInput === cleanTruth) {
          totalEntailment += 1.0;
          hits++;
          continue; 
        }
        const statementChoice = `${questionContext} ${truth.trim()}`;
        pairsToEvaluate.push(`${statementUser} ${sepToken} ${statementChoice}`);
        mapping.push({ type: 'truth', dir: 'forward', text: truth });
        pairsToEvaluate.push(`${statementChoice} ${sepToken} ${statementUser}`);
        mapping.push({ type: 'truth', dir: 'backward', text: truth });
      }

      let maxDistractorScore = 0;
      let closestIncorrectText = null;

      if (pairsToEvaluate.length > 0) {
        const batchedOutputs = await model(pairsToEvaluate, { top_k: 5, topk: 5 });
        const normalizedOutputs = Array.isArray(batchedOutputs) && batchedOutputs.length > 0 && !Array.isArray(batchedOutputs[0])
            ? [batchedOutputs]
            : batchedOutputs;

        const resultsByOriginal = { distractor: {}, truth: {} };
        
        for (let i = 0; i < normalizedOutputs.length; i++) {
          const map = mapping[i];
          const out = normalizedOutputs[i];
          const scores = getEntailmentScores(out, `${map.type} (${map.dir})`);
          
          if (!resultsByOriginal[map.type][map.text]) {
             resultsByOriginal[map.type][map.text] = { forward: null, backward: null };
          }
          resultsByOriginal[map.type][map.text][map.dir] = scores;
        }

        for (const dist of distractorField) {
           const resInfo = resultsByOriginal.distractor[dist];
           if (resInfo && resInfo.forward && resInfo.backward) {
              const avgEnt = (resInfo.forward.entailment + resInfo.backward.entailment) / 2;
              if (avgEnt > maxDistractorScore) {
                  maxDistractorScore = avgEnt;
                  closestIncorrectText = dist === compositeDistractor ? "Composite Distractor" : dist;
              }
           }
        }

        for (const truth of validTruths) {
           const cleanTruth = truth.trim().toLowerCase();
           if (cleanInput === cleanTruth) continue; 
           const resInfo = resultsByOriginal.truth[truth];
           if (resInfo && resInfo.forward && resInfo.backward) {
              const avgEnt = (resInfo.forward.entailment + resInfo.backward.entailment) / 2;
              const isEnt = resInfo.forward.isEntailment || resInfo.backward.isEntailment;
              totalEntailment += avgEnt;
              if (avgEnt > maxDistractorScore && isEnt) {
                 hits++;
              }
           }
        }
      }

      const avgEntailment = validTruths.length > 0 ? totalEntailment / validTruths.length : 0;
      
      let mappedScore10 = 0;
      if (hits === validTruths.length && validTruths.length > 0) {
          mappedScore10 = 5 + ((avgEntailment - maxDistractorScore) / Math.max(0.01, 1 - maxDistractorScore)) * 5;
          if (avgEntailment >= 0.90) mappedScore10 = 10.0;
      } else if (hits > 0) {
          const hitRatio = hits / validTruths.length;
          mappedScore10 = 5.0 + (hitRatio * 4.9);
      } else {
          const ratio = maxDistractorScore > 0 ? (avgEntailment / Math.max(0.01, maxDistractorScore)) : avgEntailment;
          mappedScore10 = ratio * 4.9;
          mappedScore10 = Math.min(4.9, mappedScore10);
      }

      mappedScore10 = Math.max(0, Math.min(10, mappedScore10)); 
      
      setTempSimScore(mappedScore10);
      setEvalMethod("text");

      let maxEmbeddingSim = 0;
      if (getEmbeddings && validTruths.length > 0) {
        try {
           const textsToEmbed = [userInput.trim(), ...validTruths];
           const embs = await getEmbeddings(textsToEmbed);
           if (embs && embs.length === textsToEmbed.length) {
              const inputEmb = embs[0];
              for(let i=1; i<embs.length; i++){
                 const sim = cosineSimilarity(inputEmb, embs[i]);
                 if(sim > maxEmbeddingSim) maxEmbeddingSim = sim;
              }
           }
        } catch (e) {
           console.error("Embedding gamification failed", e);
        }
      }

      if (hits === validTruths.length && validTruths.length > 0) {
        setPhase("success");
        setCalculatedScore(calculateNewScore("text"));
      } else if (hits > 0) {
        setPhase("input");
        setFeedback({
          type: "close",
          sim: mappedScore10,
          hotColdScore: maxEmbeddingSim,
          overridden: false,
          customMessage: `${t.partialMatch || "Partial Match!"} ${hits}/${validTruths.length} ${t.correctConcepts || "correct concepts identified. Keep going!"}`
        });
      } else {
        setPhase("input");
        if (maxDistractorScore > avgEntailment) {
          setFeedback({
            type: "leaning_wrong",
            sim: mappedScore10,
            hotColdScore: maxEmbeddingSim,
            wrongSim: maxDistractorScore,
            wrongTarget: closestIncorrectText,
            overridden: false
          });
        } else {
          setFeedback({
            type: "wrong",
            sim: mappedScore10,
            hotColdScore: maxEmbeddingSim,
            overridden: false,
          });
        }
      }
    } catch (err) {
      showToast(t.alertError || "Error evaluating input.");
      setPhase("input");
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
          {phase !== "success" && (
            <div className="flex items-center gap-2 self-end sm:self-start">
              <button onClick={() => { setSkippedToMCQ(true); setPhase("mcq"); }} className="neu-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap transition-colors hover:text-[var(--accent)]">
                {t.showChoicesDirect || "Choices"}
              </button>
              <button onClick={handleSkip} className="neu-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--accent)] whitespace-nowrap transition-colors hover:text-[var(--text-main)]">
                {t.skipKnowIt || "Skip (+1)"}
              </button>
            </div>
          )}
        </div>

        {(phase === "input" || phase === "evaluating") && (
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
