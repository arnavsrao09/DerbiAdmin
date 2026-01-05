import mongoose from 'mongoose';

const formResponseSchema = new mongoose.Schema({
  // Common fields - adjust based on your Google Form structure
  timestamp: {
    type: Date,
    default: Date.now
  },
  sector: {
    type: String,
    required: true
  },
  // Add other form fields as needed
  // These will be stored as a flexible object to accommodate any form structure
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // File uploads - store file URLs or paths
  uploadedFiles: {
    type: [{
      fieldName: String,
      fileName: String,
      fileUrl: String,        // Google Drive view link
      downloadUrl: String,    // Direct download link
      fileId: String,         // Google Drive file ID
      filePath: String,       // Legacy field (kept for compatibility)
      fileSize: Number,       // File size in bytes
      mimeType: String,      // File MIME type
      error: String           // Error message if file couldn't be accessed
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

