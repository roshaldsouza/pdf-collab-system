import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, user } from '../models/user';
import { v4 as uuidv4 } from 'uuid';

// Initialize the router at the top level
const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

interface AuthRequest extends Request {
  body: {
    name?: string;
    email: string;
    password: string;
  };
}

// ------------------ ASYNC HANDLER ------------------
const asyncHandler = (
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// ------------------ SIGNUP ------------------
router.post('/signup', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Missing fields' });
    return;
  }

  const userExists = users.find((u) => u.email === email);
  if (userExists) {
    res.status(409).json({ message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser: user = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
  };

  users.push(newUser);
  res.status(201).json({ message: 'User created successfully' });
}));

// ------------------ LOGIN ------------------
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const foundUser = users.find((u) => u.email === email);
  if (!foundUser) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, foundUser.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: foundUser.id }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({
    token,
    name: foundUser.name,
    email: foundUser.email,
  });
}));

// ------------------ AUTH MIDDLEWARE ------------------
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ------------------ ERROR HANDLER ------------------
router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Route Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default router;