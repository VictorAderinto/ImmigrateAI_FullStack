import React from "react";
import { X, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnswerItem from "./AnswerItem";
import { getQuestionText } from "../utils/questionMappings";
import { getAuthHeaders } from "../utils/auth";

interface AnsweredQuestion {
  field: string;
  answer: string;
}

interface AnswersSidebarProps {
  answers: Record<string, string>;
  conversationId: string | null;
  onAnswerUpdate: (field: string, value: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

const AnswersSidebar: React.FC<AnswersSidebarProps> = ({
  answers,
  conversationId,
  onAnswerUpdate,
  isOpen,
  onToggle
}) => {
  const { t } = useTranslation();

  // Convert answers to array and group by category
  const answeredQuestions: AnsweredQuestion[] = Object.entries(answers)
    .filter(([_, answer]) => answer && answer.trim() !== '')
    .map(([field, answer]) => ({ field, answer }));


  const handleAnswerUpdate = async (field: string, value: string) => {
    if (!conversationId) {
      throw new Error('No conversation ID available');
    }
    
    try {
      const response = await fetch('/api/chat/update-answer', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conversation_id: conversationId,
          field: field,
          answer: value
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update answer');
      }

      // Call the parent's update handler to refresh local state
      await onAnswerUpdate(field, value);
    } catch (error) {
      console.error('Error updating answer:', error);
      throw error;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-24 h-[calc(100vh-6rem)] w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-600" />
           <h2 className="text-lg font-semibold text-gray-900">
             {t("Edit Answers")}
           </h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {answeredQuestions.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {answeredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {t("No answers yet. Start chatting to see your responses here.")}
            </p>
          </div>
         ) : (
           <div className="space-y-3">
             {answeredQuestions.map((question) => (
               <AnswerItem
                 key={question.field}
                 field={question.field}
                 question={getQuestionText(question.field)}
                 answer={question.answer}
                 onUpdate={handleAnswerUpdate}
               />
             ))}
           </div>
         )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {t("Answers are saved automatically when you edit them.")}
        </p>
      </div>
    </div>
  );
};


export default AnswersSidebar;
