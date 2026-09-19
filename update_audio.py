import re

with open('src/components/AudioPlayer.tsx', 'r') as f:
    content = f.read()

tracks_target = """const TRACKS = [
  { id: 'brown', name: 'Brown Noise' },
  { id: 'pink', name: 'Pink Noise' },
  { id: 'drone', name: 'Deep Drone' }
];"""

tracks_replacement = """const TRACKS = [
  { id: 'brown', name: 'Brown Noise' },
  { id: 'pink', name: 'Pink Noise' },
  { id: 'white', name: 'White Noise' },
  { id: 'drone', name: 'Deep Drone' },
  { id: 'binaural', name: 'Binaural Focus (14Hz)' }
];"""

content = content.replace(tracks_target, tracks_replacement)

# Update playback logic
playback_target = """      if (trackId === 'brown' || trackId === 'pink') {"""
playback_replacement = """      if (trackId === 'brown' || trackId === 'pink' || trackId === 'white') {"""
content = content.replace(playback_target, playback_replacement)

white_noise_target = """          if (trackId === 'brown') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // compensate gain
          } else {
            // pink noise approximation
            const b0 = 0.99886 * (lastOut || 0) + white * 0.0555179;
            output[i] = b0;
            lastOut = b0;
          }"""
white_noise_replacement = """          if (trackId === 'brown') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // compensate gain
          } else if (trackId === 'pink') {
            const b0 = 0.99886 * (lastOut || 0) + white * 0.0555179;
            output[i] = b0;
            lastOut = b0;
          } else {
            output[i] = white * 0.5;
          }"""
content = content.replace(white_noise_target, white_noise_replacement)

filter_target = """        filter.frequency.value = trackId === 'brown' ? 400 : 800;"""
filter_replacement = """        filter.frequency.value = trackId === 'brown' ? 400 : trackId === 'pink' ? 800 : 8000;"""
content = content.replace(filter_target, filter_replacement)

drone_target = """      } else if (trackId === 'drone') {"""
drone_replacement = """      } else if (trackId === 'binaural') {
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
            merger.disconnect();
            localGain.disconnect();
          },
          stop: () => {
            oscLeft.stop();
            oscRight.stop();
          }
        } as any;
      } else if (trackId === 'drone') {"""
content = content.replace(drone_target, drone_replacement)

with open('src/components/AudioPlayer.tsx', 'w') as f:
    f.write(content)
