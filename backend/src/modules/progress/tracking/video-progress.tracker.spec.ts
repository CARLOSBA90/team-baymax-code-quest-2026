import { calculateVideoProgress } from './video-progress.tracker.js';

describe('calculateVideoProgress', () => {
  it('calculates 135 of 600 seconds as 22.5 percent', () => {
    expect(calculateVideoProgress(135, 600, 0)).toEqual({
      percentage: 22.5,
      lastPositionSeconds: 135,
      maxPositionSeconds: 135,
    });
  });

  it('allows resume position to move back without reducing progress', () => {
    expect(calculateVideoProgress(90, 600, 135)).toEqual({
      percentage: 22.5,
      lastPositionSeconds: 90,
      maxPositionSeconds: 135,
    });
  });

  it('caps reports at the trusted duration', () => {
    expect(calculateVideoProgress(900, 600, 0).percentage).toBe(100);
  });
});
