import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DumbbellIcon, PlayIcon, SparklesIcon, CheckIcon, ArrowRightIcon } from './Icons';
import { levenshtein } from '../utils/helpers';

export const PracticeView = ({ lists, updateList, nliModel, showToast, setView, setStreak }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [settings, setSettings] = useState({
    deliveryOrder: 'Randomized',
    showMnemonic: false,
    difficulty: 'adaptive'
  });

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [hiddenIndices, setHiddenIndices] = useState(new Set());
  const [userInputs, setUserInputs] = useState({});
  const [validation, setValidation] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  const now = Date.now();
  const dueLists = useMemo(() => lists.filter(l => (l.dueDate || 0) <= now), [lists, now]);

  const startPractice = () => {
    let sorted = [...lists].sort((a, b) => {
      const dueA = a.dueDate || 0;
      const dueB = b.dueDate || 0;
      const isDueA = dueA <= now;
      const isDueB = dueB <= now;

      if (isDueA && !isDueB) return -1;
      if (!isDueA && isDueB) return 1;

      const scoreA = a.performanceScore || 0;
      const scoreB = b.performanceScore || 0;
      if (scoreA !== scoreB) return scoreA - scoreB;

      return dueA - dueB;
    });

    if (settings.deliveryOrder === 'Randomized') {
      const buckets = {};
      sorted.forEach(l => {
        const isDue = (l.dueDate || 0) <= now ? 1 : 0;
        const score = l.performanceScore || 0;
        const priorityKey = `${isDue}_${score}`;
        if (!buckets[priorityKey]) buckets[priorityKey] = [];
        buckets[priorityKey].push(l);
      });

      let randomizedList = [];
      const sortedKeys = Object.keys(buckets).sort((k1, k2) => {
        const [due1, score1] = k1.split('_').map(Number);
        const [due2, score2] = k2.split('_').map(Number);
        if (due1 !== due2) return due2 - due1; 
        return score1 - score2; 
      });

      sortedKeys.forEach(key => {
        let bucket = buckets[key];
        bucket.sort(() => Math.random() - 0.5);
        randomizedList.push(...bucket);
      });
      sorted = randomizedList;
    }

    setQueue(sorted.map(l => l.id));
    setCurrentIndex(0);
    setIsSessionActive(true);
  };

  useEffect(() => {
    if (!isSessionActive || !queue[currentIndex]) return;
    const list = lists.find(l => l.id === queue[currentIndex]);
    if (!list) return;

    setUserInputs({});
    setValidation({});
    setIsEvaluated(false);
    setIsCorrect(false);

    const total = list.items.length;
    let hideCount = 0;

    if (settings.difficulty === 'adaptive') {
      hideCount = Math.min(list.masteryLevel || 0, total + 1);
      if (hideCount > total) hideCount = total;
    } else if (settings.difficulty === 'easy') {
      hideCount = Math.min(1, total);
    } else if (settings.difficulty === 'medium') {
      hideCount = Math.ceil(total / 2);
    } else if (settings.difficulty === 'hard') {
      hideCount = total;
    }

    if (hideCount === 0 && total > 0) hideCount = 1;

    const indices = [];
    while (indices.length < hideCount && indices.length < total) {
      let r = Math.floor(Math.random() * total);
      if (indices.indexOf(r) === -1) indices.push(r);
    }
    setHiddenIndices(new Set(indices));
  }, [currentIndex, isSessionActive, queue, lists, settings.difficulty]);

  const handleInput = (index, value) => {
    if (isEvaluated) return;
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
    if (e.key === 'Enter') {
      if (isEvaluated) {
        handleNextQuestion();
      } else if (!isEvaluating && hiddenIndices.size > 0) {
        verifyAnswers();
      }
    }
  };

  const handlePrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(curr => curr - 1);
    }
  }, [currentIndex]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(curr => curr + 1);
    } else {
      setIsSessionActive(false);
      showToast("Practice Session Complete!");
    }
  }, [currentIndex, queue.length, showToast]);

  const verifyAnswers = async () => {
    const currentList = lists.find(l => l.id === queue[currentIndex]);
    if (!currentList) return;

    setIsEvaluating(true);
    let allCorrect = true;
    const newValidation = {};
    const yieldThread = () => new Promise(res => setTimeout(res, 10));

    for (const idx of hiddenIndices) {
      const truth = currentList.items[idx].toLowerCase().trim();
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
    setIsEvaluated(true);
    setIsCorrect(allCorrect);

    let newScore = currentList.performanceScore || 0;
    let newDue = Date.now();

    if (allCorrect) {
      setStreak(s => s + 1);
      newScore += 1;
      const interval = 1000 * 60 * 60 * 24 * Math.pow(2, newScore - 1);
      newDue += interval;
      showToast("Correct! Next review pushed further back.");

      timeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    } else {
      setStreak(0);
      newScore = Math.max(0, newScore - 1);
      showToast("Incorrect. Showing answers. Please review and manually advance.");
    }

    updateList(currentList.id, { performanceScore: newScore, dueDate: newDue });
  };

  if (!isSessionActive) {
    return (
      <div className="w-full space-y-6 animate-fade-in">
        <div className="neu-panel p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center">
              <DumbbellIcon className="mr-3" /> Practice Settings
            </h2>
            <div className="px-4 py-2 neu-pressed rounded-xl text-sm font-bold text-[var(--text-main)]">
              <span className={dueLists.length > 0 ? "text-orange-500" : "text-green-500"}>{dueLists.length} Lists Due</span>
            </div>
          </div>

          <p className="text-[var(--text-muted)] text-sm mb-8 font-medium">
            Spaced Repetition (SRS) is always enabled. The system will continuously prioritize unmastered lists with the lowest performance scores to optimize your retention.
          </p>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] w-1/3">Delivery Order</label>
              <select
                value={settings.deliveryOrder}
                onChange={e => setSettings({ ...settings, deliveryOrder: e.target.value })}
                className="neu-pressed px-4 py-3 rounded-xl bg-transparent font-bold text-[var(--text-main)] outline-none w-full sm:w-2/3 cursor-pointer"
              >
                <option value="Randomized" className="bg-[var(--bg-main)]">Randomized</option>
                <option value="Sequential" className="bg-[var(--bg-main)]">Sequential</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] w-1/3">Local Scaled Difficulty</label>
              <select
                value={settings.difficulty}
                onChange={e => setSettings({ ...settings, difficulty: e.target.value })}
                className="neu-pressed px-4 py-3 rounded-xl bg-transparent font-bold text-[var(--text-main)] outline-none w-full sm:w-2/3 cursor-pointer"
              >
                <option value="adaptive" className="bg-[var(--bg-main)]">Adaptive (Based on List Mastery)</option>
                <option value="easy" className="bg-[var(--bg-main)]">Easy (Hide 1 item)</option>
                <option value="medium" className="bg-[var(--bg-main)]">Medium (Hide 50% of items)</option>
                <option value="hard" className="bg-[var(--bg-main)]">Hard (Hide 100% of items)</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] w-1/3">Mnemonic Anchor</label>
              <div className="flex items-center gap-4 w-full sm:w-2/3">
                <button onClick={() => setSettings({ ...settings, showMnemonic: true })} className={`flex-1 py-3 rounded-xl font-bold transition-all ${settings.showMnemonic ? 'neu-pressed text-[var(--accent)]' : 'neu-btn text-[var(--text-muted)]'}`}>Show</button>
                <button onClick={() => setSettings({ ...settings, showMnemonic: false })} className={`flex-1 py-3 rounded-xl font-bold transition-all ${!settings.showMnemonic ? 'neu-pressed text-[var(--accent)]' : 'neu-btn text-[var(--text-muted)]'}`}>Hide</button>
              </div>
            </div>
          </div>

          <button onClick={startPractice} className="mt-10 neu-btn w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3">
            <PlayIcon /> Start Session ({lists.length} lists)
          </button>
        </div>
      </div>
    );
  }

  const activeList = lists.find(l => l.id === queue[currentIndex]);
  if (!activeList) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="w-full flex justify-between items-center bg-black/10 p-3 rounded-2xl border border-white/5">
        <button onClick={handlePrevQuestion} disabled={currentIndex === 0 || isEvaluating} className="neu-btn px-4 py-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-30"><i className="fas fa-chevron-left"></i></button>
        <div className="flex flex-col items-center flex-1 px-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Practice Mode &bull; Question {currentIndex + 1} of {queue.length}
          </span>
          <h2 className="font-black text-base sm:text-xl md:text-2xl text-[var(--text-main)] uppercase tracking-widest text-center break-words leading-tight">
            {activeList.title}
          </h2>
        </div>
        <button onClick={handleNextQuestion} disabled={isEvaluating} className="neu-btn px-4 py-3 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-30"><i className="fas fa-chevron-right"></i></button>
      </div>

      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden shadow-inner -mt-2">
        <div className="h-full bg-[var(--accent)] transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}></div>
      </div>

      {settings.showMnemonic && activeList.mnemonic && activeList.mnemonic.trim() !== "" && (
        <div className="neu-panel p-6 relative overflow-hidden border-l-4 border-[var(--text-muted)]">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center">
            <SparklesIcon className="mr-2" /> Mnemonic Anchor
          </h3>
          <p className="font-bold text-lg text-[var(--text-main)] italic">"{activeList.mnemonic}"</p>
        </div>
      )}

      <div className="neu-panel p-6 sm:p-10 relative">
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
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={userInputs[idx] || ""}
                      onChange={(e) => handleInput(idx, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type missing item..."
                      className={inputStyle}
                      autoComplete="off"
                      disabled={isEvaluating || isEvaluated}
                    />
                    {isEvaluated && status === "wrong" && (
                      <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-black uppercase text-green-500">Correct: {item}</div>
                    )}
                  </div>
                ) : (
                  <div className="neu-btn w-full px-5 py-4 rounded-xl font-black text-[var(--text-main)] opacity-90 text-lg border-l-4 border-transparent">{item}</div>
                )}
              </div>
            );
          })}
        </div>

        {!isEvaluated ? (
          <button onClick={verifyAnswers} disabled={isEvaluating || hiddenIndices.size === 0} className="neu-btn w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3 disabled:opacity-50 text-sm sm:text-base">
            {isEvaluating ? <><i className="fas fa-spinner fa-spin"></i> Checking Answers...</> : <><CheckIcon /> Verify Answers (Enter)</>}
          </button>
        ) : (
          <button onClick={handleNextQuestion} className="neu-pressed w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3 text-sm sm:text-base border-2 border-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white cursor-pointer">
            {isCorrect ? <><i className="fas fa-spinner fa-spin"></i> Auto-advancing...</> : <>Next Question (Enter) <ArrowRightIcon /></>}
          </button>
        )}
      </div>
    </div>
  );
};
