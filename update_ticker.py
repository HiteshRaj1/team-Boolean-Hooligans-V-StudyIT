import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

ticker_target = """                          <div className="font-mono text-[10px] uppercase tracking-widest font-bold border border-black dark:border-white p-2 text-center text-black dark:text-white">
                            [TARGET: 9.0+ GPA]
                          </div>"""

ticker_replacement = """                          {(() => {
                            const events = examEvents[activeCourse.id] || [];
                            const nextEvent = events.length > 0 ? events.reduce((prev, curr) => {
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
                          })()}"""

content = content.replace(ticker_target, ticker_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
