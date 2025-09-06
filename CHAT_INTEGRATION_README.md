# ImmigrationAI Chat Integration

## Overview
This project now integrates a Python Flask chatbot with a .NET backend and React frontend to provide an intelligent immigration application assistant.

## Architecture
- **Frontend**: React + TypeScript (ChatPage component)
- **Backend**: .NET 8 Web API with ChatController
- **AI Service**: Python Flask app with Cohere LLM integration
- **Database**: SQLite for conversation persistence

## Setup Instructions

### 1. Start the Flask Chatbot Service
```bash
cd ImmigrateAIFullStack.Server\PythonChatbotAPI
python app.py
# OR use the startup script:
python start_chatbot.py
```
The Flask service will run on `http://localhost:5000`

### 2. Start the .NET Backend
```bash
cd ImmigrateAIFullStack.Server
dotnet run
```

### 3. Start the React Frontend
```bash
cd immigrateaifullstack.client
npm run dev
```

### 4. Use the Startup Script (Windows)
Simply run `start_services.bat` to start both services automatically.

## API Endpoints

### Chat Endpoints
- `POST /api/chat/initialize` - Start a new conversation
- `POST /api/chat/chat-step` - Send a message and get AI response
- `GET /api/chat/conversation/{id}` - Load existing conversation
- `POST /api/chat/conversation/{id}/save` - Save conversation state
- `DELETE /api/chat/conversation/{id}` - Delete conversation

## How It Works

1. **Chat Initialization**: When ChatPage loads, it automatically calls `/api/chat/initialize` to start a new conversation
2. **Message Processing**: Each user message is sent to `/api/chat/chat-step` which forwards it to the Flask chatbot
3. **AI Responses**: The Python chatbot processes the input using Cohere LLM and returns intelligent responses
4. **State Management**: Conversation state is maintained on both the Flask side and can be persisted to the .NET database

## Features

- **Real-time Chat**: Live conversation with AI immigration assistant
- **Conversation Persistence**: Chat history is saved and can be resumed
- **Intelligent Responses**: Uses Cohere LLM for natural language understanding
- **Form Validation**: AI validates user inputs and provides feedback
- **Multi-language Support**: Can handle conversations in different languages

## Troubleshooting

### Common Issues

1. **Flask Service Not Starting**: Ensure Python and required packages are installed
2. **Connection Errors**: Check that Flask is running on port 5000
3. **CORS Issues**: The .NET backend should handle CORS automatically
4. **API Errors**: Check browser console and .NET logs for detailed error messages

### Logs
- Flask logs: Check the Flask command window
- .NET logs: Check the .NET command window
- Frontend logs: Check browser developer console

## Next Steps

1. **Add Authentication**: Protect chat endpoints with JWT tokens
2. **Database Integration**: Store conversations in SQLite database
3. **Form Generation**: Generate immigration forms based on collected data
4. **File Uploads**: Allow users to upload supporting documents
5. **Progress Tracking**: Show interview progress and completion status
