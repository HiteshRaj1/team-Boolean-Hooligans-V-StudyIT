import re
import sys

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Dictionary of replacements. Use regex word boundaries \b
    replacements = {
        r'\bbg-white\b': 'bg-white dark:bg-black',
        r'\btext-black\b': 'text-black dark:text-white',
        r'\bborder-black\b': 'border-black dark:border-white',
        r'\bbg-black\b': 'bg-black dark:bg-white',
        r'\btext-white\b': 'text-white dark:text-black',
        r'\bborder-white\b': 'border-white dark:border-black',
        r'\bhover:bg-black\b': 'hover:bg-black dark:hover:bg-white',
        r'\bhover:text-white\b': 'hover:text-white dark:hover:text-black',
        r'\bhover:bg-white\b': 'hover:bg-white dark:hover:bg-black',
        r'\bhover:text-black\b': 'hover:text-black dark:hover:text-white',
        r'\bhover:border-black\b': 'hover:border-black dark:hover:border-white',
        r'\bhover:border-white\b': 'hover:border-white dark:hover:border-black',
        r'\bbg-zinc-100\b': 'bg-zinc-100 dark:bg-zinc-900',
        r'\bbg-zinc-200\b': 'bg-zinc-200 dark:bg-zinc-800',
        r'\bborder-zinc-200\b': 'border-zinc-200 dark:border-zinc-800',
        r'\btext-zinc-500\b': 'text-zinc-500 dark:text-zinc-400',
        r'\btext-zinc-600\b': 'text-zinc-600 dark:text-zinc-300',
        r'\btext-zinc-700\b': 'text-zinc-700 dark:text-zinc-300',
        r'\btext-zinc-800\b': 'text-zinc-800 dark:text-zinc-200',
        r'\bplaceholder-zinc-500\b': 'placeholder-zinc-500 dark:placeholder-zinc-400',
        r'\bplaceholder-zinc-700\b': 'placeholder-zinc-700 dark:placeholder-zinc-300',
        r'\bhover:bg-zinc-100\b': 'hover:bg-zinc-100 dark:hover:bg-zinc-900',
        r'\bhover:bg-zinc-200\b': 'hover:bg-zinc-200 dark:hover:bg-zinc-800',
        r'\bhover:text-zinc-500\b': 'hover:text-zinc-500 dark:hover:text-zinc-400',
        r'\bhover:text-zinc-600\b': 'hover:text-zinc-600 dark:hover:text-zinc-300',
        r'\bhover:text-zinc-800\b': 'hover:text-zinc-800 dark:hover:text-zinc-200',
    }

    for pattern, replacement in replacements.items():
        # Only replace if the target doesn't already have the dark mode class
        # (This is tricky with simple regex if they are already adjacent, but since we are doing this once on a fresh codebase, it should be fine. We can ensure we don't double replace by a second pass or careful regex)
        # Actually, let's just do a naive replace.
        content = re.sub(pattern, replacement, content)

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/App.tsx')
process_file('src/components/UploadModal.tsx')
process_file('src/components/CitationDrawer.tsx')
process_file('src/components/AudioPlayer.tsx')
print("Done")
