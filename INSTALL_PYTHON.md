# Python Installation Guide

Python is **not currently installed** on your system. Follow these steps to install it:

## Quick Installation Steps

### Step 1: Download Python
1. Go to: **https://www.python.org/downloads/**
2. Click the big yellow "Download Python 3.x.x" button (latest version)
3. The download will start automatically

### Step 2: Install Python
1. Run the downloaded installer (e.g., `python-3.12.x-amd64.exe`)
2. **IMPORTANT:** Check the box that says **"Add Python to PATH"** at the bottom of the installer
3. Click "Install Now"
4. Wait for installation to complete
5. Click "Close" when done

### Step 3: Verify Installation
1. **Close and reopen** your PowerShell/terminal window
2. Run:
   ```powershell
   python --version
   ```
3. You should see: `Python 3.x.x`

### Step 4: Install Python Dependencies
Once Python is installed, run:
```powershell
cd ImmigrateAIFullStack.Server\PythonChatbotAPI
python -m pip install -r requirements.txt
```

## Alternative: Using Microsoft Store (Not Recommended)
- Windows may prompt you to install from Microsoft Store
- This version can have limitations for development
- **Better option:** Use the official installer from python.org (steps above)

## Troubleshooting

**If Python is still not found after installation:**
1. Restart your computer (sometimes needed for PATH changes)
2. Or manually add Python to PATH:
   - Find Python installation: Usually `C:\Users\semil\AppData\Local\Programs\Python\Python3xx\`
   - Add to System Environment Variables PATH
   - Search Windows for "Environment Variables" → Edit System Environment Variables → Environment Variables → Path → Edit → Add Python folder

**If pip is not found:**
- Use: `python -m pip install -r requirements.txt` instead of just `pip install`

## What You're Installing
- **Python 3.8+** (3.11 or 3.12 recommended)
- **pip** (Python package manager) - comes with Python
- Required packages: Flask, Cohere, NumPy, Pandas

