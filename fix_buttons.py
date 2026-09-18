import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix Timer button
timer_target = """                  {!isRightSidebarOpen && (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" className="stroke-zinc-800" strokeWidth="3" fill="transparent" />
                        <circle cx="12" cy="12" r="10" style={{ stroke: strokeColor }} className="transition-all duration-1000 ease-linear" strokeWidth="3" strokeDasharray={62.83} strokeDashoffset={miniStrokeOffset} strokeLinecap="round" fill="transparent" />
                      </svg>
                    </div>
                  )}"""

timer_replacement = """                  {!(isRightSidebarOpen && rightPanelMode === 'timerAndTasks') ? (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" className="stroke-zinc-800" strokeWidth="3" fill="transparent" />
                        <circle cx="12" cy="12" r="10" style={{ stroke: strokeColor }} className="transition-all duration-1000 ease-linear" strokeWidth="3" strokeDasharray={62.83} strokeDashoffset={miniStrokeOffset} strokeLinecap="round" fill="transparent" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 shrink-0"></div>
                  )}"""

content = content.replace(timer_target, timer_replacement)

# Fix Schedule button
schedule_target = """                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exam Schedule
                  </span>
                </div>
              </button>"""

schedule_replacement = """                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exam Schedule
                  </span>
                  <div className="w-5 h-5 shrink-0"></div>
                </div>
              </button>"""

content = content.replace(schedule_target, schedule_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
