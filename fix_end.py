import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                      <span className="font-serif text-lg font-bold text-black dark:text-white tracking-tight w-10 text-right">{readinessScore}%</span>
                    </div>
                  </div>
                </div>
              </header>"""

replacement = """                      <span className="font-serif text-lg font-bold text-black dark:text-white tracking-tight w-10 text-right">{readinessScore}%</span>
                    </div>
                  </div>
                </div>
                )}
              </header>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
