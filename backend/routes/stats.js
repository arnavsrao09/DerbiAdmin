import express from 'express';
import FormResponse from '../models/FormResponse.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get sector distribution for pie chart
router.get('/sector-distribution', authenticateToken, async (req, res) => {
  try {
    const distribution = await FormResponse.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const formatted = distribution.map(item => ({
      sector: item._id || 'Unknown',
      count: item.count
    }));

    res.json({ distribution: formatted });
  } catch (error) {
    console.error('Error fetching sector distribution:', error);
    res.status(500).json({ error: 'Error fetching sector distribution' });
  }
});

// Get overall statistics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const totalApplications = await FormResponse.countDocuments();
    
    const pitchDecksCount = await FormResponse.countDocuments({
      'uploadedFiles.fieldName': { $regex: /pitch|deck/i }
    });
    
    const cinDocsCount = await FormResponse.countDocuments({
      'uploadedFiles.fieldName': { $regex: /cin|document/i }
    });

    const sectorStats = await FormResponse.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      totalApplications,
      pitchDecksUploaded: pitchDecksCount,
      cinDocumentsUploaded: cinDocsCount,
      sectorStats: sectorStats.map(s => ({
        sector: s._id || 'Unknown',
        count: s.count
      }))
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Error fetching overview statistics' });
  }
});

export default router;

