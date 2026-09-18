import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  const upcomingExams = [
    { name: 'Quiz', date: parseExamDate(activeCourseExams.quiz as string | undefined) },
    { name: 'CAT 1', date: parseExamDate(activeCourseExams.cat1 as string | undefined) },
    { name: 'CAT 2', date: parseExamDate(activeCourseExams.cat2 as string | undefined) },
    { name: 'FAT', date: parseExamDate(activeCourseExams.fat as string | undefined) }
  ]
  .filter(e => e.date !== null)
  .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());"""

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
