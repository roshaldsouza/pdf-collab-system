import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from './auth'; // ✅ fixed import
import File from '../models/File';

const router = express.Router();

// POST /share - Share a file with another user
router.post('/:fileId/share', authenticate, async (req: any, res: any) => {
  const { fileId } = req.params;
  const { sharedWithUserId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return res.status(400).json({ message: 'Invalid file ID' });
  }

  try {
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file?.uploadedBy?.toString() !== req.user._id.toString()) {

      return res.status(403).json({ message: 'Not authorized to share this file' });
    }

    if (!file.sharedWith.includes(sharedWithUserId)) {
      file.sharedWith.push(sharedWithUserId);
      await file.save();
    }

    res.json({ message: 'File shared successfully', file });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
