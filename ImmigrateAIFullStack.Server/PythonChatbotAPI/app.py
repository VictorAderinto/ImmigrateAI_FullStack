from flask import Flask, request, jsonify
import uuid
import json
import os
import glob
import shutil
from datetime import datetime
from chatbot_copy import chat_step, fill_pdf

app = Flask(__name__)

# Simple health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ready", "message": "API is ready to process requests"}), 200

@app.route("/initialize", methods=["POST"])
def initialize():
    """Start a new conversation - now stateless"""
    
    # Get conversation_id from request body if provided, otherwise generate one
    data = request.get_json() or {}
    conversation_id = data.get("conversation_id", str(uuid.uuid4()))
    
    state = {"answers": {}, "messages": [], "question_index": 0, "skip": 0, "attempt_counter": {}}

    # First question comes from chat_step with empty input
    result = chat_step(state, "")
    
    # Add initial instructions before the first question
    initial_instructions = """🎯 Welcome to your Study Permit Application Assistant!

I'll guide you through the application process step by step. Here's what you need to know:

📋 **What to expect:**
• I'll ask you questions about your personal information, education, and travel plans
• You can ask me questions anytime by ending your message with a question mark (?)

💡 **Tips for success:**
• Answer honestly and completely
• If you're unsure about something, ask me for clarification
• Have your passport and educational documents ready
• Take your time - there's no rush!

Let's get started! 👇"""
    
    # Combine instructions with the first question
    combined_reply = initial_instructions + "\n\n" + result["reply"]
    
    return jsonify({
        "conversation_id": conversation_id,
        "reply": combined_reply,
        "state": result["state"],
        "done": result["done"]
    })

@app.route("/chat-step", methods=["POST"])
def chat_step_endpoint():
    """Send a message and get chatbot reply - now stateless"""
        
    data = request.json
    conversation_id = data.get("conversation_id")
    user_input = data.get("user_input", "")
    current_state = data.get("state", {})

    if not conversation_id:
        return jsonify({"error": "conversation_id required"}), 400

    if not current_state:
        return jsonify({"error": "current_state required"}), 400

    # Process with AI using provided state
    result = chat_step(current_state, user_input)

    # Return result (don't save to file)
    return jsonify(result)

@app.route("/generate-pdfs", methods=["POST"])
def generate_pdfs():
    """Generate PDF forms from user answers"""
    try:
        data = request.json
        answers = data.get("answers", {})
        conversation_id = data.get("conversation_id", str(uuid.uuid4()))
        
        if not answers:
            return jsonify({"error": "No answers provided"}), 400
        
        # Clean up old files first
        cleanup_old_files()
        
        # Generate PDFs using the fill_pdf function
        pdf_results = fill_pdf(answers)
        
        # Find generated PDF files and rename them with unique names
        generated_files = []
        failed_forms = []
        # Check where files are actually generated (others/publish)
        source_folders = ["others/publish"]
        # Check additional folders in case files are generated there
        additional_folders = [
            "others/publish_5406e",
            "others/publish_1294e", 
            "others/publish_5646e",
            "others/publish_5409e",
            "others/publish_0104e"
        ]
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Use publish_5406e as the target folder for storing renamed files (for download endpoint)
        target_folder = "others/publish_5406e"
        # Create target folder if it doesn't exist
        os.makedirs(target_folder, exist_ok=True)
        
        # Check source folders first (where files are actually generated)
        for folder in source_folders + additional_folders:
            if os.path.exists(folder):
                # Look for filled PDF files (not the template files)
                pdf_files = glob.glob(os.path.join(folder, "filled_*.pdf"))
                for pdf_file in pdf_files:
                    # Create unique filename
                    original_name = os.path.basename(pdf_file)
                    new_name = f"{conversation_id}_{timestamp}_{original_name}"
                    new_path = os.path.join(target_folder, new_name)
                    
                    # Copy file with new name to target folder
                    shutil.copy2(pdf_file, new_path)
                    generated_files.append(new_name)
        
        # Check which forms failed (if pdf_results is available)
        if pdf_results:
            for form_name, result in pdf_results.items():
                if not result.get("success", False):
                    failed_forms.append({
                        "form": form_name,
                        "error": result.get("error", "Unknown error")
                    })
        
        response_data = {
            "message": "PDFs generated successfully",
            "files": generated_files,
            "total_generated": len(generated_files)
        }
        
        # Include failure information if any forms failed
        if failed_forms:
            response_data["warnings"] = f"{len(failed_forms)} form(s) failed to generate"
            response_data["failed_forms"] = failed_forms
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            "error": "PDF generation failed",
            "message": str(e)
        }), 500

def cleanup_old_files():
    """Clean up PDF files older than 24 hours"""
    try:
        publish_folders = [
            "others/publish_5406e",
            "others/publish_1294e", 
            "others/publish_5646e",
            "others/publish_5409e",
            "others/publish_0104e"
        ]
        
        current_time = datetime.now()
        cutoff_time = current_time.timestamp() - (24 * 60 * 60)  # 24 hours ago
        
        for folder in publish_folders:
            if os.path.exists(folder):
                # Look for files that match our naming pattern
                pattern = os.path.join(folder, "*_*_filled_*.pdf")
                files = glob.glob(pattern)
                
                for file_path in files:
                    try:
                        file_time = os.path.getmtime(file_path)
                        if file_time < cutoff_time:
                            os.remove(file_path)
                            print(f"Cleaned up old file: {file_path}")
                    except Exception as e:
                        print(f"Error cleaning up file {file_path}: {e}")
                        
    except Exception as e:
        print(f"Error in cleanup_old_files: {e}")

if __name__ == "__main__":
    print("🌐 Starting Flask server on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
