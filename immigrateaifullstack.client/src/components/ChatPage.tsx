import React, { useState, useRef, useEffect } from "react";
import { Loader2, Download, Send, CircleDotDashed, Edit2, Check, X, Sidebar, X as CloseIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAuthHeaders, isAuthenticated } from "../utils/auth";
import { useNavigate } from "react-router-dom";


const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ sender: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [chatState, setChatState] = useState<any>(null); // Store the chat state
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]); // Store generated PDF files

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
  }, [navigate]);

  // Helper function to format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Function to fetch answers from backend
  const fetchAnswers = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch('/api/chat/conversation/current/answers', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const answersData = await response.json();
        setAnswers(answersData);
      } else {
        console.error('Failed to fetch answers:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  // Function to start editing an answer
  const startEditing = (field: string, currentAnswer: string) => {
    setEditingAnswer(field);
    setEditValue(currentAnswer);
  };

  // Function to save edited answer
  const saveEditedAnswer = async (field: string) => {
    if (!conversationId) return;

    try {
      // Update local state
      setAnswers(prev => ({
        ...prev,
        [field]: editValue
      }));

      // Update backend
      const response = await fetch('/api/chat/update-answer', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conversation_id: conversationId,
          field: field,
          answer: editValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update answer');
      }

      setEditingAnswer(null);
      setEditValue("");
    } catch (error) {
      console.error('Error updating answer:', error);
      // Revert local state on error
      setAnswers(prev => ({
        ...prev,
        [field]: answers[field] // Revert to original value
      }));
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingAnswer(null);
    setEditValue("");
  };

  // Fetch answers when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchAnswers();
    }
  }, [conversationId]);

  // Update estimated time remaining based on number of answers
  useEffect(() => {
    const answerCount = Object.keys(answers).length;
    const timeReduction = answerCount * 15;
    setEstimatedTimeRemaining(Math.max(0, 45 * 60 - timeReduction));
  }, [answers]);

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // First, check if there's an existing conversation
        const currentResponse = await fetch('/api/chat/conversation/current', {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (currentResponse.ok) {
          // User has an existing conversation, use it
          const currentData = await currentResponse.json();
          setConversationId(currentData.conversation_id);
          setChatState(currentData.state);
          
          // Get the next question for the existing conversation
          const initResponse = await fetch('/api/chat/initialize', {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (initResponse.ok) {
            const initData = await initResponse.json();
            setIsChatComplete(initData.done || false);
            setChatState(initData.state); // Update with latest state
            setMessages([{ sender: "AI", content: initData.reply }]);
          }
        } else if (currentResponse.status === 404) {
          // No existing conversation, create a new one
          const initResponse = await fetch('/api/chat/initialize', {
            method: 'POST',
            headers: getAuthHeaders()
          });
          
          if (initResponse.ok) {
            const initData = await initResponse.json();
            setConversationId(initData.conversation_id);
            setIsChatComplete(initData.done || false);
            setChatState(initData.state); // Store the chat state
            setMessages([{ sender: "AI", content: initData.reply }]);
          } else {
            console.error('Failed to initialize chat');
          }
        } else {
          console.error('Failed to check current conversation');
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { sender: "You", content: input.trim() };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!conversationId) {
        // Initialize chat
        const initResponse = await fetch('/api/chat/initialize', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        
        if (!initResponse.ok) {
          throw new Error('Failed to initialize chat');
        }
        
        const initData = await initResponse.json();
        console.log('Chat initialized - response:', initData);
        console.log('Setting conversation ID:', initData.conversation_id);
        
        setConversationId(initData.conversation_id);
        setIsChatComplete(initData.done || false);
        setChatState(initData.state); // Store the chat state
        
        // Add the initial AI response
        setMessages((msgs) => [
          ...msgs,
          { sender: "AI", content: initData.reply }
        ]);
      } else {
        // Send chat step
        console.log('Sending chat step - conversation ID:', conversationId, 'user input:', userMsg.content);
        
        const chatResponse = await fetch('/api/chat/chat-step', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            conversation_id: conversationId,
            user_input: userMsg.content,
            state: chatState // Include the current chat state
          })
        });
        
        console.log('Chat step response status:', chatResponse.status, chatResponse.statusText);
        
        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error('Chat step failed:', errorText);
          throw new Error(`Failed to process chat step: ${chatResponse.status} ${chatResponse.statusText}`);
        }
        
        const chatData = await chatResponse.json();
        console.log('Chat step response data:', chatData);
        
        setIsChatComplete(chatData.done || false);
        
        // Update the chat state for the next request
        if (chatData.state) {
          setChatState(chatData.state);
        }
        
        // Add the AI response
        setMessages((msgs) => [
          ...msgs,
          { sender: "AI", content: chatData.reply }
        ]);

        // Refresh answers after each chat step
        await fetchAnswers();
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((msgs) => [
        ...msgs,
        { sender: "AI", content: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForms = async () => {
    if (!conversationId || !isChatComplete) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chat/download-forms', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conversation_id: conversationId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('PDFs generated successfully:', result);
        
        // Store generated files
        setGeneratedFiles(result.files || []);
        
        // Show success message with download links
        const downloadLinks = result.files?.map((file: string) => 
          `<a href="/api/chat/download-file/${conversationId}/${file}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">${file}</a>`
        ).join(', ') || 'No files';
        
        setMessages((msgs) => [
          ...msgs,
          { sender: "AI", content: `✅ Your immigration forms have been generated successfully! Download your forms: ${downloadLinks}` }
        ]);
      } else {
        const errorData = await response.json();
        console.error('PDF generation failed:', errorData);
        
        // Show error message
        setMessages((msgs) => [
          ...msgs,
          { sender: "AI", content: `❌ Failed to generate forms: ${errorData.message || 'Unknown error'}` }
        ]);
      }
    } catch (error) {
      console.error('Error downloading forms:', error);
      setMessages((msgs) => [
        ...msgs,
        { sender: "AI", content: "❌ An error occurred while generating your forms. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      {/* Section Header */}
      <div className="bg-white rounded-t-xl border border-b-0 border-gray-200 px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("Personal Information")}</h2>
          <p className="text-gray-600 text-base mt-1">
            {isChatComplete 
              ? t("✅ Interview completed! Your forms are ready for download.") 
              : t("Tell me about yourself for your study permit application.")
            }
          </p>
          {!isChatComplete && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t("Estimated time remaining:")} <span className="font-semibold text-blue-600">{formatTime(estimatedTimeRemaining)} {t("minutes")}</span></span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-semibold transition"
            title="Toggle answers sidebar"
          >
            <Sidebar className="h-5 w-5" />
            <span className="hidden sm:inline">{sidebarOpen ? t('Hide Answers') : t('Show Answers')}</span>
            <span className="sm:hidden">{t("Answers")}</span>
          </button>
          <div className="flex flex-col items-end gap-2">
            {isChatComplete && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">{t("Forms Ready")}</span>
                <span className="sm:hidden">{t("Ready")}</span>
              </div>
            )}
            <button 
              className={`flex items-center gap-2 px-5 py-2 border rounded-lg font-semibold transition ${
                isChatComplete 
                  ? 'border-red-200 text-red-700 bg-white hover:bg-red-50' 
                  : 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
              disabled={!isChatComplete || loading}
              onClick={handleDownloadForms}
              title={isChatComplete ? "Download your completed forms" : "Complete the interview to download forms"}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className={`h-5 w-5 ${!isChatComplete ? 'opacity-50' : ''}`} />
              )}
              <span className="hidden sm:inline">{t("Download Forms")}</span>
              <span className="sm:hidden">{t("Download")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Bubble Area */}
      <div className={`bg-white border-x border-b border-gray-200 px-8 pt-8 pb-4 rounded-b-xl min-h-[500px] flex flex-col transition-all duration-300 ${sidebarOpen ? 'mr-96' : ''}`}>
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 400 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex mb-6 ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "AI" ? (
                <div className="flex items-start gap-4 w-full max-w-2xl">
                  <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mt-1">
                    <CircleDotDashed className="h-7 w-7" />
                  </span>
                  <div 
                    className="bg-gray-50 rounded-lg p-5 text-gray-800 text-base shadow-sm whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                </div>
              ) : (
                <div className="flex items-end gap-4 w-full max-w-2xl justify-end flex-row-reverse">
                  <div className="bg-gray-200 text-gray-900 rounded-lg p-4 text-base shadow-sm whitespace-pre-line">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-4 mb-6">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mt-1">
                <CircleDotDashed className="h-7 w-7 animate-spin" />
              </span>
              <div className="bg-gray-50 rounded-lg p-5 text-gray-800 text-base shadow-sm flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t("Thinking...")}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Download Section - Show when forms are generated */}
        {generatedFiles.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">📄 Your Immigration Forms</h3>
            <p className="text-green-700 mb-4">Your completed immigration forms are ready for download:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedFiles.map((file, index) => (
                <a
                  key={index}
                  href={`/api/chat/download-file/${conversationId}/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Download className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 truncate">
                    {file.replace(/^[^_]+_[^_]+_/, '').replace('.pdf', '')}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-3">
              💡 Tip: Save these forms to your computer and print them for your immigration application.
            </p>
          </div>
        )}

        {/* Message Input */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <form className="flex items-end gap-3" onSubmit={handleSend}>
            <button type="button" className="p-2 text-gray-400 hover:text-red-500 transition" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" /></svg>
            </button>
            <input
              type="text"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
              placeholder={t("Type your message... (Shift+Enter for new line)")}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSend(e as any);
                }
              }}
            />
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${input.trim() && !loading ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-300 text-white cursor-not-allowed"}`}
              disabled={!input.trim() || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {t("Send")}
            </button>
          </form>
          <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
            {t("Your information is secure and will only be used for your immigration application.")}
          </div>
        </div>
      </div>

      {/* Answers Sidebar */}
      {sidebarOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t("Your Answers")}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchAnswers}
                    className="p-2 text-gray-400 hover:text-blue-600 transition"
                    title="Refresh answers"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {Object.keys(answers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CircleDotDashed className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">{t("No answers yet. Start the interview to see your responses here.")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(answers).map(([field, answer], index) => (
                    <div key={field} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm flex-1 mr-2">
                          {index + 1}. {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <button
                          onClick={() => startEditing(field, answer)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition flex-shrink-0"
                          title="Edit answer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {editingAnswer === field ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder={t("Enter your answer...")}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditedAnswer(field)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                            >
                              <Check className="h-3 w-3" />
                              {t("Save")}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                            >
                              <X className="h-3 w-3" />
                              {t("Cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm">{answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage; 