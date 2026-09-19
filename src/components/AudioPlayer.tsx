import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';

const TRACKS = [
  { id: 'brown', name: 'Deep Brown Noise' },
  { id: 'pink', name: 'Soft Pink Noise' },
  { id: 'drone', name: 'Ambient Drone' }
];

interface AudioPlayerProps {
  isCollapsed?: boolean;
}

export default function AudioPlayer({ isCollapsed = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(() => {
    const saved = localStorage.getItem('vstudyit_track_index');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('vstudyit_volume');
    return saved !== null ? parseFloat(saved) : 0.6;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('vstudyit_audio_minimized');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('vstudyit_audio_minimized', isMinimized.toString());
  }, [isMinimized]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('vstudyit_track_index', activeTrackIndex.toString());
  }, [activeTrackIndex]);

  useEffect(() => {
    localStorage.setItem('vstudyit_volume', volume.toString());
  }, [volume]);

  // Handle Playback
  useEffect(() => {
    if (isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      }
      
      const ctx = audioCtxRef.current;
      const gainNode = gainNodeRef.current!;
      
      // Reset previous source
      if (sourceRef.current) {
        if ('stop' in sourceRef.current) {
          (sourceRef.current as OscillatorNode | AudioBufferSourceNode).stop();
        }
        sourceRef.current.disconnect();
      }

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const trackId = TRACKS[activeTrackIndex].id;

      if (trackId === 'brown' || trackId === 'pink' || trackId === 'white') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (trackId === 'brown') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // compensate gain
          } else if (trackId === 'pink') {
            const b0 = 0.99886 * (lastOut || 0) + white * 0.0555179;
            output[i] = b0;
            lastOut = b0;
          } else {
            output[i] = white * 0.5;
          }
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // Lowpass filter for softness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = trackId === 'brown' ? 400 : trackId === 'pink' ? 800 : 8000;
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        sourceRef.current = noiseSource;
      } else if (trackId === 'binaural') {
        const merger = ctx.createChannelMerger(2);
        
        const oscLeft = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscLeft.frequency.value = 200; // Base carrier frequency
        
        const oscRight = ctx.createOscillator();
        oscRight.type = 'sine';
        oscRight.frequency.value = 214; // 14Hz difference (Beta waves)
        
        oscLeft.connect(merger, 0, 0); // Left channel
        oscRight.connect(merger, 0, 1); // Right channel
        
        // Lower the volume for binaural beats since pure sine waves are loud
        const localGain = ctx.createGain();
        localGain.gain.value = 0.3;
        
        merger.connect(localGain);
        localGain.connect(gainNode);
        
        oscLeft.start();
        oscRight.start();
        
        sourceRef.current = {
          disconnect: () => {
            oscLeft.disconnect();
            oscRight.disconnect();
            localGain.disconnect();
          },
          stop: () => {
            oscLeft.stop();
            oscRight.stop();
          }
        } as any;
      } else if (trackId === 'drone') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 110; // A2
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 111.5; // detuned for beating
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        
        osc.start();
        osc2.start();
        
        // Keep ref to one osc to stop it later, but we really need to stop both
        // Safe connection handling
        // (merger removed to prevent native web audio API crashes on disconnect)
        
        sourceRef.current = {
          disconnect: () => {
            osc.disconnect();
            osc2.disconnect();
          },
          stop: () => {
            osc.stop();
            osc2.stop();
          }
        } as any;
      }

    } else {
      if (audioCtxRef.current?.state === 'running') {
        audioCtxRef.current.suspend();
      }
    }

    return () => {
      // Cleanup happens when component unmounts or track changes
    };
  }, [isPlaying, activeTrackIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Handle Volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const actualVolume = isMuted ? 0 : volume;
      gainNodeRef.current.gain.setTargetAtTime(actualVolume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setActiveTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setActiveTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  const toggleMute = () => setIsMuted(!isMuted);

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 px-1 border-t border-black dark:border-white bg-white dark:bg-black" title={`Audio: ${TRACKS[activeTrackIndex].name}`}>
        <button 
          onClick={togglePlay} 
          className="p-2 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity flex items-center justify-center w-8 h-8"
          title={isPlaying ? 'Pause Audio' : 'Play Audio'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
        <button 
          onClick={toggleMute}
          className="p-1 text-black dark:text-white hover:text-zinc-500 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-end gap-0.5 h-2 opacity-80">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-[#39ff14] transition-all duration-300" 
              style={{ 
                height: isPlaying ? ['40%', '100%', '60%', '80%'][i] : '20%',
                opacity: isPlaying ? 1 : 0.3
              }} 
            />
          ))}
        </div>
      </div>
    );
  }

  // Minimized Compact Format
  if (isMinimized) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-900 border-t-2 border-black dark:border-white p-2 flex items-center justify-between gap-2 transition-all">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left group focus:outline-none"
          title="Expand Audio Player"
        >
          <div className="w-6 h-6 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-2.5">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-0.5 bg-white dark:bg-black transition-all duration-300" 
                    style={{ height: ['50%', '100%', '70%'][i] }} 
                  />
                ))}
              </div>
            ) : (
              <span className="font-mono text-[9px] font-bold">♫</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 leading-none">
              TRK {activeTrackIndex + 1}
            </div>
            <div className="font-mono text-[10px] font-bold uppercase truncate text-black dark:text-white leading-tight">
              {TRACKS[activeTrackIndex].name}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={togglePlay} 
            className="p-1.5 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          </button>
          <button 
            onClick={nextTrack} 
            className="p-1.5 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-3 h-3 fill-current" />
          </button>
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors ml-0.5"
            title="Expand Player"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border-t-2 border-black dark:border-white p-4 flex flex-col gap-4 rounded-none transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-black dark:text-white border border-black dark:border-white px-2 py-0.5 bg-white dark:bg-black">[ AUDIO ]</span>
          <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 transition-colors ${isPlaying ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700'}`}>{isPlaying ? 'ACTIVE' : 'IDLE'}</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors flex items-center justify-center"
          title="Minimize Player"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
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
              className="w-1 bg-[#39ff14] transition-all duration-300" 
              style={{ 
                height: isPlaying ? ['40%', '80%', '60%', '100%', '50%', '90%', '70%', '30%'][i] : '10%',
                opacity: isPlaying ? 1 : 0.3
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
  );
}
