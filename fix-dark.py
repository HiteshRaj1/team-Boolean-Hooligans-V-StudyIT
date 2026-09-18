import re
import sys

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # The issue was:
    # 1. bg-white -> bg-white dark:bg-black
    # 2. bg-black -> bg-black dark:bg-white
    # Result: bg-white dark:bg-black dark:bg-white
    # Fix: replace "dark:bg-black dark:bg-white" with "dark:bg-black"

    fixes = [
        (r'dark:bg-black dark:bg-white', 'dark:bg-black'),
        (r'dark:text-white dark:text-black', 'dark:text-white'),
        (r'dark:border-white dark:border-black', 'dark:border-white'),
        
        (r'dark:bg-white dark:bg-black', 'dark:bg-white'),
        (r'dark:text-black dark:text-white', 'dark:text-black'),
        (r'dark:border-black dark:border-white', 'dark:border-black'),
        
        (r'dark:hover:bg-white dark:hover:bg-black', 'dark:hover:bg-white'),
        (r'dark:hover:text-black dark:hover:text-white', 'dark:hover:text-black'),
        (r'dark:hover:border-white dark:hover:border-black', 'dark:hover:border-white'),

        (r'dark:hover:bg-black dark:hover:bg-white', 'dark:hover:bg-black'),
        (r'dark:hover:text-white dark:hover:text-black', 'dark:hover:text-white'),
        (r'dark:hover:border-black dark:hover:border-white', 'dark:hover:border-black'),

        (r'dark:text-zinc-400 dark:text-zinc-300', 'dark:text-zinc-400'),
        (r'dark:text-zinc-300 dark:text-zinc-200', 'dark:text-zinc-300'),
        (r'dark:bg-zinc-900 dark:bg-zinc-800', 'dark:bg-zinc-900'),
        (r'dark:hover:bg-zinc-900 dark:hover:bg-zinc-800', 'dark:hover:bg-zinc-900'),
        (r'dark:hover:text-zinc-400 dark:hover:text-zinc-300', 'dark:hover:text-zinc-400'),
        (r'dark:hover:text-zinc-300 dark:hover:text-zinc-200', 'dark:hover:text-zinc-300'),
        
        # also some cases like text-zinc-500 -> text-zinc-500 dark:text-zinc-400
        # Wait, if text-zinc-500 was mapped to text-zinc-500 dark:text-zinc-400, no other rule touched text-zinc-400
        # Let's check text-zinc-400 rule: didn't have one!
    ]

    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content)

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/App.tsx')
process_file('src/components/UploadModal.tsx')
process_file('src/components/CitationDrawer.tsx')
process_file('src/components/AudioPlayer.tsx')
print("Fixed")
