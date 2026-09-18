import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

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
content = re.sub(r'(import .* from \'./components/FlashcardDeck\';)', r'\1\n' + mock_data, content)
content = content.replace("import FlashcardDeck, { Flashcard } from", "import FlashcardDeck from")
content = content.replace("import FlashcardDeck, { Flashcard }", "import FlashcardDeck, { Flashcard }") # wait I just removed it
with open('src/App.tsx', 'w') as f:
    f.write(content)
