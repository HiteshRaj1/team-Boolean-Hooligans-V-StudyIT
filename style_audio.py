import re

with open('src/components/AudioPlayer.tsx', 'r') as f:
    content = f.read()

ui_target = """  return (
    <div className="bg-white dark:bg-black border-t-2 border-black dark:border-white p-4 flex flex-col gap-3 rounded-none">
      {/* Track Details Row */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center shrink-0 ${isPlaying ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
          <Disc className={`w-4 h-4 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-mono font-bold uppercase text-black dark:text-white tracking-widest truncate">{TRACKS[activeTrackIndex].name}</span>
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">Ambient Engine &bull; {isPlaying ? 'Active' : 'Paused'}</span>
        </div>
      </div>

      {/* Control Bar Row */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          <button onClick={prevTrack} className="p-1.5 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"><SkipBack className="w-3.5 h-3.5" /></button>
          <button onClick={togglePlay} className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={nextTrack} className="p-1.5 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"><SkipForward className="w-3.5 h-3.5" /></button>
        </div>
        
        <div className="flex items-center gap-2 group flex-1 ml-2 max-w-[80px]">
          <button onClick={toggleMute} className="text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors shrink-0">
            {isMuted || volume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-black dark:[&::-webkit-slider-thumb]:bg-white cursor-pointer transition-opacity"
          />
        </div>
      </div>
    </div>
  );"""

ui_replacement = """  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border-t-2 border-black dark:border-white p-4 flex flex-col gap-4 rounded-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-black dark:text-white border border-black dark:border-white px-2 py-0.5 bg-white dark:bg-black">[ AUDIO ]</span>
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 transition-colors ${isPlaying ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700'}`}>{isPlaying ? 'ACTIVE' : 'IDLE'}</span>
      </div>

      <div className="bg-black dark:bg-black border-2 border-black dark:border-white p-3 flex flex-col gap-1 relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
        <span className="text-[#39ff14] font-mono text-[10px] uppercase tracking-widest font-bold">TRK {activeTrackIndex + 1}/{TRACKS.length}</span>
        <span className="text-[#39ff14] font-mono text-sm uppercase font-bold truncate tracking-widest">{TRACKS[activeTrackIndex].name}</span>
        
        {/* Equalizer animation */}
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
        </div>
      </div>

      {/* Control Bar Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-black p-1 border border-black dark:border-white">
          <button onClick={prevTrack} className="p-2 bg-transparent text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"><SkipBack className="w-3.5 h-3.5 fill-current" /></button>
          <button onClick={togglePlay} className="p-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity duration-100">
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button onClick={nextTrack} className="p-2 bg-transparent text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-100"><SkipForward className="w-3.5 h-3.5 fill-current" /></button>
        </div>
        
        <div className="flex items-center gap-2 group flex-1 ml-4 bg-white dark:bg-black border border-black dark:border-white p-2">
          <button onClick={toggleMute} className="text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors shrink-0">
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-black dark:[&::-webkit-slider-thumb]:bg-white cursor-pointer"
          />
        </div>
      </div>
    </div>
  );"""

content = content.replace(ui_target, ui_replacement)

with open('src/components/AudioPlayer.tsx', 'w') as f:
    f.write(content)
