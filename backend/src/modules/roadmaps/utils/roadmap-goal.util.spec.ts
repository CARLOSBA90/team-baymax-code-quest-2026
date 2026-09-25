import { describe, expect, it } from 'vitest';
import { resolveGoalCategory } from './roadmap-goal.util.js';

describe('resolveGoalCategory', () => {
  it('normalizes accents and matches complete terms', () => {
    expect(
      resolveGoalCategory('Quiero aprender diseño de APIs y servidor'),
    ).toBe('BACKEND');
    expect(resolveGoalCategory('Quiero mejorar en aplicaciones móviles')).toBe(
      'MOBILE',
    );
  });

  it('does not match fragments inside another word', () => {
    expect(
      resolveGoalCategory('Quiero entender apicultura profesional'),
    ).toBeNull();
  });

  it('recognizes the common APIs plural as backend', () => {
    expect(resolveGoalCategory('Quiero dominar APIs REST')).toBe('BACKEND');
  });

  it('rejects an ambiguous goal', () => {
    expect(
      resolveGoalCategory('Quiero aprender React y APIs backend'),
    ).toBeNull();
  });
});
