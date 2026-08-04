import jwt from 'jsonwebtoken';
import { unauthorized } from '../lib/http.js';

export const JWT_SECRET = process.env.JWT_SECRET;

export const TOKEN_TTL = process.env.JWT_TTL || '12h';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Belum login.'));
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(unauthorized());
  }
}
