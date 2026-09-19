import re

with open('src/components/AudioPlayer.tsx', 'r') as f:
    content = f.read()

eq_target = """        {/* Equalizer animation */}
        <div className="flex items-end gap-1 h-3 mt-1 opacity-70">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-[#39ff14]" 
              style={{ 
                height: isPlaying ? `${20 + Math.random() * 80}%` : '10%',
                transition: 'height 0.2s ease-in-out'
              }} 
            />
          ))}
        </div>"""

eq_replacement = """        {/* Equalizer animation */}
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

content = content.replace(eq_target, eq_replacement)

# To make the animation work, we inject a style tag right above the equalizer block
eq_replacement = """        <style>{`
          @keyframes eqPulse {
            0% { height: 20%; }
            100% { height: 100%; }
          }
        `}</style>
""" + eq_replacement

content = content.replace(eq_replacement.replace("""        <style>{`
          @keyframes eqPulse {
            0% { height: 20%; }
            100% { height: 100%; }
          }
        `}</style>
""", ""), eq_replacement)

with open('src/components/AudioPlayer.tsx', 'w') as f:
    f.write(content)
