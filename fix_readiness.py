import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  const tasksCompleted = activeCourseTasks.filter(t => t.completed).length;
  const tasksRatio = activeCourseTasks.length > 0 ? tasksCompleted / activeCourseTasks.length : 0;
  const questionsReviewed = activeQuestions.filter(q => q.isReviewed).length;
  const questionsRatio = activeQuestions.length > 0 ? questionsReviewed / activeQuestions.length : 0;
  const filesRatio = Math.min(activeFilesCount / 5, 1);
  const readinessScore = Math.round((tasksRatio * 50) + (questionsRatio * 30) + (filesRatio * 20));"""

replacement = """  const tasksCompleted = activeCourseTasks.filter(t => t.completed).length;
  const tasksRatio = activeCourseTasks.length > 0 ? tasksCompleted / activeCourseTasks.length : 0;
  const questionsReviewed = activeQuestions.filter(q => q.isReviewed).length;
  const questionsRatio = activeQuestions.length > 0 ? questionsReviewed / activeQuestions.length : 0;
  const filesRatio = activeFilesCount > 0 ? Math.min(activeFilesCount / 5, 1) : 0;
  
  let totalWeight = 0;
  let earnedScore = 0;
  
  if (activeCourseTasks.length > 0) {
    totalWeight += 50;
    earnedScore += tasksRatio * 50;
  }
  if (activeQuestions.length > 0) {
    totalWeight += 30;
    earnedScore += questionsRatio * 30;
  }
  if (activeFilesCount > 0) {
    totalWeight += 20;
    earnedScore += filesRatio * 20;
  }
  
  const readinessScore = totalWeight > 0 ? Math.round((earnedScore / totalWeight) * 100) : 0;"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
