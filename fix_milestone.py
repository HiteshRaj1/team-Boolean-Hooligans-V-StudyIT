import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                          <button className="w-full border-2 border-black dark:border-white py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
                            [+ ADD MILESTONE]
                          </button>"""

replacement = """                          <button onClick={openExamEdit} className="w-full border-2 border-black dark:border-white py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
                            [+ SET MILESTONE DATES]
                          </button>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
