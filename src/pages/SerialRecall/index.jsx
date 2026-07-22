import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../../utilities/shared';
import { useNLIModel } from '../../hooks/useNLIModel';
import { DEFAULT_LISTS } from './utils/helpers';
import { StudyView } from './components/StudyView';
import { PracticeView } from './components/PracticeView';
import { ManageView } from './components/ManageView';
import { ListIcon, CpuIcon, FireIcon, BrainIcon, DumbbellIcon, SettingsIcon } from './components/Icons';

export default function SerialRecall() {
  const [view, setView] = useState("study");
  const navigate = useNavigate();
  const { appTheme, theme, toggleTheme, lang, toggleLang } = useSharedLogic([]);
  const currentLang = (lang || 'en').toLowerCase();

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
  const [selectedModel, setSelectedModel] = useState("Xenova/nli-deberta-v3-small");

  const { model, modelStatus, backendUsed, modelError, progressPercent } = useNLIModel(selectedModel);

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

  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  const updateList = (id, updates) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-300 ${themeClass} serialrecall-route`} style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
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
                <span className="truncate max-w-[150px]" title={modelError}>
                  {modelStatus === "loading" ? `NLI Engine ${progressPercent}%` : modelStatus === "ready" ? `Semantic AI (${backendUsed})` : modelStatus === "error" ? "Engine Error" : "Waiting..."}
                </span>
              </div>
              {modelStatus === "loading" && (
                <div className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] opacity-20 transition-all" style={{ width: `${progressPercent}%` }}></div>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-2 neu-pressed px-4 py-2 rounded-full text-sm font-black" title="Current Streak">
              <FireIcon className={streak > 0 ? "text-orange-500" : "text-[var(--text-muted)]"} />
              <span className={streak > 0 ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}>{streak}</span>
            </div>

            <button onClick={toggleLang} className="neu-btn w-10 h-10 flex items-center justify-center rounded-full font-black text-xs text-[var(--text-main)] uppercase" title="Toggle Language">
              {lang}
            </button>
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
            nliModel={model}
            aiStatus={modelStatus}
            showToast={showToast}
            setStreak={setStreak}
          />
        )}
        {view === "practice" && (
          <PracticeView
            lists={lists}
            updateList={updateList}
            nliModel={model}
            showToast={showToast}
            setView={setView}
            setStreak={setStreak}
          />
        )}
        {view === "manage" && (
          <div className="space-y-6 w-full">
            <ManageView
              lists={lists}
              setLists={setLists}
              setActiveListId={setActiveListId}
              activeListId={activeListId}
              showToast={showToast}
              currentLang={currentLang}
              setView={setView}
            />
            {/* AI Model Selector */}
            <div className="neu-panel p-6 sm:p-10 animate-fade-in mt-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-[var(--text-main)] flex items-center mb-6">
                <CpuIcon className="mr-3 text-[var(--accent)]" /> AI Model Selection
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  { id: "Xenova/nli-deberta-v3-small", name: "DeBERTa-v3 NLI (Small)", desc: "High-accuracy Cross-Encoder (Fast)" },
                  { id: "Xenova/mdeberta-v3-base-xnli-multilingual-nli-2mil7", name: "mDeBERTa-v3 Multilingual NLI", desc: "Multilingual NLI (French, English, 15+ Langs)" },
                  { id: "Xenova/nli-deberta-v3-base", name: "DeBERTa-v3 NLI (Base)", desc: "Maximum accuracy (Slower)" }
                ].map((m) => (
                  <label key={m.id} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-center text-left transition-all duration-300 ${selectedModel === m.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
                    <input type="radio" name="ai-model" value={m.id} checked={selectedModel === m.id} onChange={(e) => setSelectedModel(e.target.value)} className="hidden" />
                    <div>
                      <div className="font-black uppercase tracking-widest text-xs sm:text-base">{m.name}</div>
                      <div className="text-[9px] sm:text-xs font-medium opacity-70 mt-1">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
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
