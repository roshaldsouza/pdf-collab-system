import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import File from '../models/File';
import { authenticate } from './auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      file?: Express.Multer.File;
    }
  }
}

const router = Router();
const uploadDir = path.join(__dirname, '../../upload');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed!'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// POST /upload
router.post(
  '/upload',
  authenticate,
  upload.single('pdf'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const newFile = new File({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user.id,
      });

      await newFile.save();
      res.status(200).json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        uploadedBy: req.user.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /my-files
router.get('/my-files', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const files = await File.find({ uploadedBy: req.user.id });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// GET /search
router.get('/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = req.query.q?.toString() || '';
    const files = await File.find({
      uploadedBy: req.user.id,
      originalname: { $regex: query, $options: 'i' },
    });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// Error handlers
router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof Error && err.message === 'Only PDF files are allowed!') {
    res.status(400).json({ message: err.message });
    return;
  }

  next(err);
});

router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('File Route Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default router;