import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# 1. Main App Background
code = code.replace(
    'className="flex h-screen w-full bg-white dark:bg-black text-black dark:text-white font-sans overflow-hidden p-4 gap-4"',
    'className="flex h-screen w-full bg-zinc-100 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden p-6 gap-6"'
)

# 2. Main Panels (Left, Center, Right)
# Left Sidebar
code = code.replace(
    'className="w-72 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col"',
    'className="w-72 shrink-0 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl flex flex-col overflow-hidden"'
)
# Center Stage
code = code.replace(
    'className="flex-1 border border-black dark:border-white bg-white dark:bg-black flex flex-col min-w-0"',
    'className="flex-1 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl flex flex-col min-w-0 overflow-hidden"'
)
# Right Sidebar
code = code.replace(
    'className="w-80 shrink-0 border border-black dark:border-white bg-white dark:bg-black flex flex-col"',
    'className="w-80 shrink-0 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl flex flex-col overflow-hidden"'
)

# 3. Chat Input area
code = code.replace(
    'className="flex items-center gap-3 border-2 border-black dark:border-white p-2 bg-white dark:bg-black"',
    'className="flex items-center gap-3 border border-zinc-200 dark:border-zinc-800/50 p-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full shadow-sm"'
)

# 4. Action Buttons (Pill shaped)
code = code.replace(
    'border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black',
    'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-md hover:shadow-lg'
)

code = code.replace(
    'border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white',
    'border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 rounded-full shadow-sm hover:shadow-md'
)

# 5. Inner Panels & Headers (removing harsh borders, adding subtle ones)
code = code.replace('border-b border-black dark:border-white', 'border-b border-zinc-200/50 dark:border-zinc-800/50')
code = code.replace('border-t border-black dark:border-white', 'border-t border-zinc-200/50 dark:border-zinc-800/50')
code = code.replace('border-l border-black dark:border-white', 'border-l border-zinc-200/50 dark:border-zinc-800/50')
code = code.replace('border-r border-black dark:border-white', 'border-r border-zinc-200/50 dark:border-zinc-800/50')
code = code.replace('border border-black dark:border-white', 'border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl')

# 6. Global Background overrides inside components
code = code.replace('bg-white dark:bg-black', 'bg-transparent')
# Re-fix the specific ones that need backgrounds
code = code.replace('className="flex-1 flex flex-col bg-transparent overflow-hidden"', 'className="flex-1 flex flex-col bg-transparent overflow-hidden"')

# 7. Soften text colors
code = code.replace('text-black dark:text-white', 'text-zinc-800 dark:text-zinc-100')

with open('src/App.tsx', 'w') as f:
    f.write(code)
