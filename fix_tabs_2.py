import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">"""
replacement = """                </>
              )}
              {centerTab === 'practice' && (
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

