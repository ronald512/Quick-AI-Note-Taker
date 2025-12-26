
import React from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onClick }) => {
  const criticalityColors = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <div 
      onClick={() => onClick(note)}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer h-full flex flex-col"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${note.criticality === 'High' ? 'bg-red-500' : note.criticality === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-slate-800 text-lg leading-tight pr-8">{note.subject}</h3>
        <button 
          type="button"
          onClick={handleDelete}
          className="text-slate-300 hover:text-red-500 transition-colors p-2 -mr-2 relative z-10"
          title="Delete note"
        >
          <i className="fa-solid fa-trash-can text-sm"></i>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${criticalityColors[note.criticality]}`}>
          {note.criticality}
        </span>
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-200">
          {note.purpose}
        </span>
        <span className="bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-teal-100">
          Rank: {note.importance}/10
        </span>
      </div>

      <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">
        {note.content}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <div className="flex flex-wrap gap-1 max-w-[70%] overflow-hidden">
          {note.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] text-slate-400">#{tag}</span>
          ))}
        </div>
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;
