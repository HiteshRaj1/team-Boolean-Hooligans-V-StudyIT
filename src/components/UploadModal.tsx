import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { X, UploadCloud, Trash2 } from 'lucide-react';

export type DocType = "Lecture Slide" | "Past Paper" | "Syllabus";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: DocType;
  uploadDate: string;
  url: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
}

export default function UploadModal({ isOpen, onClose, courseCode, onFilesUploaded }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<DocType>("Lecture Slide");
  const [stagedFiles, setStagedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files)
      .filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'))
      .map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatSize(file.size),
        type: selectedType,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }));
    if (newFiles.length > 0) setStagedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };
  
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (stagedFiles.length === 0) return;
    onFilesUploaded(stagedFiles);
    setStagedFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/95 dark:bg-black/95">
      <div className="w-full max-w-lg p-[1px] rounded-none bg-zinc-200 dark:bg-zinc-800 ">
        <div className="bg-white dark:bg-black border-none rounded-none flex flex-col overflow-hidden w-full h-full">
          <div className="flex items-center justify-between p-6 border-b border-black dark:border-white">
          <div>
            <h2 className="text-sm font-medium text-black dark:text-white">Upload Files</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{courseCode}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 flex-1">
          <div className="mb-8">
            <div className="flex gap-4 border-b border-black dark:border-white">
              {(["Lecture Slide", "Past Paper", "Syllabus"] as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`pb-2 text-xs uppercase tracking-widest ${selectedType === type ? 'text-black dark:text-white border-b border-white dark:border-black' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? 'border-white dark:border-black text-black dark:text-white' : 'border-black dark:border-white text-zinc-600 dark:text-zinc-300 hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <input type="file" accept=".pdf,application/pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFileInput} />
            <UploadCloud className="w-6 h-6 mb-4" />
            <p className="text-xs uppercase tracking-widest">Select or drop PDFs</p>
          </div>

          {stagedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-4">Staged</h3>
              <div className="space-y-4">
                {stagedFiles.map(file => (
                  <div key={file.id} className="flex items-start justify-between group">
                    <div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate w-64">{file.name}</p>
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{file.size} · {file.type}</div>
                    </div>
                    <button onClick={() => {
                      URL.revokeObjectURL(file.url);
                      setStagedFiles(prev => prev.filter(f => f.id !== file.id));
                    }} className="text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black dark:border-white flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 uppercase tracking-widest">Cancel</button>
          <button onClick={handleSubmit} disabled={stagedFiles.length === 0} className="flex-1 py-3 border border-black dark:border-white text-xs text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:hover:bg-white dark:hover:bg-black uppercase tracking-widest transition-colors">
            Upload
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
