# Translation Setup Instructions

## Step 1: Install Backend NuGet Package

Open a terminal in the `ImmigrateAIFullStack.Server` directory and run:

```bash
dotnet add package Google.Cloud.Translation.V2
```

## Step 2: Install Frontend npm Package

Open a terminal in the `immigrateaifullstack.client` directory and run:

```bash
npm install axios
```

## Step 3: Set up Google Cloud Translate API

### 3.1 Create Google Cloud Project
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Note down your project ID

### 3.2 Enable Cloud Translation API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Translation API"
3. Click on it and click "Enable"

### 3.3 Create API Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key that appears
4. **IMPORTANT**: Click on the API key to restrict it:
   - Under "API restrictions", select "Restrict key"
   - Check only "Cloud Translation API"
   - Under "Application restrictions", add your server IP or HTTP referrer restrictions
5. Save your restrictions

### 3.4 Configure API Key in Your Application

Replace `YOUR_GOOGLE_TRANSLATE_API_KEY_HERE` in both:
- `ImmigrateAIFullStack.Server/appsettings.json`
- `ImmigrateAIFullStack.Server/appsettings.Development.json`

With your actual Google Cloud API key.

**Example:**
```json
{
  "GoogleTranslate": {
    "ApiKey": "AIzaSyAbc123def456ghi789jkl012mno345pqr"
  }
}
```

## Step 4: Test the Translation Service

After starting your server, you can test the translation endpoint:

```bash
curl -X POST http://localhost:5000/api/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, how are you?","targetLanguage":"fr","sourceLanguage":"en"}'
```

Expected response:
```json
{
  "translatedText": "Bonjour, comment allez-vous?",
  "sourceLanguage": "en",
  "targetLanguage": "fr"
}
```

## Step 5: Security Considerations

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never commit your API key to version control**
   - Add `appsettings.Development.json` to `.gitignore` if not already there
   - Consider using environment variables for production

2. **Use API key restrictions**
   - Restrict by API (only Cloud Translation API)
   - Restrict by IP address or HTTP referrer
   - Set up billing alerts

3. **Monitor usage and costs**
   - Google Translate charges approximately $20 per 1 million characters
   - Set up budget alerts in Google Cloud Console
   - Monitor usage in the Google Cloud Console

## Pricing Information

Google Cloud Translation API pricing (as of 2024):
- **Standard Edition**: $20 per 1 million characters
- **Advanced Edition**: $25 per 1 million characters
- **Free tier**: First 500,000 characters per month are free

**Estimated costs for your application:**
- Average message: ~100 characters
- 1000 messages/day = ~100,000 characters/day
- Monthly cost: ~$60 (assuming 3M characters/month)
- With caching: can reduce by 50-70%

## Next Steps

After completing the setup:
1. Test the translation endpoints
2. Integrate translation into ChatPage component
3. Monitor translation costs and performance
4. Optimize caching strategies

## Troubleshooting

### Error: "Google Translate API key is not configured"
- Check that you've replaced `YOUR_GOOGLE_TRANSLATE_API_KEY_HERE` with your actual API key
- Restart your server after updating the configuration

### Error: "API key not valid"
- Verify your API key in Google Cloud Console
- Ensure the Cloud Translation API is enabled
- Check API key restrictions

### Error: "Request had insufficient authentication scopes"
- Make sure you're using an API key, not OAuth credentials
- Verify the API key has access to Cloud Translation API

### High costs
- Implement more aggressive caching
- Batch translation requests
- Consider using translation memory for common phrases

