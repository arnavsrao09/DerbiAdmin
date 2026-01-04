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
      fileUrl: String,
      filePath: String
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

