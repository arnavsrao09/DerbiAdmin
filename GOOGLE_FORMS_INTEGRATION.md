# Google Forms Integration Guide

This guide explains how to connect your Google Form responses to the Admin Dashboard.

## Overview

The dashboard expects form responses to be sent to the backend API endpoint. Since Google Forms doesn't natively support webhooks, you have several options to integrate:

## Option 1: Google Apps Script (Recommended)

This is the most automated approach. Google Apps Script can automatically send form responses to your backend when a form is submitted.

### Step 1: Create a Google Apps Script

1. Open your Google Form
2. Click on the three dots (⋮) in the top right → **Script editor**
3. If Script editor is not available, go to [script.google.com](https://script.google.com) and create a new project

### Step 2: Add the Integration Script

**Recommended:** Copy the complete script from `GOOGLE_APPS_SCRIPT.js` file in the project root. This includes automatic file renaming functionality that will rename uploaded files with the format:
- **Pitch Deck**: `1. PD_CompanyName_FounderName.pdf`
- **CIN**: `1. CIN_CompanyName_FounderName.pdf`

Alternatively, you can use the simplified version below:

```javascript
// Replace with your backend API URL
const API_URL = 'http://localhost:5000/api/responses'; // Change to your deployed URL

// This function runs when a form is submitted
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
              
              // Get the shareable link (view link)
              // First, make sure the file is accessible
              let fileUrl = file.getUrl();
              
              // Try to get a direct download link
              // For files in Google Drive, we can create a shareable link
              // The file.getUrl() gives us the Drive edit link
              // We need to convert it to a view/download link
              const fileIdFromUrl = file.getId();
              const viewUrl = 'https://drive.google.com/file/d/' + fileIdFromUrl + '/view';
              const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileIdFromUrl;
              
              uploadedFiles.push({
                fieldName: question,
                fileName: file.getName(),
                fileUrl: viewUrl, // View link
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
        // Update this to match your exact field name
        if (question.toLowerCase().includes('industry segment') || 
            question.toLowerCase().includes('sector') ||
            question.toLowerCase().includes('vertical')) {
          sector = answer || 'Other';
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
    Logger.log('Response body: ' + responseText);
    
    if (responseCode !== 200 && responseCode !== 201) {
      throw new Error('Backend returned error: ' + responseCode + ' - ' + responseText);
    }
    
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    
    // Optional: Send error notification via email
    // Uncomment and update email address if you want error notifications
    /*
    try {
      MailApp.sendEmail({
        to: 'your-email@example.com',
        subject: 'Form Submission Error - Derbi Admin',
        body: 'Error sending form response to backend:\n\n' + error.toString() + '\n\nStack trace:\n' + error.stack
      });
    } catch (emailError) {
      Logger.log('Failed to send error email: ' + emailError.toString());
    }
    */
  }
}

// Set up the trigger (run this once)
function setupTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger('onFormSubmit')
    .timeBased()
    .onFormSubmit()
    .create();
}
```

### Step 3: Configure the Script

1. **Update the API_URL**: Replace `http://localhost:5000/api/responses` with your actual backend URL
2. **Identify your sector field**: Update the field name check (line with `question.toLowerCase().includes('sector')`) to match your actual sector field name
3. **Save the script** (Ctrl+S or Cmd+S)

### Step 4: Set Up the Trigger

1. In the Apps Script editor, click on the clock icon (Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Function to run**: `onFormSubmit`
   - **Event source**: **From form**
   - **Event type**: **On form submit**
4. Click **Save**
5. Authorize the script when prompted (it needs permissions to access Forms, Drive, and make HTTP requests)

### Step 5: Test

1. Submit a test response to your Google Form
2. Check the Apps Script execution log (View → Executions) to see if it ran successfully
3. Check your backend logs to confirm the data was received

## Option 2: Manual Import via CSV

If you prefer a manual approach or Apps Script isn't suitable:

### Step 1: Export from Google Forms

1. Open your Google Form
2. Go to **Responses** tab
3. Click the **Google Sheets** icon to link responses to a spreadsheet
4. Export the spreadsheet as CSV

### Step 2: Create an Import Script

Create a script to parse the CSV and send it to your backend. You can use Node.js:

```javascript
import fs from 'fs';
import csv from 'csv-parser';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/responses';

fs.createReadStream('form-responses.csv')
  .pipe(csv())
  .on('data', async (row) => {
    // Map CSV columns to your form structure
    const formData = { ...row };
    const sector = row['Sector'] || 'Other'; // Adjust column name
    
    // Process file uploads if present in CSV
    const uploadedFiles = [];
    // Add logic to process file references from CSV
    
    try {
      await axios.post(API_URL, {
        sector,
        formData,
        uploadedFiles
      });
      console.log('Imported:', row);
    } catch (error) {
      console.error('Error importing:', error);
    }
  })
  .on('end', () => {
    console.log('Import complete');
  });
```

## Option 3: Google Forms API (Advanced)

For more control, you can use the Google Forms API to periodically fetch responses:

1. Enable Google Forms API in Google Cloud Console
2. Set up OAuth2 authentication
3. Create a scheduled job to fetch new responses
4. Send them to your backend API

## Important Notes

### File Uploads

Google Forms stores uploaded files in Google Drive. The Apps Script method can access these files, but you'll need to:

1. **Option A**: Keep files in Google Drive and store the Drive URLs in your database
2. **Option B**: Download files from Drive and store them on your server
3. **Option C**: Use Google Drive API to access files on-demand

### Field Mapping

Make sure to identify which field in your Google Form corresponds to:
- **Sector**: Used for pie chart distribution (e.g., "Industry Segment/ Vertical")
- **Company Name**: Used for file renaming (e.g., "Name of Startup (As per Incorporation/ Registration Certificate)")
- **Founder Name**: Used for file renaming (e.g., "Name of Founders")
- **File uploads**: The 4 file upload fields (Pitch Deck, CIN, Audited Financial Statements, Startup India-DPIIT Certificate)

Update the script configuration constants at the top to match your exact field names:
- `COMPANY_NAME_KEYWORDS` - Keywords to identify the company name field
- `FOUNDER_NAME_KEYWORDS` - Keywords to identify the founder name field
- `PITCH_DECK_KEYWORDS` - Keywords to identify the Pitch Deck upload field
- `CIN_KEYWORDS` - Keywords to identify the CIN upload field

### File Renaming

The script automatically renames uploaded files in Google Drive with the following format:
- **Format**: `{responseIndex}. {prefix}_{CompanyName}_{FounderName}.{extension}`
- **Pitch Deck**: `1. PD_DERBI Foundation_Sathya.pdf` (where "1" is the response number)
- **CIN**: `1. CIN_DERBI Foundation_Sathya.pdf`
- The number represents the **response index/number** (which form submission this is), not a file counter
- All files from the same form submission will have the same response number
- Example: If this is the 5th form submission, all files will be named starting with "5."

### Security

1. **Change default admin credentials**: The default admin username is `admin` and password is `admin123`. Change these immediately in production!
2. **Use HTTPS**: In production, ensure your backend API uses HTTPS
3. **API Authentication**: Consider adding API key authentication for the `/api/responses` POST endpoint if it will be publicly accessible

### Testing

1. Start your backend server: `cd backend && npm start`
2. Test the API endpoint directly:
   ```bash
   curl -X POST http://localhost:5000/api/responses \
     -H "Content-Type: application/json" \
     -d '{
       "sector": "HealthTech",
       "formData": {
         "Company Name": "Test Company",
         "Email": "test@example.com"
       },
       "uploadedFiles": []
     }'
   ```
3. Verify the response appears in your dashboard

## Troubleshooting

- **Script not running**: Check that the trigger is set up correctly and authorized
- **Files not uploading**: Verify Drive API permissions in Apps Script
- **Data not appearing**: Check backend logs and MongoDB connection
- **CORS errors**: Ensure your backend CORS settings allow requests from Google Apps Script

## Support

If you encounter issues, check:
1. Backend server logs
2. Apps Script execution logs (View → Executions)
3. Browser console for frontend errors
4. MongoDB connection status

