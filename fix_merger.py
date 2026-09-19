import re

with open('src/components/AudioPlayer.tsx', 'r') as f:
    content = f.read()

binaural_target = """        sourceRef.current = {
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
        } as any;"""

binaural_replacement = """        sourceRef.current = {
          disconnect: () => {
            oscLeft.disconnect();
            oscRight.disconnect();
            localGain.disconnect();
          },
          stop: () => {
            oscLeft.stop();
            oscRight.stop();
          }
        } as any;"""

content = content.replace(binaural_target, binaural_replacement)

drone_target = """        // So we wrap them in a custom node or just stop the context
        const merger = ctx.createChannelMerger(1);
        osc.connect(merger);
        osc2.connect(merger);
        merger.disconnect(); // just for ref type matching, we will just use a hack"""

drone_replacement = """        // Safe connection handling
        // (merger removed to prevent native web audio API crashes on disconnect)"""

content = content.replace(drone_target, drone_replacement)

with open('src/components/AudioPlayer.tsx', 'w') as f:
    f.write(content)
