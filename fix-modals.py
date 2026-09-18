import re

files = ['src/App.tsx', 'src/components/UploadModal.tsx']

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # fix modal overlay backgrounds
    content = content.replace('bg-white dark:bg-black/95', 'bg-white/95 dark:bg-black/95')
    content = content.replace('bg-white dark:bg-black/80', 'bg-white/95 dark:bg-black/95')

    # fix shadows in App.tsx
    content = content.replace('shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-white dark:bg-black', 'shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] bg-white dark:bg-black')
    
    with open(file, 'w') as f:
        f.write(content)
