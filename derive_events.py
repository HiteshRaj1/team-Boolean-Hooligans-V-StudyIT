import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove the old examEvents state
state_regex = r"  const \[examEvents, _setExamEvents\] = useState<Record<string, ExamEvent\[\]>>\(\{[\s\S]*?\}\);\n"
content = re.sub(state_regex, "", content)

# 2. Inject derivedExamEvents right after activeCourseExams
target = """  const upcomingExams = Object.entries(activeCourseExams)
    .filter(([_, date]) => date !== null)
    .map(([name, date]) => ({ name: name.toUpperCase(), date: date as Date }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());"""

derived_events = """  const derivedExamEvents: ExamEvent[] = Object.entries(activeCourseExams)
    .filter(([_, date]) => date !== null)
    .map(([name, date]) => ({
      id: name,
      title: name.toUpperCase(),
      date: (date as Date).toISOString(),
      type: name.includes('cat') ? 'CAT' : name.includes('fat') ? 'FAT' : 'REVIEW',
      daysLeft: Math.ceil(((date as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      status: 'PENDING'
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());"""

content = content.replace(target, target + "\n\n" + derived_events)

# 3. Replace examEvents[activeCourse?.id || ''] with derivedExamEvents inside the Schedule block
schedule_block_start = "const events = examEvents[activeCourse?.id || ''] || [];"
content = content.replace(schedule_block_start, "const events = derivedExamEvents;")

schedule_block_map = "(examEvents[activeCourse?.id || ''] || []).map((event: ExamEvent) => {"
content = content.replace(schedule_block_map, "derivedExamEvents.map((event: ExamEvent) => {")

schedule_block_empty = "(examEvents[activeCourse?.id || ''] || []).length === 0 && ("
content = content.replace(schedule_block_empty, "derivedExamEvents.length === 0 && (")

with open('src/App.tsx', 'w') as f:
    f.write(content)
