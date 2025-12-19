import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Fix: Explicitly type the options object
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(
    payload, 
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string): TokenPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}