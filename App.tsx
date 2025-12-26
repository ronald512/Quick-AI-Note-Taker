
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import NoteTable from './components/NoteTable';
import NoteEditorModal from './components/NoteEditorModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { Note, SearchFilters } from './types';
import { parseVoiceSearch } from './services/geminiService';

type ViewMode = 'grid' | 'list';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('lumina_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Deletion States
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('lumina_notes', JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchQuery = !filters.query || note.content.toLowerCase().includes(filters.query.toLowerCase()) || note.subject.toLowerCase().includes(filters.query.toLowerCase());
      const matchSubject = !filters.subject || note.subject.toLowerCase().includes(filters.subject.toLowerCase());
      const matchCriticality = !filters.criticality || note.criticality === filters.criticality;
      const matchPurpose = !filters.purpose || note.purpose.toLowerCase().includes(filters.purpose.toLowerCase());
      const matchImportance = filters.minImportance === undefined || note.importance >= filters.minImportance;
      
      let matchDate = true;
      const noteDate = new Date(note.createdAt).getTime();
      if (filters.startDate) {
        matchDate = matchDate && noteDate >= new Date(filters.startDate).getTime();
      }
      if (filters.endDate) {
        matchDate = matchDate && noteDate <= new Date(filters.endDate).getTime();
      }

      return matchQuery && matchSubject && matchCriticality && matchPurpose && matchImportance && matchDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, filters]);

  // Clean up selection if notes change
  useEffect(() => {
    const validIds = new Set(filteredNotes.map(n => n.id));
    setSelectedIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => { if (validIds.has(id)) next.add(id); });
      return next;
    });
  }, [filteredNotes]);

  const handleAddNote = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const confirmSingleDelete = () => {
    if (noteIdToDelete) {
      setNotes((prev) => prev.filter((n) => n.id !== noteIdToDelete));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(noteIdToDelete);
        return next;
      });
      setNoteIdToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    setNotes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setEditingNote(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotes.length && filteredNotes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const triggerVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsVoiceSearching(true);
    recognition.onend = () => setIsVoiceSearching(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      const parsedFilters = await parseVoiceSearch(transcript);
      setFilters(parsedFilters);
    };
    recognition.start();
  };

  const handleManualSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setFilters({ query: val });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const downloadNotes = () => {
    if (filteredNotes.length === 0) {
      alert("No notes to download.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredNotes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `lumina_notes_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <span className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-brain text-lg"></i>
            </span>
            Lumina <span className="text-emerald-600">Notes AI</span>
          </h1>
          <p className="text-slate-500 mt-1">Smart organization for your digital memory.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fa-solid fa-table-cells-large"></i>
              Grid
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fa-solid fa-table-list"></i>
              Spreadsheet
            </button>
          </div>
          <button 
            type="button"
            onClick={downloadNotes}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-download"></i>
            Export ({filteredNotes.length})
          </button>
        </div>
      </header>

      {/* Input Section */}
      <section className="mb-10">
        <NoteForm onSave={handleAddNote} />
      </section>

      {/* Filter & List Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
            <input 
              type="text" 
              placeholder="Search notes, subjects, or ask via voice..."
              value={searchTerm}
              onChange={handleManualSearch}
              className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button 
              type="button"
              onClick={triggerVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isVoiceSearching ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-500'
              }`}
              title="Voice Search"
            >
              <i className="fa-solid fa-microphone"></i>
            </button>
          </div>

          <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0">
            {Object.keys(filters).length > 0 && (
              <button 
                type="button"
                onClick={clearFilters}
                className="whitespace-nowrap px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <div className="flex gap-2">
              <select 
                value={filters.criticality || ''} 
                onChange={(e) => setFilters(prev => ({...prev, criticality: (e.target.value || undefined) as any}))}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg outline-none focus:border-emerald-500"
              >
                <option value="">Criticality</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Badge Area */}
        {Object.entries(filters).some(([k,v]) => !!v) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <div key={key} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
                  <span className="opacity-60">{key}:</span> {value.toString()}
                </div>
              );
            })}
          </div>
        )}

        {filteredNotes.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={setNoteIdToDelete} 
                  onClick={setEditingNote}
                />
              ))}
            </div>
          ) : (
            <NoteTable 
              notes={filteredNotes} 
              selectedIds={selectedIds} 
              onToggleSelect={toggleSelect} 
              onToggleSelectAll={toggleSelectAll} 
              onRowClick={setEditingNote}
              onDeleteSelected={() => setShowBulkDeleteConfirm(true)}
              onDeleteOne={setNoteIdToDelete}
            />
          )
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="text-slate-300 text-5xl mb-4">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <h3 className="text-slate-600 font-bold text-lg">No notes found</h3>
            <p className="text-slate-400 mt-1">Try adjusting your search filters or add a new note.</p>
            <button 
              type="button"
              onClick={clearFilters}
              className="mt-4 text-emerald-600 font-semibold hover:underline"
            >
              Show all notes
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      {editingNote && (
        <NoteEditorModal 
          note={editingNote} 
          onSave={handleUpdateNote} 
          onClose={() => setEditingNote(null)} 
        />
      )}

      {/* Delete Confirmation for Single Note */}
      <DeleteConfirmationModal 
        isOpen={!!noteIdToDelete}
        title="Delete Note?"
        message="This action cannot be undone. This note will be permanently removed from your storage."
        onConfirm={confirmSingleDelete}
        onCancel={() => setNoteIdToDelete(null)}
      />

      {/* Delete Confirmation for Bulk selection */}
      <DeleteConfirmationModal 
        isOpen={showBulkDeleteConfirm}
        title={`Delete ${selectedIds.size} Notes?`}
        message={`You are about to delete ${selectedIds.size} selected notes. This action is irreversible.`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Floating Info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-full shadow-xl flex items-center gap-6 border border-slate-200 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{notes.length} Total</span>
        </div>
        <div className="w-px h-4 bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{filteredNotes.length} Found</span>
        </div>
      </div>
    </div>
  );
};

export default App;
