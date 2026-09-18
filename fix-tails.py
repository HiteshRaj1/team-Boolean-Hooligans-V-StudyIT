import re

files = ['src/App.tsx', 'src/components/UploadModal.tsx', 'src/components/CitationDrawer.tsx', 'src/components/AudioPlayer.tsx']

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # The issue is things like "dark:hover:text-black dark:text-black"
    # We want to remove the trailing " dark:text-black" if it was erroneously appended
    
    # We can just do string replacements for the known tails
    tails = [
        ('dark:hover:bg-white dark:bg-white', 'dark:hover:bg-white'),
        ('dark:hover:text-black dark:text-black', 'dark:hover:text-black'),
        ('dark:hover:border-white dark:border-white', 'dark:hover:border-white'),
        ('dark:hover:bg-black dark:bg-black', 'dark:hover:bg-black'),
        ('dark:hover:text-white dark:text-white', 'dark:hover:text-white'),
        ('dark:hover:border-black dark:border-black', 'dark:hover:border-black'),
        
        ('dark:hover:bg-zinc-900 dark:bg-zinc-900', 'dark:hover:bg-zinc-900'),
        ('dark:hover:bg-zinc-800 dark:bg-zinc-800', 'dark:hover:bg-zinc-800'),
        ('dark:hover:text-zinc-400 dark:text-zinc-400', 'dark:hover:text-zinc-400'),
        ('dark:hover:text-zinc-300 dark:text-zinc-300', 'dark:hover:text-zinc-300'),
        ('dark:hover:text-zinc-200 dark:text-zinc-200', 'dark:hover:text-zinc-200'),
    ]

    for bad, good in tails:
        content = content.replace(bad, good)
        
    with open(file, 'w') as f:
        f.write(content)

print("Tails fixed")
