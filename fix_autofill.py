import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = "setTimeout(() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent), 50);"
replacement = "setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);"

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

