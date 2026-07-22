import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SaveIcon, ClockIcon, RandomIcon, SeqIcon, DownloadIcon, UploadIcon, SparklesIcon, CpuIcon, CheckIcon, EditIcon, CopyIcon, BrainIcon } from './Icons';
import { QRCodeSVG } from 'qrcode.react';

export const SettingsView = ({
  currentDeck, onImport, selectedModel, onModelChange,
  selectedEmbeddingModel, onEmbeddingModelChange,
  cardOrderMode, onCardOrderChange,
  questionTypeSettings, setQuestionTypeSettings,
  onExportProgress, onImportProgress,
  myDecks, loadedDeckId, onSaveDeckToCache, onOverwriteDeck, onLoadDeckFromCache, 
  onDeleteDeckFromCache, onToggleDeckCompleted, onRenameDeck, onDirectDropSave,
  onMoveDeck, onBatchDeleteDecks, onBatchMoveDecks, syncCode, syncHash, pairingCode, isGeneratingCode, setSyncCode, onGenerateSyncCode, onConnectSyncCode, onDisconnectSyncCode, onClearCloudData,
  onExportWithoutProgress, onShareToCode, onImportFromCode, t, showToast, servingMode, onServingModeChange, onJumpToPriorityCard, onClearAICache
}) => {

  const [jsonInput, setJsonInput] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [inputSyncCode, setInputSyncCode] = useState(syncCode || "");
  const [importCode, setImportCode] = useState("");
  const [activeTab, setActiveTab] = useState('decks');
  const [shareQrCodeData, setShareQrCodeData] = useState(null);
  const [selectedDeckIds, setSelectedDeckIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState("");

  const handleBatchExport = (ids) => {
     ids.forEach(id => {
        const rootDeck = myDecks.find(d => d.id === id);
        if (!rootDeck) return;

        const getDescendants = (parentId) => {
           let children = myDecks.filter(d => d.parentId === parentId);
           let all = [...children];
           children.forEach(child => {
              all = all.concat(getDescendants(child.id));
           });
           return all;
        };

        const hierarchyDecks = [rootDeck, ...getDescendants(id)].map(d => {
           const strippedDeck = (d.deck || []).map(q => ({ ...q, score: 0, attempts: 0, isMastered: false }));
           return { ...d, deck: strippedDeck };
        });

        const blob = new Blob([JSON.stringify(hierarchyDecks, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const prefix = rootDeck.name ? rootDeck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'deck';
        a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
     });
     showToast(`Exported ${ids.length} deck(s)`);
  };
  
  useEffect(() => {
     setInputSyncCode(syncCode || "");
  }, [syncCode]);
  
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
    const deckStats = {};
    myDecks.forEach(d => {
       const total = d.deck ? d.deck.length : 0;
       const mastered = d.deck ? d.deck.filter(q => q.score >= 8 || q.isMastered).length : 0;
       const scoreSum = total > 0 ? d.deck.reduce((s, q) => s + (q.isMastered ? 10 : q.score), 0) : 0;
       deckStats[d.id] = { total, mastered, scoreSum };
    });

    const getStats = (deckId) => {
       const children = myDecks.filter(d => d.parentId === deckId);
       let t = deckStats[deckId].total;
       let m = deckStats[deckId].mastered;
       let s = deckStats[deckId].scoreSum;
       for (const child of children) {
          const childStats = getStats(child.id);
          t += childStats.t;
          m += childStats.m;
          s += childStats.s;
       }
       return { t, m, s };
    };

    let decks = myDecks.map(d => {
       const agg = getStats(d.id);
       const avgScore = agg.t > 0 ? (agg.s / agg.t) : 0;
       const progress = agg.t > 0 ? Math.round((agg.m / agg.t) * 100) : 0;
       return { ...d, totalCards: agg.t, mastered: agg.m, avgScore, progress };
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

  const visualOrder = useMemo(() => {
     const order = [];
     const traverse = (decks) => {
        decks.forEach(d => {
           order.push(d.id);
           const children = processedDecks.filter(child => child.parentId === d.id);
           if (children.length > 0) traverse(children);
        });
     };
     traverse(processedDecks.filter(d => !d.parentId));
     return order;
  }, [processedDecks]);

  const AVAILABLE_MODELS = [
    { id: "Xenova/nli-deberta-v3-small", name: "DeBERTa-v3 NLI (Small)", desc: t.fastLightweight || "High-accuracy Cross-Encoder" },
    { id: "Xenova/mdeberta-v3-base-xnli-multilingual-nli-2mil7", name: "mDeBERTa-v3 Multilingual NLI", desc: "Multilingual NLI (French, English, Spanish, 15+ Languages)" },
    { id: "Xenova/nli-deberta-v3-base", name: "DeBERTa-v3 NLI (Base)", desc: t.moreAccurate || "Maximum accuracy (Slower)" },
    { id: "Xenova/nli-deberta-v3-large", name: "DeBERTa-v3 NLI (Large)", desc: t.highQuality || "Highest accuracy (Slowest)" }
  ];

  const AVAILABLE_EMBEDDING_MODELS = [
    { id: "Xenova/all-MiniLM-L6-v2", name: "MiniLM-L6-v2 (Fast)", desc: t.embeddingFast || "Very fast, lightweight (22MB)" },
    { id: "Xenova/multilingual-e5-small", name: "Multilingual E5 Small", desc: "SOTA Multilingual Embeddings (French, English, 100+ Langs)" },
    { id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2", name: "Multilingual Paraphrase L12", desc: "Multilingual Paraphrase Detection (118MB)" },
    { id: "Xenova/all-MiniLM-L12-v2", name: "MiniLM-L12-v2 (Balanced)", desc: t.embeddingBalanced || "Better accuracy, slightly slower (120MB)" },
    { id: "Xenova/bge-base-en-v1.5", name: "BGE Base EN (High Quality)", desc: t.embeddingHQ || "State of the art accuracy (438MB)" }
  ];

  const handleDrop = (e, targetParentId = null) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      jsonFiles.forEach(file => {
        const name = file.name.replace('.json', '');
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            if (!Array.isArray(parsed)) throw new Error("Not a JSON array");
            
            if (parsed.length > 0 && parsed[0].deck !== undefined) {
               if (onBatchImportDecks) {
                  onBatchImportDecks(parsed, typeof targetParentId === 'string' ? targetParentId : null);
               }
            } else {
               const formattedDeck = parsed.map((q, idx) => {
                 const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
                 return {
                   ...q,
                   correctAnswers: correctAnswersArray,
                   id: q.id || `custom-${Date.now()}-${idx}-${Math.random()}`,
                   score: 0,
                   dueTurn: 0,
                   attempts: 0,
                   isMastered: false
                 };
               });

               onDirectDropSave({
                 id: Date.now().toString() + Math.random().toString(),
                 name: name,
                 deck: formattedDeck,
                 completed: false,
                 parentId: typeof targetParentId === 'string' ? targetParentId : null
               });
            }
          } catch (err) {
            console.error("Drop import failed for file", file.name, err);
          }
        };
        reader.readAsText(file);
      });
    } else {
      const draggedData = e.dataTransfer.getData("text/plain");
      try {
         const ids = JSON.parse(draggedData);
         if (Array.isArray(ids) && onBatchMoveDecks) {
             onBatchMoveDecks(ids, typeof targetParentId === 'string' ? targetParentId : null);
             setSelectedDeckIds(new Set());
         }
      } catch (err) {
         if (draggedData && draggedData !== targetParentId && onMoveDeck) {
            onMoveDeck(draggedData, targetParentId);
         }
      }
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = t.llmPromptTemplate;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(t.promptCopiedBtn || "Copied!");
    }).catch(() => {
      showToast(t.clipboardFailed || "Failed to copy. Clipboard access denied.");
    });
  };

  const handleCopyLongPrompt = () => {
    const textToCopy = t.llmPromptLongTemplate;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(t.promptCopiedBtn || "Copied!");
    }).catch(() => {
      showToast(t.clipboardFailed || "Failed to copy. Clipboard access denied.");
    });
  };

  const handleAnkiImport = (text, filename) => {
     try {
        const lines = text.split('\n');
        const parsedDeck = [];
        
        lines.forEach((line, idx) => {
           if (!line.trim()) return;
           const separator = line.includes('\t') ? '\t' : ',';
           const row = line.split(separator); 
           if (row.length >= 2) {
              const question = row[0].replace(/^"|"$/g, '').trim();
              const answer = row[1].replace(/^"|"$/g, '').trim();
              
              if (question && answer) {
                 parsedDeck.push({
                    id: `anki-${Date.now()}-${idx}`,
                    question: question,
                    choices: [answer],
                    correctAnswers: [answer],
                    score: 0,
                    dueTurn: 0,
                    attempts: 0,
                    isMastered: false
                 });
              }
           }
        });
        
        if (parsedDeck.length > 0) {
           onDirectDropSave({
              id: Date.now().toString(),
              name: filename.replace(/\.(csv|txt)$/i, ''),
              deck: parsedDeck,
              completed: false,
              parentId: null
           });
           showToast(`Imported ${parsedDeck.length} cards from Anki`);
        } else {
           showToast("No valid cards found in Anki file");
        }
     } catch (err) {
        console.error("Anki import failed", err);
        showToast("Failed to parse Anki file");
     }
  };

  const handleAnkiExport = () => {
     if (!currentDeck || currentDeck.length === 0) {
         showToast("No deck currently loaded to export");
         return;
     }
     const csvContent = currentDeck.map(q => {
        const front = `"${q.question.replace(/"/g, '""')}"`;
        const back = `"${(q.correctAnswers?.[0] || q.correctAnswer || "").replace(/"/g, '""')}"`;
        return `${front},${back}`;
     }).join('\n');
     
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     const url = URL.createObjectURL(blob);
     link.setAttribute('href', url);
     link.setAttribute('download', `neurodeck-anki-export-${Date.now()}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const navItems = [
    { id: 'decks', icon: <SaveIcon />, label: t.myDecksTitle || "My Decks" },
    { id: 'algorithm', icon: <ClockIcon />, label: "Algorithm Selection" },
    { id: 'backup', icon: <DownloadIcon />, label: t.dataBackup || "Data Backup" },
    { id: 'nli', icon: <CpuIcon />, label: t.aiModelTitle || "AI Models" },
    { id: 'generator', icon: <SparklesIcon />, label: t.llmGeneratorTitle || "AI Generator" },
    { id: 'sync', icon: <UploadIcon />, label: t.cloudSyncTitle || "Cloud Sync" },
    { id: 'raw', icon: <EditIcon />, label: t.rawDeckImport || "Raw Import" }
  ];

  const handleShare = async (withProgress, shareHierarchy) => {
     const code = await onShareToCode(withProgress, shareHierarchy);
     if (code) {
        setShareQrCodeData({ code, url: `${window.location.origin}${window.location.pathname}?share=${code}` });
     }
  };

  const scrollTo = (id) => {
    setActiveTab(id);
    const el = document.getElementById(`settings-${id}`);
    if (el && window.innerWidth >= 1024) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 w-full">
      <div className="w-full lg:w-1/4">
        <nav className="sticky top-24 flex lg:flex-col gap-3 lg:gap-2 overflow-x-auto lg:overflow-visible p-4 -m-4 scrollbar-hide">
          {navItems.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className={`neu-btn p-3 lg:p-4 flex-shrink-0 flex items-center gap-2 lg:gap-4 text-sm font-bold text-left rounded-2xl transition-all hover:text-[var(--accent)] ${activeTab === item.id ? 'text-[var(--accent)] neu-pressed' : ''}`}>
              <div className="w-4 lg:w-5 text-center">{item.icon}</div>
              <span className="uppercase tracking-widest text-[10px] xl:text-xs leading-tight whitespace-nowrap lg:whitespace-normal text-[var(--text-main)]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="w-full lg:w-3/4 space-y-4 sm:space-y-8">
      <div 
        id="settings-decks"
        className={`neu-panel p-4 sm:p-8 md:p-12 transition-all border-2 ${isDraggingOver ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-5' : 'border-transparent'} ${activeTab === 'decks' ? 'block' : 'hidden lg:block'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
        onDrop={handleDrop}
        onClick={(e) => {
           if (e.target.closest('.deck-row-container') || e.target.closest('button') || e.target.closest('input')) return;
           setSelectedDeckIds(new Set());
           setLastSelectedId(null);
        }}
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
             placeholder={t.searchDecksPrompt || "Search decks..."}
             className="neu-pressed px-4 py-3 rounded-xl bg-transparent text-[var(--text-main)] text-sm font-medium outline-none"
           />
           <div className="flex flex-col sm:flex-row gap-2">
             <select onChange={(e) => setFilterMode(e.target.value)} className="neu-btn flex-1 px-3 sm:px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <option value="all">{t.all || "All"}</option>
                <option value="completed">{t.completed || "Completed"}</option>
                <option value="in-progress">{t.inProgress || "In Progress"}</option>
             </select>
             <select onChange={(e) => setSortBy(e.target.value)} className="neu-btn flex-1 px-3 sm:px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <option value="name">{t.sortByName || "Sort by Name"}</option>
                <option value="score">{t.sortByAvg || "Sort by Score"}</option>
                <option value="progress">{t.sortByProgress || "Sort by Progress"}</option>
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
                 onSaveDeckToCache(newDeckName.trim(), true);
                 setNewDeckName("");
               }
             }}
             disabled={!newDeckName.trim()}
             className="neu-btn px-3 sm:px-8 py-2.5 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] rounded-lg sm:rounded-2xl disabled:opacity-50 text-[10px] sm:text-sm active:scale-95 transition-all text-center sm:whitespace-nowrap"
          >
            {t.createEmptyFolderBtn || "Create Folder"}
          </button>
          
          <button
             onClick={() => {
               if (newDeckName.trim()) {
                 onSaveDeckToCache(newDeckName.trim(), false);
                 setNewDeckName("");
               }
             }}
             disabled={!newDeckName.trim()}
             className="neu-btn px-3 sm:px-8 py-2.5 sm:py-4 font-black uppercase tracking-widest text-[var(--accent)] rounded-lg sm:rounded-2xl disabled:opacity-50 text-[10px] sm:text-sm active:scale-95 transition-all text-center sm:whitespace-nowrap"
          >
            {t.saveDeckBtn || "Save as New"}
          </button>
          
          {loadedDeckId && (
            <button
               onClick={onOverwriteDeck}
               className="neu-btn px-3 sm:px-8 py-2.5 sm:py-4 font-black uppercase tracking-widest text-[color:var(--color-success)] rounded-lg sm:rounded-2xl text-[10px] sm:text-sm active:scale-95 transition-all text-center sm:whitespace-nowrap"
            >
              <i className="fas fa-sync-alt mr-2"></i> {t.overwriteDeckBtn || "Overwrite Progress"}
            </button>
          )}
        </div>

       {processedDecks && processedDecks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {selectedDeckIds.size > 0 && (
              <div className="mb-4 p-4 neu-flat rounded-2xl flex flex-wrap items-center justify-between gap-4 border-l-4 border-[var(--accent)] animate-fade-in">
                 <div className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">
                   {selectedDeckIds.size} Deck(s) Selected
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                    <button
                       onClick={() => {
                          handleBatchExport(Array.from(selectedDeckIds));
                          setSelectedDeckIds(new Set());
                       }}
                       className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg text-[var(--accent)]"
                    >
                       Export
                    </button>
                    <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-4">
                       <button
                          onClick={() => {
                             if (onBatchMoveDecks) onBatchMoveDecks(Array.from(selectedDeckIds), null);
                             setSelectedDeckIds(new Set());
                          }}
                          className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg text-[color:var(--color-success)]"
                       >
                          Move to Root
                       </button>
                    </div>
                    <button
                       onClick={() => {
                          if (onBatchDeleteDecks) onBatchDeleteDecks(Array.from(selectedDeckIds));
                          setSelectedDeckIds(new Set());
                       }}
                       className="neu-btn px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg text-[color:var(--color-danger)] ml-2"
                    >
                       Delete
                    </button>
                 </div>
              </div>
            )}
            {(() => {
               const renderDeckTree = (decksToRender, level = 0) => {
                 return decksToRender.map(d => {
                    const children = processedDecks.filter(child => child.parentId === d.id);
                    return (
                       <div key={d.id} className="flex flex-col gap-2">
                          <div 
                             draggable 
                             onDragStart={(e) => { 
                                e.stopPropagation(); 
                                if (selectedDeckIds.has(d.id)) {
                                   e.dataTransfer.setData("text/plain", JSON.stringify(Array.from(selectedDeckIds)));
                                } else {
                                   e.dataTransfer.setData("text/plain", JSON.stringify([d.id]));
                                }
                              }}
                             onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                             onDrop={(e) => {
                                e.preventDefault(); 
                                e.stopPropagation();
                                const files = Array.from(e.dataTransfer.files || []);
                                const jsonFiles = files.filter(f => f.name.endsWith('.json'));
                                if (jsonFiles.length > 0) {
                                   handleDrop(e, d.id);
                                } else {
                                   const draggedData = e.dataTransfer.getData("text/plain");
                                   try {
                                      const ids = JSON.parse(draggedData);
                                      if (Array.isArray(ids) && onBatchMoveDecks) {
                                          onBatchMoveDecks(ids, d.id);
                                          setSelectedDeckIds(new Set());
                                      }
                                   } catch (err) {
                                      if (draggedData && draggedData !== d.id && onMoveDeck) {
                                         onMoveDeck(draggedData, d.id);
                                      }
                                   }
                                }
                             }}
                             onClick={(e) => {
                                 if (e.shiftKey && lastSelectedId) {
                                    const idx1 = visualOrder.indexOf(lastSelectedId);
                                    const idx2 = visualOrder.indexOf(d.id);
                                    if (idx1 !== -1 && idx2 !== -1) {
                                       const start = Math.min(idx1, idx2);
                                       const end = Math.max(idx1, idx2);
                                       const newSet = new Set(selectedDeckIds);
                                       for (let i = start; i <= end; i++) {
                                          newSet.add(visualOrder[i]);
                                       }
                                       setSelectedDeckIds(newSet);
                                    }
                                 } else if (e.ctrlKey || e.metaKey) {
                                    const newSet = new Set(selectedDeckIds);
                                    if (newSet.has(d.id)) newSet.delete(d.id);
                                    else newSet.add(d.id);
                                    setSelectedDeckIds(newSet);
                                    setLastSelectedId(d.id);
                                 } else {
                                    onLoadDeckFromCache(d.id);
                                    setSelectedDeckIds(new Set());
                                    setLastSelectedId(d.id);
                                 }
                              }}
                             className={`deck-row-container p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-all cursor-pointer select-none ${selectedDeckIds.has(d.id) ? 'neu-flat ring-2 ring-[var(--accent)] bg-[var(--accent)]/5' : (loadedDeckId === d.id ? 'neu-flat border-2 border-[var(--accent)] bg-[var(--accent)]/10 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]' : 'neu-pressed hover:bg-white/5')}`}
                             style={{ marginLeft: `${level * 1.5}rem` }}
                          >
                              <div className="flex items-center gap-3 w-full sm:flex-1 overflow-hidden">
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 w-12">
                                   <span className="text-[10px] font-black text-[var(--accent)]">{d.progress}%</span>
                                   <div className="w-8 h-1 bg-[var(--text-muted)] opacity-20 rounded-full overflow-hidden">
                                      <div className="h-full bg-[var(--accent)]" style={{ width: `${d.progress}%` }}></div>
                                   </div>
                                </div>

                                {editingDeckId === d.id ? (
                                   <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                      <input
                                         type="text"
                                         value={editingDeckName}
                                         onChange={(e) => setEditingDeckName(e.target.value)}
                                         autoFocus
                                         onClick={(e) => e.stopPropagation()}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (editingDeckName.trim()) onRenameDeck(d.id, editingDeckName.trim());
                                          setEditingDeckId(null);
                                        }}
                                        className="text-[color:var(--color-success)] hover:opacity-80 p-2 flex-shrink-0"
                                      >
                                         <CheckIcon />
                                      </button>
                                   </div>
                                ) : (
                                   <div className="flex-1 flex flex-col justify-center overflow-hidden min-w-0 pr-2">
                                      <h3 
                                        onClick={(e) => { e.stopPropagation(); setEditingDeckId(d.id); setEditingDeckName(d.name); }}
                                        className="font-black text-sm sm:text-base truncate hover:text-[var(--accent)] transition-colors cursor-text group/title inline-flex items-center w-fit"
                                        title="Click to edit name"
                                      >
                                         <span className="truncate">{d.name}</span>
                                         <span className="opacity-40 md:opacity-0 group-hover/title:opacity-50 transition-opacity ml-2 flex-shrink-0 flex items-center">
                                            <EditIcon />
                                         </span>
                                      </h3>
                                      <p className="text-[9px] sm:text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">
                                         {d.totalCards} {t.cardsLabel || "cards"} • Avg: {d.avgScore.toFixed(1)}/10
                                      </p>
                                   </div>
                                )}
                             </div>
                             <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                                <button 
                                   onClick={() => onLoadDeckFromCache(d.id)} 
                                   disabled={loadedDeckId === d.id}
                                   className={`neu-btn flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${loadedDeckId === d.id ? 'opacity-50 text-[var(--text-muted)]' : 'text-[color:var(--color-success)]'}`}
                                >
                                   {loadedDeckId === d.id ? (t.loadedDeck || "Loaded") : (t.loadBtn || "Load")}
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
                                   className={`neu-btn flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${confirmDeleteId === d.id ? 'bg-[var(--color-danger)] text-white' : 'text-[color:var(--color-danger)]'}`}
                                >
                                   {confirmDeleteId === d.id ? (t.confirmDeleteBtn || "Sure?") : (t.deleteBtn || "Delete")}
                                </button>
                             </div>
                          </div>
                          {children.length > 0 && searchQuery === "" && (
                             <div className="flex flex-col gap-2 mt-2">
                                {renderDeckTree(children, level + 1)}
                             </div>
                          )}
                       </div>
                    );
                 });
               };
               
               const rootDecks = searchQuery !== "" ? processedDecks : processedDecks.filter(d => !d.parentId);
               return renderDeckTree(rootDecks);
            })()}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium text-center py-8 neu-pressed rounded-xl border border-dashed border-white/10">
             {t.noSavedDecks || "No saved decks yet. Drag and drop a .json file here to import!"}
          </p>
        )}
      </div>

      <div id="settings-algorithm" className={`neu-panel p-4 sm:p-8 md:p-12 ${activeTab === 'algorithm' ? 'block' : 'hidden lg:block'}`}>
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <ClockIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> Card Delivery Modifier
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
          Spaced Repetition algorithm is always enabled, continuously prioritizing unmastered cards with the lowest performance scores. Choose how you want cards delivered when several are due with the same priority:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { id: "random", name: t.orderRandom || "Randomised (Recommended)", icon: RandomIcon },
            { id: "sequential", name: t.orderSequential || "Sequential", icon: SeqIcon },
            { id: "semantic", name: t.orderSemantic || "Semantic Weakness Target", icon: BrainIcon }
          ].map(mode => (
            <label key={mode.id} className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${cardOrderMode === mode.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
              <input type="radio" value={mode.id} checked={cardOrderMode === mode.id} onChange={(e) => onCardOrderChange(e.target.value)} className="hidden" />
              <div className="opacity-80 text-2xl sm:text-3xl mb-3"><mode.icon /></div>
              <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs leading-tight">{mode.name}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 neu-pressed rounded-xl">
          <div className="flex-1">
            <span className="font-bold text-xs sm:text-sm text-[var(--text-main)] block uppercase tracking-wider">
              {t.jumpToPriorityCard || "Jump to Priority Question"}
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--text-muted)] block mt-0.5">
              {t.jumpToPriorityCardDesc || "Deterministically jump to the algorithm's next priority card to easily start at the exact same spot across synced devices."}
            </span>
          </div>
          <button 
            onClick={onJumpToPriorityCard} 
            className="neu-btn px-3.5 sm:px-5 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest text-[var(--accent)] hover:text-[var(--text-main)] transition-colors flex items-center gap-2 self-stretch sm:self-auto justify-center text-center leading-snug sm:whitespace-nowrap"
          >
            <i className="fas fa-crosshairs text-xs sm:text-sm"></i>
            <span>{t.jumpToPriorityCard || "Jump to Priority Question"}</span>
          </button>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8">
           <h3 className="text-sm sm:text-base font-black text-[var(--text-main)] mb-4 flex items-center uppercase tracking-widest">
             <i className="fas fa-layer-group mr-2 sm:mr-4 text-[var(--accent)]"></i> {t.servingModeLabel || "Serving Mode"}
           </h3>
           <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
             {t.servingModeDesc || "Choose how cards are presented to you."}
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
             {[
               { id: "full", name: t.servingModeFull || "Full (Type answer then choices)", icon: "fa-keyboard" },
               { id: "mcq", name: t.servingModeMCQ || "Multiple Choice Direct", icon: "fa-list-ul" },
               { id: "pass", name: t.servingModePass || "Passthrough (Answers revealed)", icon: "fa-eye" }
             ].map(mode => (
               <label key={mode.id} className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${servingMode === mode.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
                 <input type="radio" value={mode.id} checked={servingMode === mode.id} onChange={(e) => onServingModeChange(e.target.value)} className="hidden" />
                 <div className="opacity-80 text-2xl sm:text-3xl mb-3"><i className={`fas ${mode.icon}`}></i></div>
                 <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs leading-tight">{mode.name}</span>
               </label>
             ))}
           </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8">
           <h3 className="text-sm sm:text-base font-black text-[var(--text-main)] mb-4 flex items-center uppercase tracking-widest">
             <i className="fas fa-filter mr-2 sm:mr-4 text-[var(--accent)]"></i> {t.questionTypesLabel || "Question Types"}
           </h3>
           <div className="flex flex-col gap-3 sm:gap-4 mb-6">
              {[
                { id: "long", name: t.typeLong || "Long Form Questions", icon: "fa-align-left" },
                { id: "mcc", name: t.typeMcc || "Single Choice (MCC)", icon: "fa-check-circle" },
                { id: "multi", name: t.typeMulti || "Multiple Choice (Multi-MCC)", icon: "fa-check-square" }
              ].map(type => (
                <label key={type.id} className={`p-3 sm:p-4 rounded-xl cursor-pointer flex items-center justify-between text-left transition-all duration-300 ${questionTypeSettings[type.id] ? "neu-pressed border border-[var(--accent)]" : "neu-btn text-[var(--text-muted)]"}`}>
                  <div className="flex items-center">
                     <i className={`fas ${type.icon} mr-3 sm:mr-4 text-lg ${questionTypeSettings[type.id] ? "text-[var(--accent)]" : "opacity-50"}`}></i>
                     <span className={`font-bold uppercase tracking-widest text-xs sm:text-sm ${questionTypeSettings[type.id] ? "text-[var(--accent)]" : ""}`}>{type.name}</span>
                  </div>
                  <input type="checkbox" checked={!!questionTypeSettings[type.id]} onChange={(e) => setQuestionTypeSettings({ ...questionTypeSettings, [type.id]: e.target.checked })} className="hidden" />
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${questionTypeSettings[type.id] ? 'bg-[var(--accent)]' : 'bg-black/30'}`}>
                     <div className={`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-all ${questionTypeSettings[type.id] ? 'left-5' : 'left-1'}`}></div>
                  </div>
                </label>
              ))}
           </div>

           <label className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between text-left transition-all duration-300 ${questionTypeSettings.proportional ? "neu-pressed border-l-4 border-[var(--accent)]" : "neu-btn border-l-4 border-transparent text-[var(--text-muted)]"}`}>
              <div className="flex-1 mr-4">
                 <div className={`font-black uppercase tracking-widest text-xs sm:text-sm mb-1 ${questionTypeSettings.proportional ? "text-[var(--text-main)]" : ""}`}>
                    {t.proportionalLabel || "Proportional Type Distribution"}
                 </div>
                 <div className="text-[10px] sm:text-xs font-medium opacity-70">
                    {t.proportionalDesc || "Dynamically serves questions to perfectly match the ratio of your deck (e.g. 10% long, 90% MCC) based on your lifetime answers."}
                 </div>
              </div>
              <input type="checkbox" checked={!!questionTypeSettings.proportional} onChange={(e) => setQuestionTypeSettings({ ...questionTypeSettings, proportional: e.target.checked })} className="hidden" />
              <div className={`w-12 h-6 rounded-full relative transition-colors ${questionTypeSettings.proportional ? 'bg-[var(--accent)]' : 'bg-black/30'}`}>
                 <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all ${questionTypeSettings.proportional ? 'left-7' : 'left-1'}`}></div>
              </div>
           </label>
        </div>
      </div>

      <div id="settings-backup" className={`neu-panel p-4 sm:p-8 md:p-12 ${activeTab === 'backup' ? 'block' : 'hidden lg:block'}`}>
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-6 flex items-center uppercase tracking-widest">
          <DownloadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.dataBackup || "Data Backup"}
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
          {t.dataBackupDesc || "Export your progress or import a backup"}
        </p>
        <div className="mb-8">
          <label className="text-xs font-bold text-[var(--text-muted)] block mb-2 uppercase tracking-widest flex items-center">
            <UploadIcon className="mr-2" /> {t.exportShareTitle || "Export & Share"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
            <button onClick={onExportProgress} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--accent)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.exportBackup || "Export JSON (With Progress)"}
            </button>
            <button onClick={onExportWithoutProgress} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--accent)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.exportBackupClean || "Export JSON (Clean)"}
            </button>
            <button onClick={handleAnkiExport} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.exportAnki || "Export Anki (CSV)"}
            </button>
            <button onClick={() => handleShare(true, false)} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[color:var(--color-success)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.shareProgress || "Share Deck (With Progress)"}
            </button>
            <button onClick={() => handleShare(false, false)} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[color:var(--color-success)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.shareClean || "Share Deck (Clean)"}
            </button>
            <button onClick={() => handleShare(true, true)} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[color:var(--color-success)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.shareHierarchyProgress || "Share Hierarchy (With Progress)"}
            </button>
            <button onClick={() => handleShare(false, true)} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[color:var(--color-success)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
              {t.shareHierarchyClean || "Share Hierarchy (Clean)"}
            </button>
          </div>
          {shareQrCodeData && (
             <div className="mt-6 p-4 neu-pressed rounded-2xl max-w-sm mx-auto lg:mx-0 flex flex-col items-center">
                <div className="flex justify-between w-full items-center mb-4">
                  <span className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">{t.shareCodeIs || "Share Code:"} {shareQrCodeData.code}</span>
                  <button onClick={() => setShareQrCodeData(null)} className="text-[var(--text-muted)] hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                <div 
                   className="bg-white p-3 rounded-xl mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                   title="Click to copy link"
                   onClick={() => {
                       navigator.clipboard.writeText(shareQrCodeData.url).then(() => {
                           showToast(t.linkCopied || "Link copied to clipboard!");
                       });
                   }}
                >
                   <QRCodeSVG value={shareQrCodeData.url} size={200} />
                </div>
                <span className="text-xs font-bold text-center text-[var(--text-muted)]">{t.scanCodeOrOpenLink || "Scan this code or open the link to import the shared cards."}</span>
             </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <label className="text-xs font-bold text-[var(--text-muted)] block mb-2 uppercase tracking-widest flex items-center">
            <DownloadIcon className="mr-2" /> {t.importLoadTitle || "Import & Load"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap mb-4">
            <button onClick={() => fileInputRef.current.click()} className="neu-btn flex-none sm:flex-1 min-w-[120px] py-3 sm:py-4 font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center text-xs sm:text-sm rounded-lg sm:rounded-2xl">
              {t.importFile || "Import File (JSON/CSV)"}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input 
              type="text" 
              value={importCode} 
              onChange={e => setImportCode(e.target.value)} 
              className="neu-pressed flex-1 px-4 py-3 rounded-xl bg-transparent text-[var(--text-main)] font-black outline-none uppercase min-w-[150px]"
              placeholder={t.enterSyncOrShareCode || "ENTER SYNC OR SHARE CODE"}
            />
            <button 
              onClick={() => { onImportFromCode(importCode); setImportCode(""); }}
              disabled={!importCode}
              className="neu-btn flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm uppercase disabled:opacity-50 text-[var(--text-main)] text-center sm:whitespace-nowrap"
            >
              {t.importCodeBtn || "Import Code"}
            </button>
          </div>
        </div>
        <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              files.forEach(file => {
                 const reader = new FileReader();
                 reader.onload = (event) => {
                    const text = event.target.result;
                    const filename = file.name.replace(/\.(json|csv|txt)$/i, '');
                    
                    if (file.name.toLowerCase().endsWith('.json')) {
                       try {
                          const parsed = JSON.parse(text);
                          if (Array.isArray(parsed)) {
                             const formattedDeck = parsed.map((q, idx) => {
                                const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
                                return {
                                  ...q,
                                  correctAnswers: correctAnswersArray,
                                  id: q.id || `custom-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                                  score: 0,
                                  dueTurn: 0,
                                  attempts: 0,
                                  isMastered: false
                                };
                             });
                             onDirectDropSave({
                               id: Date.now().toString() + Math.random().toString(),
                               name: filename,
                               deck: formattedDeck,
                               completed: false,
                               parentId: null
                             });
                             showToast(`${t.importedFile || "Imported"} ${filename}`);
                          } else if (parsed.myDecks) {
                             onImportProgress(text);
                          }
                       } catch (err) {
                          showToast(`${t.failedToParse || "Failed to parse"} ${filename}`);
                       }
                    } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
                       handleAnkiImport(text, file.name);
                    } else {
                       showToast(t.unsupportedFormat || "Unsupported file format");
                    }
                 };
                 reader.readAsText(file);
              });
              e.target.value = null;
            }}
            accept=".json,.csv,.txt"
            className="hidden"
          />
      </div>

      <div id="settings-nli" className={`neu-panel p-4 sm:p-8 md:p-12 ${activeTab === 'nli' || activeTab === 'embedding' ? 'block' : 'hidden lg:block'}`}>
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-6 sm:mb-8 flex items-center uppercase tracking-widest">
          <CpuIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.aiModelTitle || "AI Models Configuration"}
        </h2>
        
        {/* NLI Cross-Encoder Selection */}
        <div className="mb-8 sm:mb-10">
          <h3 className="text-xs sm:text-sm font-black text-[var(--accent)] mb-3 uppercase tracking-widest flex items-center">
            <CpuIcon className="mr-2" /> {t.nliModelSubtitle || "NLI Cross-Encoder (Text Grading)"}
          </h3>
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

        {/* Embedding Model Selection */}
        <div className="pt-6 sm:pt-8 border-t border-white/10">
          <h3 className="text-xs sm:text-sm font-black text-[var(--accent)] mb-3 uppercase tracking-widest flex items-center">
            <BrainIcon className="mr-2" /> {t.embeddingModelTitle || "Embedding Model (Semantic Focus & Graph)"}
          </h3>
          <div className="flex flex-col gap-2 sm:gap-4">
            {AVAILABLE_EMBEDDING_MODELS.map((m) => (
              <label key={m.id} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-center text-left transition-all duration-300 ${selectedEmbeddingModel === m.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
                <input type="radio" name="embedding-model" value={m.id} checked={selectedEmbeddingModel === m.id} onChange={(e) => onEmbeddingModelChange(e.target.value)} className="hidden" />
                <div>
                  <div className="font-black uppercase tracking-widest text-xs sm:text-base">{m.name}</div>
                  <div className="text-[9px] sm:text-xs font-medium opacity-70 mt-1">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Clear AI Cache & Loaded Models */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
              <i className="fas fa-broom text-[var(--accent)]"></i>
              {t.clearAiCacheTitle || "Clear AI Cache & Loaded Models"}
            </h4>
            <p className="text-[9px] sm:text-xs text-[var(--text-muted)] font-medium mt-1 leading-relaxed max-w-md">
              {t.clearAiCacheDesc || "Purge pre-calculated graph vector embeddings, evaluation caches, and loaded neural model memory."}
            </p>
          </div>
          <button
            onClick={onClearAICache}
            className="neu-btn px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl text-orange-500 hover:text-red-500 transition-colors flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <i className="fas fa-trash-alt"></i>
            <span>{t.clearAiCacheBtn || "Clear AI Cache"}</span>
          </button>
        </div>
      </div>



      <div id="settings-generator" className={`neu-panel p-4 sm:p-8 md:p-12 flex flex-col sm:flex-row justify-between items-center gap-6 ${activeTab === 'generator' ? 'block' : 'hidden lg:flex'}`}>
        <div className="text-left">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-2 flex items-center justify-start uppercase tracking-widest">
            <SparklesIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.llmGeneratorTitle || "AI Deck Generator"}
          </h2>
          <p className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)] max-w-md text-left">
            {t.llmGeneratorDesc || "Copy the prompt template to automatically generate JSON flashcards from your study notes using ChatGPT, Claude, or other LLMs."}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <button onClick={handleCopyPrompt} className="neu-btn px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center text-[var(--text-main)] text-center sm:whitespace-nowrap">
            <CopyIcon className="mr-2" /> {t.copyPromptBtn || "Copy Prompt Template"}
          </button>
          <button onClick={handleCopyLongPrompt} className="neu-btn px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center text-[color:var(--color-success)] text-center sm:whitespace-nowrap">
            <CopyIcon className="mr-2" /> {t.copyLongPromptBtn || "Copy Long Prompt"}
          </button>
        </div>
      </div>

      <div id="settings-sync" className={`neu-panel p-4 sm:p-8 md:p-12 ${activeTab === 'sync' ? 'block' : 'hidden lg:block'}`}>
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <UploadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.cloudSyncTitle || "P2P Cloud Sync"}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[var(--text-muted)] block uppercase tracking-widest">{t.syncCodeLabel || "Sync Code:"}</label>
              {syncCode && syncHash && (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-mono font-bold text-xs border border-[var(--accent)]/30 animate-pulse">
                  {t.syncTokenHashLabel || "Token Hash:"} [{syncHash}]
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <input 
                type="text" 
                value={inputSyncCode} 
                onChange={e => setInputSyncCode(e.target.value)} 
                className="neu-pressed flex-1 px-4 py-3 rounded-xl bg-transparent text-[var(--text-main)] font-black outline-none uppercase min-w-[150px]"
                placeholder={t.enterSyncOrShareCode || "ENTER SYNC OR SHARE CODE"}
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                {syncCode && (
                  <button 
                    onClick={onDisconnectSyncCode} 
                    className="neu-btn flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase text-[color:var(--color-danger)] text-center sm:whitespace-nowrap"
                  >
                    {t.stopSyncBtn || "Stop Sync"}
                  </button>
                )}
                <button 
                  onClick={() => onConnectSyncCode(inputSyncCode)}
                  disabled={!inputSyncCode}
                  className="neu-btn flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase disabled:opacity-50 text-center sm:whitespace-nowrap"
                >
                  {t.connectBtn || "Connect"}
                </button>
                <button 
                  onClick={onGenerateSyncCode} 
                  disabled={isGeneratingCode}
                  className="neu-btn flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase text-[color:var(--color-success)] disabled:opacity-50 text-center sm:whitespace-nowrap"
                >
                  {isGeneratingCode ? (t.generatingCode || "Generating...") : (t.generateCode || "Generate")}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">
              {syncCode ? (t?.syncDescActive || "Auto-sync is enabled. Changes will be pushed and pulled automatically in the background.") : (t?.syncDescInactive || "Enter a code to enable automatic cross-device sync (expires after 5 minutes of inactivity). Share codes expire after 3 days.")}
            </p>
            {syncCode && (
              <div className="mt-6 flex flex-col items-center p-4 neu-pressed rounded-2xl max-w-xs mx-auto lg:mx-0">
                {pairingCode && (
                   <div className="mb-4 text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">Pairing Code (Expires in 5m)</span>
                     <span className="font-mono text-3xl font-black tracking-widest text-[var(--accent)]">{pairingCode}</span>
                   </div>
                )}
                <span className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-main)]">{t?.scanToSync || "Scan to Sync"}</span>
                <div 
                   className="bg-white p-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                   title="Click to copy link"
                   onClick={() => {
                       const url = `${window.location.origin}${window.location.pathname}?sync=${syncCode}`;
                       navigator.clipboard.writeText(url).then(() => {
                           showToast(t.linkCopied || "Link copied to clipboard!");
                       });
                   }}
                >
                  <QRCodeSVG value={`${window.location.origin}${window.location.pathname}?sync=${syncCode}`} size={150} />
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <label className="text-xs font-bold text-[color:var(--color-danger)] block mb-2 uppercase tracking-widest">{t?.dangerZone || "Danger Zone"}</label>
              <button 
                onClick={onClearCloudData} 
                className="neu-btn px-4 py-3 rounded-xl font-bold text-xs uppercase text-[color:var(--color-danger)] flex items-center justify-center"
              >
                {t?.clearCloudData || "Clear All Cloud Data (Remote Wipe)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="settings-raw" className={`neu-panel p-4 sm:p-8 md:p-12 ${activeTab === 'raw' ? 'block' : 'hidden lg:block'}`}>
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-6 flex items-center uppercase tracking-widest">
          <UploadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.rawDeckImport || "Raw Deck Import"}
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-3 sm:mb-6 text-[10px] sm:text-sm">
          {t.rawDeckImportDesc || "Paste JSON to import."}
        </p>
        <textarea
          className="neu-pressed w-full h-48 sm:h-80 p-3 sm:p-6 font-mono text-[9px] sm:text-xs rounded-xl sm:rounded-2xl border-0 text-[var(--text-main)] outline-none bg-transparent focus-within:ring-2 focus:ring-[color:var(--color-danger)] transition-all"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <div className="mt-4 sm:mt-8 flex justify-end">
          <button onClick={() => onImport(jsonInput)} className="neu-btn w-full sm:w-auto px-4 sm:px-10 py-2 sm:py-4 font-black uppercase tracking-widest text-[color:var(--color-danger)] text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            {t.importResetDeck || "Import & Reset"}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};
