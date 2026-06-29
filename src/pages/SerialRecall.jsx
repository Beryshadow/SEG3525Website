import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared';

// --- DEFAULT DATA ---
const DEFAULT_LISTS = [
  {
    id: "1",
    title: "Biological Classification",
    items: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"],
    mnemonic: "Kings Play Chess On Fine Glass Surfaces.",
    masteryLevel: 0,
    performanceScore: 0,
    dueDate: 0
  },
  {
    id: "2",
    title: "Order of Operation",
    items: ["Parentheses", "Exponents", "Multiplication", "Division", "Addition", "Subtraction"],
    mnemonic: "Please Excuse My Dear Aunt Sally.",
    masteryLevel: 0,
    performanceScore: 0,
    dueDate: 0
  }
];

// --- ICONS ---
const BrainIcon = () => <i className="fas fa-brain text-xl"></i>;
const SettingsIcon = () => <i className="fas fa-cog text-xl"></i>;
const ListIcon = () => <i className="fas fa-list-ol text-xl"></i>;
const CheckIcon = () => <i className="fas fa-check"></i>;
const PlayIcon = () => <i className="fas fa-play"></i>;
const CpuIcon = () => <i className="fas fa-microchip"></i>;
const SparklesIcon = () => <i className="fas fa-magic"></i>;
const EyeSlashIcon = () => <i className="fas fa-eye-slash"></i>;
const PlusIcon = () => <i className="fas fa-plus"></i>;
const TrashIcon = () => <i className="fas fa-trash"></i>;
const DownloadIcon = () => <i className="fas fa-download"></i>;
const UploadIcon = () => <i className="fas fa-upload"></i>;
const CopyIcon = () => <i className="fas fa-copy"></i>;
const EditIcon = () => <i className="fas fa-pencil-alt"></i>;
const RefreshIcon = () => <i className="fas fa-undo"></i>;
const DumbbellIcon = () => <i className="fas fa-dumbbell text-xl"></i>;
const ArrowRightIcon = () => <i className="fas fa-arrow-right"></i>;
const FireIcon = () => <i className="fas fa-fire"></i>;

// Levenshtein distance for fuzzy matching typos
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
};

export default function ListMem() {
  const [view, setView] = useState("study"); // study, practice, manage
  const navigate = useNavigate();
  const { appTheme, theme, toggleTheme, lang } = useSharedLogic([]);
  const currentLang = (lang || 'en').toLowerCase();

  // Data State
  const [lists, setLists] = useState(() => {
    try {
      const saved = localStorage.getItem('list-memorizer-data');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LISTS;
    } catch (e) {
      return DEFAULT_LISTS;
    }
  });

  const [activeListId, setActiveListId] = useState(lists[0]?.id || null);

  // Single AI State (NLI Only)
  const [nliModel, setNliModel] = useState(null);
  const [aiStatus, setAiStatus] = useState("unloaded"); // unloaded, loading, ready, error
  const [aiBackend, setAiBackend] = useState("");
  const [aiProgress, setAiProgress] = useState(0);

  const [streak, setStreak] = useState(() => {
    try {
      const savedStreak = localStorage.getItem('list-memorizer-streak');
      return savedStreak ? parseInt(savedStreak, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 4000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (view === 'study') {
          navigate('/');
        } else {
          setView('study');
        }
      } else if (e.key === 'Backspace' && !isInput) {
        if (view !== 'study') {
          setView('study');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, view]);


  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('list-memorizer-data', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('list-memorizer-streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    let isMounted = true;
    const initModels = async () => {
      setAiStatus("loading");

      const updateProgress = (data) => {
        if (!isMounted) return;
        if (["progress", "download", "done"].includes(data.status)) {
          setAiProgress(data.progress || 0);
        }
      };

      try {
        // eslint-disable-next-line no-new-func
        const transformers = await new Function("return import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2')")();
        const { pipeline, env } = transformers;
        env.allowLocalModels = false;
        try { env.backends.onnx.wasm.numThreads = 1; } catch (e) { }

        let device = "wasm";
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile && navigator.gpu) {
          try { if (await navigator.gpu.requestAdapter()) device = "webgpu"; } catch (e) { }
        }
        if (isMounted) setAiBackend(device === "webgpu" ? "WebGPU" : "WASM");

        let nli;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            nli = await pipeline("text-classification", "Xenova/nli-deberta-v3-small", {
              device, dtype: "q8", progress_callback: updateProgress
            });
            break;
          } catch (e) {
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
            else throw e;
          }
        }

        if (isMounted && nli) {
          setNliModel(() => nli);
          setAiStatus("ready");
        }
      } catch (err) {
        if (isMounted) {
          setAiStatus("error");
          console.error("AI Load Error:", err);
        }
      }
    };

    initModels();
    return () => { isMounted = false; };
  }, []);

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  const updateList = (id, updates) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-300 ${themeClass} serialrecall-route`} style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Header */}
      <nav className="sticky top-0 z-50 w-full px-4 pt-4 mb-8 flex flex-col items-center">
        <div className="neu-panel w-full max-w-5xl px-6 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center space-x-3 text-[var(--accent)] font-bold text-xl cursor-pointer" onClick={() => setView("study")}>
            <ListIcon />
            <span className="uppercase tracking-widest text-sm whitespace-nowrap hidden sm:inline">SerialRecall</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-2 text-xs px-4 py-2 neu-pressed text-[var(--text-muted)] relative overflow-hidden">
              <div className="relative flex items-center space-x-2 z-10 font-bold">
                <CpuIcon />
                <span className="truncate max-w-[150px]">
                  {aiStatus === "loading" ? `NLI Engine ${Math.round(aiProgress)}%` : aiStatus === "ready" ? `Semantic AI (${aiBackend})` : aiStatus === "error" ? "Engine Error" : "Waiting..."}
                </span>
              </div>
              {aiStatus === "loading" && (
                <div className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-20 transition-all" style={{ width: `${aiProgress}%` }}></div>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-2 neu-pressed px-4 py-2 rounded-full text-sm font-black" title="Current Streak">
              <FireIcon className={streak > 0 ? "text-orange-500" : "text-[var(--text-muted)]"} />
              <span className={streak > 0 ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>{streak}</span>
            </div>

            <button onClick={toggleTheme} className="neu-btn w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-main)]">
              {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
            <button onClick={() => setView("study")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "study" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title="Study Mode">
              <BrainIcon />
            </button>
            <button onClick={() => setView("practice")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "practice" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title="Practice Mode">
              <DumbbellIcon />
            </button>
            <button onClick={() => setView("manage")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "manage" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title="Manage Lists">
              <SettingsIcon />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto mb-12">
        {view === "study" && (
          <StudyView
            activeList={activeList}
            lists={lists}
            setActiveListId={setActiveListId}
            updateList={updateList}
            nliModel={nliModel}
            aiStatus={aiStatus}
            showToast={showToast}
            setStreak={setStreak}
          />
        )}
        {view === "practice" && (
          <PracticeView
            lists={lists}
            updateList={updateList}
            nliModel={nliModel}
            showToast={showToast}
            setView={setView}
            setStreak={setStreak}
          />
        )}
        {view === "manage" && (
          <ManageView
            lists={lists}
            setLists={setLists}
            setActiveListId={setActiveListId}
            activeListId={activeListId}
            showToast={showToast}
            currentLang={currentLang}
            setView={setView}
          />
        )}
      </main>

      {/* Toasts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[250] neu-panel px-6 py-4 border-l-4 border-[var(--accent)] max-w-sm flex items-center gap-3 shadow-2xl animate-fade-in">
          <i className="fas fa-info-circle text-[var(--accent)] text-xl"></i>
          <span className="text-sm font-bold text-[var(--text-main)]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- STUDY VIEW: UNIFIED MNEMONIC & FADE ---
const StudyView = ({ activeList, lists, setActiveListId, updateList, nliModel, aiStatus, showToast, setStreak }) => {
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

  // NLI Semantic Verification
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
      return entailScore > 0.85; // Strict threshold for lists
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
        // 1. Check for typos using Levenshtein distance
        const dist = levenshtein(truth, input);
        const allowedTypos = truth.length <= 4 ? 1 : 2;

        if (dist <= allowedTypos) {
          newValidation[idx] = "correct";
        } else {
          // 2. Fall back to Semantic matching for synonyms
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
      // Re-randomize immediately after brief pause for feedback, using smart retry
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

// --- PRACTICE VIEW: SPACED REPETITION ---
const PracticeView = ({ lists, updateList, nliModel, showToast, setView, setStreak }) => {
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

  // Analyze queue on load
  const now = Date.now();
  const dueLists = useMemo(() => lists.filter(l => (l.dueDate || 0) <= now), [lists, now]);

  const startPractice = () => {
    // SRS Sort: Prioritize due cards, then lowest performance scores
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
      // Group by exact priority level (Due Status + Score) and shuffle within those groups
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
        if (due1 !== due2) return due2 - due1; // Due (1) comes before Not Due (0)
        return score1 - score2; // Lowest score first
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

    // Always hide at least 1 item in practice mode if difficulty allows
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
      // Exponential interval scheduling
      const interval = 1000 * 60 * 60 * 24 * Math.pow(2, newScore - 1);
      newDue += interval;
      showToast("Correct! Next review pushed further back.");

      // Auto-advance only on correct
      timeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    } else {
      setStreak(0);
      newScore = Math.max(0, newScore - 1);
      showToast("Incorrect. Showing answers. Please review and manually advance.");
      // Keeps due date as now so it's reviewed soon
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

  // Active Session rendering
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


// --- MANAGE VIEW: DASHBOARD & EDITOR ---
const ManageView = ({ lists, setLists, setActiveListId, activeListId, showToast, currentLang, setView }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingListId, setEditingListId] = useState(null);
  const fileInputRef = useRef(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === lists.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(lists.map(l => l.id)));
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const remaining = lists.filter(l => !selectedIds.has(l.id));
    if (remaining.length === 0) {
      showToast("Cannot delete all lists. Leave at least one.");
      return;
    }
    setLists(remaining);
    if (selectedIds.has(activeListId)) setActiveListId(remaining[0].id);
    setSelectedIds(new Set());
    showToast("Selected lists deleted.");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(lists, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seriarecall-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed) && parsed[0]?.items) {
          // Standardize missing properties to ensure it doesn't break
          const cleanParsed = parsed.map(p => ({
            ...p,
            id: p.id || Date.now().toString() + Math.random(),
            masteryLevel: p.masteryLevel || 0,
            mnemonic: p.mnemonic || "",
            performanceScore: p.performanceScore || 0,
            dueDate: p.dueDate || 0
          }));
          setLists(cleanParsed);
          setActiveListId(cleanParsed[0].id);
          showToast("Data imported successfully!");
        } else {
          showToast("Invalid JSON format. Expected array of lists.");
        }
      } catch (err) {
        showToast("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleCopyPrompt = (lang) => {
    const promptEN = `Generate a JSON array of lists for me to memorize. Each object in the array must strictly follow this structure: {"id": "unique-string", "title": "Subject Name", "items": ["Item 1", "Item 2", "Item 3"], "mnemonic": "A memorable sentence where the first letter of each word corresponds to the first letter of each item.", "masteryLevel": 0}. Output ONLY raw valid JSON.`;
    const promptFR = `Générez un tableau JSON de listes à mémoriser. Chaque objet doit strictement suivre cette structure : {"id": "chaine-unique", "title": "Nom du sujet", "items": ["Élément 1", "Élément 2"], "mnemonic": "Une phrase mémorable où la première lettre de chaque mot correspond à la première lettre de chaque élément.", "masteryLevel": 0}. Ne sortez QUE du JSON valide.`;

    const textToCopy = lang === 'fr' ? promptFR : promptEN;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`Prompt copied to clipboard! Paste it into ChatGPT/Claude.`);
    }).catch(() => {
      showToast("Failed to copy. Clipboard access denied.");
    });
  };

  // If editing a list, show the inline editor
  const editList = lists.find(l => l.id === editingListId);

  if (editList) {
    const updateEditList = (updates) => {
      setLists(prev => prev.map(l => l.id === editingListId ? { ...l, ...updates } : l));
    };

    const saveEdit = () => {
      setEditingListId(null);
      showToast("List saved successfully!");
    };

    return (
      <div className="w-full neu-panel p-6 sm:p-10 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-[var(--accent)]">Edit List</h2>
          <button onClick={saveEdit} className="neu-btn px-6 py-2 rounded-xl font-black text-green-500 uppercase tracking-widest"><CheckIcon /> Save</button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">List Title</span>
            <input
              type="text"
              value={editList.title}
              onChange={e => updateEditList({ title: e.target.value })}
              className="neu-pressed w-full mt-2 px-4 py-3 rounded-xl bg-transparent font-black text-[var(--text-main)] outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] ml-2 flex items-center">
              <SparklesIcon className="mr-2" /> Mnemonic Anchor (Optional)
            </span>
            <textarea
              value={editList.mnemonic || ""}
              onChange={e => updateEditList({ mnemonic: e.target.value })}
              placeholder="e.g. My Very Educated Mother..."
              className="neu-pressed w-full mt-2 p-4 rounded-xl bg-transparent font-medium italic text-[var(--text-main)] outline-none resize-none h-24"
            />
          </label>

          <div>
            <div className="mb-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">List Items (In Strict Order)</div>
            <div className="space-y-3 mb-6">
              {editList.items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="neu-flat w-12 flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-black opacity-50">{idx + 1}</div>
                  <input
                    type="text"
                    value={item}
                    onChange={e => {
                      const newItems = [...editList.items];
                      newItems[idx] = e.target.value;
                      updateEditList({ items: newItems });
                    }}
                    className="neu-pressed w-full px-4 py-3 rounded-xl bg-transparent font-bold text-[var(--text-main)] outline-none"
                  />
                  <button onClick={() => {
                    const newItems = editList.items.filter((_, i) => i !== idx);
                    updateEditList({ items: newItems });
                  }} className="neu-btn w-12 flex-shrink-0 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"><TrashIcon /></button>
                </div>
              ))}
            </div>
            <button onClick={() => updateEditList({ items: [...editList.items, ""] })} className="neu-btn w-full py-4 rounded-xl font-black uppercase tracking-widest text-[var(--text-main)] flex items-center justify-center gap-2">
              <PlusIcon /> Add Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Overview
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Generate external LLM Prompt */}
      <div className="neu-panel p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-black uppercase tracking-widest text-[var(--accent)] mb-2 flex items-center justify-center sm:justify-start">
            <SparklesIcon className="mr-2" /> AI Generation Prompt
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] max-w-md">
            Outsource list creation! Copy a strict JSON instruction prompt to paste into ChatGPT, Claude, or Gemini. Import the result below.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <button onClick={() => handleCopyPrompt('en')} className="neu-btn px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center whitespace-nowrap text-[var(--text-main)]">
            <CopyIcon className="mr-2" /> Copy English Prompt
          </button>
          <button onClick={() => handleCopyPrompt('fr')} className="neu-btn px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center whitespace-nowrap text-[var(--text-main)]">
            <CopyIcon className="mr-2" /> Copier Prompt Français
          </button>
        </div>
      </div>

      {/* Dashboard Table */}
      <div className="neu-panel p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-xl font-black uppercase tracking-widest text-[var(--text-main)] flex items-center">
            <SettingsIcon className="mr-3 text-[var(--accent)]" /> Dashboard
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleExport} className="neu-btn flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--accent)]"><DownloadIcon className="mr-2" /> Export</button>
            <button onClick={() => fileInputRef.current.click()} className="neu-btn flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]"><UploadIcon className="mr-2" /> Import</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="mb-4">
            <button onClick={handleBatchDelete} className="neu-btn px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-lg flex items-center"><TrashIcon className="mr-2" /> Delete Selected ({selectedIds.size})</button>
          </div>
        )}

        <div className="overflow-x-auto neu-pressed rounded-xl p-2">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest border-b border-white/5">
                <th className="py-4 px-4 w-12 text-center"><input type="checkbox" checked={selectedIds.size === lists.length && lists.length > 0} onChange={toggleSelectAll} className="cursor-pointer w-4 h-4" /></th>
                <th className="py-4 px-4 font-black">Title</th>
                <th className="py-4 px-4 font-black text-center w-20">Items</th>
                <th className="py-4 px-4 font-black text-center w-32">Mastery</th>
                <th className="py-4 px-4 font-black text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map(list => (
                <tr key={list.id} onClick={() => { setActiveListId(list.id); setView('study'); }} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="py-4 px-4 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(list.id)} onChange={(e) => toggleSelect(list.id, e)} className="cursor-pointer w-4 h-4" />
                  </td>
                  <td className="py-4 px-4 font-bold text-sm text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                    <div className="break-words whitespace-normal leading-snug">{list.title}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[var(--text-muted)] text-sm">{list.items.length}</td>
                  <td className="py-4 px-4 text-center" onClick={e => e.stopPropagation()}>
                    {(() => {
                      const maxLevel = list.items.length + 1;
                      const currentLevel = Math.min(list.masteryLevel || 0, maxLevel);
                      const levels = Array.from({ length: maxLevel + 1 }, (_, i) => i);
                      return (
                        <select
                          value={currentLevel}
                          onChange={(e) => {
                            setLists(prev => prev.map(l => l.id === list.id ? { ...l, masteryLevel: parseInt(e.target.value) } : l));
                          }}
                          className={`neu-pressed px-2 py-1 rounded text-[10px] sm:text-xs font-black outline-none cursor-pointer uppercase tracking-widest w-full text-center ${currentLevel === maxLevel ? "text-purple-500" :
                              currentLevel >= Math.ceil(maxLevel / 2) ? "text-green-500" :
                                currentLevel >= 1 ? "text-orange-500" :
                                  "text-[var(--text-muted)]"
                            }`}
                        >
                          {levels.map(lvl => (
                            <option key={lvl} value={lvl} className="bg-[var(--bg-main)]">
                              {lvl === maxLevel ? "Mastery" : `Lvl ${lvl}`}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-4 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => {
                        setLists(prev => prev.map(l => l.id === list.id ? { ...l, masteryLevel: 0, performanceScore: 0, dueDate: 0 } : l));
                        showToast("Mastery & SRS reset");
                      }}
                        className="text-[var(--text-muted)] hover:text-orange-500 p-2 transition-colors"
                        title="Reset Mastery"
                      >
                        <RefreshIcon />
                      </button>
                      <button onClick={() => setEditingListId(list.id)} className="text-[var(--text-muted)] hover:text-[var(--accent)] p-2 transition-colors" title="Edit List">
                        <EditIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={() => {
        const newList = { id: Date.now().toString(), title: "New Custom List", items: ["Item 1", "Item 2"], mnemonic: "", masteryLevel: 0, performanceScore: 0, dueDate: 0 };
        setLists(prev => [...prev, newList]);
        setEditingListId(newList.id);
      }} className="neu-btn w-full py-6 rounded-2xl font-black uppercase tracking-widest text-[var(--accent)] flex items-center justify-center gap-3 text-lg">
        <PlusIcon /> Create New List manually
      </button>
    </div>
  );
};
