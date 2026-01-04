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

Copy and paste this script into the Apps Script editor:

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
      const answer = itemResponse.getResponse();
      
      // Store all form data
      formData[question] = answer;
      
      // Check if this is the sector field (adjust field name as needed)
      if (question.toLowerCase().includes('sector')) {
        sector = answer;
      }
      
      // Check for file uploads (Google Forms stores file IDs)
      if (Array.isArray(answer) && answer.length > 0) {
        // If answer is an array, it might be file uploads
        answer.forEach((fileId, index) => {
          try {
            const file = DriveApp.getFileById(fileId);
            uploadedFiles.push({
              fieldName: question,
              fileName: file.getName(),
              fileUrl: file.getUrl(),
              filePath: file.getId()
            });
          } catch (err) {
            console.log('Error processing file:', err);
          }
        });
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
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(API_URL, options);
    Logger.log('Response sent:', response.getResponseCode());
    
  } catch (error) {
    Logger.log('Error:', error);
    // You can also send error notifications via email
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: 'Form Submission Error',
      body: 'Error sending form response: ' + error.toString()
    });
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
- **Sector**: Used for pie chart distribution
- **File uploads**: The 4 file upload fields you mentioned

Update the script accordingly to map your actual field names.

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

