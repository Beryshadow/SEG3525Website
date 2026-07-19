import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SparklesIcon, EyeSlashIcon, CheckIcon, PlayIcon } from './Icons';
import { levenshtein } from '../utils/helpers';

export const StudyView = ({ activeList, lists, setActiveListId, updateList, nliModel, aiStatus, showToast, setStreak }) => {
  const [hiddenIndices, setHiddenIndices] = useState(new Set());
  const [userInputs, setUserInputs] = useState({});
  const [validation, setValidation] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);
  const timeoutRef = useRef(null);
  const lastHiddenRef = useRef(new Set());

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  const activeListId = activeList?.id;
  const masteryLevel = activeList?.masteryLevel;
  const itemsLength = activeList?.items?.length;
  const activeListItems = activeList?.items;

  const setupIndices = useCallback((isRetry = false) => {
    if (!activeListId || !activeListItems) return;
    let hideCount = 0;
    const total = itemsLength;
    const maxLevel = total + 1;
    const currentLevel = Math.min(masteryLevel, maxLevel);

    if (currentLevel > 0 && currentLevel <= total) {
      hideCount = currentLevel;
    } else if (currentLevel === maxLevel) {
      hideCount = total;
    }

    let indices = [];
    const allIndices = Array.from({ length: total }, (_, i) => i);

    if (isRetry && lastHiddenRef.current.size > 0 && hideCount < total) {
      const visibleLastTime = allIndices.filter(i => !lastHiddenRef.current.has(i));
      visibleLastTime.sort(() => Math.random() - 0.5);

      while (indices.length < hideCount && visibleLastTime.length > 0) {
        indices.push(visibleLastTime.pop());
      }

      const remainingToHide = allIndices.filter(i => !indices.includes(i));
      remainingToHide.sort(() => Math.random() - 0.5);
      while (indices.length < hideCount) {
        indices.push(remainingToHide.pop());
      }
    } else {
      while (indices.length < hideCount) {
        let r = Math.floor(Math.random() * total);
        if (indices.indexOf(r) === -1) indices.push(r);
      }
    }

    const newHidden = new Set(indices);
    setHiddenIndices(newHidden);
    lastHiddenRef.current = newHidden;
    setUserInputs({});
    setValidation({});
    setMnemonicRevealed(false);
  }, [activeListId, masteryLevel, itemsLength, activeListItems]);

  useEffect(() => {
    setupIndices();
  }, [setupIndices]);

  const handleInput = (index, value) => {
    setUserInputs(prev => ({ ...prev, [index]: value }));
    if (validation[index]) {
      setValidation(prev => { const next = { ...prev }; delete next[index]; return next; });
    }
  };

  const checkEntailment = async (truth, input) => {
    if (!nliModel || input.trim() === "") return false;
    const sepToken = nliModel?.tokenizer?.sep_token || "[SEP]";
    const statementTruth = `The item is: ${truth}`;
    const statementInput = `The item is: ${input}`;

    try {
      const combined = `${statementInput} ${sepToken} ${statementTruth}`;
      const out = await nliModel(combined, { top_k: 5 });
      const classes = Array.isArray(out) && Array.isArray(out[0]) ? out[0] : (Array.isArray(out) ? out : [out]);

      let entailScore = 0;
      for (const c of classes) {
        const label = c.label.toUpperCase();
        if (label.includes('ENTAIL') || label === 'LABEL_1') entailScore = c.score;
      }
      return entailScore > 0.85; 
    } catch (e) {
      return false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isEvaluating && hiddenIndices.size > 0) {
      verifyAnswers();
    }
  };

  const verifyAnswers = async () => {
    setIsEvaluating(true);
    let allCorrect = true;
    const newValidation = {};
    const yieldThread = () => new Promise(res => setTimeout(res, 10));

    for (const idx of hiddenIndices) {
      const truth = activeList.items[idx].toLowerCase().trim();
      const input = (userInputs[idx] || "").toLowerCase().trim();

      if (input === truth) {
        newValidation[idx] = "correct";
      } else {
        const dist = levenshtein(truth, input);
        const allowedTypos = truth.length <= 4 ? 1 : 2;

        if (dist <= allowedTypos) {
          newValidation[idx] = "correct";
        } else {
          const isSemanticMatch = await checkEntailment(truth, input);
          await yieldThread();
          if (isSemanticMatch) {
            newValidation[idx] = "correct";
          } else {
            newValidation[idx] = "wrong";
            allCorrect = false;
          }
        }
      }
    }

    setValidation(newValidation);
    setIsEvaluating(false);

    const maxLevel = activeList.items.length + 1;
    const currentLevel = Math.min(activeList.masteryLevel, maxLevel);

    if (allCorrect) {
      setStreak(s => s + 1);
      if (currentLevel === maxLevel) {
        showToast("Flawless! Mastered! Moving to next list...");
        timeoutRef.current = setTimeout(() => {
          const currentIdx = lists.findIndex(l => l.id === activeList.id);
          const nextList = lists[(currentIdx + 1) % lists.length];
          setActiveListId(nextList.id);
        }, 1500);
      } else {
        showToast("Perfect recall! Increasing difficulty...");
        timeoutRef.current = setTimeout(() => {
          updateList(activeList.id, { masteryLevel: Math.min(maxLevel, currentLevel + 1) });
        }, 1500);
      }
    } else {
      setStreak(0);
      showToast("Incorrect answers. Re-randomizing...");
      if (currentLevel === maxLevel) {
        setMnemonicRevealed(true);
      }
      timeoutRef.current = setTimeout(() => {
        setupIndices(true);
      }, 1500);
    }
  };

  if (!activeList) return null;

  const maxLevel = activeList.items.length + 1;
  const currentLevel = Math.min(activeList.masteryLevel, maxLevel);

  return (
    <div className="w-full space-y-6">
      <div className="w-full flex justify-between items-center bg-black/10 p-3 rounded-2xl border border-white/5">
        <button onClick={() => { const idx = lists.findIndex(l => l.id === activeList.id); setActiveListId(lists[(idx - 1 + lists.length) % lists.length].id); }} className="neu-btn px-4 py-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><i className="fas fa-chevron-left"></i></button>
        <div className="flex flex-col items-center flex-1 px-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Study Mode</span>
          <h2 className="font-black text-base sm:text-xl md:text-2xl text-[var(--text-main)] uppercase tracking-widest text-center break-words leading-tight">{activeList.title}</h2>
        </div>
        <button onClick={() => { const idx = lists.findIndex(l => l.id === activeList.id); setActiveListId(lists[(idx + 1) % lists.length].id); }} className="neu-btn px-4 py-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><i className="fas fa-chevron-right"></i></button>
      </div>

      {activeList.mnemonic && activeList.mnemonic.trim() !== "" && (
        <div className={`neu-panel p-6 sm:p-8 relative overflow-hidden border-l-4 ${currentLevel === maxLevel && !mnemonicRevealed ? 'border-[var(--text-muted)]' : 'border-[var(--accent)]'}`}>
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <SparklesIcon className="text-9xl" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent)] mb-3 flex items-center">
            <SparklesIcon className="mr-2" /> Mnemonic Anchor
          </h3>
          {currentLevel === maxLevel && !mnemonicRevealed ? (
            <div className="flex flex-col items-center justify-center py-4 relative z-10">
              <p className="font-bold text-[var(--text-muted)] mb-4 uppercase tracking-widest text-xs sm:text-sm">Mnemonic is hidden for Mastery check</p>
              <button onClick={() => setMnemonicRevealed(true)} className="neu-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-[var(--text-main)] uppercase tracking-widest">
                Reveal Mnemonic
              </button>
            </div>
          ) : (
            <p className="font-black text-xl md:text-3xl text-[var(--text-main)] leading-relaxed italic relative z-10">
              "{activeList.mnemonic}"
            </p>
          )}
        </div>
      )}

      <div className="neu-panel p-6 sm:p-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center">
            <EyeSlashIcon className="mr-2" />
            {currentLevel === maxLevel ? `Level ${maxLevel}: Mastery Mode` : `Level ${currentLevel}: ${currentLevel === 0 ? "Study Mode" : `Hiding ${hiddenIndices.size} of ${activeList.items.length} items`}`}
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => updateList(activeList.id, { masteryLevel: Math.max(0, currentLevel - 1) })} disabled={currentLevel === 0} className="neu-btn flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 text-[var(--text-main)] uppercase tracking-widest">Easier</button>
            <button onClick={() => updateList(activeList.id, { masteryLevel: Math.min(maxLevel, currentLevel + 1) })} disabled={currentLevel === maxLevel} className="neu-btn flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 text-[var(--accent)] uppercase tracking-widest">Harder</button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {activeList.items.map((item, idx) => {
            const isHidden = hiddenIndices.has(idx);
            const status = validation[idx];
            let inputStyle = "neu-pressed w-full px-5 py-4 rounded-xl bg-transparent font-black text-[var(--text-main)] outline-none text-lg transition-all";
            if (status === "correct") inputStyle += " border-2 border-green-500 text-green-500 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]";
            if (status === "wrong") inputStyle += " border-2 border-red-500 text-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]";

            return (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center neu-flat rounded-xl text-sm font-black text-[var(--text-muted)] opacity-50">{idx + 1}</span>
                {isHidden ? (
                  <input
                    type="text"
                    value={userInputs[idx] || ""}
                    onChange={(e) => handleInput(idx, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type missing item..."
                    className={inputStyle}
                    autoComplete="off"
                    disabled={isEvaluating}
                  />
                ) : (
                  <div className="neu-btn w-full px-5 py-4 rounded-xl font-black text-[var(--text-main)] opacity-90 text-lg border-l-4 border-transparent">{item}</div>
                )}
              </div>
            );
          })}
        </div>

        {hiddenIndices.size > 0 && (
          <button onClick={verifyAnswers} disabled={isEvaluating} className="neu-btn w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3 disabled:opacity-50 text-sm sm:text-base">
            {isEvaluating ? <><i className="fas fa-spinner fa-spin"></i> Analyzing Semantics...</> : <><CheckIcon /> Verify Answers (NLI)</>}
          </button>
        )}
        {hiddenIndices.size === 0 && (
          <button onClick={() => updateList(activeList.id, { masteryLevel: 1 })} className="neu-btn w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3 text-sm sm:text-base">
            <PlayIcon /> Start Memorization Challenge
          </button>
        )}
      </div>
    </div>
  );
};
