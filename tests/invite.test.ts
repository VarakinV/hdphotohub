// Vitest/Jest-style tests (requires installing a test runner)
// To run, I recommend Vitest:
//   pnpm add -D vitest ts-node @types/node
//   npx vitest run

import { describe, it, expect } from 'vitest';
import { generateInviteToken, hashToken } from '@/lib/utils/invite';

describe('invitation utils', () => {
  it('generates token and hash with future expiry', () => {
    const { token, tokenHash, expiresAt } = generateInviteToken(7);
    expect(token).toBeTypeOf('string');
    expect(token.length).toBeGreaterThan(10);
    expect(tokenHash).toEqual(hashToken(token));
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

