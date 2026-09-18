import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. State for Schedule Tab
target_state = "const [rightSidebarTab, setRightSidebarTab] = useState<'checklist' | 'materials'>('checklist');"
new_state = "const [rightSidebarTab, setRightSidebarTab] = useState<'materials'>('materials');\n  const [scheduleTab, setScheduleTab] = useState<'schedule' | 'tasks'>('schedule');"
content = content.replace(target_state, new_state)

# 2. Update Left Sidebar Labels
content = content.replace(">Timer & Tasks<", ">Timer & Files<")
content = content.replace(">Exam Schedule<", ">Schedule & Tasks<")

# 3. Extract Tasks Block
tasks_target = """                    {rightSidebarTab === 'checklist' && (
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
                    )}"""

content = content.replace(tasks_target, "")

# 4. Remove Checklist tab button from Timer panel
tab_target = """                <button onClick={() => setRightSidebarTab('checklist')} className={`flex-1 py-4 pl-10 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'checklist' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Tasks</button>
                <button onClick={() => setRightSidebarTab('materials')} className={`flex-1 py-4 pr-10 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'materials' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Files</button>"""

tab_replacement = """                <button onClick={() => setRightSidebarTab('materials')} className={`flex-1 py-4 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 text-black dark:text-white border-black dark:border-white`}>Files</button>"""
content = content.replace(tab_target, tab_replacement)


# 5. Inject Tasks block and bottom tabs into Schedule panel
schedule_target = """              <div className="flex-1 overflow-y-auto p-8">
                      <div className="flex flex-col gap-6 animate-in fade-in duration-100">"""

schedule_end_target = """                          </button>
                        </div>
                      </div>
              </div>"""

tasks_injected = tasks_target.replace("rightSidebarTab === 'checklist'", "true")

new_schedule_panel = """              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                  {scheduleTab === 'schedule' && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-100">"""

new_schedule_panel_end = """                          </button>
                        </div>
                    </div>
                  )}
                  {scheduleTab === 'tasks' && (
                    <div className="animate-in fade-in duration-100">
""" + tasks_injected + """
                    </div>
                  )}
                </div>
                <div className="flex border-t border-black dark:border-white text-xs items-center shrink-0 mt-auto bg-white dark:bg-black">
                  <button onClick={() => setScheduleTab('schedule')} className={`flex-1 py-4 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-t-2 ${scheduleTab === 'schedule' ? 'text-black dark:text-white border-black dark:border-white bg-zinc-100 dark:bg-zinc-900' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>Schedule</button>
                  <button onClick={() => setScheduleTab('tasks')} className={`flex-1 py-4 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-t-2 ${scheduleTab === 'tasks' ? 'text-black dark:text-white border-black dark:border-white bg-zinc-100 dark:bg-zinc-900' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>Tasks</button>
                </div>
              </div>"""

content = content.replace(schedule_target, new_schedule_panel)
content = content.replace(schedule_end_target, new_schedule_panel_end)

with open('src/App.tsx', 'w') as f:
    f.write(content)

