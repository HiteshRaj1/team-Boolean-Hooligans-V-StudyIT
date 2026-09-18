import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import FlashcardDeck, { Flashcard } from './components/FlashcardDeck';\n"
content = re.sub(r'(import .* from \'lucide-react\';)', r'\1\n' + import_stmt, content)

# Also need Brain icon from lucide-react if not imported
if 'Brain' not in content:
    content = content.replace('Timer, MessageSquare, Target', 'Timer, MessageSquare, Target, Brain')

# Add mock data outside component
mock_data = """
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
"""
content = re.sub(r'(const MOCK_PREDICTED_QUESTIONS)', mock_data + r'\1', content)

# Update state type
content = content.replace("useState<'chat' | 'practice'>('chat')", "useState<'chat' | 'practice' | 'flashcards'>('chat')")

# Add Tab
old_tab_practice = """                <button 
                  onClick={() => setCenterTab('practice')}
                  className={`flex items-center gap-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 border-b-4 ${centerTab === 'practice' ? 'border-black dark:border-white text-black dark:text-white font-bold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                >
                  <Target className="w-4 h-4" /> Exam Question Predictor
                </button>"""
new_tab_flashcards = """
                <button 
                  onClick={() => setCenterTab('flashcards')}
                  className={`flex items-center gap-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 border-b-4 ${centerTab === 'flashcards' ? 'border-black dark:border-white text-black dark:text-white font-bold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                >
                  <Brain className="w-4 h-4" /> Flashcards
                </button>"""
content = content.replace(old_tab_practice, old_tab_practice + new_tab_flashcards)

# Add Render Block
old_practice_render = """              )}
            </>
          )}
        </main>
      </div>"""
new_render_flashcards = """              )}
              {centerTab === 'flashcards' && (
                <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-8">
                  <FlashcardDeck deckName={`${activeCourse.code} High-Yield Flashcards`} cards={MOCK_FLASHCARDS[activeCourse.id] || []} />
                </div>
              )}
            </>
          )}
        </main>
      </div>"""

# Wait, replace the end of practice render accurately
# Let's use regex to find the end of practice render safely.
# Since it might be hard to match EXACTLY without risking a wrong substitution, let's just do it manually.

with open('update_app_step1.ts', 'w') as f:
    f.write(content)

print("Step 1 done")
