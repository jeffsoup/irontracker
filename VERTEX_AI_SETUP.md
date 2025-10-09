# Vertex AI Integration Setup Guide

This guide will help you set up Google's Vertex AI with Gemini model integration for the IronTracker AI chat feature.

## Prerequisites

1. Google Cloud Console account
2. A Google Cloud project with Vertex AI API enabled
3. Service Account with appropriate permissions

## Step 1: Google Cloud Setup

### 1.1 Create or Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

### 1.2 Enable Vertex AI API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Vertex AI API"
3. Click on it and press "Enable"

### 1.3 Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "irontracker-ai-service")
4. Add description: "Service account for IronTracker AI chat integration"
5. Click "Create and Continue"

### 1.4 Grant Permissions
Add the following roles to your service account:
- `Vertex AI User`
- `AI Platform Developer` (if available)

### 1.5 Generate Service Account Key
1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the JSON file
6. **Keep this file secure and never commit it to version control**

## Step 2: Environment Configuration

### 2.1 Create Environment File
Create a `.env.local` file in your project root (this file is gitignored):

```bash
# Google Cloud Configuration
VITE_GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### 2.2 Configure Environment Variables

**VITE_GOOGLE_CLOUD_PROJECT_ID**: Your Google Cloud project ID

**VITE_GOOGLE_CLOUD_LOCATION**: The region where Vertex AI is available (default: us-central1)

**VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY**: The entire JSON content from your service account key file as a single-line string

#### Example:
```bash
VITE_GOOGLE_CLOUD_PROJECT_ID=my-fitness-app-123456
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"my-fitness-app-123456","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"irontracker-ai@my-fitness-app-123456.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/irontracker-ai%40my-fitness-app-123456.iam.gserviceaccount.com"}
```

## Step 3: Installation

The required dependency is already installed:
```bash
npm install @google-cloud/vertexai
```

## Step 4: Usage

The AI chat feature is now integrated into your IronTracker app:

1. **Access**: Look for the floating AI chat button in the bottom-right corner of the app
2. **Features**:
   - Ask questions about exercises and form
   - Get workout plan recommendations
   - Request nutrition advice
   - General fitness guidance
   - Quick action buttons for common requests

3. **Quick Actions Available**:
   - Exercise Recommendations
   - Workout Plan Creation
   - Nutrition Advice
   - General Help

## Step 5: Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your app and log in
3. Click the AI chat button (robot icon) in the bottom-right corner
4. Try asking: "What are some good exercises for building chest muscles?"
5. Verify you receive a helpful response from the Gemini model

## Troubleshooting

### Common Issues:

1. **"VITE_GOOGLE_CLOUD_PROJECT_ID environment variable is required"**
   - Ensure your `.env.local` file exists and contains the correct project ID
   - Restart your development server after adding environment variables

2. **"Invalid service account key format"**
   - Make sure the service account key JSON is properly formatted as a single-line string
   - Escape any quotes in the JSON properly

3. **Authentication errors**
   - Verify your service account has the correct permissions
   - Check that the Vertex AI API is enabled for your project
   - Ensure the service account key is valid and not expired

4. **API quota exceeded**
   - Check your Google Cloud quotas in the Console
   - Consider implementing rate limiting for production use

### Environment Variables Not Loading:
If environment variables aren't loading:
1. Ensure the file is named `.env.local` (not `.env`)
2. Restart your development server
3. Check that variables start with `VITE_`
4. Verify no spaces around the `=` sign

## Security Notes

1. **Never commit service account keys to version control**
2. **Use environment variables for all sensitive data**
3. **Consider using Google Cloud Secret Manager for production**
4. **Regularly rotate service account keys**
5. **Monitor API usage and set up billing alerts**

## Production Deployment

For production deployment:

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Consider using Google Cloud Secret Manager instead of direct JSON keys
3. Implement proper error handling and user feedback
4. Add rate limiting to prevent abuse
5. Monitor API usage and costs

## Support

If you encounter issues:
1. Check the Google Cloud Console for API errors
2. Review the browser console for client-side errors
3. Verify all environment variables are correctly set
4. Ensure your Google Cloud billing is active

The AI chat feature should now be fully functional in your IronTracker application!

