import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = '                <div className="bg-white dark:bg-black border border-black dark:border-white p-4 flex items-center justify-between gap-6 relative">'
replacement = '                {!(isRightSidebarOpen && rightPanelMode === \'schedule\') && (\n                <div className="bg-white dark:bg-black border border-black dark:border-white p-4 flex items-center justify-between gap-6 relative">'

content = content.replace(target, replacement)

# Now we need to close the conditional.
# The widget ends before the </header>
target_end = """                      </div>
                    </div>
                  </div>
                </div>
              </header>"""

replacement_end = """                      </div>
                    </div>
                  </div>
                </div>
                )}
              </header>"""

content = content.replace(target_end, replacement_end)

with open('src/App.tsx', 'w') as f:
    f.write(content)
