import json
import os

# Path to the questions file
file_path = 'questions_file_updated.json'

# Read the JSON file
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Find the deleted position (107) and renumber all subsequent questions
deleted_position = 107
updated_count = 0

for question in questions:
    current_position = question.get('position')
    if current_position is not None and current_position > deleted_position:
        question['position'] = current_position - 1
        updated_count += 1

# Write the updated JSON back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"✅ Successfully renumbered {updated_count} questions.")
print(f"   Questions with position > {deleted_position} have been decremented by 1.")
print(f"   (Position {deleted_position + 1} → {deleted_position}, {deleted_position + 2} → {deleted_position + 1}, etc.)")

