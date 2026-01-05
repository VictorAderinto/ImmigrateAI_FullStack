# ImmigrateAI Full Stack Application

> **⚠️ First Time Setup:** If you're getting "Python was not found" or "dotnet is not recognized" errors, see the installation instructions in the [Prerequisites](#prerequisites) section below.

This is a full-stack application for immigration study permit assistance, consisting of three main components:

1. **React Frontend** (Vite + TypeScript) - Port 5173
2. **.NET 8.0 Backend API** - Port 5039 (HTTP) / 7205 (HTTPS)
3. **Python Flask Chatbot API** - Port 5000

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **.NET 8.0 SDK** (see installation instructions below)
- **Python 3.8+** and pip
- **SQLite** (comes with .NET)

### Installing .NET 8.0 SDK

If `dotnet` command is not recognized, you need to install the .NET 8.0 SDK:

1. **Download .NET 8.0 SDK:**
   - Visit: https://dotnet.microsoft.com/download/dotnet/8.0
   - Download the SDK (not just the runtime) for Windows x64
   - Run the installer

2. **Verify installation:**
   ```powershell
   dotnet --version
   ```
   Should display: `8.0.x` or higher

3. **Alternative: Using Visual Studio**
   - Install Visual Studio 2022 (Community edition is free)
   - Make sure to include ".NET desktop development" workload
   - Visual Studio includes the .NET SDK

### Installing Python 3.8+

If `python` command is not recognized, you need to install Python:

1. **Download Python:**
   - Visit: https://www.python.org/downloads/
   - Download Python 3.8 or higher (Python 3.11+ recommended)
   - **Important:** During installation, check the box "Add Python to PATH"

2. **Verify installation:**
   ```powershell
   python --version
   ```
   Should display: `Python 3.x.x`

3. **If Python is still not found after installation:**
   - Restart your terminal/PowerShell
   - If still not working, manually add Python to PATH:
     - Find Python installation (usually `C:\Users\YourName\AppData\Local\Programs\Python\Python3xx\`)
     - Add it to System Environment Variables PATH
   - Or use the full path: `C:\Users\YourName\AppData\Local\Programs\Python\Python3xx\python.exe`

4. **Alternative: Using Microsoft Store Python (not recommended for development)**
   - The Microsoft Store version may have limitations
   - Prefer the official Python.org installer instead

## Setup Instructions

### 1. Python Flask API Setup

Navigate to the Python API directory and install dependencies:

```powershell
cd ImmigrateAIFullStack.Server\PythonChatbotAPI
python -m pip install -r requirements.txt
```

**Note:** 
- If you have Python 3.14+, the requirements.txt has been updated to use compatible package versions
- You may need a Cohere API key for the chatbot to work. Check the `chatbot_copy.py` file for API key configuration.
- If you encounter installation errors, try: `python -m pip install --upgrade pip` first

### 2. React Frontend Setup

Navigate to the client directory and install dependencies:

```powershell
cd immigrateaifullstack.client
npm install
```

### 3. .NET Backend Setup

The .NET backend will automatically restore packages when you run it. The database (SQLite) will be created automatically on first run.

## Running the Application

You need to run all three components simultaneously. Open **three separate terminal windows**:

### Terminal 1: Python Flask API

```powershell
cd ImmigrateAIFullStack.Server\PythonChatbotAPI
python app.py
```

**If `python` is not recognized, try:**
- `py app.py` (Python launcher on Windows)
- `python3 app.py` (if you have both Python 2 and 3)
- Full path: `C:\Users\YourName\AppData\Local\Programs\Python\Python3xx\python.exe app.py`

The Flask API should start on `http://localhost:5000`

### Terminal 2: .NET Backend API

**Option A: Using dotnet CLI (requires .NET SDK installed)**
```powershell
cd ImmigrateAIFullStack.Server
dotnet run
```

**Option B: Using Visual Studio**
1. Open `ImmigrateAIFullStack.sln` in Visual Studio
2. Set `ImmigrateAIFullStack.Server` as the startup project
3. Press F5 or click "Run"

**Option C: Using the compiled executable (requires .NET 8.0 Runtime)**
If you have a pre-compiled executable but don't want to install the full SDK:
1. Install .NET 8.0 Runtime (smaller than SDK): https://dotnet.microsoft.com/download/dotnet/8.0
   - Choose "Runtime" (not SDK) - it's about 70MB vs 200MB+ for SDK
2. Run the executable:
```powershell
cd ImmigrateAIFullStack.Server\bin\Debug\net8.0
.\ImmigrateAIFullStack.Server.exe
```

The .NET API should start on:
- HTTP: `http://localhost:5039`
- HTTPS: `https://localhost:7205`
- Swagger UI: `http://localhost:5039/swagger` (in development mode)

### Terminal 3: React Frontend

```powershell
cd immigrateaifullstack.client
npm run dev
```

The React app should start on `https://localhost:5173`

## Accessing the Application

Once all three services are running:

- **Frontend**: Open your browser to `https://localhost:5173`
- **Backend API Swagger**: `http://localhost:5039/swagger` (for API testing)
- **Python API Health Check**: `http://localhost:5000/health`

## Project Structure

```
ImmigrateAIFullStack/
├── immigrateaifullstack.client/     # React + TypeScript frontend
├── ImmigrateAIFullStack.Server/     # .NET 8.0 backend API
│   ├── Controllers/                 # API controllers
│   ├── Models/                      # Database models
│   ├── Services/                    # Business logic services
│   └── PythonChatbotAPI/            # Python Flask chatbot API
│       ├── app.py                   # Flask application entry point
│       ├── chatbot_copy.py          # Chatbot logic
│       └── requirements.txt         # Python dependencies
└── README.md                        # This file
```

## Troubleshooting

### Python API not responding

**"Python was not found" error:**
- Install Python 3.8+ from https://www.python.org/downloads/
- **Important:** Check "Add Python to PATH" during installation
- Restart your terminal/PowerShell after installation
- Verify with: `python --version`
- If still not found, use full path: `C:\Users\YourName\AppData\Local\Programs\Python\Python3xx\python.exe app.py`

**Other Python issues:**
- If you have Python 3.14+, make sure requirements.txt uses compatible versions (numpy>=1.26.0, pandas>=2.1.0)
- Ensure Flask is installed: `python -m pip install flask==3.0.0`
- If `pip` is not found, try: `python -m pip install -r requirements.txt`
- If you get build errors with numpy/pandas, try: `python -m pip install --upgrade pip setuptools wheel`
- Check if port 5000 is already in use
- Verify Cohere API key is configured (if required)
- Make sure you're in the correct directory: `ImmigrateAIFullStack.Server\PythonChatbotAPI`

### .NET API issues

**"dotnet is not recognized" error:**
- Install .NET 8.0 SDK from https://dotnet.microsoft.com/download/dotnet/8.0
- Restart your terminal/PowerShell after installation
- Verify with: `dotnet --version`

**Alternative solutions:**
- Use Visual Studio to open and run the solution file (`ImmigrateAIFullStack.sln`)
- If a compiled executable exists, run it directly from `bin\Debug\net8.0\`

**Other issues:**
- Run `dotnet restore` to restore packages (if SDK is installed)
- Check if ports 5039/7205 are available
- Ensure .NET 8.0 SDK (not just runtime) is installed

### Frontend not connecting
- Ensure the backend is running first
- Check browser console for CORS errors
- Verify the proxy configuration in `vite.config.ts`

### Database issues
- The SQLite database (`immigrateai.db`) is created automatically
- If you need to reset, delete `immigrateai.db` and restart the .NET server

## Development Notes

- The .NET backend uses Entity Framework Core with SQLite
- The frontend uses Vite with React and TypeScript
- The Python API uses Flask and Cohere for AI chatbot functionality
- CORS is enabled for all origins in development mode
- JWT authentication is configured for user management

## Building for Production

### Frontend
```powershell
cd immigrateaifullstack.client
npm run build
```

### Backend
```powershell
cd ImmigrateAIFullStack.Server
dotnet publish -c Release
```


