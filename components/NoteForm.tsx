
import React, { useState, useRef } from 'react';
import { analyzeNote } from '../services/geminiService';
import { Note } from '../types';

interface NoteFormProps {
  onSave: (note: Note) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ onSave }) => {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    // Set continuous to true to allow long-form dictation
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setContent((prev) => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      const metadata = await analyzeNote(content);
      const newNote: Note = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        ...metadata
      };
      onSave(newNote);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-emerald-50">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Type or use voice for long notes..."
            className="w-full min-h-[120px] p-4 text-slate-700 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all placeholder:text-slate-400"
            disabled={isAnalyzing}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                isRecording 
                  ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                  : 'bg-white text-emerald-500 border-slate-200 hover:border-emerald-300'
              }`}
              title={isRecording ? "Stop Recording" : "Start Voice Note (Long Form)"}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone-lines'}`}></i>
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isAnalyzing}
              className="px-6 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus"></i>
                  Add Note
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NoteForm;
