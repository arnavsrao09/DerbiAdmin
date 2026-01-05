// Google Apps Script for Derbi Admin Portal
// Copy this entire script into your Google Apps Script editor
// Instructions: https://script.google.com

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Replace with your backend API URL (use your deployed URL in production)
const API_URL = 'http://localhost:5000/api/responses'; // Change this!

// Field name that contains the sector/industry segment
// Update this to match your exact Google Form field name
const SECTOR_FIELD_KEYWORDS = ['industry segment', 'sector', 'vertical'];

// Optional: Email for error notifications (leave empty to disable)
const ERROR_NOTIFICATION_EMAIL = ''; // e.g., 'admin@example.com'

// ============================================
// MAIN FUNCTION - Runs on form submit
// ============================================

function onFormSubmit(e) {
  try {
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract form data
    const formData = {};
    let sector = 'Other'; // Default sector
    const uploadedFiles = [];
    
    itemResponses.forEach(itemResponse => {
      const question = itemResponse.getItem().getTitle();
      const itemType = itemResponse.getItem().getType();
      const answer = itemResponse.getResponse();
      
      // Check if this is a file upload question
      if (itemType === FormApp.ItemType.FILE_UPLOAD) {
        // File upload responses are arrays of file IDs
        if (Array.isArray(answer) && answer.length > 0) {
          answer.forEach((fileId) => {
            try {
              const file = DriveApp.getFileById(fileId);
              
              // Get file information
              const fileIdFromUrl = file.getId();
              const viewUrl = 'https://drive.google.com/file/d/' + fileIdFromUrl + '/view';
              const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileIdFromUrl;
              
              uploadedFiles.push({
                fieldName: question,
                fileName: file.getName(),
                fileUrl: viewUrl, // View link for Google Drive
                downloadUrl: downloadUrl, // Direct download link
                fileId: fileIdFromUrl,
                fileSize: file.getSize(),
                mimeType: file.getBlob().getContentType()
              });
              
              Logger.log('File processed: ' + file.getName() + ' - ' + viewUrl);
            } catch (err) {
              Logger.log('Error processing file with ID ' + fileId + ': ' + err.toString());
              // Still add the file ID even if we can't access it
              uploadedFiles.push({
                fieldName: question,
                fileName: 'File ID: ' + fileId,
                fileUrl: 'https://drive.google.com/file/d/' + fileId + '/view',
                downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
                fileId: fileId,
                error: 'Could not access file: ' + err.toString()
              });
            }
          });
        }
        // Store file IDs in formData as well
        formData[question] = answer;
      } else {
        // Regular form field
        formData[question] = answer;
        
        // Check if this is the sector field
        const questionLower = question.toLowerCase();
        const isSectorField = SECTOR_FIELD_KEYWORDS.some(keyword => 
          questionLower.includes(keyword)
        );
        
        if (isSectorField && answer) {
          sector = answer;
        }
      }
    });
    
    // Prepare payload
    const payload = {
      sector: sector,
      formData: formData,
      uploadedFiles: uploadedFiles,
      timestamp: formResponse.getTimestamp()
    };
    
    // Send to backend
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('Response sent. Status: ' + responseCode);
    
    if (responseCode !== 200 && responseCode !== 201) {
      throw new Error('Backend returned error: ' + responseCode + ' - ' + responseText);
    }
    
    Logger.log('Form submission successfully sent to backend');
    
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    
    // Send error notification if email is configured
    if (ERROR_NOTIFICATION_EMAIL) {
      try {
        MailApp.sendEmail({
          to: ERROR_NOTIFICATION_EMAIL,
          subject: 'Form Submission Error - Derbi Admin',
          body: 'Error sending form response to backend:\n\n' + 
                'Error: ' + error.toString() + '\n\n' +
                'Stack trace:\n' + error.stack + '\n\n' +
                'Please check the Apps Script execution logs for more details.'
        });
      } catch (emailError) {
        Logger.log('Failed to send error email: ' + emailError.toString());
      }
    }
  }
}

// ============================================
// SETUP FUNCTION - Run this once to set up the trigger
// ============================================

function setupTrigger() {
  try {
    const form = FormApp.getActiveForm();
    
    // Delete existing triggers for this function
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger
    ScriptApp.newTrigger('onFormSubmit')
      .timeBased()
      .onFormSubmit()
      .create();
    
    Logger.log('Trigger set up successfully!');
    Logger.log('The script will now run automatically when a form is submitted.');
  } catch (error) {
    Logger.log('Error setting up trigger: ' + error.toString());
    throw error;
  }
}

// ============================================
// TEST FUNCTION - Use this to test the script
// ============================================

function testScript() {
  // This simulates a form submission event
  // Note: This is a basic test - you may need to adjust based on your form structure
  Logger.log('Testing script...');
  Logger.log('Make sure to update API_URL before testing!');
  Logger.log('Current API_URL: ' + API_URL);
}

