import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add ExamEvent interface
interface_code = """
interface ExamEvent {
  id: string;
  title: string;
  date: string;
  type: 'CAT' | 'FAT' | 'LAB' | 'REVIEW';
  daysLeft: number;
  status: 'PENDING' | 'DONE';
}
"""
content = re.sub(r'(interface Task {[\s\S]*?})', r'\1\n' + interface_code, content)

# 2. Add mock data state
state_code = """
  const [examEvents, setExamEvents] = useState<Record<string, ExamEvent[]>>({
    'c1': [
      { id: 'e1', title: 'CAT-2 OS', date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], type: 'CAT', daysLeft: 5, status: 'PENDING' },
      { id: 'e2', title: 'Lab FAT', date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0], type: 'LAB', daysLeft: 12, status: 'PENDING' },
      { id: 'e3', title: 'Theory FAT', date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], type: 'FAT', daysLeft: 20, status: 'PENDING' }
    ]
  });
"""
# find where to insert state
content = re.sub(r'(const \[tasks, setTasks\] = .*?;)', r'\1\n' + state_code, content)

# 3. Update rightSidebarTab state
content = content.replace("useState<'checklist' | 'materials'>('checklist')", "useState<'checklist' | 'materials' | 'schedule'>('checklist')")

# 4. Add the button to the tabs
tabs_target = """<button onClick={() => setRightSidebarTab('materials')} className={`flex-1 py-4 pr-10 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'materials' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Files</button>"""
new_tab = """<button onClick={() => setRightSidebarTab('schedule')} className={`flex-1 py-4 pr-4 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'schedule' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Schedule</button>"""
content = content.replace("pr-10", "pr-4") # reduce padding on Files to fit 3 tabs
content = content.replace(tabs_target.replace("pr-10", "pr-4"), tabs_target.replace("pr-10", "pr-4") + "\n                " + new_tab)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("done")
