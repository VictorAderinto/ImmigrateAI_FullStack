import React, { useState, useRef, useEffect } from "react";
import { Loader2, Download, Send, CircleDotDashed, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAuthHeaders, isAuthenticated } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import AnswersSidebar from "./AnswersSidebar";


const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ sender: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Keep for backend storage - answers are stored but not displayed
  const [isInitializing, setIsInitializing] = useState(false); // Prevent multiple initialize calls
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [chatState, setChatState] = useState<any>(null); // Store the chat state
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]); // Store generated PDF files
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state
  
  // Timer state - calculated based on questions answered
  const calculateTimeRemaining = () => {
    if (!chatState || !chatState.question_index) return 45 * 60; // Default 45 minutes
    const questionsAnswered = chatState.question_index;
    const timeUsed = questionsAnswered * 15; // 15 seconds per question
    return Math.max(0, (45 * 60) - timeUsed); // 45 minutes minus time used
  };
  
  const timeRemaining = calculateTimeRemaining();
  const timerActive = !isChatComplete && timeRemaining > 0;

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
  }, [navigate]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Function to fetch answers from backend
  const fetchAnswers = async () => {
    if (!conversationId) {
      console.log('=== CONVERSATION ID DEBUG - FETCH ANSWERS ===');
      console.log('No conversation ID, skipping fetchAnswers');
      return;
    }
    
    console.log('=== CONVERSATION ID DEBUG - FETCH ANSWERS ===');
    console.log('Fetching answers for conversation ID:', conversationId);
    
    try {
      const response = await fetch(`/api/chat/conversation/${conversationId}/answers`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const answersData = await response.json();
        setAnswers(answersData);
        console.log('Answers fetched successfully:', Object.keys(answersData).length, 'answers');
        console.log('Fetched answers dictionary:', answersData);
      } else if (response.status === 404) {
        console.log('No active conversation found, answers will be populated as chat progresses');
        // Don't show error for 404, just wait for answers to be populated
        setAnswers({});
      } else {
        console.error('Failed to fetch answers:', response.statusText);
        // Fallback: try to get answers from chat state
        if (chatState && chatState.answers) {
          setAnswers(chatState.answers);
          console.log('Using answers from chat state as fallback');
        }
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
      // Fallback: try to get answers from chat state
      if (chatState && chatState.answers) {
        setAnswers(chatState.answers);
        console.log('Using answers from chat state as fallback after error');
      }
    }
  };

  // Timer functions - now calculated dynamically based on question_index
  const handleQuestionAnswered = () => {
    // Timer is now calculated automatically based on question_index
    // No need to manually update timer state
  };

  // Show time up message when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !isChatComplete && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.content.includes("Time's up")) {
        setMessages(msgs => [
          ...msgs,
          { sender: "AI", content: "⏰ Time's up! The interview session has ended. You can still review and edit your answers, or start a new session." }
        ]);
      }
    }
  }, [timeRemaining, isChatComplete, messages]);

  // Note: Answers are now set directly from initialize response
  // No need for immediate fetchAnswers() call since we have transaction isolation



  // Periodic refresh to ensure answers stay synchronized (only for active chats)
  useEffect(() => {
    if (!conversationId || isChatComplete) return;
    
    const interval = setInterval(() => {
      fetchAnswers();
    }, 60000); // Refresh every 60 seconds (less aggressive)
    
    return () => clearInterval(interval);
  }, [conversationId, isChatComplete]);

  // Initialize chat when component mounts - only run once
  useEffect(() => {
    const initializeChat = async () => {
      // Prevent multiple initialize calls
      if (isInitializing || conversationId) {
        console.log('=== INITIALIZE CHAT SKIPPED ===');
        console.log('isInitializing:', isInitializing, 'conversationId:', conversationId);
        return;
      }
      
      try {
        console.log('=== INITIALIZE CHAT CALLED ===');
        console.log('Current conversationId state:', conversationId);
        setIsInitializing(true);
        setLoading(true);
        
        // Always call initialize - it handles both new and existing users
        console.log('Calling /api/chat/initialize...');
        console.log('Request timestamp:', new Date().toISOString());
        const initResponse = await fetch('/api/chat/initialize', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        console.log('Initialize response received at:', new Date().toISOString());
        
        if (initResponse.ok) {
          const initData = await initResponse.json();
          console.log('=== CONVERSATION ID DEBUG - INITIALIZE ===');
          console.log('Initialize response conversation_id:', initData.conversation_id);
          setConversationId(initData.conversation_id);
          console.log('Set conversation ID to:', initData.conversation_id);
          setIsChatComplete(initData.done || false);
          setChatState(initData.state); // Store the chat state
          setMessages([{ sender: "AI", content: initData.reply }]);
          
          // Set answers from initialize response - this is the source of truth
          if (initData.state && initData.state.answers) {
            setAnswers(initData.state.answers);
            console.log('Answers set from initialize response:', Object.keys(initData.state.answers).length, 'answers');
            console.log('Current answers dictionary:', initData.state.answers);
          }
          
          // Timer is now calculated automatically based on question_index
        } else {
          console.error('Failed to initialize chat');
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, []); // Empty dependency array - only run once on mount

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { sender: "You", content: input.trim() };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!conversationId) {
        // Don't initialize here - let the useEffect handle it
        console.log('=== CONVERSATION ID DEBUG - NO CONVERSATION ID ===');
        console.log('No conversation ID, but not initializing here. Let useEffect handle it.');
        console.log('isInitializing:', isInitializing);
        
        // If we're not initializing, something went wrong
        if (!isInitializing) {
          console.error('No conversation ID and not initializing - this should not happen');
          setMessages((msgs) => [
            ...msgs,
            { sender: "AI", content: "Please wait, initializing chat..." }
          ]);
          return;
        }
        
        // If we are initializing, just wait
        setMessages((msgs) => [
          ...msgs,
          { sender: "AI", content: "Please wait, initializing chat..." }
        ]);
        return;
      } else {
        // Send chat step
        console.log('=== CONVERSATION ID DEBUG - CHAT STEP ===');
        console.log('Sending chat step - conversation ID:', conversationId, 'user input:', userMsg.content);
        console.log('Current conversationId state:', conversationId);
        
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

        // Track that a question was answered
        handleQuestionAnswered();

        // Refresh answers after each chat step
        await fetchAnswers();
        
        // Log current answers after each chat step
        console.log('Answers after chat step:', answers);
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

  // Function to handle answer updates from sidebar
  const handleAnswerUpdate = async (field: string, value: string) => {
    // Update local answers state immediately for optimistic update
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Also update chat state if it exists
    if (chatState) {
      setChatState((prev: any) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [field]: value
        }
      }));
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
    <div className="bg-gray-50">
      {/* Sidebar Toggle Button */}
      <div className="fixed top-24 right-4 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <FileText className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-gray-700">
            Edit Answers
          </span>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-96' : ''}`}>
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
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          {/* Timer Display */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{t("Estimated time remaining:")}</span>
            {timeRemaining > 0 ? (
              <>
                <span className="font-bold text-red-600">
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
                <span className="text-gray-500">{t("minutes")}</span>
              </>
            ) : (
              <span className="font-bold text-red-600">{t("Time's up!")}</span>
            )}
          </div>
          
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
      <div className="bg-white border-x border-b border-gray-200 px-8 pt-8 pb-4 rounded-b-xl min-h-[500px] flex flex-col">
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
        </div>
      </div>

      {/* Answers Sidebar */}
      <AnswersSidebar
        answers={answers}
        conversationId={conversationId}
        onAnswerUpdate={handleAnswerUpdate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
};

export default ChatPage; 