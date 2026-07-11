import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

export const syncApiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Missing Authorization header',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Invalid Authorization format',
    });
    return;
  }

  const token = parts[1];
  const expectedKey = env.SYNC_API_KEY;

  if (!expectedKey) {
    console.error('SYNC_API_KEY is not configured');
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedKey);

  let match = false;
  if (tokenBuffer.length === expectedBuffer.length) {
    match = crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
  } else {
    // Perform timing-safe comparison on equal length buffers to avoid early return timing attack
    crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
    match = false;
  }

  if (!match) {
    console.warn('Invalid Sync API authentication');
    res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
    return;
  }

  next();
};
