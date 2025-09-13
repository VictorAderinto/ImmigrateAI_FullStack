import React, { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";

interface AnswerItemProps {
  field: string;
  question: string;
  answer: string;
  onUpdate: (field: string, value: string) => Promise<void>;
}

const AnswerItem: React.FC<AnswerItemProps> = ({ field, question, answer, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(answer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(answer);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(answer);
    setError(null);
  };

  const handleSave = async () => {
    if (editValue.trim() === answer.trim()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onUpdate(field, editValue.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Question */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-700 mb-1">{question}</h4>
      </div>

      {/* Answer Display/Edit */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
            rows={3}
            placeholder="Enter your answer..."
          />
          
          {error && (
            <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || editValue.trim() === ''}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group">
          <div className="text-gray-800 text-sm leading-relaxed mb-2 min-h-[1.5rem]">
            {answer || <span className="text-gray-400 italic">No answer provided</span>}
          </div>
          
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default AnswerItem;
