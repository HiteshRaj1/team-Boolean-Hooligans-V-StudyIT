import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

state_code = """
  const [examEvents, setExamEvents] = useState<Record<string, ExamEvent[]>>({
    'c1': [
      { id: 'e1', title: 'CAT-2 OS', date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], type: 'CAT', daysLeft: 5, status: 'PENDING' },
      { id: 'e2', title: 'Lab FAT', date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0], type: 'LAB', daysLeft: 12, status: 'PENDING' },
      { id: 'e3', title: 'Theory FAT', date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], type: 'FAT', daysLeft: 20, status: 'PENDING' }
    ]
  });
"""

target = "const [chatInput, setChatInput] = useState('');"
content = content.replace(target, target + "\n" + state_code)

with open('src/App.tsx', 'w') as f:
    f.write(content)

