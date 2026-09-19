import { useEffect } from 'react';
import { X, FileText, AlertTriangle, BookOpen, ExternalLink, Tag } from 'lucide-react';

export interface CitationData {
  id: string;
  documentName: string;
  pageOrSlide: number;
  examContext?: string;
  excerpt: string;
  keyTopics: string[];
}

interface CitationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citation: CitationData | null;
}

export default function CitationDrawer({ isOpen, onClose, citation }: CitationDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !citation) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-white/80 dark:bg-black/80 z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div 
        className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-black border-l border-black dark:border-white z-50 transition-transform transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col relative overflow-hidden`}
      >
        {/* Subtle Swiss Dot Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none swiss-dot-pattern z-0" />
        <div className="flex flex-col h-full w-full relative z-10">
          {/* Header */}
        <div className="p-6 border-b border-black dark:border-white flex items-start justify-between">
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-none text-zinc-600 dark:text-zinc-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-black dark:text-white line-clamp-2">{citation.documentName}</h2>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-none text-zinc-600 dark:text-zinc-300">
                  {citation.documentName.toLowerCase().includes('slide') ? 'Slide' : 'Page'} {citation.pageOrSlide}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Exam Relevance Banner */}
          {citation.examContext && (
            <div className="p-4 rounded-none bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white flex gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1">Exam Match</h3>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{citation.examContext}</p>
              </div>
            </div>
          )}

          {/* Source Excerpt Card */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Source Excerpt
            </h3>
            <div className="p-4 rounded-none bg-white dark:bg-black border border-black dark:border-white relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-200 dark:bg-zinc-800 rounded-l-lg" />
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono pl-2">
                "{citation.excerpt}"
              </p>
            </div>
          </div>

          {/* Key Entities Detected */}
          {citation.keyTopics && citation.keyTopics.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Key Entities
              </h3>
              <div className="flex flex-wrap gap-2">
                {citation.keyTopics.map((topic, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white rounded-none">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black dark:border-white">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-white dark:hover:bg-black text-black dark:text-white text-sm font-semibold rounded-none transition-colors">
            Jump to Full Document <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
