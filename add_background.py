import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

target = 'className="flex h-screen w-full bg-zinc-100 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden p-6 gap-6"'

replacement = '''className="flex h-screen w-full bg-zinc-100 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden p-6 gap-6 relative"
    >
      {/* Abstract Ambient Studio Background to make Glassmorphism visible */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-zinc-300/40 to-transparent dark:from-zinc-800/30 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-zinc-400/20 to-transparent dark:from-white/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-zinc-300/30 to-transparent dark:from-zinc-700/20 blur-[90px]" />
      </div>
      
      {/* Foreground Container to keep z-index above background */}
      <div className="flex h-full w-full gap-6 relative z-10"'''

code = code.replace(target, replacement)

# Fix the closing div
code = code.replace(
    '    </div>\n  );\n}',
    '      </div>\n    </div>\n  );\n}'
)

with open('src/App.tsx', 'w') as f:
    f.write(code)
