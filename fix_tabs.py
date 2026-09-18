import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace {centerTab === 'chat' ? ( with {centerTab === 'chat' && (
content = content.replace("{centerTab === 'chat' ? (", "{centerTab === 'chat' && (")

# Replace ) : ( with )} \n {centerTab === 'practice' && (
# BUT I need to find the specific ) : ( that separates chat and practice.
# Let's search for "              ) : (" around the end of the chat input.
# The chat input ends with:
#                 </div>
#               ) : (
#                 <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">

target = """                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">"""

replacement = """                </div>
              )}
              {centerTab === 'practice' && (
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-black">"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

