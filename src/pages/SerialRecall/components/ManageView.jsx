import React, { useState, useRef } from 'react';
import { CheckIcon, SparklesIcon, TrashIcon, PlusIcon, CopyIcon, SettingsIcon, DownloadIcon, UploadIcon, RefreshIcon, EditIcon } from './Icons';

export const ManageView = ({ lists, setLists, setActiveListId, activeListId, showToast, currentLang, setView }) => {
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

  return (
    <div className="w-full space-y-6 animate-fade-in">
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
