import express from 'express';
import FormResponse from '../models/FormResponse.js';
import { authenticateToken } from '../middleware/auth.js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export responses to XLS
router.get('/xls', authenticateToken, async (req, res) => {
  try {
    const responses = await FormResponse.find().sort({ timestamp: -1 }).lean();

    // Transform data for Excel with hyperlinks using HYPERLINK formula
    const excelData = responses.map((response, index) => {
      const row = {
        'S.No': index + 1,
        'Timestamp': new Date(response.timestamp).toLocaleString(),
        'Sector': response.sector,
        ...response.formData
      };

      // Add file upload information with hyperlinks
      if (response.uploadedFiles && response.uploadedFiles.length > 0) {
        response.uploadedFiles.forEach((file, idx) => {
          const columnName = `File ${idx + 1} (${file.fieldName})`;
          const fileUrl = file.fileUrl || file.downloadUrl;
          const fileName = file.fileName || 'N/A';
          
          if (fileUrl) {
            // Use Excel HYPERLINK formula: HYPERLINK(link_location, [friendly_name])
            // Escape quotes in URL and filename for Excel formula
            const escapedUrl = fileUrl.replace(/"/g, '""');
            const escapedName = fileName.replace(/"/g, '""');
            row[columnName] = `=HYPERLINK("${escapedUrl}","${escapedName}")`;
          } else {
            row[columnName] = fileName;
          }
        });
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Form Responses');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=form-responses.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting to XLS:', error);
    res.status(500).json({ error: 'Error exporting to XLS' });
  }
});

// Download uploaded documents
router.get('/download-docs', authenticateToken, async (req, res) => {
  try {
    const responses = await FormResponse.find().lean();
    
    const allFiles = [];
    responses.forEach(response => {
      if (response.uploadedFiles && response.uploadedFiles.length > 0) {
        response.uploadedFiles.forEach(file => {
          allFiles.push({
            responseId: response._id,
            timestamp: response.timestamp,
            sector: response.sector,
            fieldName: file.fieldName,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            filePath: file.filePath
          });
        });
      }
    });

    // Create a summary file
    const summaryData = allFiles.map((file, index) => ({
      'S.No': index + 1,
      'Response ID': file.responseId.toString(),
      'Timestamp': new Date(file.timestamp).toLocaleString(),
      'Sector': file.sector,
      'Field Name': file.fieldName,
      'File Name': file.fileName,
      'File URL/Path': file.fileUrl || file.filePath || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Uploaded Documents');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=uploaded-documents.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading documents list:', error);
    res.status(500).json({ error: 'Error downloading documents list' });
  }
});

export default router;

