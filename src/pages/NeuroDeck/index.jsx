import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSharedLogic } from '../../utilities/shared';
import { useNLIModel } from '../../hooks/useNLIModel';
import { useEmbeddingModel } from '../../hooks/useEmbeddingModel';
import { TRANSLATIONS, DEFAULT_DECK } from '../../data/flashcardData';
import { cosineSimilarity } from '../../utilities/shared';


import { useNeuroSync } from './hooks/useNeuroSync';
import { useDeckManager } from './hooks/useDeckManager';
import { useStudyEngine } from './hooks/useStudyEngine';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { StudyView } from './components/StudyView';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { BrainIcon, SettingsIcon, ActivityIcon, CpuIcon, FireIcon, NetworkIcon } from './components/Icons';

const SYNC_API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api/sync' : '/api/sync';

export default function NeuroDeck() {
  const [view, setView] = useState("study");
  const navigate = useNavigate();
  const location = useLocation();
  const { appTheme, theme, toggleTheme, lang, toggleLang } = useSharedLogic([]);

  const currentLangKey = (lang || 'EN').toUpperCase();
  const t = TRANSLATIONS[currentLangKey] || TRANSLATIONS.EN;

  const [myDecks, setMyDecks] = useState(() => {
    try {
      const savedDecks = localStorage.getItem('neurodeck-my-decks');
      const parsed = savedDecks ? JSON.parse(savedDecks) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [loadedDeckId, setLoadedDeckId] = useState(() => {
    try {
      return localStorage.getItem('neurodeck-loaded-deck-id') || null;
    } catch (e) {
      return null;
    }
  });

  const [currentDeck, setCurrentDeck] = useState(() => {
    try {
      const savedDeck = localStorage.getItem('neurodeck-progress');
      const parsed = savedDeck ? JSON.parse(savedDeck) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DECK;
    } catch (e) {
      return DEFAULT_DECK;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      return parseInt(localStorage.getItem('neurodeck-current-index')) || 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem('neurodeck-my-decks', JSON.stringify(myDecks));
  }, [myDecks]);

  useEffect(() => {
    if (loadedDeckId) {
      localStorage.setItem('neurodeck-loaded-deck-id', loadedDeckId);
    } else {
      localStorage.removeItem('neurodeck-loaded-deck-id');
    }
  }, [loadedDeckId]);

  useEffect(() => {
    localStorage.setItem('neurodeck-progress', JSON.stringify(currentDeck));
  }, [currentDeck]);

  useEffect(() => {
    localStorage.setItem('neurodeck-current-index', currentIndex.toString());
  }, [currentIndex]);

  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('neurodeck-ai-model') || "Xenova/nli-deberta-v3-small";
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-ai-model', selectedModel);
  }, [selectedModel]);
  
  const { model, modelStatus, backendUsed, modelError, progressPercent } = useNLIModel(selectedModel);

  const [cardOrderMode, setCardOrderMode] = useState(() => {
    return localStorage.getItem('neurodeck-card-order') || "random";
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-card-order', cardOrderMode);
  }, [cardOrderMode]);
  
  const [servingMode, setServingMode] = useState(() => {
    return localStorage.getItem('neurodeck-serving-mode') || "full";
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-serving-mode', servingMode);
  }, [servingMode]);
  
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState(() => {
    return localStorage.getItem('neurodeck-embedding-model') || "Xenova/all-MiniLM-L6-v2";
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-embedding-model', selectedEmbeddingModel);
  }, [selectedEmbeddingModel]);

  const [focusMode, setFocusMode] = useState(() => {
    try {
      const saved = localStorage.getItem('neurodeck-focus-mode');
      return saved ? JSON.parse(saved) : { active: false, focalNodeId: null, threshold: 0.85 };
    } catch (e) {
      return { active: false, focalNodeId: null, threshold: 0.85 };
    }
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-focus-mode', JSON.stringify(focusMode));
  }, [focusMode]);

  const [questionTypeSettings, setQuestionTypeSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('neurodeck-question-type-settings');
      return saved ? JSON.parse(saved) : { long: true, mcc: true, multi: true, proportional: true };
    } catch (e) {
      return { long: true, mcc: true, multi: true, proportional: true };
    }
  });
  useEffect(() => {
    localStorage.setItem('neurodeck-question-type-settings', JSON.stringify(questionTypeSettings));
  }, [questionTypeSettings]);

  const { getEmbeddings, modelStatus: embeddingStatus, backendUsed: embeddingBackend, modelError: embeddingError, progressPercent: embeddingProgress } = useEmbeddingModel(selectedEmbeddingModel);
  const [cardEmbeddings, setCardEmbeddings] = useState({});
  const activeEmbeddingModelRef = useRef(selectedEmbeddingModel);

  const handleRecalculateGraph = () => {
    if (activeEmbeddingModelRef.current !== selectedEmbeddingModel) {
      setCardEmbeddings({});
      activeEmbeddingModelRef.current = selectedEmbeddingModel;
    }
  };

  useEffect(() => {
    if (!currentDeck || !getEmbeddings || embeddingStatus !== 'ready') return;
    const toEmbed = currentDeck.filter(q => !cardEmbeddings[q.id]);
    if (toEmbed.length === 0) return;

    const texts = toEmbed.map(q => q.question);
    getEmbeddings(texts).then(res => {
       if (res && res.length === toEmbed.length) {
          setCardEmbeddings(prev => {
             const next = { ...prev };
             for(let i=0; i<toEmbed.length; i++) next[toEmbed[i].id] = res[i];
             return next;
          });
          activeEmbeddingModelRef.current = selectedEmbeddingModel;
       }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeck, getEmbeddings, embeddingStatus]); 

  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('neurodeck-streak')) || 0; } catch (e) { return 0; }
  });

  useEffect(() => {
    localStorage.setItem('neurodeck-streak', streak.toString());
  }, [streak]);

  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
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


  const {
    saveDeckToCache, overwriteDeckCache, loadDeckFromCache, deleteDeckFromCache,
    renameDeck, handleDirectDropSave, handleMoveDeck, handleBatchDeleteDecks,
    handleBatchMoveDecks, handleUpdateCards,
    handleDeleteCards, handleToggleDeckCompleted, handleExportProgress,
    handleExportWithoutProgress, handleImport, handleImportProgress
  } = useDeckManager({ myDecks, setMyDecks, currentDeck, setCurrentDeck, loadedDeckId, setLoadedDeckId, streak, setStreak, showToast, t });

  const {
    computeActiveDeckPool, selectNextCard, updateCardStats, handleManualNavigation
  } = useStudyEngine({
    currentDeck, setCurrentDeck, setStreak, setCurrentIndex, currentIndex, t,
    focusMode, questionTypeSettings, cardEmbeddings, cardOrderMode,
    loadedDeckId, setMyDecks, showToast
  });

  const {
    syncCode, setSyncCode, pairingCode, setPairingCode, isGeneratingCode, syncVersion, datasetId, handleCloudSyncDownload,
    handleConnectSyncCode, forcePushToCloud, handleGenerateSyncCode,
    handleClearCloudData, handleShareToCode, handleImportFromCode
  } = useNeuroSync({
    myDecks, setMyDecks, currentDeck, setCurrentDeck, loadedDeckId, setLoadedDeckId,
    streak, setStreak, selectedModel, setSelectedModel, cardOrderMode, setCardOrderMode,
    servingMode, setServingMode, selectedEmbeddingModel, setSelectedEmbeddingModel,
    focusMode, setFocusMode, questionTypeSettings, setQuestionTypeSettings, showToast, currentIndex, t
  });

  // Automatically connect if ?sync= is provided in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const syncParam = params.get('sync');
    if (syncParam) {
       // Only trigger download if we aren't already connected to this code
       if (syncParam !== syncCode) {
           handleCloudSyncDownload(syncParam, true);
       }
       // Clean up URL so it doesn't stay there if user disconnects later
       navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate, syncCode, handleCloudSyncDownload]);

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);
  const isDeckMastered = currentDeck.length > 0 && currentDeck.every(q => q.isMastered);

  const activePool = useMemo(() => computeActiveDeckPool(currentDeck), [currentDeck, computeActiveDeckPool]);
  const currentCard = currentDeck.length > 0 ? currentDeck[currentIndex] : null;
  const activeIndex = currentCard ? activePool.findIndex(q => q.id === currentCard.id) : -1;
  const displayIndex = Math.max(0, activeIndex);
  const displayTotal = activePool.length > 0 ? activePool.length : currentDeck.length;

  useEffect(() => {
    if (activePool.length > 0 && activeIndex === -1 && currentDeck.length > 0) {
      selectNextCard(currentDeck);
    }
  }, [activePool.length, activeIndex, currentDeck, selectNextCard]);

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-300 ${themeClass} neurodeck-route`} style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      
      <nav className="sticky top-0 z-50 w-full px-2 sm:px-4 pt-2 sm:pt-4 mb-4 sm:mb-8 flex flex-col items-center">
        <div className="neu-panel w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          
          <div className="flex items-center space-x-3 text-[var(--accent)] font-bold text-xl cursor-pointer" onClick={() => setView("study")}>
            <BrainIcon />
            <span className="uppercase tracking-widest text-sm whitespace-nowrap">NeuroDeck</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
            
            <div className="hidden lg:flex items-center space-x-2 text-xs px-4 py-2 neu-pressed text-[var(--text-muted)] relative overflow-hidden">
              <div className="relative flex items-center space-x-2 z-10 font-bold">
                <CpuIcon />
                <span className="truncate max-w-[150px]" title={modelError}>
                  {modelStatus === "loading" ? `${t.nliEngine || "NLI Engine"} ${progressPercent}%` : modelStatus === "ready" ? `${t.semanticAi || "Semantic AI"} (${backendUsed})` : modelStatus === "error" ? (t.engineError || "Engine Error") : (t.waiting || "Waiting...")}
                </span>
              </div>
              {modelStatus === "loading" && (
                <div className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-20 transition-all" style={{ width: `${progressPercent}%` }}></div>
              )}
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-xs px-4 py-2 neu-pressed text-[var(--text-muted)] relative overflow-hidden">
              <div className="relative flex items-center space-x-2 z-10 font-bold">
                <NetworkIcon />
                <span className="truncate max-w-[150px]" title={embeddingError}>
                  {embeddingStatus === "loading" ? `${t.embeddingsStatus || "Embeddings"} ${embeddingProgress}%` : embeddingStatus === "ready" ? `${t.embeddingsStatus || "Embeddings"} (${embeddingBackend})` : embeddingStatus === "error" ? (t.modelErrorStatus || "Model Error") : (t.waiting || "Waiting...")}
                </span>
              </div>
              {embeddingStatus === "loading" && (
                <div className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-20 transition-all" style={{ width: `${embeddingProgress}%` }}></div>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-2 neu-pressed px-4 py-2 rounded-full text-sm font-black" title="Current Streak">
              <FireIcon className={streak > 0 ? "text-orange-500" : "text-[var(--text-muted)]"} />
              <span className={streak > 0 ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>{streak}</span>
            </div>

            <button onClick={toggleLang} className="neu-btn w-10 h-10 flex items-center justify-center rounded-full font-black text-xs text-[var(--text-main)] uppercase" title="Toggle Language">
              {lang === 'en' ? 'fr' : 'en'}
            </button>
            <button onClick={toggleTheme} className="neu-btn w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-main)]">
              {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
            <button onClick={() => setView("study")} className={`neu-btn w-10 h-10 hidden sm:flex items-center justify-center rounded-full ${view === "study" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title={t.navStudy || "Study"}>
              <BrainIcon />
            </button>
            <button onClick={() => setView("dashboard")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "dashboard" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title={t.navDashboard || "Dashboard"}>
              <ActivityIcon />
            </button>
            <button onClick={() => setView("graph")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "graph" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title={t.navGraph || "Knowledge Graph"}>
              <NetworkIcon />
            </button>
            <button onClick={() => setView("settings")} className={`neu-btn w-10 h-10 flex items-center justify-center rounded-full ${view === "settings" ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`} title={t.navSettings || "Settings"}>
              <SettingsIcon />
            </button>

          </div>
        </div>

      </nav>

      <main className="flex flex-col items-center p-4 w-full max-w-5xl mx-auto mb-12">
        {view === "study" && (
          <StudyView
            question={!isDeckMastered && currentDeck.length > 0 ? currentCard : null}
            currentIndex={displayIndex}
            totalCards={displayTotal}
            model={model}
            modelStatus={modelStatus}
            modelError={modelError}
            progressPercent={progressPercent}
            onComplete={(id, newScore, firstTry, skipped) => {
              const newDeck = updateCardStats(id, newScore, firstTry, skipped);
              setCurrentDeck(newDeck);
              selectNextCard(newDeck);
            }}
            onNavigate={handleManualNavigation}
            hintPref={focusMode.active ? 'strict' : 'ablation'}
            servingMode={servingMode}
            t={t}
            showToast={showToast}
            currentLangKey={currentLangKey}
            getEmbeddings={getEmbeddings}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
          />
        )}
        
        {view === "dashboard" && (
          <DashboardView
            deck={currentDeck}
            t={t}
            onGoToCard={(idx) => { setCurrentIndex(idx); setView("study"); }}
            onUpdateCards={handleUpdateCards}
            onDeleteCards={handleDeleteCards}
            cardEmbeddings={cardEmbeddings}
            getEmbeddings={getEmbeddings}
          />
        )}

        {view === "graph" && (
          <KnowledgeGraphView
            deck={currentDeck}
            myDecks={myDecks}
            cardEmbeddings={cardEmbeddings}
            t={t}
            onGoToCard={(idx) => { setCurrentIndex(idx); setView("study"); }}
            embeddingStatus={embeddingStatus}
            embeddingProgress={embeddingProgress}
            onRecalculate={handleRecalculateGraph}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            onStartFocusStudy={() => {
              selectNextCard(currentDeck);
              setView("study");
            }}
          />
        )}

        {view === "settings" && (
          <SettingsView
            currentDeck={currentDeck}
            onImport={handleImport}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedEmbeddingModel={selectedEmbeddingModel}
            onEmbeddingModelChange={setSelectedEmbeddingModel}
            cardOrderMode={cardOrderMode}
            onCardOrderChange={setCardOrderMode}
            servingMode={servingMode}
            onServingModeChange={setServingMode}
            questionTypeSettings={questionTypeSettings}
            setQuestionTypeSettings={setQuestionTypeSettings}
            onExportProgress={handleExportProgress}
            onImportProgress={handleImportProgress}
            onSaveDeckToCache={saveDeckToCache}
            onOverwriteDeck={overwriteDeckCache}
            myDecks={myDecks}
            loadedDeckId={loadedDeckId}
            onLoadDeckFromCache={loadDeckFromCache}
            onDeleteDeckFromCache={deleteDeckFromCache}
            onToggleDeckCompleted={(id) => {
               setMyDecks(prev => prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
            }}
            onRenameDeck={renameDeck}
            onDirectDropSave={handleDirectDropSave}
            onMoveDeck={handleMoveDeck}
            onBatchDeleteDecks={handleBatchDeleteDecks}
            onBatchMoveDecks={handleBatchMoveDecks}
            syncCode={syncCode}
            pairingCode={pairingCode}
            isGeneratingCode={isGeneratingCode}
            setSyncCode={setSyncCode}
            onGenerateSyncCode={handleGenerateSyncCode}
            onConnectSyncCode={handleConnectSyncCode}
            onDisconnectSyncCode={() => setSyncCode("")}
            onClearCloudData={handleClearCloudData}
            onExportWithoutProgress={handleExportWithoutProgress}
            onShareToCode={handleShareToCode}
            onImportFromCode={handleImportFromCode}
            t={t}
            showToast={showToast}
          />
        )}
      </main>

      {toastMessage && (
         <div className="fixed bottom-6 right-6 z-[250] neu-panel px-6 py-4 border-l-4 border-[var(--accent)] max-w-sm flex items-center gap-3 shadow-2xl animate-fade-in">
           <i className="fas fa-info-circle text-[var(--accent)] text-xl"></i>
           <span className="text-sm font-bold text-[var(--text-main)]">{toastMessage}</span>
         </div>
      )}
    </div>
  );
}
