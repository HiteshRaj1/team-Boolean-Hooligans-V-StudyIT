import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Exam Schedule
                  </span>
                  <div className="w-5 h-5 shrink-0"></div>"""

replacement = """                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </span>
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {(() => {
                      const count = activeCourseTasks.filter(t => !t.completed).length;
                      if (count === 0) return null;
                      const isActive = isRightSidebarOpen && rightPanelMode === 'schedule';
                      return (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold leading-none transition-colors duration-100 ${isActive ? 'bg-white dark:bg-black text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black group-hover:bg-white dark:group-hover:bg-black group-hover:text-black dark:group-hover:text-white'}`}>
                          {count}
                        </span>
                      );
                    })()}
                  </div>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
