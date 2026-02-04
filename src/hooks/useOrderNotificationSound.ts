import { useEffect, useRef } from 'react';

/**
 * Hook to play a notification sound when new orders arrive
 * Uses Web Audio API to generate a pleasant 2-second ringtone
 */
export function useOrderNotificationSound(orderCount: number, isAuthenticated: boolean) {
  const prevOrderCountRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only trigger sound if authenticated and orders increased
    if (!isAuthenticated) {
      prevOrderCountRef.current = null;
      return;
    }

    // Skip initial load - only play on new orders
    if (prevOrderCountRef.current === null) {
      prevOrderCountRef.current = orderCount;
      return;
    }

    // Play sound only when order count increases
    if (orderCount > prevOrderCountRef.current) {
      playNotificationSound();
    }

    prevOrderCountRef.current = orderCount;
  }, [orderCount, isAuthenticated]);

  const playNotificationSound = () => {
    try {
      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      // Resume if suspended (required for autoplay policies)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const duration = 2; // 2 seconds

      // Create a pleasant notification melody
      const frequencies = [
        { freq: 587.33, start: 0, dur: 0.15 },      // D5
        { freq: 659.25, start: 0.15, dur: 0.15 },   // E5
        { freq: 783.99, start: 0.3, dur: 0.2 },     // G5
        { freq: 880.00, start: 0.5, dur: 0.3 },     // A5
        { freq: 783.99, start: 0.9, dur: 0.15 },    // G5
        { freq: 880.00, start: 1.05, dur: 0.15 },   // A5
        { freq: 987.77, start: 1.2, dur: 0.4 },     // B5
        { freq: 1046.50, start: 1.6, dur: 0.4 },    // C6 (final note)
      ];

      // Master gain for overall volume (loud)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, now); // Loud but not distorted
      masterGain.connect(ctx.destination);

      frequencies.forEach(({ freq, start, dur }) => {
        // Oscillator for main tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Second oscillator for richness (slightly detuned)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.002, now + start);

        // Gain envelope for each note
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0, now + start);
        noteGain.gain.linearRampToValueAtTime(0.5, now + start + 0.02); // Quick attack
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + start + dur); // Decay

        // Connect
        osc.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(masterGain);

        // Start and stop
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
        osc2.start(now + start);
        osc2.stop(now + start + dur + 0.05);
      });

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
}
