import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Settings, 
  Check, Plus, Trash2, X, ChevronDown,
  Timer, Calendar, MessageSquare, Target, Brain, BookOpen, FileSpreadsheet
} from 'lucide-react';
import UploadModal, { UploadedFile } from './components/UploadModal';
import CitationDrawer, { CitationData } from './components/CitationDrawer';
import AudioPlayer from './components/AudioPlayer';
import FlashcardDeck, { Flashcard } from './components/FlashcardDeck';

const MOCK_FLASHCARDS: Record<string, Flashcard[]> = {
  'c1': [
    {
      id: 'f1',
      category: 'Concept',
      question: "What are the four necessary conditions for deadlock?",
      answer: "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
      keyPoints: [
        "Mutual Exclusion: At least one resource must be non-shareable.",
        "Hold and Wait: A process holding at least one resource is waiting to acquire additional resources held by other processes.",
        "No Preemption: A resource can be released only voluntarily by the process holding it.",
        "Circular Wait: There must exist a set of waiting processes such that P0 is waiting for P1, P1 for P2... and Pn for P0."
      ],
      sourceCitation: "OS_Mod3_Deadlocks.pdf • Slide 18"
    },
    {
      id: 'f2',
      category: 'Concept',
      question: "Mutex vs Semaphore: Key Difference?",
      answer: "Mutex is an ownership-based locking mechanism, while Semaphore is a signaling mechanism.",
      keyPoints: [
        "Mutex can only be unlocked by the thread that locked it.",
        "Semaphore can be signaled by any thread (Binary or Counting)."
      ],
      sourceCitation: "OS_Mod3_Sync.pdf • Page 4"
    },
    {
      id: 'f3',
      category: 'Definition',
      question: "What is Thrashing?",
      answer: "A state where the system spends more time paging (swapping pages in and out of memory) than executing actual processes.",
      keyPoints: [
        "Occurs when the working set of active processes exceeds available physical memory.",
        "Leads to severe performance degradation and low CPU utilization."
      ],
      sourceCitation: "OS_Mod4_Memory.pdf • Slide 32"
    },
    {
      id: 'f4',
      category: 'Formula',
      question: "Effective Access Time (EAT) Formula with TLB?",
      answer: "EAT = (Hit Ratio × TLB Hit Time) + (Miss Ratio × TLB Miss Time)",
      keyPoints: [
        "TLB Hit Time = TLB search time + Memory access time",
        "TLB Miss Time = TLB search time + 2 × Memory access time (one for page table, one for actual data)"
      ],
      sourceCitation: "OS_Mod4_Memory.pdf • Slide 25"
    }
  ]
};



// --- Types ---
type TimerMode = 'work' | 'break';
type StudyMode = 'deep' | 'exam';

interface TimerSettings {
  work: number;
  break: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
}

interface Task {
  id: string;
  courseId: string;
  title: string;
  completed: boolean;
  pomodorosCompleted: number;
}

interface ExamEvent {
  id: string;
  title: string;
  date: string;
  type: 'CAT' | 'FAT' | 'LAB' | 'REVIEW';
  daysLeft: number;
  status: 'PENDING' | 'DONE';
}


interface ExamQuestion {
  id: string;
  courseId: string;
  tag: string;
  marks: number;
  difficulty: string;
  question: string;
  sourceText: string;
  sourceCitationData?: CitationData;
  pointDistribution: string[];
  examinerChecklist: string[];
  isReviewed?: boolean;
}

interface CourseExams {
  quiz: string | null;
  cat1: string | null;
  cat2: string | null;
  fat: string | null;
}

// --- Main Component ---
export default function App() {
  const [courses, setCourses] = useState<Course[]>([
    { id: 'c1', code: 'CS101', title: 'Intro to Computer Science' }
  ]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>('c1');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);
  const [courseFiles, setCourseFiles] = useState<Record<string, UploadedFile[]>>({});

  const [studyMode, setStudyMode] = useState<StudyMode>('deep');
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'c1': [
      {
        id: 'm1',
        role: 'assistant',
        content: 'Welcome to CS101. How can I help you study today?',
        citations: []
      }
    ]
  });
  const [chatInput, setChatInput] = useState('');


  const chatEndRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<TimerSettings>({
    work: 25,
    break: 5,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  });
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(settings.work * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', courseId: 'c1', title: 'Read Chapter 1', completed: false, pomodorosCompleted: 0 }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [rightPanelMode, setRightPanelMode] = useState<'timerAndTasks' | 'schedule'>('timerAndTasks');
  const [rightSidebarTab, setRightSidebarTab] = useState<'checklist' | 'materials'>('checklist');
  const [isTimerOpen, setIsTimerOpen] = useState(true);
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const [centerTab, setCenterTab] = useState<'chat' | 'practice' | 'flashcards'>('chat');
  const [questionFilter, setQuestionFilter] = useState<'All' | '5 Marks' | '10 Marks'>('All');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [isCramMode, setIsCramMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('vstudy_theme');
    return saved ? saved === 'dark' : false;
  });
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vstudy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vstudy_theme', 'light');
    }
  }, [isDarkMode]);

  const [examMetaStore, setExamMetaStore] = useState<Record<string, CourseExams>>(() => {
    const saved = localStorage.getItem('vstudy_exam_meta');
    return saved ? JSON.parse(saved) : {};
  });
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [editExams, setEditExams] = useState<CourseExams>({ quiz: null, cat1: null, cat2: null, fat: null });

  const [predictedQuestions, setPredictedQuestions] = useState<ExamQuestion[]>([
    {
      id: 'q1',
      courseId: 'c1',
      tag: 'FAT Recurring',
      marks: 10,
      difficulty: 'High Yield',
      question: "Explain Banker's Algorithm with state matrices and derive the safety sequence.",
      sourceText: "Lecture 4 - OS Intro (Slide 15)",
      sourceCitationData: {
        id: 'cit-3', documentName: 'Lecture 4 - OS Intro', pageOrSlide: 15, excerpt: "Banker's Algorithm is used for deadlock avoidance...", keyTopics: ['Deadlock', 'Bankers Algorithm']
      },
      pointDistribution: [
        "State definition & safety formula: 2M",
        "Correct execution trace: 5M",
        "Final safety sequence & deadlock check: 3M"
      ],
      examinerChecklist: [
        "Failing to define Need matrix correctly",
        "Missing final safety check conclusion",
        "Calculation errors in Available vector"
      ]
    },
    {
      id: 'q2',
      courseId: 'c1',
      tag: 'CAT-1 High Probability',
      marks: 5,
      difficulty: 'Medium',
      question: "Describe the differences between preemptive and non-preemptive scheduling.",
      sourceText: "Lecture 5 - CPU Scheduling (p.12)",
      sourceCitationData: {
        id: 'cit-4', documentName: 'Lecture 5 - CPU Scheduling', pageOrSlide: 12, excerpt: "Scheduling algorithms can be preemptive or non-preemptive...", keyTopics: ['CPU Scheduling', 'Preemptive vs Non-preemptive']
      },
      pointDistribution: [
        "Definition of preemptive scheduling: 2M",
        "Definition of non-preemptive scheduling: 2M",
        "Key difference/example: 1M"
      ],
      examinerChecklist: [
        "Not mentioning context switching overhead",
        "Failing to give clear examples (e.g. RR vs FCFS)"
      ],
      isReviewed: false
    }
  ]);

  useEffect(() => {
    localStorage.setItem('vstudy_exam_meta', JSON.stringify(examMetaStore));
  }, [examMetaStore]);

  const activeCourseExams = examMetaStore[activeCourseId || ''] || {};

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nowTime = now.getTime();
  
  // Robust date parser for both legacy ISO strings and basic YYYY-MM-DD
  const parseExamDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const upcomingExams = [
    { name: 'Quiz', date: parseExamDate(activeCourseExams.quiz as string | undefined) },
    { name: 'CAT 1', date: parseExamDate(activeCourseExams.cat1 as string | undefined) },
    { name: 'CAT 2', date: parseExamDate(activeCourseExams.cat2 as string | undefined) },
    { name: 'FAT', date: parseExamDate(activeCourseExams.fat as string | undefined) }
  ]
  .filter(e => e.date)
  .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const derivedExamEvents: ExamEvent[] = upcomingExams.map((exam, i) => ({
    id: 'e' + i,
    title: exam.name.toUpperCase(),
    date: (exam.date as Date).toISOString(),
    type: exam.name.includes('CAT') ? 'CAT' : exam.name.includes('FAT') ? 'FAT' : 'REVIEW',
    daysLeft: Math.ceil(((exam.date as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    status: 'PENDING'
  }));


  const openExamEdit = () => {
    setEditExams({
      quiz: activeCourseExams.quiz || null,
      cat1: activeCourseExams.cat1 || null,
      cat2: activeCourseExams.cat2 || null,
      fat: activeCourseExams.fat || null
    });
    setIsEditingExam(true);
  };
  
  const saveExamMeta = () => {
    if (!activeCourseId) return;
    setExamMetaStore(prev => ({
      ...prev,
      [activeCourseId]: editExams
    }));
    setIsEditingExam(false);
  };

  const activeQuestions = predictedQuestions.filter(q => q.courseId === activeCourseId);

  const toggleQuestionReviewed = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPredictedQuestions(prev => prev.map(q => q.id === id ? { ...q, isReviewed: !q.isReviewed } : q));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeCourseId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode, completedPomodoros, settings, activeCourseId]);

  useEffect(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const modeLabel = timerMode === 'work' ? 'Focus' : 'Break';
    document.title = `${formatted} - ${modeLabel} | V-StudyIT`;
  }, [timeLeft, timerMode]);

  const changeTimerMode = (newMode: TimerMode, newSettings = settings) => {
    setTimerMode(newMode);
    setIsRunning(false);
    setTimeLeft(newSettings[newMode] * 60);
  };

  const handleTimerComplete = () => {
    if (timerMode === 'work') {
      const nextCount = completedPomodoros + 1;
      setCompletedPomodoros(nextCount);
      changeTimerMode('break');
      if (settings.autoStartBreaks) setIsRunning(true);
    } else {
      changeTimerMode('work');
      if (settings.autoStartPomodoros) setIsRunning(true);
    }
  };

  const handleSaveSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    setTimeLeft(newSettings[timerMode] * 60);
    setIsRunning(false);
  };

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const totalSeconds = settings[timerMode] * 60;
  const progressPercentage = ((totalSeconds - Math.max(0, timeLeft)) / totalSeconds) * 100;
  
  const strokeOffset = timerMode === 'work' 
    ? 212.06 - (212.06 * (progressPercentage / 100))
    : 212.06 * (progressPercentage / 100); 

  const miniCircum = 2 * Math.PI * 10;
  const miniStrokeOffset = timerMode === 'work'
    ? miniCircum - (miniCircum * (progressPercentage / 100))
    : miniCircum * (progressPercentage / 100);

  const strokeColor = timerMode === 'work' ? '#1DB954' : '#B22B27';

  const handleFilesUploaded = (files: UploadedFile[]) => {
    if (!activeCourseId) return;
    setCourseFiles(prev => ({
      ...prev,
      [activeCourseId]: [...(prev[activeCourseId] || []), ...files]
    }));
  };

  const removeUploadedFile = (courseId: string, fileId: string) => {
    setCourseFiles(prev => {
      const courseFiles = prev[courseId] || [];
      const fileToRemove = courseFiles.find(f => f.id === fileId);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return {
        ...prev,
        [courseId]: courseFiles.filter(f => f.id !== fileId)
      };
    });
  };

  const handleAddCourse = (e: FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;
    const newCourse = { id: Date.now().toString(), code: newCourseCode.trim(), title: newCourseTitle.trim() };
    setCourses([...courses, newCourse]);
    setActiveCourseId(newCourse.id);
    setIsAddingCourse(false);
    setNewCourseCode('');
    setNewCourseTitle('');
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeCourseId) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: chatInput.trim() };
    setMessages(prev => {
      const courseMsgs = prev[activeCourseId] || [];
      return { ...prev, [activeCourseId]: [...courseMsgs, userMsg] };
    });
    setChatInput('');
    setTimeout(() => {
      const asstMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Acknowledged query regarding ${activeCourseId} for ${studyMode} mode.`,
        citations: [
          { 
            id: 'cit-1', documentName: 'Lecture 4 - OS Intro', pageOrSlide: 12, 
            excerpt: 'The operating system serves as a resource allocator and control program.', 
            keyTopics: ['OS Basics', 'Resource Allocator']
          },
          { 
            id: 'cit-2', documentName: 'Midterm 2023', pageOrSlide: 4, 
            examContext: 'Matched Fall 2023 Q2(b) (10 Marks)',
            excerpt: 'Explain the dual-mode operation of an operating system.', 
            keyTopics: ['Dual-mode', 'Protection']
          }
        ]
      };
      setMessages(prev => {
        const courseMsgs = prev[activeCourseId] || [];
        return { ...prev, [activeCourseId]: [...courseMsgs, asstMsg] };
      });
    }, 1000);
  };

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeCourseId) return;
    const newTask: Task = {
      id: Date.now().toString(), courseId: activeCourseId, title: newTaskTitle.trim(),
      completed: false, pomodorosCompleted: 0
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeCourseTasks = tasks.filter(t => t.courseId === activeCourseId);
  const activeMessages = activeCourseId ? (messages[activeCourseId] || []) : [];

  const activeFilesCount = courseFiles[activeCourseId || '']?.length || 0;
  const tasksCompleted = activeCourseTasks.filter(t => t.completed).length;
  const tasksRatio = activeCourseTasks.length > 0 ? tasksCompleted / activeCourseTasks.length : 0;
  const questionsReviewed = activeQuestions.filter(q => q.isReviewed).length;
  const questionsRatio = activeQuestions.length > 0 ? questionsReviewed / activeQuestions.length : 0;
  const filesRatio = Math.min(activeFilesCount / 5, 1);
  const readinessScore = Math.round((tasksRatio * 50) + (questionsRatio * 30) + (filesRatio * 20));

  let readinessBadge = { label: 'Critical Revision Required', color: 'text-black dark:text-white bg-white dark:bg-black border-black dark:border-white font-bold' };
  if (readinessScore >= 75) {
    readinessBadge = { label: 'FAT 9+ CGPA Ready', color: 'text-white dark:text-black bg-black dark:bg-white border-black dark:border-white font-bold' };
  } else if (readinessScore >= 40) {
    readinessBadge = { label: 'On Track for Passing Marks', color: 'text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white font-bold' };
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans overflow-hidden p-4 gap-4">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-72 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col">
        <aside className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden">
          <div className="p-6 border-b border-black dark:border-white flex items-center justify-between">
            <h1 className="font-serif text-2xl font-bold text-black dark:text-white tracking-tight">V-StudyIT<span className="font-sans text-xs ml-2 tracking-widest uppercase font-normal text-zinc-500 dark:text-zinc-400">/ OS</span></h1>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"
              title="Toggle Theme"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-black dark:bg-white overflow-hidden flex">
                <div className="w-1/2 h-full bg-black dark:bg-white"></div>
                <div className="w-1/2 h-full bg-white dark:bg-black"></div>
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative mb-4">
              <button 
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className="w-full text-left group focus:outline-none"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:hover:text-zinc-200 uppercase tracking-widest transition-colors bg-white dark:bg-black hover:bg-zinc-100 dark:hover:bg-zinc-900 p-3 rounded-none border border-black dark:border-white">
                  <span>Active Course</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCourseDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isCourseDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-black border border-black dark:border-white rounded-none  z-50 overflow-hidden flex flex-col">
                  <div className="max-h-64 overflow-y-auto">
                    {courses.map(course => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setActiveCourseId(course.id);
                          setIsCourseDropdownOpen(false);
                        }}
                        className={`w-full text-left flex items-center justify-between px-4 py-3 border-b border-black dark:border-white last:border-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${activeCourseId === course.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                      >
                        <div className="flex flex-col overflow-hidden mr-2">
                          <span className={`text-sm font-medium ${activeCourseId === course.id ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>{course.code}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{course.title}</span>
                        </div>
                        {activeCourseId === course.id && <Check className="w-3 h-3 text-black dark:text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900">
                    {isAddingCourse ? (
                      <form onSubmit={e => { handleAddCourse(e); setIsCourseDropdownOpen(false); }}>
                        <input autoFocus type="text" placeholder="Course Code" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white text-sm py-1.5 mb-2 focus:outline-none focus:border-zinc-500 text-black dark:text-white placeholder-zinc-700 dark:placeholder-zinc-300" />
                        <input type="text" placeholder="Course Title" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} className="w-full bg-transparent border-b border-black dark:border-white text-sm py-1.5 mb-4 focus:outline-none focus:border-zinc-500 text-black dark:text-white placeholder-zinc-700 dark:placeholder-zinc-300" />
                        <div className="flex gap-4 text-xs">
                          <button type="button" onClick={() => setIsAddingCourse(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">Cancel</button>
                          <button type="submit" className="text-black dark:text-white">Save Course</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setIsAddingCourse(true)} className="w-full text-left text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-2 py-1"><Plus className="w-3 h-3" /> Add New Course</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (isRightSidebarOpen && rightPanelMode === 'timerAndTasks') setIsRightSidebarOpen(false);
                  else { setIsRightSidebarOpen(true); setRightPanelMode('timerAndTasks'); }
                }}
                className="w-full text-left group focus:outline-none"
              >
                <div className={`flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-100 p-3 border border-black dark:border-white ${isRightSidebarOpen && rightPanelMode === 'timerAndTasks' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>
                  <span className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Timer & Tasks
                  </span>
                  {!(isRightSidebarOpen && rightPanelMode === 'timerAndTasks') ? (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" className="stroke-zinc-800" strokeWidth="3" fill="transparent" />
                        <circle cx="12" cy="12" r="10" style={{ stroke: strokeColor }} className="transition-all duration-1000 ease-linear" strokeWidth="3" strokeDasharray={62.83} strokeDashoffset={miniStrokeOffset} strokeLinecap="round" fill="transparent" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 shrink-0"></div>
                  )}
                </div>
              </button>
              <button 
                onClick={() => {
                  if (isRightSidebarOpen && rightPanelMode === 'schedule') setIsRightSidebarOpen(false);
                  else { setIsRightSidebarOpen(true); setRightPanelMode('schedule'); }
                }}
                className="w-full text-left group focus:outline-none"
              >
                <div className={`flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-100 p-3 border border-black dark:border-white ${isRightSidebarOpen && rightPanelMode === 'schedule' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exam Schedule
                  </span>
                  <div className="w-5 h-5 shrink-0"></div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-black dark:border-white">
            <AudioPlayer />
          </div>
        </aside>
      </div>

      {/* 2. CENTER STAGE */}
      <div className="flex-1 border border-black dark:border-white bg-white dark:bg-black flex flex-col min-w-0">
        <main className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden">
          {!activeCourse ? (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Select a course</div>
          ) : (
            <>
              <header className={`px-8 py-4 border-b border-black dark:border-white flex flex-col gap-4 shrink-0 transition-all ${isCramMode ? '   bg-rose-950/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif text-lg font-bold text-black dark:text-white tracking-tight">{activeCourse.code}</h2>
                    <span className="text-zinc-700 dark:text-zinc-300">/</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{activeCourse.title}</span>
                    {(courseFiles[activeCourse.id]?.length || 0) > 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">({courseFiles[activeCourse.id].length} files)</span>}
                  </div>
                </div>

                {!(isRightSidebarOpen && rightPanelMode === 'schedule') && (
                <div className="bg-white dark:bg-black border border-black dark:border-white p-4 flex items-center justify-between gap-6 relative">
                  <div className="flex-1 flex flex-col gap-2 min-w-[250px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold font-mono uppercase tracking-widest">Upcoming Exams</span>
                      <button onClick={openExamEdit} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><Settings className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {upcomingExams.length === 0 ? (
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">No Exams Set</span>
                      ) : (
                        upcomingExams.map(exam => {
                          const diffMs = exam.date!.getTime() - nowTime;
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          let text = '';
                          let colorClass = '';
                          if (diffMs > 0) {
                            text = diffDays > 0 ? `${diffDays}d left` : 'Today';
                            colorClass = diffDays < 2 ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white';
                          } else if (diffDays === 0 || diffDays === -1) {
                            text = 'Today';
                            colorClass = 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white';
                          } else {
                            text = 'Passed';
                            colorClass = 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
                          }
                          return (
                            <div key={exam.name} className={`font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-1 border flex items-center gap-2 ${colorClass}`}>
                              <span>{exam.name}</span>
                              <span className="opacity-50">•</span>
                              <span>{text}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex-1 max-w-md flex flex-col gap-2 border-l border-black dark:border-white pl-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold font-mono uppercase tracking-widest">Readiness Index</span>
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${readinessBadge.color}`}>{readinessBadge.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 border border-black dark:border-white bg-white dark:bg-black relative">
                        <div className="absolute top-0 left-0 h-full bg-black dark:bg-white transition-all duration-100" style={{ width: `${readinessScore}%` }} />
                      </div>
                      <span className="font-serif text-lg font-bold text-black dark:text-white tracking-tight w-10 text-right">{readinessScore}%</span>
                    </div>
                  </div>
                </div>
                )}
              </header>

              <div className="flex items-center gap-6 px-8 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <button 
                  onClick={() => setCenterTab('chat')}
                  className={`flex items-center gap-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 border-b-4 ${centerTab === 'chat' ? 'border-black dark:border-white text-black dark:text-white font-bold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                >
                  <MessageSquare className="w-4 h-4" /> AI Copilot & Notes
                </button>
                <button 
                  onClick={() => setCenterTab('practice')}
                  className={`flex items-center gap-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 border-b-4 ${centerTab === 'practice' ? 'border-black dark:border-white text-black dark:text-white font-bold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                >
                  <Target className="w-4 h-4" /> Exam Question Predictor
                </button>
                <button 
                  onClick={() => setCenterTab('flashcards')}
                  className={`flex items-center gap-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 border-b-4 ${centerTab === 'flashcards' ? 'border-black dark:border-white text-black dark:text-white font-bold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                >
                  <Brain className="w-4 h-4" /> Flashcards
                </button>
              </div>

              {centerTab === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {activeMessages.length === 0 ? (
                      <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">No messages yet.</div>
                    ) : (
                      activeMessages.map(msg => (
                        <div key={msg.id} className="flex gap-6 max-w-2xl border-b border-zinc-200 dark:border-zinc-800 pb-8 last:border-0">
                          <div className="w-6 h-6 mt-1 border-2 border-black dark:border-white flex items-center justify-center shrink-0 font-bold font-mono text-[10px] text-black dark:text-white uppercase">{msg.role === 'user' ? 'U' : 'A'}</div>
                          <div className="space-y-4 w-full">
                            <div className={`text-base leading-relaxed ${msg.role === 'user' ? 'font-serif font-bold text-black dark:text-white' : 'font-serif text-black dark:text-white'}`}>{msg.content}</div>
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs mt-4">
                                {msg.citations.map((c, i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => setActiveCitation(c)}
                                    className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest font-bold border-2 transition-colors duration-100 ${c.examContext ? 'bg-white dark:bg-black border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white dark:hover:text-black' : 'bg-white dark:bg-black border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                                  >
                                    {c.documentName} {c.pageOrSlide && `(p.${c.pageOrSlide})`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-8 border-t border-black dark:border-white shrink-0 bg-white dark:bg-black">
                    <div className="flex items-center justify-between mb-4 max-w-2xl font-mono text-[10px] uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsCramMode(!isCramMode)} 
                          className={`flex items-center gap-2 px-2 py-1 border border-black dark:border-white transition-colors duration-100 ${isCramMode ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                        >
                          Cram Filter {isCramMode ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-2 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">Upload</button>
                      </div>
                      <div className="flex items-center">
                        <button onClick={() => setStudyMode('deep')} className={`w-20 shrink-0 text-center px-2 py-1 border border-black dark:border-white transition-colors duration-100 ${studyMode === 'deep' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Deep</button>
                        <button onClick={() => setStudyMode('exam')} className={`w-20 shrink-0 text-center px-2 py-1 border border-black dark:border-white -ml-[1px] transition-colors duration-100 ${studyMode === 'exam' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Exam</button>
                      </div>
                    </div>
                    <form onSubmit={handleSendMessage} className="relative max-w-2xl">
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="w-full bg-transparent border-b-2 border-black dark:border-white text-base font-serif text-black dark:text-white placeholder:italic placeholder-zinc-500 dark:placeholder-zinc-400 py-3 focus:outline-none focus:border-b-4 transition-all duration-100" />
                    </form>
                  </div>
                </>
              )}
              {centerTab === 'practice' && (
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] font-bold uppercase tracking-widest">{activeCourse.code}</span>
                      <span className="text-[10px] font-mono text-black dark:text-white uppercase tracking-widest font-bold px-3 py-1 border border-black dark:border-white">
                        {predictedQuestions.length} Predicted High-Yield Questions
                      </span>
                    </div>
                    <div className="flex items-center font-mono text-[10px] font-bold uppercase tracking-widest gap-0">
                      {(['All', '5 Marks', '10 Marks'] as const).map((filter, i) => (
                        <button 
                          key={filter}
                          onClick={() => setQuestionFilter(filter)}
                          className={`w-24 shrink-0 text-center px-3 py-1.5 border border-black dark:border-white transition-colors duration-100 ${i !== 0 ? '-ml-[1px]' : ''} ${questionFilter === filter ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {predictedQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <FileSpreadsheet className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400 font-serif text-sm max-w-sm">Upload course materials or lecture slides to generate predicted exam questions.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {predictedQuestions
                        .filter(q => questionFilter === 'All' || (questionFilter === '5 Marks' && q.marks === 5) || (questionFilter === '10 Marks' && q.marks === 10))
                        .filter(q => !isCramMode || q.tag.includes('FAT Recurring') || q.marks >= 10 || q.difficulty === 'High Yield')
                        .map(q => (
                        <div key={q.id} className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => toggleQuestionReviewed(e, q.id)} className={`w-5 h-5 flex items-center justify-center shrink-0 border-2 transition-colors duration-100 ${q.isReviewed ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' : 'bg-white dark:bg-black border-black dark:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 py-1 border border-black dark:border-white text-black dark:text-white text-[10px] font-mono font-bold uppercase tracking-widest">{q.tag}</span>
                              <span className={`px-2.5 py-1 border border-black dark:border-white text-[10px] font-mono font-bold uppercase tracking-widest ${q.marks >= 10 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white'}`}>{q.marks} Marks</span>
                              <span className="text-xs text-black dark:text-white">•</span>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-black dark:text-white">{q.difficulty}</span>
                            </div>
                            {q.sourceCitationData && (
                              <button 
                                onClick={() => setActiveCitation(q.sourceCitationData!)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-white text-[10px] font-mono font-bold tracking-widest uppercase text-black dark:text-white hover:text-white dark:hover:text-black hover:bg-black dark:hover:bg-white transition-colors duration-100"
                              >
                                <BookOpen className="w-3 h-3" />
                                {q.sourceText}
                              </button>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-serif font-bold text-black dark:text-white leading-relaxed mt-2">{q.question}</h3>
                          
                          <div className="mt-4 border-t border-black dark:border-white pt-4">
                            <button 
                              onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                              className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors focus:outline-none"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedQuestionId === q.id ? 'rotate-180' : ''}`} />
                              Reveal Ideal Answer & Marking Scheme
                            </button>
                            
                            {expandedQuestionId === q.id && (
                              <div className="mt-8 space-y-8 animate-in fade-in duration-100">
                                <div>
                                  <h4 className="text-[10px] font-mono font-bold text-black dark:text-white uppercase tracking-widest mb-4">Point Distribution</h4>
                                  <ul className="space-y-3">
                                    {q.pointDistribution.map((pt, i) => (
                                      <li key={i} className="flex gap-3 text-sm font-serif text-black dark:text-white items-start">
                                        <div className="w-1.5 h-1.5 mt-2 border border-black dark:border-white bg-black dark:bg-white shrink-0" />
                                        <span className="leading-relaxed">{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                  <button 
                                    onClick={() => {
                                      setCenterTab('chat');
                                      setChatInput(`Let's practice answering: ${q.question}`);
                                      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-mono font-bold text-[10px] tracking-widest uppercase hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Practice This in Copilot
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {centerTab === 'flashcards' && (
                <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-8">
                  <FlashcardDeck deckName={`${activeCourse.code} High-Yield Flashcards`} cards={MOCK_FLASHCARDS[activeCourse.id] || []} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. RIGHT SIDEBAR */}
      {isRightSidebarOpen && (
        <div className="w-80 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col">
          <aside className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden">
            {rightPanelMode === 'timerAndTasks' ? (
              <>
                <div className={`p-8 border-b border-black dark:border-white flex flex-col items-center justify-center ${!isTimerOpen ? 'pb-8' : ''}`}>
              <div className={`w-full flex justify-between items-center ${isTimerOpen ? 'mb-8' : ''}`}>
                <button 
                  onClick={() => setIsTimerOpen(!isTimerOpen)} 
                  className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors focus:outline-none"
                >
                  <span className="text-xs uppercase tracking-widest">Timer</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isTimerOpen ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setShowSettings(true)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"><Settings className="w-3 h-3" /></button>
              </div>
              
              {isTimerOpen && (
                <>
                  <div className="flex bg-white dark:bg-black w-full overflow-hidden text-xs font-mono uppercase font-bold tracking-widest border border-black dark:border-white mb-8">
                    {(['work', 'break'] as TimerMode[]).map((m, i) => (
                      <button 
                        key={m} 
                        onClick={() => changeTimerMode(m)} 
                        className={`flex-1 py-2 transition-colors duration-100 ${i !== 0 ? 'border-l border-black dark:border-white' : ''} ${timerMode === m ? 'text-white dark:text-black bg-black dark:bg-white' : 'text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                      >
                        {m === 'work' ? 'Focus' : 'Break'}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col items-center justify-center mb-8 gap-4 w-full">
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          className="stroke-zinc-200 dark:stroke-zinc-800" 
                          strokeWidth="2" 
                          strokeDasharray="212.06 282.74" 
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          className="transition-all duration-1000 ease-linear" style={{ stroke: strokeColor }} 
                          strokeWidth="4" 
                          strokeDasharray="212.06 282.74" 
                          strokeDashoffset={strokeOffset} 
                          strokeLinecap="butt" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center mt-2">
                        <span className="font-mono text-5xl font-bold tracking-tight text-black dark:text-white">{formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between border border-black dark:border-white p-0.5 gap-0.5">
                    <button onClick={() => { setTimeLeft(settings[timerMode] * 60); setIsRunning(false); }} className="p-2 bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 flex-1 flex justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 flex-1 flex justify-center">
                      {isRunning ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                    </button>
                    <button onClick={handleTimerComplete} className="p-2 bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100 flex-1 flex justify-center">
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-6 text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-500 dark:text-zinc-400">Sessions: {completedPomodoros}</div>
                </>
              )}
            </div>

            <div className={`flex-1 flex flex-col min-h-0 ${!isTasksOpen ? 'flex-none' : ''}`}>
              <div className="flex border-b border-black dark:border-white text-xs items-center relative">
                <button 
                  onClick={() => setIsTasksOpen(!isTasksOpen)}
                  className="absolute left-4 z-10 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white focus:outline-none transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isTasksOpen ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setRightSidebarTab('checklist')} className={`flex-1 py-4 pl-10 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'checklist' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Tasks</button>
                <button onClick={() => setRightSidebarTab('materials')} className={`flex-1 py-4 pr-10 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'materials' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Files</button>
                
              </div>
              
              {isTasksOpen && (
                activeCourse ? (
                  <div className="flex-1 overflow-y-auto p-6">
                    {rightSidebarTab === 'checklist' && (
                      <div>
                        <form onSubmit={handleAddTask} className="mb-6">
                          <input type="text" placeholder="Add task..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full font-mono bg-transparent border-b-2 border-black dark:border-white text-sm text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-b-4 transition-all duration-100" />
                        </form>
                        <div className="space-y-0">
                          {(() => {
                            const filteredTasks = isCramMode 
                              ? activeCourseTasks.filter(t => t.title.toLowerCase().includes('important') || t.title.toLowerCase().includes('fat') || t.title.toLowerCase().includes('cat')) 
                              : activeCourseTasks;
                            if (filteredTasks.length === 0) return <div className="text-[11px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">No tasks{isCramMode && ' in Cram Mode'}</div>;
                            return filteredTasks.map(task => (
                              <div key={task.id} onClick={() => toggleTask(task.id)} className="flex items-start gap-4 cursor-pointer group border-b border-zinc-200 dark:border-zinc-800 py-4 last:border-b-0">
                                <div className={`w-4 h-4 mt-0.5 rounded-none border-2 flex items-center justify-center shrink-0 transition-colors duration-100 ${task.completed ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' : 'border-black dark:border-white bg-white dark:bg-black group-hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
                                  {task.completed && <Check className="w-3 h-3" />}
                                </div>
                                <span className={`text-sm font-serif ${task.completed ? 'text-zinc-400 line-through' : 'text-black dark:text-white font-medium group-hover:text-zinc-600 dark:hover:text-zinc-300'}`}>{task.title}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                    {rightSidebarTab === 'materials' && (
                      <div>
                        {(courseFiles[activeCourse.id] || []).length === 0 ? (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">No files uploaded.</div>
                        ) : (
                          <div className="space-y-4">
                            {(courseFiles[activeCourse.id] || []).map(file => (
                              <div key={file.id} className="flex justify-between items-start group border-b border-zinc-200 dark:border-zinc-800 py-4 last:border-b-0">
                                <div>
                                  <a href={file.url} target="_blank" rel="noreferrer" title="View Document" className="text-sm font-serif font-bold text-black dark:text-white hover:underline truncate w-48 block transition-colors">
                                    {file.name}
                                  </a>
                                  <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mt-1">{file.size} · {file.type}</div>
                                </div>
                                <button onClick={() => removeUploadedFile(activeCourse.id, file.id)} className="text-zinc-500 dark:text-zinc-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-6 text-[11px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">Select course</div>
                )
              )}
            </div>
            </>
            ) : (
              <div className="flex-1 overflow-y-auto p-8">
                      <div className="flex flex-col gap-6 animate-in fade-in duration-100">
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const events = derivedExamEvents;
                            const nextEvent = events.length > 0 ? events.reduce((prev: ExamEvent, curr: ExamEvent) => {
                              const prevDiff = Math.abs(new Date(prev.date).getTime() - new Date().getTime());
                              const currDiff = Math.abs(new Date(curr.date).getTime() - new Date().getTime());
                              return currDiff < prevDiff ? curr : prev;
                            }) : null;
                            const diffDays = nextEvent ? Math.ceil(Math.abs(new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            
                            return (
                              <>
                                {nextEvent && (
                                  <div className="font-mono text-[10px] uppercase tracking-widest font-bold border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black p-2 text-center">
                                    [COUNTDOWN: {diffDays} DAYS TO {nextEvent.title.toUpperCase()}]
                                  </div>
                                )}
                                <div className="font-mono text-[10px] uppercase tracking-widest font-bold border-2 border-black dark:border-white p-2 text-center text-black dark:text-white">
                                  [TARGET: 9.0+ GPA]
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="space-y-4 mt-2">
                          {derivedExamEvents.map((event: ExamEvent) => {
                             const diffTime = Math.abs(new Date(event.date).getTime() - new Date().getTime());
                             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                             const isUrgent = diffDays <= 7;
                             return (
                               <div key={event.id} className={`border-2 p-4 flex flex-col gap-3 transition-colors duration-100 ${isUrgent ? 'border-rose-600' : 'border-black dark:border-white'}`}>
                                 <div className="flex items-center justify-between">
                                   <span className={`font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-1 ${isUrgent ? 'bg-rose-600 text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}>[{event.type}]</span>
                                   <span className="font-mono text-xs font-bold">{diffDays} DAYS LEFT</span>
                                 </div>
                                 <div className="font-serif font-bold text-lg">{event.title}</div>
                                 <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                               </div>
                             );
                          })}
                          {derivedExamEvents.length === 0 && (
                             <div className="text-[11px] font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400 text-center py-8">
                               No schedule added.
                             </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-4">
                          <button className="w-full border-2 border-black dark:border-white py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
                            [+ ADD MILESTONE]
                          </button>
                          <button onClick={() => {
                             setCenterTab('chat');
                             setChatInput(`Generate a structured 7-day spaced review plan for ${activeCourse?.code || ''}.`);
                             setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                          }} className="w-full border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity duration-100">
                            [GENERATE AI REVISION PLAN]
                          </button>
                        </div>
                      </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-white/95 dark:bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm border-2 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] bg-white dark:bg-black">
            <div className="p-8 w-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-2xl font-bold text-black dark:text-white tracking-tight">Timer Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-2">Focus (Min)</label>
                    <input type="number" value={settings.work} onChange={e => setSettings({...settings, work: Number(e.target.value)})} className="w-full bg-transparent border-b-2 border-black dark:border-white text-lg font-serif font-bold text-black dark:text-white py-2 focus:outline-none focus:border-black dark:border-white text-center transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-2">Break (Min)</label>
                    <input type="number" value={settings.break} onChange={e => setSettings({...settings, break: Number(e.target.value)})} className="w-full bg-transparent border-b-2 border-black dark:border-white text-lg font-serif font-bold text-black dark:text-white py-2 focus:outline-none focus:border-black dark:border-white text-center transition-colors" />
                  </div>
                </div>
              </div>
              <button onClick={() => handleSaveSettings(settings)} className="w-full mt-8 py-3 border-2 border-black dark:border-white font-mono text-xs uppercase tracking-widest font-bold bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {isEditingExam && (
        <div className="fixed inset-0 bg-white/95 dark:bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm border-2 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] bg-white dark:bg-black animate-in fade-in zoom-in-95 duration-100">
            <div className="p-8 w-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-2xl font-bold text-black dark:text-white tracking-tight">Edit Exams</h3>
                <button onClick={() => setIsEditingExam(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-5">
                {(['quiz', 'cat1', 'cat2', 'fat'] as const).map(key => (
                  <div key={key}>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block mb-1">{key === 'cat1' ? 'CAT 1' : key === 'cat2' ? 'CAT 2' : key}</label>
                    <input 
                      type="date" 
                      value={editExams[key] ? editExams[key]!.split('T')[0] : ''} 
                      onChange={e => setEditExams({ ...editExams, [key]: e.target.value || null })} 
                      className="w-full bg-transparent border-b-2 border-black dark:border-white text-sm font-mono text-black dark:text-white py-2 focus:outline-none focus:border-black dark:border-white transition-colors" 
                    />
                  </div>
                ))}
              </div>
              <button onClick={saveExamMeta} className="w-full mt-8 py-3 border-2 border-black dark:border-white font-mono text-xs uppercase tracking-widest font-bold bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">Save Details</button>
            </div>
          </div>
        </div>
      )}

      <CitationDrawer 
        isOpen={activeCitation !== null}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />

      {activeCourse && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          courseCode={activeCourse.code}
          onFilesUploaded={handleFilesUploaded}
        />
      )}
    </div>
  );
}
