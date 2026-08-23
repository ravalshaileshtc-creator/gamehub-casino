import { useCallback } from "react"

// Types of sounds
type SoundType = "tick" | "win" | "lose" | "click" | "flip"

// Normally we would use real audio files. 
// For this demo, we can try to use simple oscillator beeps if supported, or just verify logic.
// However, the best "juice" comes from real SFX. I will leave the structure ready for files.
// For now, let's create a tiny synth for instant feedback without assets!

export function useSound() {

  const playSound = useCallback((type: SoundType) => {
    if (typeof window === "undefined") return

    // Simple Web Audio API Synth for interactions
    try {
      // Standard AudioContext only to avoid lint/type hell with legacy webkit prefix
      const AudioContext = window.AudioContext
      if (!AudioContext) return

      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime

      if (type === "click") {
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === "win") {
        // Arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50] // C Major
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.type = "sine"
          o.frequency.value = freq
          g.gain.setValueAtTime(0.1, now + i * 0.1)
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3)
          o.start(now + i * 0.1)
          o.stop(now + i * 0.1 + 0.3)
        })
      } else if (type === "lose") {
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.linearRampToValueAtTime(100, now + 0.3)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3)
        osc.start(now)
        osc.stop(now + 0.3)
      } else if (type === "flip") {
        // White noise burst sim would be better but simple tone:
        osc.frequency.setValueAtTime(1200, now)
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        osc.start(now)
        osc.stop(now + 0.05)
      }
    } catch (e) {
      console.error("Audio play failed", e)
    }
  }, [])

  return { playSound }
}
