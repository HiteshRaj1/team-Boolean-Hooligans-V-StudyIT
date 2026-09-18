import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add rightPanelMode state
target_state = "const [rightSidebarTab, setRightSidebarTab] = useState<'checklist' | 'materials' | 'schedule'>('checklist');"
new_state = "const [rightPanelMode, setRightPanelMode] = useState<'timerAndTasks' | 'schedule'>('timerAndTasks');\n  const [rightSidebarTab, setRightSidebarTab] = useState<'checklist' | 'materials'>('checklist');"
content = content.replace(target_state, new_state)

# 2. Modify left sidebar button and add Schedule button
left_btn_target = """            <div>
              <button 
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="w-full text-left group focus:outline-none"
              >
                <div className={`flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-100 p-3 border border-black dark:border-white ${isRightSidebarOpen ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>"""

left_btn_replacement = """            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (isRightSidebarOpen && rightPanelMode === 'timerAndTasks') setIsRightSidebarOpen(false);
                  else { setIsRightSidebarOpen(true); setRightPanelMode('timerAndTasks'); }
                }}
                className="w-full text-left group focus:outline-none"
              >
                <div className={`flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest transition-colors duration-100 p-3 border border-black dark:border-white ${isRightSidebarOpen && rightPanelMode === 'timerAndTasks' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>"""

content = content.replace(left_btn_target, left_btn_replacement)

# Also need to add the Schedule button
schedule_btn_inject_target = """                    <Timer className="w-4 h-4" />
                    Timer & Tasks
                  </span>
                  {!isRightSidebarOpen && (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" className="stroke-zinc-800" strokeWidth="3" fill="transparent" />
                        <circle cx="12" cy="12" r="10" style={{ stroke: strokeColor }} className="transition-all duration-1000 ease-linear" strokeWidth="3" strokeDasharray={62.83} strokeDashoffset={miniStrokeOffset} strokeLinecap="round" fill="transparent" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>"""

schedule_btn = """              <button 
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
                </div>
              </button>"""

content = content.replace(schedule_btn_inject_target, schedule_btn_inject_target + "\n" + schedule_btn)

with open('src/App.tsx', 'w') as f:
    f.write(content)

