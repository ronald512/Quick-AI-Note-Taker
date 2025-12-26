
import React from 'react';
import { Note } from '../types';

interface NoteTableProps {
  notes: Note[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (note: Note) => void;
  onDeleteSelected: () => void;
  onDeleteOne: (id: string) => void;
}

const NoteTable: React.FC<NoteTableProps> = ({ 
  notes, 
  selectedIds, 
  onToggleSelect, 
  onToggleSelectAll, 
  onRowClick,
  onDeleteSelected,
  onDeleteOne
}) => {
  const allSelected = notes.length > 0 && selectedIds.size === notes.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelectAll();
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Added</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Preview</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notes.map((note) => (
              <tr 
                key={note.id} 
                className={`hover:bg-emerald-50/30 cursor-pointer transition-colors ${selectedIds.has(note.id) ? 'bg-emerald-50/50' : ''}`}
                onClick={() => onRowClick(note)}
              >
                <td className="p-4 w-10">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(note.id)} 
                      onChange={() => onToggleSelect(note.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                  {new Date(note.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm font-semibold text-slate-800">
                  {note.subject}
                </td>
                <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                  {note.content}
                </td>
                <td className="p-4 text-center">
                   <span className={`inline-block w-2 h-2 rounded-full ${
                     note.criticality === 'High' ? 'bg-red-500' : 
                     note.criticality === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                   }`} title={note.criticality}></span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOne(note.id);
                    }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2"
                    title="Delete row"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium">{selectedIds.size} notes selected</span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSelected();
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <i className="fa-solid fa-trash-can"></i>
            Delete Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteTable;
