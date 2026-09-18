import re

files = ['src/App.tsx', 'src/components/UploadModal.tsx', 'src/components/CitationDrawer.tsx', 'src/components/AudioPlayer.tsx']

for file in files:
    with open(file, 'r') as f:
        content = f.read()
        
    # Let's extract all classNames
    for match in re.finditer(r'className=(["\'])(.*?)\1|className=\{`(.*?)`\}', content):
        classes = match.group(2) if match.group(2) else match.group(3)
        classes_list = classes.split()
        
        for cls in classes_list:
            if cls in ['bg-white', 'bg-black', 'text-black', 'text-white', 'border-black', 'border-white', 'bg-zinc-100', 'bg-zinc-200']:
                # check if there is a dark: counterpart in the same class list
                if not any(c.startswith('dark:') for c in classes_list):
                    print(f"Missing dark mode in {file}: {cls} in '{classes}'")
            elif '/' in cls and cls.startswith('bg-white'):
                if not any(c.startswith('dark:bg-black') for c in classes_list):
                    print(f"Missing dark mode for transparent {file}: {cls} in '{classes}'")
