import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage and file filter
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

// Create async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// File upload route with proper typing
router.post('/upload', upload.single('pdf'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  res.status(200).json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
  });
}));

export default router;

// Export error handler to be used in main app file
export const fileUploadErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  
  if (err instanceof Error && err.message === 'Only PDF files are allowed!') {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};