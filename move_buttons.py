import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# The block of buttons to extract:
buttons_block_regex = r'(<div className="flex items-center gap-4 font-mono text-xs uppercase">\s*<button[\s\S]*?Cram Filter[\s\S]*?setIsUploadModalOpen[\s\S]*?setStudyMode[\s\S]*?</div>\s*</div>)'

# Wait, the parent of buttons_block is:
#                 <div className="flex items-center justify-between">
#                   <div className="flex items-center gap-4">
#                     <h2 className="font-serif text-lg font-bold text-black dark:text-white tracking-tight">{activeCourse.code}</h2>
#                   </div>
#                   <div className="flex items-center gap-4 font-mono text-xs uppercase"> ... </div>
#                 </div>

# Let's extract the exact string:
header_target = """                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif text-lg font-bold text-black dark:text-white tracking-tight">{activeCourse.code}</h2>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs uppercase">
                    <button 
                      onClick={() => setIsCramMode(!isCramMode)} 
                      className={`flex items-center gap-2 px-3 py-1.5 border border-black dark:border-white transition-colors duration-100 ${isCramMode ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                    >
                      Cram Filter {isCramMode ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">Upload</button>
                    <div className="flex items-center">
                      <button onClick={() => setStudyMode('deep')} className={`w-24 shrink-0 text-center px-3 py-1.5 border border-black dark:border-white transition-colors duration-100 ${studyMode === 'deep' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Deep</button>
                      <button onClick={() => setStudyMode('exam')} className={`w-24 shrink-0 text-center px-3 py-1.5 border border-black dark:border-white -ml-[1px] transition-colors duration-100 ${studyMode === 'exam' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Exam</button>
                    </div>
                  </div>
                </div>"""

new_header = """                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif text-lg font-bold text-black dark:text-white tracking-tight">{activeCourse.code}</h2>
                  </div>
                </div>"""

if header_target in content:
    content = content.replace(header_target, new_header)
else:
    print("Could not find header_target")

buttons_extracted = """                    <div className="flex items-center justify-between mb-4 max-w-2xl font-mono text-[10px] uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsCramMode(!isCramMode)} 
                          className={`flex items-center gap-2 px-2 py-1 border border-black dark:border-white transition-colors duration-100 ${isCramMode ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}
                        >
                          Cram Filter {isCramMode ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-2 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">Upload</button>
                      </div>
                      <div className="flex items-center">
                        <button onClick={() => setStudyMode('deep')} className={`w-20 shrink-0 text-center px-2 py-1 border border-black dark:border-white transition-colors duration-100 ${studyMode === 'deep' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Deep</button>
                        <button onClick={() => setStudyMode('exam')} className={`w-20 shrink-0 text-center px-2 py-1 border border-black dark:border-white -ml-[1px] transition-colors duration-100 ${studyMode === 'exam' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'}`}>Exam</button>
                      </div>
                    </div>"""

# Wait, search bar input is here:
chat_input_target = """                  <div className="p-8 border-t border-black dark:border-white shrink-0 bg-white dark:bg-black">
                    <form onSubmit={handleSendMessage} className="relative max-w-2xl">"""

new_chat_input = f"""                  <div className="p-8 border-t border-black dark:border-white shrink-0 bg-white dark:bg-black">
{buttons_extracted}
                    <form onSubmit={handleSendMessage} className="relative max-w-2xl">"""

if chat_input_target in content:
    content = content.replace(chat_input_target, new_chat_input)
else:
    print("Could not find chat_input_target")

with open('src/App.tsx', 'w') as f:
    f.write(content)

