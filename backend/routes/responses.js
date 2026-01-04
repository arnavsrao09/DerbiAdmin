import express from 'express';
import FormResponse from '../models/FormResponse.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all responses with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const responses = await FormResponse.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FormResponse.countDocuments();

    res.json({
      responses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResponses: total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Error fetching responses' });
  }
});

// Get single response by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await FormResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Error fetching response' });
  }
});

// Create new response (for Google Forms integration)
router.post('/', async (req, res) => {
  try {
    const { sector, formData, uploadedFiles } = req.body;

    const newResponse = new FormResponse({
      sector: sector || 'Other',
      formData,
      uploadedFiles: uploadedFiles || []
    });

    await newResponse.save();
    res.status(201).json({ message: 'Response saved successfully', response: newResponse });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Error saving response' });
  }
});

export default router;

