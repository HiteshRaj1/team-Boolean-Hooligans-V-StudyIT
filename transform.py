import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Radii
content = re.sub(r'rounded-(xl|lg|md|sm|full|2xl|3xl)', 'rounded-none', content)
content = re.sub(r'(?<!-)rounded(?!-none|-t|-b|-l|-r|-tl|-tr|-bl|-br)', 'rounded-none', content)
content = re.sub(r'rounded-t-[a-z]+|rounded-b-[a-z]+', 'rounded-none', content)

# 2. Colors - Backgrounds
content = re.sub(r'bg-zinc-950/?\d*', 'bg-zinc-100', content)
content = re.sub(r'bg-zinc-900/?\d*', 'bg-zinc-100', content)
content = re.sub(r'bg-zinc-800/?\d*', 'bg-zinc-200', content)
content = re.sub(r'bg-black', 'bg-white', content)
# Invert specific elements later if needed

# 3. Colors - Text
content = re.sub(r'text-white', 'text-black', content)
content = re.sub(r'text-zinc-300', 'text-zinc-800', content)
content = re.sub(r'text-zinc-400', 'text-zinc-600', content)
content = re.sub(r'text-zinc-500', 'text-zinc-500', content)
content = re.sub(r'text-zinc-600', 'text-zinc-500', content)

# 4. Colors - Borders
content = re.sub(r'border-zinc-900/?\d*', 'border-black', content)
content = re.sub(r'border-zinc-800/?\d*', 'border-black', content)
content = re.sub(r'border-zinc-700/?\d*', 'border-black', content)
content = re.sub(r'border-zinc-600/?\d*', 'border-black', content)

# 5. Remove shadows and glows
content = re.sub(r'shadow-(sm|md|lg|xl|2xl|inner|none)', '', content)
content = re.sub(r'shadow-\[.*?\]', '', content)
content = re.sub(r'ring-\d+', '', content)
content = re.sub(r'ring-inset', '', content)
content = re.sub(r'ring-[a-z]+-\d+/?\d*', '', content)

# 6. Typography
# Add font-serif to headers
content = content.replace('text-lg font-medium text-black', 'font-serif text-2xl font-bold text-black uppercase tracking-tight')
content = content.replace('text-sm font-medium text-black', 'font-serif text-lg font-bold text-black tracking-tight')
content = content.replace('text-xs font-medium text-black', 'font-mono text-xs font-bold text-black uppercase tracking-widest')

with open('src/App.tsx', 'w') as f:
    f.write(content)
