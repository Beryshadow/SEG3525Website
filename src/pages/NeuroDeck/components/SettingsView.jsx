import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SaveIcon, ClockIcon, RandomIcon, SeqIcon, DownloadIcon, UploadIcon, SparklesIcon, CpuIcon, CheckIcon, EditIcon, CopyIcon, BrainIcon } from './Icons';

export const SettingsView = ({
  currentDeck, onImport, selectedModel, onModelChange,
  cardOrderMode, onCardOrderChange,
  onExportProgress, onImportProgress,
  myDecks, loadedDeckId, onSaveDeckToCache, onOverwriteDeck, onLoadDeckFromCache, 
  onDeleteDeckFromCache, onToggleDeckCompleted, onRenameDeck, onDirectDropSave, t, showToast
}) => {
  const [jsonInput, setJsonInput] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
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
    { id: "Xenova/nli-deberta-v3-base", name: "DeBERTa-v3 NLI (Base)", desc: t.moreAccurate || "Maximum accuracy (Slower)" },
    { id: "Xenova/nli-deberta-v3-large", name: "DeBERTa-v3 NLI (Large)", desc: t.highQuality || "Highest accuracy (Slowest)" }
  ];

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

  const handleCopyPrompt = () => {
    const textToCopy = t.llmPromptTemplate;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(t.promptCopiedBtn || "Copied!");
    }).catch(() => {
      showToast("Failed to copy. Clipboard access denied.");
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
              completed: false
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

  return (
    <div className="w-full space-y-4 sm:space-y-8">
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
             placeholder={t.searchDecksPrompt || "Search decks..."}
             className="neu-pressed px-4 py-3 rounded-xl bg-transparent text-[var(--text-main)] text-sm font-medium outline-none"
           />
           <div className="flex gap-2">
             <select onChange={(e) => setFilterMode(e.target.value)} className="neu-btn px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                <option value="all">{t.all || "All"}</option>
                <option value="completed">{t.completed || "Completed"}</option>
                <option value="in-progress">{t.inProgress || "In Progress"}</option>
             </select>
             <select onChange={(e) => setSortBy(e.target.value)} className="neu-btn px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
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
               className="neu-btn px-4 sm:px-8 py-3 sm:py-4 font-black uppercase tracking-widest text-[color:var(--color-success)] rounded-lg sm:rounded-2xl text-[10px] sm:text-sm active:scale-95 transition-all whitespace-nowrap"
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
                             className="text-[color:var(--color-success)] hover:opacity-80 p-2"
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
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium text-center py-8 neu-pressed rounded-xl border border-dashed border-white/10">
             {t.noSavedDecks || "No saved decks yet. Drag and drop a .json file here to import!"}
          </p>
        )}
      </div>

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
            { id: "sequential", name: t.orderSequential || "Sequential", icon: SeqIcon },
            { id: "semantic", name: t.orderSemantic || "Semantic Weakness Target", icon: BrainIcon }
          ].map(mode => (
            <label key={mode.id} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer flex items-center text-left transition-all duration-300 ${cardOrderMode === mode.id ? "neu-pressed text-[var(--accent)]" : "neu-btn text-[var(--text-main)]"}`}>
              <input type="radio" value={mode.id} checked={cardOrderMode === mode.id} onChange={(e) => onCardOrderChange(e.target.value)} className="hidden" />
              <div className="mr-3 sm:mr-4 opacity-80 text-lg sm:text-xl"><mode.icon /></div>
              <span className="font-black uppercase tracking-widest text-xs sm:text-base">{mode.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-6 flex items-center uppercase tracking-widest">
          <DownloadIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.dataBackup || "Data Backup"}
        </h2>
        <p className="text-[var(--text-muted)] font-medium mb-4 sm:mb-8 leading-relaxed text-xs sm:text-base">
          {t.dataBackupDesc || "Export your progress or import a backup"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
          <button onClick={onExportProgress} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--accent)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            <DownloadIcon className="mr-2 sm:mr-3" /> {t.exportBackup || "Export JSON"}
          </button>
          <button onClick={handleAnkiExport} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--accent)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            <DownloadIcon className="mr-2 sm:mr-3" /> {t.exportAnki || "Export Anki (CSV)"}
          </button>
          <button onClick={() => fileInputRef.current.click()} className="neu-btn flex-1 min-w-[120px] py-2 sm:py-4 font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center text-[10px] sm:text-sm rounded-lg sm:rounded-2xl">
            <UploadIcon className="mr-2 sm:mr-3" /> {t.importBackup || "Import (JSON/CSV)"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                 const text = event.target.result;
                 if (file.name.toLowerCase().endsWith('.json')) {
                    onImportProgress(text);
                 } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
                    handleAnkiImport(text, file.name);
                 } else {
                    showToast("Unsupported file format");
                 }
              };
              reader.readAsText(file);
              e.target.value = null;
            }}
            accept=".json,.csv,.txt"
            className="hidden"
          />
        </div>
      </div>

      <div className="neu-panel p-4 sm:p-8 md:p-12">
        <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-4 sm:mb-8 flex items-center uppercase tracking-widest">
          <CpuIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.aiModelTitle || "AI Model"}
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

      <div className="neu-panel p-4 sm:p-8 md:p-12 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-left">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] mb-2 flex items-center justify-start uppercase tracking-widest">
            <SparklesIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> {t.llmGeneratorTitle || "AI Deck Generator"}
          </h2>
          <p className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)] max-w-md text-left">
            {t.llmGeneratorDesc || "Copy the prompt template to automatically generate JSON flashcards from your study notes using ChatGPT, Claude, or other LLMs."}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <button onClick={handleCopyPrompt} className="neu-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center whitespace-nowrap text-[var(--text-main)]">
            <CopyIcon className="mr-2" /> {t.copyPromptBtn || "Copy Prompt Template"}
          </button>
        </div>
      </div>

      <div className="neu-panel p-4 sm:p-8 md:p-12">
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
  );
};
