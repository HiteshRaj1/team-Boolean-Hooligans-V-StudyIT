import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  .sort((a, b) => a.date!.getTime() - b.date!.getTime());"""

derived = """
  const derivedExamEvents: ExamEvent[] = upcomingExams.map((exam, i) => ({
    id: 'e' + i,
    title: exam.name.toUpperCase(),
    date: (exam.date as Date).toISOString(),
    type: exam.name.includes('CAT') ? 'CAT' : exam.name.includes('FAT') ? 'FAT' : 'REVIEW',
    daysLeft: Math.ceil(((exam.date as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    status: 'PENDING'
  }));
"""

content = content.replace(target, target + "\n" + derived)

with open('src/App.tsx', 'w') as f:
    f.write(content)
