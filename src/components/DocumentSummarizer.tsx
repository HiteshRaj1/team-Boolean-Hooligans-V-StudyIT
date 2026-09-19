import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, Brain, AlertCircle, Loader2, Copy, Check, X, BookOpen } from 'lucide-react';

export interface DocumentSummary {
  filename: string;
  summary: string;
  timestamp: string;
}

interface DocumentSummarizerProps {
  onGenerateFlashcards: (summaryText: string) => void;
  courseCode?: string;
  courseId?: string;
  onDocumentUploaded?: (file: { id: string; name: string; size: string; content?: string }) => void;
}

export default function DocumentSummarizer({ onGenerateFlashcards, courseCode, courseId, onDocumentUploaded }: DocumentSummarizerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<DocumentSummary | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectFile = (file: File) => {
    setError(null);
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'txt', 'md'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a .pdf, .txt, or .md file.');
      setSelectedFile(null);
      return;
    }
    if (file.size === 0) {
      setError('The selected file is empty (0 bytes).');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndSummarize = async () => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('course_id', courseId || 'c1');

    try {
      const res = await fetch('http://localhost:8000/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Server returned ${res.status}`);
      }

      if (!data.summary) {
        throw new Error('No summary returned from server.');
      }

      setSummaryData({
        filename: data.filename || selectedFile.name,
        summary: data.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      onDocumentUploaded?.({
        id: data.id || `doc-${Date.now()}`,
        name: data.filename || selectedFile.name,
        size: formatSize(selectedFile.size),
        content: data.summary || ''
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during summarization.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleCopy = () => {
    if (!summaryData) return;
    navigator.clipboard.writeText(summaryData.summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderFormattedSummary = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    let currentBulletList: JSX.Element[] = [];

    const flushList = () => {
      if (currentBulletList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2.5 my-3">
            {[...currentBulletList]}
          </ul>
        );
        currentBulletList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Format bold markdown within text: **text**
      const formatInline = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-bold text-black dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      };

      // Header 3: ### Header
      if (trimmed.startsWith('###')) {
        flushList();
        elements.push(
          <h3
            key={`h3-${idx}`}
            className="font-serif text-lg font-bold text-black dark:text-white mt-6 mb-2 border-b border-black dark:border-white pb-1 tracking-tight flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-black dark:bg-white inline-block" />
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
        return;
      }

      // Header 2: ## Header
      if (trimmed.startsWith('##')) {
        flushList();
        elements.push(
          <h2
            key={`h2-${idx}`}
            className="font-serif text-xl font-bold text-black dark:text-white mt-8 mb-3 tracking-tight border-b-2 border-black dark:border-white pb-1"
          >
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
        return;
      }

      // Bullet points: - item or * item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.replace(/^[-*]\s+/, '');
        currentBulletList.push(
          <li key={`li-${idx}`} className="flex items-start gap-3 text-sm font-serif leading-relaxed text-black dark:text-white">
            <div className="w-1.5 h-1.5 mt-2 border border-black dark:border-white bg-black dark:bg-white shrink-0" />
            <span className="flex-1">{formatInline(itemContent)}</span>
          </li>
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${idx}`} className="text-sm font-serif leading-relaxed text-black dark:text-white mb-3">
          {formatInline(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-100">
        
        {/* Header Title */}
        <div className="border-b-2 border-black dark:border-white pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-black dark:text-white" />
              <h2 className="font-serif text-2xl font-bold text-black dark:text-white tracking-tight">
                Document Summarizer
              </h2>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">
              Upload course notes, slides, or transcripts (.pdf, .txt, .md) • {courseCode || 'All Courses'}
            </p>
          </div>
          {summaryData && (
            <button
              onClick={() => {
                setSummaryData(null);
                setSelectedFile(null);
                setError(null);
              }}
              className="px-3 py-1.5 border border-black dark:border-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              Upload Another
            </button>
          )}
        </div>

        {/* Upload & Drop Zone */}
        {!summaryData && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 text-center select-none ${
                isDragging
                  ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900'
                  : 'border-black dark:border-white hover:bg-zinc-50 dark:hover:bg-zinc-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <UploadCloud className="w-10 h-10 mb-4 text-black dark:text-white stroke-1" />
              <p className="font-serif font-bold text-base text-black dark:text-white mb-1">
                {selectedFile ? selectedFile.name : 'Drop study material here, or browse files'}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Supports .PDF, .TXT, and .MD files
              </p>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div className="border-2 border-black dark:border-white p-4 flex items-center justify-between bg-white dark:bg-black">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-black dark:border-white flex items-center justify-center font-mono font-bold text-xs uppercase bg-zinc-100 dark:bg-zinc-900">
                    {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-black dark:text-white truncate max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      {formatSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="p-1 text-zinc-500 hover:text-black dark:hover:text-white disabled:opacity-30"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleUploadAndSummarize}
                    disabled={isLoading}
                    className="px-6 py-2.5 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <span>Summarize Document</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Progress / Loading Indicator */}
            {isLoading && (
              <div className="border-2 border-black dark:border-white p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent animate-spin" />
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                    Processing Document with Ollama
                  </h4>
                  <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Extracting text and synthesizing high-yield overview, key takeaways, and definitions...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="border-2 border-rose-600 bg-rose-50 dark:bg-rose-950/20 p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-600">
                    Upload / Summarization Error
                  </h4>
                  <p className="font-serif text-sm text-black dark:text-white mt-1">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rendered Summary Card */}
        {summaryData && (
          <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,1)] space-y-6">
            
            {/* Card Header & Quick Actions */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-black dark:text-white">
                    {summaryData.filename}
                  </h3>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    AI Summary • Generated at {summaryData.timestamp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-white font-mono text-[10px] uppercase tracking-widest font-bold text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
                  title="Copy Summary"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Main Requested Quick-Action Button */}
                <button
                  onClick={() => onGenerateFlashcards(summaryData.summary)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
                  title="Generate Flashcards from this Summary"
                >
                  <Brain className="w-4 h-4" />
                  <span>Generate Flashcards from this Summary</span>
                </button>
              </div>
            </div>

            {/* Formatted Summary Content */}
            <div className="prose dark:prose-invert max-w-none">
              {renderFormattedSummary(summaryData.summary)}
            </div>

            {/* Bottom Call to Action */}
            <div className="border-t border-black dark:border-white pt-6 flex items-center justify-between flex-wrap gap-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Ready to test your knowledge on this document?
              </span>
              <button
                onClick={() => onGenerateFlashcards(summaryData.summary)}
                className="flex items-center gap-2 px-5 py-2.5 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
              >
                <Brain className="w-4 h-4" />
                <span>Generate Flashcards from this Summary</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
