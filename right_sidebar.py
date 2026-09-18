import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the Schedule tab button
content = content.replace(
    """<button onClick={() => setRightSidebarTab('schedule')} className={`flex-1 py-4 pr-4 uppercase tracking-widest font-mono text-[11px] font-bold transition-all duration-100 border-b-2 ${rightSidebarTab === 'schedule' ? 'text-black dark:text-white border-black dark:border-white' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-white'}`}>Schedule</button>""",
    ""
)
content = content.replace("pr-4", "pr-10") # restore files padding

# Extract the schedule block that was inside the Tasks panel
schedule_block = """                    {rightSidebarTab === 'schedule' && (
                      <div className="flex flex-col gap-6 animate-in fade-in duration-100">
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const events = examEvents[activeCourse.id] || [];
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
                          {(examEvents[activeCourse.id] || []).map((event: ExamEvent) => {
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
                          {(examEvents[activeCourse.id] || []).length === 0 && (
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
                             setChatInput(`Generate a structured 7-day spaced review plan for ${activeCourse.code}.`);
                             setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                          }} className="w-full border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity duration-100">
                            [GENERATE AI REVISION PLAN]
                          </button>
                        </div>
                      </div>
                    )}"""

content = content.replace(schedule_block, "")

# Now inject rightPanelMode logic at the top of Right Sidebar
sidebar_start = """      {/* 3. RIGHT SIDEBAR */}
      {isRightSidebarOpen && (
        <div className="w-80 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col">
          <aside className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden">
            <div className={`p-8 border-b border-black dark:border-white flex flex-col items-center justify-center ${!isTimerOpen ? 'pb-8' : ''}`}>"""

sidebar_start_new = """      {/* 3. RIGHT SIDEBAR */}
      {isRightSidebarOpen && (
        <div className="w-80 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col">
          <aside className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden">
            {rightPanelMode === 'timerAndTasks' ? (
              <>
                <div className={`p-8 border-b border-black dark:border-white flex flex-col items-center justify-center ${!isTimerOpen ? 'pb-8' : ''}`}>"""

content = content.replace(sidebar_start, sidebar_start_new)

# Now cap off the timerAndTasks block and start the schedule block
sidebar_end = """                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Select a course to view tasks and materials
                  </div>
                )
              )}
            </div>
          </aside>
        </div>
      )}"""

sidebar_end_new = """                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Select a course to view tasks and materials
                  </div>
                )
              )}
            </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-8">
""" + schedule_block.replace("                    {rightSidebarTab === 'schedule' && (", "").replace("                    )}", "") + """
              </div>
            )}
          </aside>
        </div>
      )}"""

content = content.replace(sidebar_end, sidebar_end_new)

# Need to import Calendar if not imported
if 'Calendar' not in content:
    content = content.replace("Timer,", "Timer, Calendar,")

with open('src/App.tsx', 'w') as f:
    f.write(content)

