import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../../utilities/shared';
import { useNLIModel } from '../../hooks/useNLIModel';
import { useEmbeddingModel } from '../../hooks/useEmbeddingModel';
import { TRANSLATIONS, DEFAULT_DECK } from '../../data/flashcardData';
import { cosineSimilarity } from '../../utilities/shared';

import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { StudyView } from './components/StudyView';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { BrainIcon, SettingsIcon, ActivityIcon, CpuIcon, FireIcon, NetworkIcon } from './components/Icons';

const SYNC_API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api/sync' : '/api/sync';

export default function NeuroDeck() {
  const [view, setView] = useState("study");
  const navigate = useNavigate();
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

  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  const [syncCode, setSyncCode] = useState(() => {
    return localStorage.getItem('neurodeck-sync-code') || "";
  });
  
  const [syncVersion, setSyncVersion] = useState(() => {
    return parseInt(localStorage.getItem('neurodeck-sync-version')) || 0;
  });

  useEffect(() => {
    localStorage.setItem('neurodeck-sync-code', syncCode);
  }, [syncCode]);
  
  useEffect(() => {
    localStorage.setItem('neurodeck-sync-version', syncVersion.toString());
  }, [syncVersion]);

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

  const isPullingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    }
  }, []);

  const handleCloudSyncDownload = useCallback(async (code, manual = false) => {
    if (!code) return;
    try {
      const res = await fetch(`${SYNC_API_BASE}/${code}`);
      if (res.status === 404) {
         showToast("Sync code expired or not found.");
         setSyncCode("");
         return;
      }
      if (!res.ok) {
         console.warn("Failed to pull sync data");
         if (manual) showToast("Failed to pull sync data.");
         return;
      }
      const data = await res.json();
      if (data && data.version > syncVersion) {
         isPullingRef.current = true;
         if (data.data.myDecks) setMyDecks(data.data.myDecks);
         if (data.data.currentDeck) setCurrentDeck(data.data.currentDeck);
         if (data.data.loadedDeckId !== undefined) setLoadedDeckId(data.data.loadedDeckId);
         if (data.data.streak !== undefined) setStreak(data.data.streak);
         if (data.data.selectedModel) setSelectedModel(data.data.selectedModel);
         if (data.data.cardOrderMode) setCardOrderMode(data.data.cardOrderMode);
         if (data.data.selectedEmbeddingModel) setSelectedEmbeddingModel(data.data.selectedEmbeddingModel);
         if (data.data.focusMode) setFocusMode(data.data.focusMode);
         if (data.data.questionTypeSettings) setQuestionTypeSettings(data.data.questionTypeSettings);
         setSyncVersion(data.version);
         if (manual) {
            setSyncCode(code);
         }
         showToast("Cloud sync: Data pulled successfully.");
      } else if (manual) {
         showToast("Connected! You are already up to date.");
      }
    } catch (err) {
       console.error("Auto-pull error", err);
       if (manual) showToast("Connection failed.");
    }
  }, [syncVersion, showToast]);

  const handleConnectSyncCode = useCallback((codeToConnect) => {
      handleCloudSyncDownload(codeToConnect, true);
  }, [handleCloudSyncDownload]);

  const forcePushToCloud = useCallback(async (codeToUse) => {
      const code = codeToUse || syncCode;
      if (!code) return;
      const payload = { myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, selectedEmbeddingModel, focusMode, questionTypeSettings };
      const newVersion = Date.now();
      try {
         const res = await fetch(`${SYNC_API_BASE}/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload, version: newVersion })
         });
         if (res.ok) {
            setSyncVersion(newVersion);
            showToast("Cloud sync: Data pushed initially.");
         }
      } catch (err) {
         console.error("Auto-push error", err);
      }
  }, [syncCode, myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, selectedEmbeddingModel, focusMode, questionTypeSettings, showToast]);

  const handleGenerateSyncCode = useCallback(() => {
     const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
     setSyncCode(newCode);
     forcePushToCloud(newCode);
  }, [forcePushToCloud]);

  useEffect(() => {
    let intervalId;
    if (syncCode) {
       intervalId = setInterval(async () => {
          try {
             const res = await fetch(`${SYNC_API_BASE}/${syncCode}/version`);
             if (res.status === 404) {
                 showToast("Sync code expired. Please generate a new one.");
                 setSyncCode("");
                 return;
             }
             if (res.ok) {
                const data = await res.json();
                if (data && data.version > syncVersion) {
                   handleCloudSyncDownload(syncCode);
                }
             }
          } catch (err) {}
       }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); }
  }, [syncCode, syncVersion, handleCloudSyncDownload, showToast]);

  useEffect(() => {
    const onFocus = () => {
       if (syncCode) {
          handleCloudSyncDownload(syncCode);
       }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [syncCode, handleCloudSyncDownload]);

  useEffect(() => {
    localStorage.setItem('neurodeck-progress', JSON.stringify(currentDeck));
    localStorage.setItem('neurodeck-current-index', currentIndex.toString());
    localStorage.setItem('neurodeck-streak', streak.toString());
    localStorage.setItem('neurodeck-my-decks', JSON.stringify(myDecks));
    if (loadedDeckId) {
      localStorage.setItem('neurodeck-loaded-deck-id', loadedDeckId);
    } else {
      localStorage.removeItem('neurodeck-loaded-deck-id');
    }

    if (syncCode) {
       if (isPullingRef.current) {
          isPullingRef.current = false;
          return;
       }
       if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
       syncTimeoutRef.current = setTimeout(async () => {
          const payload = { myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, selectedEmbeddingModel, focusMode, questionTypeSettings };
          const newVersion = Date.now();
          try {
             const res = await fetch(`${SYNC_API_BASE}/${syncCode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload, version: newVersion })
             });
             if (res.ok) {
                setSyncVersion(newVersion);
             }
          } catch (err) {
             console.error("Auto-push error", err);
          }
       }, 2000);
    }
  }, [currentDeck, currentIndex, streak, myDecks, loadedDeckId, syncCode, selectedModel, cardOrderMode, selectedEmbeddingModel, focusMode, questionTypeSettings]);

  const computeActiveDeckPool = useCallback((deck) => {
    if (!deck || deck.length === 0) return [];
    
    let activeDeck = deck;
    if (focusMode.active && focusMode.focalNodeId && cardEmbeddings[focusMode.focalNodeId]) {
      const focalEmbedding = cardEmbeddings[focusMode.focalNodeId];
      const mode = focusMode.mode || 'threshold';
      
      let similarities = deck.map(q => {
         if (q.id === focusMode.focalNodeId) return { id: q.id, sim: 2.0 };
         if (!cardEmbeddings[q.id]) return { id: q.id, sim: -2.0 };
         return { id: q.id, sim: cosineSimilarity(cardEmbeddings[q.id], focalEmbedding) };
      });

      if (mode === 'threshold') {
         const thresh = focusMode.threshold !== undefined ? focusMode.threshold : 0.85;
         const validIds = new Set(similarities.filter(s => s.sim >= thresh || s.id === focusMode.focalNodeId).map(s => s.id));
         activeDeck = deck.filter(q => validIds.has(q.id));
      } else if (mode === 'topN') {
         similarities.sort((a, b) => b.sim - a.sim);
         const topN = focusMode.topN || 5;
         const validIds = new Set(similarities.slice(0, topN).map(s => s.id));
         activeDeck = deck.filter(q => validIds.has(q.id));
      }
      if (activeDeck.length === 0) activeDeck = deck; 
    }

    activeDeck = activeDeck.filter(q => {
       const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
       const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
       const isMcc = !isLong && !isMulti;
       
       if (isLong && !questionTypeSettings.long) return false;
       if (isMulti && !questionTypeSettings.multi) return false;
       if (isMcc && !questionTypeSettings.mcc) return false;
       return true;
    });
    if (activeDeck.length === 0) activeDeck = deck;
    return activeDeck;
  }, [focusMode, cardEmbeddings, questionTypeSettings.long, questionTypeSettings.multi, questionTypeSettings.mcc]);

  const selectNextCard = useCallback((deck) => {
    if (!deck || deck.length === 0) return 0;
    
    let activeDeck = computeActiveDeckPool(deck);


    if (questionTypeSettings.proportional) {
       let targetLong = 0, targetMcc = 0, targetMulti = 0;
       let actualLong = 0, actualMcc = 0, actualMulti = 0;
       
       for (const q of deck) {
          const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
          const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
          const isMcc = !isLong && !isMulti;
          
          if (isLong && questionTypeSettings.long) { targetLong++; actualLong += (q.attempts || 0); }
          else if (isMulti && questionTypeSettings.multi) { targetMulti++; actualMulti += (q.attempts || 0); }
          else if (isMcc && questionTypeSettings.mcc) { targetMcc++; actualMcc += (q.attempts || 0); }
       }
       
       const totalTargets = targetLong + targetMcc + targetMulti;
       const totalAttempts = actualLong + actualMcc + actualMulti;
       
       if (totalTargets > 0 && totalAttempts > 0) {
          const expectedLong = (targetLong / totalTargets) * totalAttempts;
          const expectedMcc = (targetMcc / totalTargets) * totalAttempts;
          const expectedMulti = (targetMulti / totalTargets) * totalAttempts;
          
          const deficitLong = expectedLong - actualLong;
          const deficitMcc = expectedMcc - actualMcc;
          const deficitMulti = expectedMulti - actualMulti;
          
          let maxDeficit = -Infinity;
          let targetType = null;
          
          if (questionTypeSettings.mcc && targetMcc > 0 && deficitMcc > maxDeficit) {
             maxDeficit = deficitMcc; targetType = 'mcc';
          }
          if (questionTypeSettings.long && targetLong > 0 && deficitLong > maxDeficit) {
             maxDeficit = deficitLong; targetType = 'long';
          }
          if (questionTypeSettings.multi && targetMulti > 0 && deficitMulti > maxDeficit) {
             maxDeficit = deficitMulti; targetType = 'multi';
          }
          
          if (targetType) {
             const filteredProportional = activeDeck.filter(q => {
                const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
                const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
                if (targetType === 'long') return isLong;
                if (targetType === 'multi') return isMulti;
                return !isLong && !isMulti;
             });
             if (filteredProportional.length > 0) {
                activeDeck = filteredProportional;
             }
          }
       }
    }

    const now = 0; 
    let dueCards = activeDeck.filter(q => q.dueTurn <= now && !q.isMastered);

    if (dueCards.length === 0) {
      dueCards = activeDeck.filter(q => !q.isMastered);
    }
    if (dueCards.length === 0) {
      return deck.findIndex(q => q.id === (activeDeck[0] ? activeDeck[0].id : deck[0].id)); 
    }

    dueCards.sort((a, b) => a.score - b.score);
    const lowestScore = dueCards[0].score;
    const lowestScoreCards = dueCards.filter(q => q.score === lowestScore);

    if (cardOrderMode === 'random') {
      const selected = lowestScoreCards[Math.floor(Math.random() * lowestScoreCards.length)];
      return deck.findIndex(q => q.id === selected.id);
    } else if (cardOrderMode === 'semantic') {
      let attempted = deck.filter(q => q.attempts > 0 && !q.isMastered);
      let targetEmbeddings = [];
      if (attempted.length > 0) {
         attempted.sort((a,b) => a.score - b.score);
         const lowestAttemptedScore = attempted[0].score;
         const weakestCards = attempted.filter(q => q.score === lowestAttemptedScore);
         targetEmbeddings = weakestCards.map(q => cardEmbeddings[q.id]).filter(Boolean);
      }
      
      if (targetEmbeddings.length > 0) {
          const weaknessVector = new Array(targetEmbeddings[0].length).fill(0);
          for(const emb of targetEmbeddings) {
             for(let i=0; i<emb.length; i++) weaknessVector[i] += emb[i];
          }
          for(let i=0; i<weaknessVector.length; i++) weaknessVector[i] /= targetEmbeddings.length;

          const sortedBySimilarity = [...lowestScoreCards].sort((a, b) => {
             const simA = cardEmbeddings[a.id] ? cosineSimilarity(cardEmbeddings[a.id], weaknessVector) : 0;
             const simB = cardEmbeddings[b.id] ? cosineSimilarity(cardEmbeddings[b.id], weaknessVector) : 0;
             return simB - simA; 
          });
          return deck.findIndex(q => q.id === sortedBySimilarity[0].id);
      } else {
          const selected = lowestScoreCards[Math.floor(Math.random() * lowestScoreCards.length)];
          return deck.findIndex(q => q.id === selected.id);
      }
    } else {
      return deck.findIndex(q => q.id === lowestScoreCards[0].id);
    }
  }, [cardOrderMode, cardEmbeddings, focusMode, questionTypeSettings.proportional, computeActiveDeckPool]);

  const updateCardStats = useCallback((id, newScore, firstTry, skipped) => {
    setCurrentDeck(prev => {
      const nextDeck = [...prev];
      const idx = nextDeck.findIndex(q => q.id === id);
      if (idx === -1) return prev;

      const card = { ...nextDeck[idx] };
      card.score = newScore;
      card.attempts = (card.attempts || 0) + 1;
      
      const interval = Math.max(1, Math.floor(Math.pow(2, newScore - 5))); 
      card.dueTurn = 0 + interval; 

      if (newScore >= 8) card.isMastered = true;
      else card.isMastered = false;

      nextDeck[idx] = card;
      
      if (loadedDeckId) {
         setMyDecks(currDecks => currDecks.map(d => {
            if (d.id === loadedDeckId) {
               return { ...d, deck: nextDeck };
            }
            return d;
         }));
      }

      return nextDeck;
    });

    if (skipped) {
      setStreak(0);
      showToast(t.skippedCard || "Card Skipped. Review Later.");
    } else if (firstTry && newScore >= 8) {
      setStreak(s => s + 1);
      showToast(t.perfectRecall || "Perfect Recall! Mastering rapidly.");
    } else if (firstTry) {
      setStreak(s => s + 1);
      showToast(t.correctAnswer || "Correct!");
    } else {
      setStreak(0);
    }

    setCurrentIndex(prevIdx => {
      const updatedDeck = [...currentDeck];
      const idx = updatedDeck.findIndex(q => q.id === id);
      if (idx > -1) {
         updatedDeck[idx].score = newScore;
         if (newScore >= 8) updatedDeck[idx].isMastered = true;
         else updatedDeck[idx].isMastered = false;
      }
      return selectNextCard(updatedDeck);
    });
  }, [t, showToast, currentDeck, loadedDeckId, selectNextCard]);

  const handleManualNavigation = useCallback((dir) => {
    if (currentDeck.length === 0) return;
    let nextIdx = currentIndex + dir;
    if (nextIdx < 0) nextIdx = currentDeck.length - 1;
    if (nextIdx >= currentDeck.length) nextIdx = 0;
    setCurrentIndex(nextIdx);
  }, [currentDeck, currentIndex]);

  const handleImport = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const formatted = parsed.map((q, idx) => {
          const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
          return {
            ...q,
            correctAnswers: correctAnswersArray,
            id: q.id || Date.now().toString() + Math.random().toString(),
            score: 0,
            dueTurn: 0,
            attempts: 0,
            isMastered: false
          };
        });
        setCurrentDeck(formatted);
        setCurrentIndex(0);
        setLoadedDeckId(null);
        showToast(t.importSuccess || "Deck imported successfully!");
      } else {
        showToast(t.invalidJson || "Invalid JSON array.");
      }
    } catch (e) {
      showToast(t.parseError || "Failed to parse JSON.");
    }
  };

  const saveDeckToCache = (name) => {
    if (currentDeck.length === 0) {
       showToast(t.noDeckToSave || "No active deck to save!");
       return;
    }
    const newDeck = {
       id: Date.now().toString(),
       name: name || `Deck ${myDecks.length + 1}`,
       deck: currentDeck,
       completed: false
    };
    setMyDecks(prev => [newDeck, ...prev]);
    setLoadedDeckId(newDeck.id);
    showToast(`${t.deckSaved || "Deck saved as"} "${newDeck.name}"`);
  };

  const overwriteDeckCache = () => {
    if (!loadedDeckId || currentDeck.length === 0) return;
    setMyDecks(prev => prev.map(d => d.id === loadedDeckId ? { ...d, deck: currentDeck } : d));
    showToast(t.progressSaved || "Progress saved to cached deck.");
  };

  const loadDeckFromCache = (id) => {
    const deckToLoad = myDecks.find(d => d.id === id);
    if (deckToLoad) {
       setCurrentDeck(deckToLoad.deck);
       setLoadedDeckId(id);
       setCurrentIndex(selectNextCard(deckToLoad.deck));
       setView('study');
       showToast(`${t.loadedDeckMsg || "Loaded deck"} "${deckToLoad.name}"`);
    }
  };

  const deleteDeckFromCache = (id) => {
    setMyDecks(prev => prev.filter(d => d.id !== id));
    if (loadedDeckId === id) {
       setLoadedDeckId(null);
    }
    showToast(t.deckDeleted || "Deck deleted.");
  };
  
  const renameDeck = (id, newName) => {
    setMyDecks(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    showToast(t.deckRenamed || "Deck renamed.");
  };

  const handleDirectDropSave = (deckObj) => {
    setMyDecks(prev => [deckObj, ...prev]);
    showToast(`${t.deckSaved || "Deck saved as"} "${deckObj.name}"`);
  };

  const handleAppendToCurrentDeck = (newCardsArray) => {
    setCurrentDeck(prev => {
      const next = [...prev, ...newCardsArray];
      if (loadedDeckId) {
        setMyDecks(currDecks => currDecks.map(d => {
           if (d.id === loadedDeckId) return { ...d, deck: next };
           return d;
        }));
      }
      return next;
    });
    showToast(`Appended ${newCardsArray.length} cards to the current deck.`);
  };

  const handleUpdateCards = (updates) => {
    setCurrentDeck(prev => {
      const next = [...prev];
      updates.forEach(u => {
        const idx = next.findIndex(c => c.id === u.id);
        if (idx > -1) {
          next[idx] = { ...next[idx], ...u.changes };
          if (next[idx].score >= 8) next[idx].isMastered = true;
          else if (next[idx].score < 8) next[idx].isMastered = false;
        }
      });
      if (loadedDeckId) {
         setMyDecks(currDecks => currDecks.map(d => {
            if (d.id === loadedDeckId) return { ...d, deck: next };
            return d;
         }));
      }
      return next;
    });
    showToast(t.cardsUpdated || "Cards updated successfully.");
  };

  const handleDeleteCards = (idsToDelete) => {
    setCurrentDeck(prev => {
      const next = prev.filter(c => !idsToDelete.includes(c.id));
      if (loadedDeckId) {
         setMyDecks(currDecks => currDecks.map(d => {
            if (d.id === loadedDeckId) return { ...d, deck: next };
            return d;
         }));
      }
      return next;
    });
    setCurrentIndex(0);
    showToast(t.cardsDeleted || "Cards deleted.");
  };

  const handleExportProgress = () => {
    const dataStr = JSON.stringify({ myDecks, currentDeck, loadedDeckId, streak }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurodeck-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWithoutProgress = () => {
    const strippedDeck = currentDeck.map(q => ({
      ...q,
      score: 0,
      attempts: 0,
      isMastered: false
    }));
    const dataStr = JSON.stringify([{ ...strippedDeck }], null, 2);
    // Wait, the standard array format for raw decks is just the array of cards
    const blob = new Blob([JSON.stringify(strippedDeck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurodeck-clean-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareToCode = async (withProgress) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const deckToShare = withProgress ? currentDeck : currentDeck.map(q => ({
      ...q,
      score: 0,
      attempts: 0,
      isMastered: false
    }));
    
    const payload = { sharedDeck: deckToShare, sharedName: `Shared Deck ${newCode}` };
    const newVersion = Date.now();
    try {
      const res = await fetch(`${SYNC_API_BASE}/${newCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload, version: newVersion })
      });
      if (res.ok) {
        showToast(`Deck shared! Code: ${newCode} (Copied to clipboard)`);
        navigator.clipboard.writeText(newCode).catch(() => {});
      }
    } catch (err) {
      console.error("Share error", err);
      showToast("Failed to generate share code.");
    }
  };

  const handleImportFromCode = async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`${SYNC_API_BASE}/${code}/version`);
      if (res.status === 404) {
        showToast("Share code expired or invalid.");
        return;
      }
      if (res.ok) {
        const dataRes = await fetch(`${SYNC_API_BASE}/${code}`);
        const data = await dataRes.json();
        if (data && data.data && data.data.sharedDeck) {
          const newDeck = data.data.sharedDeck;
          if (window.confirm("Would you like to append these shared cards to your current deck, or save as a new deck in 'My Decks'?\n\nOK = Append\nCancel = New Deck")) {
            handleAppendToCurrentDeck(newDeck);
          } else {
            handleDirectDropSave({
              id: Date.now().toString(),
              name: data.data.sharedName || `Imported Deck ${code}`,
              deck: newDeck,
              completed: false
            });
            showToast("Saved as new deck in My Decks!");
          }
        } else {
          showToast("Code does not contain a shared deck.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch share code.");
    }
  };

  const handleImportProgress = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.myDecks) setMyDecks(parsed.myDecks);
      if (parsed.currentDeck) setCurrentDeck(parsed.currentDeck);
      if (parsed.loadedDeckId !== undefined) setLoadedDeckId(parsed.loadedDeckId);
      if (parsed.streak !== undefined) setStreak(parsed.streak);
      showToast(t.backupRestored || "Backup restored successfully!");
    } catch (e) {
      showToast(t.parseError || "Failed to parse backup.");
    }
  };

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);
  const isDeckMastered = currentDeck.length > 0 && currentDeck.every(q => q.isMastered);

  const activePool = useMemo(() => computeActiveDeckPool(currentDeck), [currentDeck, computeActiveDeckPool]);
  const currentCard = currentDeck.length > 0 ? currentDeck[currentIndex] : null;
  const activeIndex = currentCard ? activePool.findIndex(q => q.id === currentCard.id) : -1;
  const displayIndex = Math.max(0, activeIndex);
  const displayTotal = activePool.length || currentDeck.length;

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
                  {modelStatus === "loading" ? `NLI Engine ${progressPercent}%` : modelStatus === "ready" ? `Semantic AI (${backendUsed})` : modelStatus === "error" ? "Engine Error" : "Waiting..."}
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
                  {embeddingStatus === "loading" ? `Embeddings ${embeddingProgress}%` : embeddingStatus === "ready" ? `Embeddings (${embeddingBackend})` : embeddingStatus === "error" ? "Model Error" : "Waiting..."}
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
            onComplete={updateCardStats}
            onNavigate={handleManualNavigation}
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
            cardEmbeddings={cardEmbeddings}
            t={t}
            onGoToCard={(idx) => { setCurrentIndex(idx); setView("study"); }}
            embeddingStatus={embeddingStatus}
            embeddingProgress={embeddingProgress}
            onRecalculate={handleRecalculateGraph}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            onStartFocusStudy={() => {
              setCurrentIndex(selectNextCard(currentDeck));
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
            onAppendToCurrentDeck={handleAppendToCurrentDeck}
            syncCode={syncCode}
            setSyncCode={setSyncCode}
            onGenerateSyncCode={handleGenerateSyncCode}
            onConnectSyncCode={handleConnectSyncCode}
            onDisconnectSyncCode={() => setSyncCode("")}
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
