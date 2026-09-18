import re
import sys

filename = sys.argv[1]
with open(filename, 'r') as f:
    content = f.read()

content = re.sub(r'rounded-(xl|lg|md|sm|full|2xl|3xl)', 'rounded-none', content)
content = re.sub(r'(?<!-)rounded(?!-none|-t|-b|-l|-r|-tl|-tr|-bl|-br)', 'rounded-none', content)
content = re.sub(r'bg-zinc-950/?\d*', 'bg-white', content)
content = re.sub(r'bg-zinc-900/?\d*', 'bg-zinc-100', content)
content = re.sub(r'bg-zinc-800/?\d*', 'bg-zinc-200', content)
content = re.sub(r'bg-black', 'bg-white', content)
content = re.sub(r'text-white', 'text-black', content)
content = re.sub(r'text-zinc-300', 'text-zinc-800', content)
content = re.sub(r'text-zinc-400', 'text-zinc-600', content)
content = re.sub(r'border-zinc-900/?\d*', 'border-black', content)
content = re.sub(r'border-zinc-800/?\d*', 'border-black', content)
content = re.sub(r'border-zinc-700/?\d*', 'border-black', content)

# Remove shadows
content = re.sub(r'shadow-(sm|md|lg|xl|2xl|inner|none)', '', content)

with open(filename, 'w') as f:
    f.write(content)
