import mongoose from 'mongoose';

const formResponseSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  sector: {
    type: String,
    required: true
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  uploadedFiles: {
    type: [{
      fieldName: String,
      fileName: String,        // New renamed filename (e.g., "1. PD_CompanyName_FounderName.pdf")
      originalFileName: String, // Original filename before renaming
      fileUrl: String,          // Google Drive view link
      downloadUrl: String,      // Direct download link
      fileId: String,           // Google Drive file ID
      filePath: String,         // Legacy field (kept for compatibility)
      fileSize: Number,         // File size in bytes
      mimeType: String,         // File MIME type
      error: String             // Error message if file couldn't be accessed
    }],
    default: []
  }
}, {
  timestamps: true
});

// Index for faster queries
formResponseSchema.index({ sector: 1 });
formResponseSchema.index({ timestamp: -1 });

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

export default FormResponse;

