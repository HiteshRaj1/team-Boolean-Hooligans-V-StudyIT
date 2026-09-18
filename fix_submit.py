import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = "setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50);"
replacement = "setTimeout(() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent), 50);"

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

