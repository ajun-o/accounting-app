import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET. Set JWT_SECRET in the server environment before startup.');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = '7d';

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') return null;
    if (typeof decoded.userId !== 'string' || typeof decoded.email !== 'string') return null;
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}
