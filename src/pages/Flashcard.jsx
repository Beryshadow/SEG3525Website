import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../shared';
import { TRANSLATIONS, DEFAULT_DECK, STOP_WORDS } from '../data/flashcardData';
import { updateLeniencyBiasOnOverride, updateLeniencyBiasOnNormalPass, updateLeniencyBiasOnFail } from './NeuroDeck/hooks/useAIEvaluation';


// --- ICONS ---
const BrainIcon = () => <i className="fas fa-brain text-xl"></i>;
const SettingsIcon = () => <i className="fas fa-cog text-xl"></i>;
const ActivityIcon = () => <i className="fas fa-chart-line text-xl"></i>;
const CheckIcon = () => <i className="fas fa-check"></i>;
const XIcon = () => <i className="fas fa-times"></i>;
const UploadIcon = () => <i className="fas fa-upload"></i>;
const DownloadIcon = () => <i className="fas fa-download"></i>;
const SaveIcon = () => <i className="fas fa-save"></i>;
const PlayIcon = () => <i className="fas fa-play"></i>;
const CpuIcon = () => <i className="fas fa-microchip"></i>;
const FireIcon = () => <i className="fas fa-fire"></i>;
const LightbulbIcon = () => <i className="fas fa-lightbulb"></i>;
const SparklesIcon = () => <i className="fas fa-magic"></i>;
const ClockIcon = () => <i className="fas fa-clock"></i>;
const RandomIcon = () => <i className="fas fa-random"></i>;
const SeqIcon = () => <i className="fas fa-exchange-alt"></i>;
const EditIcon = () => <i className="fas fa-pencil-alt"></i>;
const TrashIcon = () => <i className="fas fa-trash"></i>;
const RefreshIcon = () => <i className="fas fa-undo"></i>;

// Utility to escape raw strings for safe dynamic RegExp constructor calls
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const getCorrectAnswers = (q) => {
  if (!q) return [];
  return q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
};

export default function Flashcard() {
  const [view, setView] = useState("study");
  const navigate = useNavigate();

  // Linking up to global styling logic
  const { theme, lang, toggleTheme, toggleLang } = useSharedLogic([]);

  const currentLangKey = (lang || 'fr').toLowerCase() === 'fr' ? 'FR' : 'EN';
  const t = TRANSLATIONS[currentLangKey] || TRANSLATIONS['EN'];

  // --- LOCAL STORAGE INIT ---
  const savedData = useMemo(() => {
    try {
      const saved = localStorage.getItem('neurodeck-save');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse local save:", e);
      return null;
    }
  }, []);

  // Model State
  const [model, setModel] = useState(null);
  const [modelStatus, setModelStatus] = useState("unloaded");
  const [backendUsed, setBackendUsed] = useState("");
  const [modelError, setModelError] = useState("");

  // Settings State
  const [selectedModel, setSelectedModel] = useState("Xenova/nli-deberta-v3-small");
  const [hintPref, setHintPref] = useState(savedData?.hintPref || "ablation");
  
  // Card Order modifier: "random" or "sequential". (Spaced repetition is now unconditionally handled)
  const [cardOrderMode, setCardOrderMode] = useState(() => {
    const saved = savedData?.cardOrderMode;
    if (saved === "spaced" || !saved) return "random"; 
    return saved;
  }); 
  const [progressItems, setProgressItems] = useState({});

  // Deck & Game State
  const [deck, setDeck] = useState(() => {
    if (savedData?.deck) return savedData.deck;
    return DEFAULT_DECK.map((q) => ({
      ...q,
      score: 0,
      dueTurn: 0,
      attempts: 0,
      isMastered: false
    }));
  });
  const [myDecks, setMyDecks] = useState(savedData?.myDecks || []);
  const [loadedDeckId, setLoadedDeckId] = useState(savedData?.loadedDeckId || null);
  const [turnCount, setTurnCount] = useState(savedData?.turnCount || 0);
  const [streak, setStreak] = useState(savedData?.streak || 0);
  const [manualCardIndex, setManualCardIndex] = useState(null);

  // --- TOAST STATE ---
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  }, []);

  // --- AUTO-SAVE EFFECT ---
  useEffect(() => {
    const data = { version: 5, turnCount, streak, deck, cardOrderMode, hintPref, myDecks, loadedDeckId };
    try {
      localStorage.setItem('neurodeck-save', JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [turnCount, streak, deck, cardOrderMode, hintPref, myDecks, loadedDeckId]);

  // Calculate download progress
  const progressPercent = useMemo(() => {
    const items = Object.values(progressItems);
    if (items.length === 0) return 0;
    return Math.round(
      items.reduce((acc, item) => acc + (item.progress || 0), 0) / items.length
    );
  }, [progressItems]);

  // Handle global escape and backspace keys to navigate
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

  // Load Transformer NLI Text-Classification model
  useEffect(() => {
    let isMounted = true;

    const initModel = async () => {
      setModelStatus("loading");
      setProgressItems({});

      try {
        // eslint-disable-next-line no-new-func
        const transformers = await new Function(
          "return import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2')"
        )();
        const { pipeline, env } = transformers;

        env.allowLocalModels = false;
        try {
          env.backends.onnx.wasm.numThreads = 1;
        } catch (e) {
          console.warn("Could not set numThreads", e);
        }

        const progress_callback = (data) => {
          if (!isMounted) return;
          if (["progress", "download", "done"].includes(data.status)) {
            setProgressItems((prev) => ({ ...prev, [data.file]: data }));
          }
        };

        let hasWebGpu = false;
        const isMobile = typeof navigator !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));

        if (!isMobile && navigator.gpu) {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) hasWebGpu = true;
          } catch (e) {
            console.warn("GPU adapter request failed:", e);
          }
        }

        const loadPipelineWithRetries = async (device, dtype, maxRetries = 2) => {
          let lastErr;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`[DEBUG] Loading model (Attempt ${attempt}/${maxRetries}). Device: ${device}, Dtype: ${dtype}`);
              return await pipeline("text-classification", selectedModel, {
                device,
                dtype,
                progress_callback,
              });
            } catch (e) {
              lastErr = e;
              console.warn(`[DEBUG] Pipeline load failed on attempt ${attempt}:`, e);
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              }
            }
          }
          throw lastErr;
        };

        let classifier;
        if (hasWebGpu) {
          try {
            classifier = await loadPipelineWithRetries("webgpu", "q8", 2);
            if (isMounted) setBackendUsed("WebGPU");
          } catch (webGpuErr) {
            console.warn("WebGPU initialization failed. Falling back to WASM...", webGpuErr);
            classifier = await loadPipelineWithRetries("wasm", "q8", 2);
            if (isMounted) setBackendUsed("WASM");
          }
        } else {
          classifier = await loadPipelineWithRetries("wasm", "q8", 3);
          if (isMounted) setBackendUsed("WASM");
        }

        if (isMounted && classifier) {
          setModel(() => classifier);
          setModelStatus("ready");
          setModelError("");
        }
      } catch (err) {
        console.error("Failed to load Transformers model:", err);
        if (isMounted) {
          setModelStatus("error");
          setModelError(err.message || String(err));
        }
      }
    };

    initModel();
    return () => { isMounted = false; };
  }, [selectedModel]);

  // Determine Current Question Index with advanced Spaced Repetition rules
  const currentIndex = useMemo(() => {
    if (deck.length === 0) return -1;
    if (manualCardIndex !== null && manualCardIndex >= 0 && manualCardIndex < deck.length) {
      return manualCardIndex;
    }

    // 1. Filter out Mastered cards
    let pool = deck.map((c, i) => ({ ...c, originalIndex: i })).filter(c => !c.isMastered);

    if (pool.length === 0) {
      // Fallback if the entire deck is mastered so the app doesn't break
      pool = deck.map((c, i) => ({ ...c, originalIndex: i }));
    }

    // 2. Unconditional Spaced Repetition logic
    let dueCards = pool.filter(c => c.dueTurn <= turnCount);
    
    // If no cards are currently strictly due, grab the cards closest to being due
    if (dueCards.length === 0) {
      const minDue = Math.min(...pool.map(c => c.dueTurn));
      dueCards = pool.filter(c => c.dueTurn === minDue);
    }

    // 3. Score prioritization: Prioritize unmastered cards with the absolute lowest score first
    const minScore = Math.min(...dueCards.map(c => c.score));
    let priorityPool = dueCards.filter(c => c.score === minScore);

    // 4. Modifiers for tie-breaking
    if (cardOrderMode === "random") {
      const randomIndex = Math.floor(Math.random() * priorityPool.length);
      return priorityPool[randomIndex].originalIndex;
    } else { // "sequential" modifier
      priorityPool.sort((a, b) => a.originalIndex - b.originalIndex);
      return priorityPool[0].originalIndex;
    }
  }, [deck, manualCardIndex, cardOrderMode, turnCount]);

  const currentQuestion = currentIndex !== -1 ? deck[currentIndex] : null;

  const navigateCard = (direction) => {
    if (deck.length === 0) return;
    setStreak(0); // Manually skipping resets streak
    let newIdx = currentIndex + direction;
    if (newIdx < 0) newIdx = deck.length - 1;
    if (newIdx >= deck.length) newIdx = 0;
    setManualCardIndex(newIdx);
  };

  const handleQuestionComplete = (questionId, newScore, passedOnFirstTry, isSkipped = false) => {
    setDeck((prevDeck) =>
      prevDeck.map((q) => {
        if (q.id === questionId) {
          let interval = newScore >= 9 ? 10 : newScore >= 7 ? 5 : newScore >= 5 ? 3 : 1;
          
          // If a flashcard is skipped when it has 10/10 score it changes to "mastered"
          const becomeMastered = isSkipped && q.score === 10;
          
          return {
            ...q,
            score: newScore,
            attempts: q.attempts + 1,
            dueTurn: turnCount + interval,
            isMastered: q.isMastered || becomeMastered
          };
        }
        return q;
      })
    );

    if (passedOnFirstTry && !isSkipped) {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setTurnCount((prev) => prev + 1);
    setManualCardIndex(null); // Clear manual override to respect card ordering settings
  };

  const goToDashboardCard = (index) => {
    setManualCardIndex(index);
    setView("study");
  };

  // Dashboard batch/individual operations
  const handleUpdateCards = (updates) => {
    setDeck(prev => prev.map(q => {
      const update = updates.find(u => u.id === q.id);
      if (update) {
        return { ...q, ...update.changes };
      }
      return q;
    }));
    showToast("Cards updated!");
  };

  const handleDeleteCards = (idsToDelete) => {
    setDeck(prev => {
       const filtered = prev.filter(q => !idsToDelete.includes(q.id));
       // Safety fallback if deleting causes manualCardIndex out of bounds
       if (manualCardIndex !== null && manualCardIndex >= filtered.length) {
         setManualCardIndex(null); 
       }
       return filtered;
    });
    showToast("Cards deleted!");
  };

  const handleSaveDeckToCache = (name) => {
    const newId = Date.now().toString();
    const newDeckInfo = { id: newId, name, deck: [...deck], completed: false };
    setMyDecks(prev => [...prev, newDeckInfo]);
    setLoadedDeckId(newId);
    showToast(t.alertDeckSaved || "Deck saved to My Decks!");
  };

  const handleOverwriteDeck = () => {
    if (!loadedDeckId) return;
    setMyDecks(prev => prev.map(d => d.id === loadedDeckId ? { ...d, deck: [...deck] } : d));
    showToast("Progress overwritten successfully!");
  };

  const handleLoadDeckFromCache = (id) => {
    const target = myDecks.find(d => d.id === id);
    if (target) {
      setDeck(target.deck);
      setLoadedDeckId(id);
      setTurnCount(0);
      setStreak(0);
      setView("study");
      showToast(t.alertDeckLoaded || "Deck loaded!");
    }
  };

  const handleDeleteDeckFromCache = (id) => {
    setMyDecks(prev => prev.filter(d => d.id !== id));
    if (loadedDeckId === id) setLoadedDeckId(null);
    showToast(t.alertDeckDeleted || "Deck deleted.");
  };

  const handleToggleDeckCompleted = (id) => {
    setMyDecks(prev => prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
  };

  const handleRenameDeck = (id, newName) => {
    setMyDecks(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    showToast("Deck renamed successfully!");
  };

  const handleDirectDropSave = (newDeckInfo) => {
    setMyDecks(prev => [...prev, newDeckInfo]);
    showToast(`Deck "${newDeckInfo.name}" added!`);
  };

  const handleExportProgress = () => {
    const data = { version: 5, turnCount, streak, deck, cardOrderMode, hintPref, myDecks, loadedDeckId };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurodeck-progress-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDeck = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error(t.alertJsonArray || "Must be a JSON array.");

      const newDeck = parsed.map((q, idx) => {
        const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
        if (!q.question || correctAnswersArray.length === 0 || !q.choices) {
          throw new Error(`${t.alertInvalidIndex || "Invalid format at index"} ${idx}`);
        }
        return {
          ...q,
          correctAnswers: correctAnswersArray,
          id: q.id || `custom-${Date.now()}-${idx}`,
          score: 0,
          dueTurn: 0,
          attempts: 0,
          isMastered: false
        };
      });

      setDeck(newDeck);
      setLoadedDeckId(null); // It's a new unsaved session
      setTurnCount(0);
      setView("study");
      showToast(t.alertDeckImported || "Deck imported successfully!");
    } catch (err) {
      showToast(`${t.alertInvalidFormat || "Invalid format:"} ${err.message}`);
    }
  };

  const handleImportProgress = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);

      if (Array.isArray(data)) {
        return handleImportDeck(jsonString);
      }

      if (data.deck && Array.isArray(data.deck)) {
        setDeck(data.deck);
        setTurnCount(data.turnCount || 0);
        setStreak(data.streak || 0);
        if (data.cardOrderMode) setCardOrderMode(data.cardOrderMode);
        if (data.hintPref) setHintPref(data.hintPref);
        if (data.myDecks) setMyDecks(data.myDecks);
        if (data.loadedDeckId) setLoadedDeckId(data.loadedDeckId);
        setView("study");
        showToast(t.alertRestored || "Progress restored!");
      } else {
        throw new Error(t.alertInvalidFormat || "Invalid format.");
      }
    } catch (err) {
      showToast(`${t.alertFailedRestore || "Failed to restore: "}${err.message}`);
    }
  };

  return (
    <div
      className={`flashcard-route min-h-screen text-[var(--text-main)] transition-colors duration-300 font-sans relative ${theme === 'light' ? 'light-mode' : ''}`}
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      {/* Header respecting global uOPets styling */}
      <nav className="navbar navbar-dark sticky-top z-50 w-full px-3 sm:px-4 pt-4 mb-4 sm:mb-8 d-flex flex-column align-items-center">
        <div className="neu-panel w-full max-w-5xl px-3 sm:px-6 py-2 sm:py-4 d-flex justify-content-between align-items-center gap-3">
          <div
            className="flex items-center space-x-2 sm:space-x-3 text-[var(--accent)] font-bold text-base sm:text-xl cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setView("study")}
          >
            <BrainIcon />
            <span className="uppercase tracking-widest text-xs sm:text-sm whitespace-nowrap">{t.appTitle}</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {streak > 0 && (
              <div className="hidden md:flex items-center space-x-2 text-xs px-4 py-2 neu-pressed font-bold text-orange-500">
                <FireIcon />
                <span>{streak} {t.streakLabel}</span>
              </div>
            )}

            <div className="hidden lg:flex items-center space-x-2 text-xs px-4 py-2 neu-pressed text-[var(--text-muted)] relative overflow-hidden">
              <div className="relative flex items-center space-x-2 z-10 font-bold">
                <CpuIcon />
                <span className="truncate max-w-[150px] sm:max-w-xs block" title={modelError}>
                  {modelStatus === "loading"
                    ? `${t.loadingAi || "Loading Engine..."} ${progressPercent}%`
                    : modelStatus === "ready"
                      ? `${t.aiReady || "AI Ready"} (${backendUsed})`
                      : modelStatus === "error"
                        ? `${t.aiError || "Engine Error"} ${modelError ? `(${modelError})` : ''}`
                        : t.waiting || "Waiting..."}
                </span>
              </div>
              {modelStatus === "loading" && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-20 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              )}
            </div>

            <button
              onClick={toggleLang}
              className="neu-btn w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-xs text-[var(--text-main)]"
              title="Toggle Language"
            >
              <span>{currentLangKey === 'FR' ? 'EN' : 'FR'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="neu-btn w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center transition-colors text-[var(--text-main)]"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <i className="fas fa-sun text-lg"></i> : <i className="fas fa-moon text-lg"></i>}
            </button>
            <button
              onClick={() => setView("dashboard")}
              className={`neu-btn w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center transition-colors ${view === "dashboard" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}
              title="Dashboard"
            >
              <ActivityIcon />
            </button>
            <button
              onClick={() => setView("settings")}
              className={`neu-btn w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center transition-colors ${view === "settings" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}
              title="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center p-2 sm:p-4 md:p-8 w-full max-w-4xl mx-auto mb-12">
        {view === "study" && (
          <StudyView
            question={currentQuestion}
            currentIndex={currentIndex}
            totalCards={deck.length}
            model={model}
            modelStatus={modelStatus}
            modelError={modelError}
            progressPercent={progressPercent}
            onComplete={handleQuestionComplete}
            onNavigate={navigateCard}
            hintPref={hintPref}
            t={t}
            showToast={showToast}
            currentLangKey={currentLangKey}
          />
        )}
        {view === "settings" && (
          <SettingsView
            currentDeck={deck}
            onImport={handleImportDeck}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            hintPref={hintPref}
            onHintPrefChange={setHintPref}
            cardOrderMode={cardOrderMode}
            onCardOrderChange={setCardOrderMode}
            onExportProgress={handleExportProgress}
            onImportProgress={handleImportProgress}
            myDecks={myDecks}
            loadedDeckId={loadedDeckId}
            onSaveDeckToCache={handleSaveDeckToCache}
            onOverwriteDeck={handleOverwriteDeck}
            onLoadDeckFromCache={handleLoadDeckFromCache}
            onDeleteDeckFromCache={handleDeleteDeckFromCache}
            onToggleDeckCompleted={handleToggleDeckCompleted}
            onRenameDeck={handleRenameDeck}
            onDirectDropSave={handleDirectDropSave}
            t={t}
          />
        )}
        {view === "dashboard" && (
          <DashboardView 
             deck={deck} 
             t={t} 
             onGoToCard={goToDashboardCard} 
             onUpdateCards={handleUpdateCards}
             onDeleteCards={handleDeleteCards}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[250] neu-panel px-6 py-4 border-l-4 border-[var(--accent)] max-w-sm flex items-center gap-3 animate-bounce shadow-2xl animate-fade-in">
          <i className="fas fa-info-circle text-[var(--accent)] text-xl"></i>
          <span className="text-sm font-bold text-[var(--text-main)]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- STUDY VIEW COMPONENT ---
const StudyView = ({
  question, currentIndex, totalCards, model, modelStatus, modelError, progressPercent, onComplete,
  onNavigate, hintPref, t, showToast, currentLangKey
}) => {
  const [phase, setPhase] = useState("input");
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  
  // Visual 0.0 to 10.0 scale for the UI
  const [tempSimScore, setTempSimScore] = useState(0);

  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [hintText, setHintText] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);

  // New Scoring & Evaluation State
  const [evalMethod, setEvalMethod] = useState(null); 
  const [wrongClicks, setWrongClicks] = useState(0);
  const [clickedWrongChoices, setClickedWrongChoices] = useState(new Set()); 
  const [skippedToMCQ, setSkippedToMCQ] = useState(false); 

  // MCQ State for multiple answers
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

  // Build clean, case-insensitive Set of stop words to avoid crashes or leaks
  const stopWordsSet = useMemo(() => {
    const list = Array.isArray(STOP_WORDS)
      ? STOP_WORDS
      : (STOP_WORDS instanceof Set ? Array.from(STOP_WORDS) : []);
    return new Set(list.map(w => w.toLowerCase()));
  }, []);

  // Reset state on new question
  useEffect(() => {
    setPhase("input");
    setUserInput("");
    setFeedback(null);
    setTempSimScore(0);
    setHintText(null);
    setHintUsed(false);
    setIsGeneratingHint(false);

    setEvalMethod(null);
    setWrongClicks(0);
    setClickedWrongChoices(new Set());
    setSkippedToMCQ(false);
    setWasRightClicked(false);
    setSelectedChoices(new Set());
    setShakingChoices(new Set());
    setCalculatedScore(0);
  }, [question]);

  // Auto-focus the next button when success phase is reached
  useEffect(() => {
    if (phase === "success" && nextBtnRef.current) {
      setTimeout(() => {
        nextBtnRef.current?.focus();
      }, 50);
    }
  }, [phase]);

  // Calculate strict initial vs progressive scores
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

  // Keyboard controls for MCQ toggle / submit
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
    // Trigger isSkipped = true so it can be evaluated for mastery
    onComplete(question.id, newScore, true, true);
  };

  // Upgraded NLI Helper strictly adhering to Pure Semantic Entailment & accurate parsing
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

  // High-Accuracy Single-Stage Cross-Encoder Evaluation Architecture (Pure Implementation)
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
      
      const basePhrase = currentLangKey === 'FR' ? `L'idée principale est :` : `The core meaning is:`;
      const statementUser = `${basePhrase} ${userInput.trim()}`;
      const yieldThread = () => new Promise(resolve => setTimeout(resolve, 15));

      const evaluateBidirectional = async (choiceText, debugLabel) => {
        const statementChoice = `${basePhrase} ${choiceText.trim()}`;

        const combinedForward = `${statementUser} ${sepToken} ${statementChoice}`;
        const outForward = await model(combinedForward, { top_k: 5, topk: 5 });
        await yieldThread(); 
        const resForward = getEntailmentScores(outForward, `${debugLabel} (Forward)`);
        
        const combinedBackward = `${statementChoice} ${sepToken} ${statementUser}`;
        const outBackward = await model(combinedBackward, { top_k: 5, topk: 5 });
        await yieldThread(); 
        const resBackward = getEntailmentScores(outBackward, `${debugLabel} (Backward)`);
        
        const avgEntailment = (resForward.entailment + resBackward.entailment) / 2;
        const isEntailment = resForward.isEntailment || resBackward.isEntailment;
        
        return { entailment: avgEntailment, isEntailment };
      };

      const compositeDistractor = incorrectTexts.join(". ");
      const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d.trim());
      const validTruths = truthTexts.filter(t => t.trim());

      let maxDistractorScore = 0;
      let closestIncorrectText = null;

      for (const dist of distractorField) {
          const res = await evaluateBidirectional(dist, "Distractor");
          if (res.entailment > maxDistractorScore) {
              maxDistractorScore = res.entailment;
              closestIncorrectText = dist === compositeDistractor ? "Composite Distractor" : dist;
          }
      }

      let hits = 0;
      let totalEntailment = 0;

      for (const truth of validTruths) {
          const cleanTruth = truth.trim().toLowerCase();
          if (cleanInput === cleanTruth) {
              totalEntailment += 1.0;
              hits++;
              continue;
          }
          
          const res = await evaluateBidirectional(truth, "Truth");
          totalEntailment += res.entailment;
          
          if (res.entailment > maxDistractorScore && res.isEntailment) {
              hits++;
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

      if (hits === validTruths.length && validTruths.length > 0) {
        updateLeniencyBiasOnNormalPass();
        setPhase("success");
        setCalculatedScore(calculateNewScore("text"));
      } else if (hits > 0) {
        setPhase("input");
        setFeedback({
          type: "close",
          sim: mappedScore10,
          overridden: false,
          customMessage: `${t.partialMatch || "Partial Match!"} ${hits}/${validTruths.length} ${t.correctConcepts || "correct concepts identified. Keep going!"}`
        });
      } else {
        setPhase("input");
        if (maxDistractorScore > avgEntailment) {
          setFeedback({
            type: "leaning_wrong",
            sim: mappedScore10,
            wrongSim: maxDistractorScore,
            wrongTarget: closestIncorrectText,
            overridden: false
          });
        } else {
          setFeedback({
            type: "wrong",
            sim: mappedScore10,
            overridden: false,
          });
        }
      }
    } catch (err) {
      showToast(t.alertError || "Error evaluating input.");
      setPhase("input");
    }
  };

  const [wasRightClicked, setWasRightClicked] = useState(false);

  const handleOverrideAI = () => {
    const aiScoreRatio = tempSimScore > 0 ? (tempSimScore / 10.0) : 0.4;
    updateLeniencyBiasOnOverride(aiScoreRatio);

    setWasRightClicked(true);
    setPhase("success");
    setEvalMethod("text");
    setCalculatedScore(10);
    setFeedback(null);

    if (showToast) {
      showToast(t.overrideTune || t.iWasRight || "Wait, my typed answer was right! (Tune AI)");
    }
  };



  const generateSmartHint = async () => {
    setIsGeneratingHint(true);
    try {
      const truthText = correctAnswersArray.join(" ");
      const words = truthText.split(/\s+/)
        .map(w => ({ original: w, clean: w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }))
        .filter(w => w.clean.length > 2 && !stopWordsSet.has(w.clean));

      if (words.length === 0) {
        setHintText(t.shortHintError);
        setIsGeneratingHint(false);
        return;
      }

      const yieldThread = () => new Promise(resolve => setTimeout(resolve, 15));
      const sepToken = model?.tokenizer?.sep_token || "[SEP]";
      const basePhrase = currentLangKey === 'FR' ? `L'idée principale est :` : `The core meaning is:`;
      const statementTruth = `${basePhrase} ${truthText}`;

      const combinedBase = `${statementTruth} ${sepToken} ${statementTruth}`;
      const baseOutput = await model(combinedBase, { top_k: 3, topk: 3 });
      await yieldThread();
      const baseEmb = getEntailmentScores(baseOutput, "HintBase").entailment;

      for (const w of words) {
        const ablatedInput = truthText.replace(new RegExp(`\\b${escapeRegExp(w.original)}\\b`, 'gi'), "");
        const statementAblated = `${basePhrase} ${ablatedInput.trim()}`;
        
        const combinedAblated = `${statementAblated} ${sepToken} ${statementTruth}`;
        const ablOut = await model(combinedAblated, { top_k: 3, topk: 3 });
        await yieldThread();
        
        const ablEnt = getEntailmentScores(ablOut, `HintAblate_${w.clean}`).entailment;
        w.sim = baseEmb - ablEnt; 
      }

      words.sort((a, b) => b.sim - a.sim);
      const topWords = words.slice(0, 2); 

      if (hintPref === "ablation") {
        let hintedText = truthText;
        topWords.forEach(w => {
          hintedText = hintedText.replace(new RegExp(`\\b${escapeRegExp(w.original)}\\b`, 'gi'), "_".repeat(w.original.length));
        });
        setHintText(hintedText);
      } else if (hintPref === "synonym") {
        const allSynonyms = [];
        for (let w of topWords) {
          try {
            const res = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(w.clean)}&max=8`);
            const data = await res.json();
            const valid = data.filter(d => {
              const syn = d.word.toLowerCase();
              const overlap = correctAnswersArray.some(ans => ans.toLowerCase().includes(syn) || syn.includes(ans.toLowerCase()));
              return !overlap && syn.length > 2;
            });
            if (valid.length > 0) allSynonyms.push(...valid.slice(0, 2).map(v => v.word));
          } catch (e) {}
        }

        if (allSynonyms.length > 0) {
          setHintText(`${t.relatedConceptHint} ${[...new Set(allSynonyms)].join(", ")}`);
        } else {
          setHintText(`${t.stronglyRelatedHint} ${topWords.map(w => w.original).join(", ")}`);
        }
      }
      setHintUsed(true);
    } catch (e) {
      setHintText(t.aiHintError);
    }
    setIsGeneratingHint(false);
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
    // Ensure `isSkipped` param evaluates explicitly as false
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

      {/* Navigation Controls */}
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
        {/* Progress/Score Header */}
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

        {/* Question Text & Skip/MCQ Buttons */}
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

        {/* INPUT PHASE */}
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

            {/* Loading AI State */}
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

            {/* AI Error State */}
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

            {/* INLINE FEEDBACK UI */}
            {feedback && phase === "input" && (
              <div className="mt-3 sm:mt-6 neu-pressed p-3 sm:p-6 rounded-xl sm:rounded-2xl animate-fade-in" style={{
                borderLeft: `4px solid ${feedback.type === "close" ? '#3b82f6' : '#ef4444'}`
              }}>
                <h3 className="font-black text-sm sm:text-lg flex items-center mb-1 sm:mb-2" style={{ color: feedback.type === "close" ? '#3b82f6' : '#ef4444' }}>
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

                {hintText ? (
                  <div className="mb-3 sm:mb-6 neu-flat p-3 sm:p-5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-mono text-[var(--text-main)]">
                    <span className="font-black text-[var(--accent)] mr-2 sm:mr-3 uppercase tracking-widest block sm:inline mb-1 sm:mb-0">{t.aiHintLabel}</span>
                    {hintText}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      onClick={generateSmartHint}
                      disabled={isGeneratingHint}
                      className="neu-btn flex-1 py-2 sm:py-4 px-3 sm:px-6 font-bold uppercase tracking-wider flex items-center justify-center disabled:opacity-50 text-[var(--accent)] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
                    >
                      {isGeneratingHint ? <i className="fas fa-spinner fa-spin mr-2 sm:mr-3"></i> : <SparklesIcon className="mr-2 sm:mr-3" />}
                      <span>{t.getAiHint}</span>
                    </button>
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
                      className="text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-[#10b981] font-bold transition-colors uppercase tracking-widest"
                    >
                      {t.iWasRight || "I was right (Override AI)"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MCQ PHASE */}
        {phase === "mcq" && (
          <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {shuffledChoices.map((choice, idx) => {
                const isSelected = selectedChoices.has(choice);
                const isShaking = shakingChoices.has(choice);
                const isClickedWrong = clickedWrongChoices.has(choice);

                if (isSingleAnswer) {
                  let extraClass = "neu-btn text-[var(--text-main)]";
                  if (isClickedWrong) extraClass = "neu-pressed opacity-50 text-[#ef4444]";
                  if (isShaking) extraClass += " animate-custom-shake text-[#ef4444]";

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
                if (isShaking) extraClass += " animate-custom-shake text-[#ef4444]";

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
                  <p className="text-[#ef4444] font-bold text-[10px] sm:text-sm uppercase tracking-widest text-center">
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

            {userInput && userInput.trim() && (
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5 flex flex-col items-center">
                <button
                  onClick={handleOverrideAI}
                  className="neu-btn px-6 py-3 sm:px-8 sm:py-3.5 font-black uppercase tracking-widest text-[color:var(--color-success)] hover:text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all w-full sm:w-auto"
                >
                  <i className="fas fa-thumbs-up text-sm"></i>
                  <span>{t.overrideTune || t.iWasRight || "Wait, my typed answer was right! (Tune AI)"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS PHASE */}
        {phase === "success" && (
          <div className="mt-4 sm:mt-8 animate-fade-in">
            <div className="mb-4 sm:mb-8 neu-pressed p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center justify-between" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="mb-3 sm:mb-0 text-center sm:text-left">
                <h3 className="font-black text-base sm:text-xl text-[#10b981] flex items-center justify-center sm:justify-start uppercase tracking-widest">
                  <CheckIcon className="mr-2 sm:mr-3 text-lg sm:text-2xl" /> {t.correct}
                </h3>
                <p className="text-[10px] sm:text-sm font-bold text-[var(--text-muted)] mt-1 sm:mt-2 uppercase tracking-widest">
                  {t.scoreLabel} <strong className="text-sm sm:text-lg text-[var(--text-main)]">{calculatedScore}</strong>/10
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto gap-2">
                <button
                  ref={nextBtnRef}
                  onClick={handleNext}
                  className="neu-btn w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-4 font-black uppercase tracking-widest text-[#10b981] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl"
                >
                  {t.nextQuestion} <i className="fas fa-arrow-right ml-2"></i>
                </button>
                {userInput && userInput.trim() && skippedToMCQ && !wasRightClicked && calculatedScore < 10 && (
                  <button
                    onClick={handleOverrideAI}
                    className="neu-btn px-4 py-2 font-black uppercase tracking-widest text-[color:var(--color-success)] text-[10px] sm:text-xs rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <i className="fas fa-thumbs-up text-xs"></i>
                    <span>{t.overrideTune || t.iWasRight || "Wait, my typed answer was right! (Tune AI)"}</span>
                  </button>
                )}
              </div>
            </div>


            <div className="grid grid-cols-1 gap-3 sm:gap-4 opacity-70">
              {question.choices.map((choice, idx) => {
                const isCorrect = correctAnswersArray.includes(choice);
                if (!isCorrect) return null;
                return (
                  <div key={idx} className="w-full text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl font-medium flex items-center text-xs sm:text-base neu-pressed" style={{ color: '#10b981', borderLeft: '4px solid #10b981' }}>
                    <i className="fas fa-check text-lg mr-3 sm:mr-4"></i> <span className="leading-relaxed">{choice}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --- SETTINGS VIEW ---
const SettingsView = ({
  currentDeck, onImport, selectedModel, onModelChange,
  hintPref, onHintPrefChange, cardOrderMode, onCardOrderChange,
  onExportProgress, onImportProgress,
  myDecks, loadedDeckId, onSaveDeckToCache, onOverwriteDeck, onLoadDeckFromCache, 
  onDeleteDeckFromCache, onToggleDeckCompleted, onRenameDeck, onDirectDropSave, t
}) => {
  const [jsonInput, setJsonInput] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [editingDeckName, setEditingDeckName] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); 
  const [sortBy, setSortBy] = useState("name");
  
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setJsonInput(JSON.stringify(currentDeck, null, 2));
  }, [currentDeck]);

  const processedDecks = useMemo(() => {
    let decks = myDecks.map(d => {
       const total = d.deck.length;
       const mastered = d.deck.filter(q => q.score >= 8 || q.isMastered).length;
       const avgScore = total > 0 ? (d.deck.reduce((s, q) => s + (q.isMastered ? 10 : q.score), 0) / total) : 0;
       const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
       return { ...d, mastered, avgScore, progress };
    });

    decks = decks.filter(d => {
       const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
       const matchesStatus = filterMode === 'all' || (filterMode === 'completed' ? d.progress === 100 : d.progress < 100);
       return matchesSearch && matchesStatus;
    });

    decks.sort((a, b) => {
       if (sortBy === 'name') return a.name.localeCompare(b.name);
       if (sortBy === 'score') return b.avgScore - a.avgScore;
       if (sortBy === 'progress') return b.progress - a.progress;
       return 0;
    });

    return decks;
  }, [myDecks, searchQuery, filterMode, sortBy]);

  const AVAILABLE_MODELS = [
    { id: "Xenova/nli-deberta-v3-small", name: "DeBERTa-v3 NLI (Small)", desc: t.fastLightweight || "High-accuracy Cross-Encoder" },
    { id: "Xenova/mdeberta-v3-base-xnli-multilingual-nli-2mil7", name: "mDeBERTa-v3 Multilingual NLI", desc: "Multilingual NLI (French, English, 15+ Langs)" },
    { id: "Xenova/nli-deberta-v3-base", name: "DeBERTa-v3 NLI (Base)", desc: t.moreAccurate || "Maximum accuracy (Slower)" }
  ];

  const handleCopyPrompt = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t.llmPromptTemplate);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = t.llmPromptTemplate;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.json')) return;
    
    const name = file.name.replace('.json', '');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("Not a JSON array");
        
        const formattedDeck = parsed.map((q, idx) => {
          const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
          return {
            ...q,
            correctAnswers: correctAnswersArray,
            id: q.id || `custom-${Date.now()}-${idx}`,
            score: 0,
            dueTurn: 0,
            attempts: 0,
            isMastered: false
          };
        });

        onDirectDropSave({
          id: Date.now().toString(),
          name: name,
          deck: formattedDeck,
          completed: false
        });
      } catch (err) {
        console.error("Drop import failed", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-8">
      
     {/* MY DECKS CACHE SECTION WITH DRAG & DROP */}
      <div 
        className={`neu-panel p-4 sm:p-8 md:p-12 transition-all border-2 ${isDraggingOver ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-5' : 'border-transparent'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
        onDrop={handleDrop}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] flex items-center uppercase tracking-widest">
            <SaveIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.myDecksTitle || "My Decks"}
          </h2>
          {isDraggingOver && (
            <span className="text-[var(--accent)] font-bold text-xs sm:text-sm animate-pulse">
              Drop JSON here to add...
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
           <input
             type="text"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder={t.searchDecksPrompt}
             className="neu-pressed px-4 py-3 rounded-xl bg-transparent text-[var(--text-main)] text-sm font-medium outline-none"
           />
           <div className="flex gap-2">
             <select onChange={(e) => setFilterMode(e.target.value)} className="neu-btn px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                <option value="all">{t.all}</option>
                <option value="completed">{t.completed}</option>
                <option value="in-progress">{t.inProgress}</option>
             </select>
             <select onChange={(e) => setSortBy(e.target.value)} className="neu-btn px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                <option value="name">{t.sortByName}</option>
                <option value="score">{t.sortByAvg}</option>
                <option value="progress">{t.sortByProgress}</option>
             </select>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
          <input
             type="text"
             value={newDeckName}
             onChange={e => setNewDeckName(e.target.value)}
             placeholder={t.deckNamePlaceholder || "Enter deck name..."}
             className="neu-pressed flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-transparent outline-none text-[var(--text-main)] text-xs sm:text-sm font-medium focus-within:ring-2 focus:ring-[var(--accent)] transition-all min-w-[200px]"
          />
          <button
             onClick={() => {
               if (newDeckName.trim()) {
                 onSaveDeckToCache(newDeckName.trim());
                 setNewDeckName("");
               }
             }}
             disabled={!newDeckName.trim()}
             className="neu-btn px-4 sm:px-8 py-3 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] rounded-lg sm:rounded-2xl disabled:opacity-50 text-[10px] sm:text-sm active:scale-95 transition-all whitespace-nowrap"
          >
            {t.saveDeckBtn || "Save as New"}
          </button>
          
          {loadedDeckId && (
            <button
               onClick={onOverwriteDeck}
               className="neu-btn px-4 sm:px-8 py-3 sm:py-4 font-black uppercase tracking-widest text-[#10b981] rounded-lg sm:rounded-2xl text-[10px] sm:text-sm active:scale-95 transition-all whitespace-nowrap"
            >
              <i className="fas fa-sync-alt mr-2"></i> {t.overwriteDeckBtn || "Overwrite Progress"}
            </button>
          )}
        </div>

        
       {processedDecks && processedDecks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {processedDecks.map(d => (
               <div key={d.id} className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-colors ${loadedDeckId === d.id ? 'neu-flat border-l-4 border-[var(--accent)]' : 'neu-pressed'}`}>
                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                     {/* Stats Indicators */}
                     <div className="flex-shrink-0 flex flex-col items-center gap-1 w-12">
                        <span className="text-[10px] font-black text-[var(--accent)]">{d.progress}%</span>
                        <div className="w-8 h-1 bg-[var(--text-muted)] opacity-20 rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--accent)]" style={{ width: `${d.progress}%` }}></div>
                        </div>
                     </div>

                     <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        <div className="truncate">
                           <h3 className="font-black text-sm sm:text-base truncate">{d.name}</h3>
                           <p className="text-[9px] sm:text-xs text-[var(--text-muted)] font-medium">
                              {d.deck.length} {t.cardsLabel || "cards"} • Avg: {d.avgScore.toFixed(1)}/10
                           </p>
                        </div>
                     </div>
                     
                     {/* Renaming Flow */}
                     {editingDeckId === d.id ? (
                        <div className="flex flex-1 items-center gap-2">
                           <input
                              type="text"
                              value={editingDeckName}
                              onChange={(e) => setEditingDeckName(e.target.value)}
                              autoFocus
                              className="neu-pressed w-full px-3 py-1 rounded bg-transparent text-[var(--text-main)] text-sm font-black outline-none focus:ring-1 focus:ring-[var(--accent)]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                   if (editingDeckName.trim()) onRenameDeck(d.id, editingDeckName.trim());
                                   setEditingDeckId(null);
                                } else if (e.key === 'Escape') {
                                   setEditingDeckId(null);
                                }
                              }}
                           />
                           <button 
                             onClick={() => {
                               if (editingDeckName.trim()) onRenameDeck(d.id, editingDeckName.trim());
                               setEditingDeckId(null);
                             }}
                             className="text-[#10b981] hover:opacity-80 p-2"
                           >
                              <CheckIcon />
                           </button>
                        </div>
                     ) : (
                        <div className="flex-2 flex items-center gap-2 overflow-hidden">
                           <button 
                             onClick={() => { setEditingDeckId(d.id); setEditingDeckName(d.name); }}
                             className="text-[var(--text-muted)] hover:text-[var(--accent)] p-2 ml-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
                           >
                             <EditIcon />
                           </button>
                        </div>
                     )}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                     <button 
                        onClick={() => onLoadDeckFromCache(d.id)} 
                        disabled={loadedDeckId === d.id}
                        className={`neu-btn flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${loadedDeckId === d.id ? 'opacity-50 text-[var(--text-muted)]' : 'text-[var(--accent)]'}`}
                     >
                        {loadedDeckId === d.id ? t.loadedDeck : (t.loadBtn || "Load")}
                     </button>
                     <button
                        onClick={() => {
                          if (confirmDeleteId === d.id) {
                            onDeleteDeckFromCache(d.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(d.id);
                            setTimeout(() => setConfirmDeleteId(null), 3000);
                          }
                        }}
                        className={`neu-btn flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${confirmDeleteId === d.id ? 'bg-[#ef4444] text-white' : 'text-[#ef4444]'}`}
                     >
                        {confirmDeleteId === d.id ? (t.confirmDeleteBtn || "Sure?") : (t.deleteBtn || "Delete")}
                     </button>
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium text-center py-8 neu-pressed rounded-xl border border-dashed border-white/10">
             {t.noSavedDecks || "No saved decks yet. Drag and drop a .json file here to import!"}
          </p>
        )}
      </div>

      {/* Card Delivery Modifier Setting */}
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <ClockIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> Card Delivery Modifier
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
          Spaced Repetition algorithm is always enabled, continuously prioritizing unmastered cards with the lowest performance scores. Choose how you want cards delivered when several are due with the same priority:
        </p>
        <div className="flex flex-col gap-3 sm:gap-4">
          {[
            { id: "random", name: t.orderRandom || "Randomised (Recommended)", icon: RandomIcon },
            { id: "sequential", name: t.orderSequential || "Sequential", icon: SeqIcon }
          ].map(mode => (
            <label key={mode.id} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-center text-left transition-all duration-300 ${cardOrderMode === mode.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
              <input type="radio" value={mode.id} checked={cardOrderMode === mode.id} onChange={(e) => onCardOrderChange(e.target.value)} className="hidden" />
              <div className="mr-3 sm:mr-4 opacity-80 text-lg sm:text-xl"><mode.icon /></div>
              <span className="font-black uppercase tracking-widest text-xs sm:text-base">{mode.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Backup Section */}
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-6 flex items-center uppercase tracking-widest">
          <DownloadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.dataBackup}
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
          {t.dataBackupDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button onClick={onExportProgress} className="neu-btn flex-1 py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--accent)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            <DownloadIcon className="mr-2 sm:mr-3" /> {t.exportBackup}
          </button>
          <button onClick={() => fileInputRef.current.click()} className="neu-btn flex-1 py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            <UploadIcon className="mr-2 sm:mr-3" /> {t.importBackup}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => onImportProgress(event.target.result);
              reader.readAsText(file);
              e.target.value = null;
            }}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Hints Section */}
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <SparklesIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.hintEngine}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <label className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-start text-left transition-all ${hintPref === "ablation" ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
            <input type="radio" name="hint-pref" value="ablation" checked={hintPref === "ablation"} onChange={(e) => onHintPrefChange(e.target.value)} className="hidden" />
            <div>
              <div className="font-black mb-1 sm:mb-2 uppercase tracking-widest text-xs sm:text-base">{t.blankCoreWords}</div>
              <div className="text-[9px] sm:text-xs font-medium opacity-70 leading-relaxed">{t.blankCoreWordsDesc}</div>
            </div>
          </label>
          <label className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-start text-left transition-all ${hintPref === "synonym" ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
            <input type="radio" name="hint-pref" value="synonym" checked={hintPref === "synonym"} onChange={(e) => onHintPrefChange(e.target.value)} className="hidden" />
            <div>
              <div className="font-black mb-1 sm:mb-2 uppercase tracking-widest text-xs sm:text-base">{t.relatedConcept}</div>
              <div className="text-[9px] sm:text-xs font-medium opacity-70 leading-relaxed">{t.relatedConceptDesc}</div>
            </div>
          </label>
        </div>
      </div>

      {/* AI Model Section */}
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <CpuIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.aiModelTitle}
        </h2>
        <div className="flex flex-col gap-2 sm:gap-4">
          {AVAILABLE_MODELS.map((m) => (
            <label key={m.id} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-center text-left transition-all duration-300 ${selectedModel === m.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
              <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id} onChange={(e) => onModelChange(e.target.value)} className="hidden" />
              <div>
                <div className="font-black uppercase tracking-widest text-xs sm:text-base">{m.name}</div>
                <div className="text-[9px] sm:text-xs font-medium opacity-70 mt-1">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Deck JSON Section */}
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-6 flex items-center uppercase tracking-widest">
          <UploadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.rawDeckImport}
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-3 sm:mb-6 text-[10px] sm:text-sm">
          {t.rawDeckImportDesc}
        </p>
        <textarea
          className="neu-pressed w-full h-48 sm:h-80 p-3 sm:p-6 font-mono text-[9px] sm:text-xs rounded-xl sm:rounded-2xl border-0 text-[var(--text-main)] outline-none bg-transparent focus-within:ring-2 focus:ring-[#ef4444] transition-all"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <div className="mt-4 sm:mt-8 flex justify-end">
          <button onClick={() => onImport(jsonInput)} className="neu-btn w-full sm:w-auto px-4 sm:px-10 py-2 sm:py-4 font-black uppercase tracking-widest text-[#ef4444] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            {t.importResetDeck}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD VIEW ---
const DashboardView = ({ deck, t, onGoToCard, onUpdateCards, onDeleteCards }) => {
  const averageScore = deck.length > 0 ? (deck.reduce((acc, q) => acc + (q.isMastered ? 10 : q.score), 0) / deck.length).toFixed(1) : 0;
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteConfirmState, setDeleteConfirmState] = useState(false);

  const toggleSelectAll = (e) => {
    if (selectedIds.size === deck.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deck.map(q => q.id)));
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchReset = () => {
    if (selectedIds.size === 0) return;
    const updates = Array.from(selectedIds).map(id => ({
      id,
      changes: { score: 0, attempts: 0, isMastered: false }
    }));
    onUpdateCards(updates);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (deleteConfirmState) {
       onDeleteCards(Array.from(selectedIds));
       setSelectedIds(new Set());
       setDeleteConfirmState(false);
    } else {
       setDeleteConfirmState(true);
       setTimeout(() => setDeleteConfirmState(false), 3000);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 sm:mb-10 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] flex items-center uppercase tracking-widest">
            <ActivityIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.dashboardTitle}
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full lg:w-auto items-center">
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                 <button onClick={handleBatchReset} className="neu-btn px-4 py-2 text-[10px] sm:text-xs font-bold text-orange-500 uppercase tracking-widest rounded-lg transition-colors">
                   <RefreshIcon className="mr-2" /> Reset
                 </button>
                 <button onClick={handleBatchDelete} className={`neu-btn px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${deleteConfirmState ? 'bg-red-500 text-white' : 'text-red-500'}`}>
                   <TrashIcon className="mr-2" /> {deleteConfirmState ? "Sure?" : "Delete"}
                 </button>
              </div>
            )}
            <div className="neu-pressed flex-1 lg:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl flex items-center justify-between lg:justify-start">
              <span className="text-[var(--text-muted)] font-black text-[9px] sm:text-xs uppercase tracking-widest mr-2 sm:mr-3">{t.average}</span>
              <span className="font-black text-[var(--accent)] text-xs sm:text-base">{averageScore}/10</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto neu-pressed rounded-xl sm:rounded-3xl p-1 sm:p-2">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[9px] sm:text-xs uppercase tracking-widest border-b border-white/5">
                <th className="py-2 px-2 sm:py-5 sm:px-6 w-10 text-center">
                   <input type="checkbox" checked={selectedIds.size === deck.length && deck.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                </th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black">{t.questionCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-16 sm:w-24">{t.attemptsCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32">{t.scoreCol}</th>
                <th className="py-2 px-2 sm:py-5 sm:px-6 font-black text-center w-24 sm:w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deck.map((q, i) => (
                <tr key={i} onClick={() => onGoToCard(i)} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(q.id)} onChange={(e) => toggleSelect(q.id, e)} className="cursor-pointer" />
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-[var(--text-main)] font-medium text-[10px] sm:text-sm leading-relaxed group-hover:text-[var(--accent)] transition-colors">
                    <span className="line-clamp-2">{q.question}</span>
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center text-[var(--text-muted)] font-black text-[10px] sm:text-sm">
                    {q.attempts}
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center">
                    <div className="flex justify-center items-center">
                      {q.isMastered ? (
                        <span className="text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                           Mastered
                        </span>
                      ) : (
                        <select
                           value={q.score}
                           onClick={(e) => e.stopPropagation()}
                           onChange={(e) => {
                             e.stopPropagation();
                             onUpdateCards([{ id: q.id, changes: { score: parseInt(e.target.value) } }]);
                           }}
                           className={`neu-pressed px-2 py-1 rounded text-[10px] sm:text-xs font-black outline-none cursor-pointer uppercase tracking-widest ${
                             q.attempts === 0 ? "text-[var(--text-muted)]" :
                             q.score <= 3 ? "text-red-500" :
                             q.score <= 7 ? "text-orange-500" :
                             "text-green-500"
                           }`}
                        >
                           {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-[var(--bg-main)]">{n} / 10</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:py-5 sm:px-6 text-center">
                     <div className="flex justify-center gap-3">
                        <button 
                           onClick={(e) => { e.stopPropagation(); onUpdateCards([{ id: q.id, changes: { score: 0, attempts: 0, isMastered: false } }]); }}
                           className="text-[var(--text-muted)] hover:text-orange-500 transition-colors p-1"
                           title="Reset Score"
                        >
                           <RefreshIcon />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); onDeleteCards([q.id]); }}
                           className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                           title="Delete Card"
                        >
                           <TrashIcon />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {deck.length === 0 && (
                <tr>
                   <td colSpan="5" className="py-8 text-center text-[var(--text-muted)] font-medium text-xs sm:text-sm">
                      Deck is completely empty. Import some cards!
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
