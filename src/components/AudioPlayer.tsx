import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc } from 'lucide-react';

const TRACKS = [
  { id: 'brown', name: 'Deep Brown Noise' },
  { id: 'pink', name: 'Soft Pink Noise' },
  { id: 'drone', name: 'Ambient Drone' }
];

export default function AudioPlayer() {
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

      if (trackId === 'brown' || trackId === 'pink') {
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
          } else {
            // pink noise approximation
            const b0 = 0.99886 * (lastOut || 0) + white * 0.0555179;
            output[i] = b0;
            lastOut = b0;
          }
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // Lowpass filter for softness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = trackId === 'brown' ? 400 : 800;
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        sourceRef.current = noiseSource;
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
        // So we wrap them in a custom node or just stop the context
        const merger = ctx.createChannelMerger(1);
        osc.connect(merger);
        osc2.connect(merger);
        merger.disconnect(); // just for ref type matching, we will just use a hack
        
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

  return (
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
  );
}
