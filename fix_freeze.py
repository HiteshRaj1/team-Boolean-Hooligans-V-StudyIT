import re

with open('src/components/AudioPlayer.tsx', 'r') as f:
    content = f.read()

# Remove the <style> tag completely
style_target = """        <style>{`
          @keyframes eqPulse {
            0% { height: 20%; }
            100% { height: 100%; }
          }
        `}</style>"""

content = content.replace(style_target, "")

# Replace EQ block
eq_target = """        {/* Equalizer animation */}
        <div className="flex items-end gap-1 h-3 mt-1 opacity-70">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-[#39ff14]" 
              style={{ 
                height: isPlaying ? ['40%', '80%', '60%', '100%', '50%', '90%', '70%', '30%'][i] : '10%',
                animation: isPlaying ? `eqPulse ${0.5 + (i * 0.1)}s ease-in-out infinite alternate` : 'none',
              }} 
            />
          ))}
        </div>"""

eq_replacement = """        {/* Equalizer animation */}
        <div className="flex items-end gap-1 h-3 mt-1 opacity-70">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-[#39ff14] transition-all duration-300" 
              style={{ 
                height: isPlaying ? ['40%', '80%', '60%', '100%', '50%', '90%', '70%', '30%'][i] : '10%',
                opacity: isPlaying ? 1 : 0.3
              }} 
            />
          ))}
        </div>"""

content = content.replace(eq_target, eq_replacement)

with open('src/components/AudioPlayer.tsx', 'w') as f:
    f.write(content)
