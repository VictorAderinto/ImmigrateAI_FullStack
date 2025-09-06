#!/usr/bin/env python3
"""
Test script to debug the conversation flow issue.
This simulates the exact sequence that happens in the frontend.
"""

import requests
import json
import time
import urllib3

# Disable SSL warnings and verification for development testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
BACKEND_URL = "https://localhost:7205"
PYTHON_API_URL = "http://localhost:5000"

def test_python_api_directly():
    """Test the Python API directly to ensure it's working"""
    print("=== Testing Python API Directly ===")
    
    try:
        # Test initialize
        init_response = requests.post(f"{PYTHON_API_URL}/initialize")
        print(f"Python API /initialize status: {init_response.status_code}")
        if init_response.status_code == 200:
            init_data = init_response.json()
            print(f"Python API response: {json.dumps(init_data, indent=2)}")
        else:
            print(f"Python API error: {init_response.text}")
            return False
            
        # Test chat-step
        chat_response = requests.post(f"{PYTHON_API_URL}/chat-step", json={
            "conversation_id": "test-123",
            "user_input": "Hello",
            "state": {
                "answers": {},
                "messages": [],
                "question_index": 0,
                "skip": 0,
                "attempt_counter": {}
            }
        })
        print(f"Python API /chat-step status: {chat_response.status_code}")
        if chat_response.status_code == 200:
            chat_data = chat_response.json()
            print(f"Python API chat-step response: {json.dumps(chat_data, indent=2)}")
        else:
            print(f"Python API chat-step error: {chat_response.text}")
            return False
            
        return True
        
    except Exception as e:
        print(f"Python API test failed: {e}")
        return False

def test_backend_flow():
    """Test the backend flow (this will fail without auth, but we can see the logs)"""
    print("\n=== Testing Backend Flow ===")
    
    try:
        # Test initialize endpoint
        init_response = requests.post(f"{BACKEND_URL}/api/chat/initialize", 
                                    headers={"Authorization": "Bearer fake-token"},
                                    verify=False)  # Ignore SSL verification
        print(f"Backend /api/chat/initialize status: {init_response.status_code}")
        print(f"Backend response: {init_response.text}")
        
        # Test chat-step endpoint
        chat_response = requests.post(f"{BACKEND_URL}/api/chat/chat-step", 
                                    headers={"Authorization": "Bearer fake-token"},
                                    json={
                                        "conversation_id": "test-123",
                                        "user_input": "Hello"
                                    },
                                    verify=False)  # Ignore SSL verification
        print(f"Backend /api/chat/chat-step status: {chat_response.status_code}")
        print(f"Backend response: {chat_response.text}")
        
    except Exception as e:
        print(f"Backend test failed: {e}")

def main():
    print("Starting debug flow test...")
    
    # Test Python API first
    if test_python_api_directly():
        print("✅ Python API is working correctly")
    else:
        print("❌ Python API has issues")
        return
    
    # Test backend (will fail auth but we can see the logs)
    test_backend_flow()
    
    print("\n=== Test Complete ===")
    print("Check the backend logs for detailed information about what's happening.")
    print("The backend should be running with detailed logging enabled.")

if __name__ == "__main__":
    main()
