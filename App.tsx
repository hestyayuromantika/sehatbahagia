import React, { useState, useRef, useEffect } from 'react';
import { AgentType, Message, ChatState } from './types';
import { routeRequest, generateAgentResponse } from './services/geminiService';
import { AGENTS } from './constants';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: 'welcome',
        role: 'system',
        content: "Selamat datang di Sistem Rumah Sakit. Saya adalah Navigator Anda. Bagaimana saya bisa membantu Anda hari ini? (Contoh: 'Saya ingin membuat janji temu' atau 'Saya butuh hasil lab saya')",
        agent: AgentType.NAVIGATOR,
        timestamp: new Date(),
      },
    ],
    isRouting: false,
    isGenerating: false,
    activeAgent: AgentType.NAVIGATOR,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isRouting, chatState.isGenerating]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isRouting: true,
      activeAgent: AgentType.NAVIGATOR, // Reset to navigator for routing
    }));

    try {
      // 2. Navigator routes the request
      const routingResult = await routeRequest(text);
      
      const targetAgent = routingResult.agent;
      const reasoning = routingResult.reasoning;

      // Add a small system log message to show the delegation (optional UI enhancement)
      const routingMsg: Message = {
        id: Date.now().toString() + '_routing',
        role: 'system',
        content: `Menganalisis permintaan... Delegasi ke: **${AGENTS[targetAgent].name}**. (Alasan: ${reasoning})`,
        agent: AgentType.NAVIGATOR,
        timestamp: new Date(),
        isInternalLog: true, 
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, routingMsg],
        isRouting: false,
        isGenerating: true,
        activeAgent: targetAgent,
      }));

      // 3. Sub-Agent processes the request
      // We pass the conversation context relevant to the task
      const agentResponse = await generateAgentResponse(
        targetAgent,
        text,
        chatState.messages // Pass history for context
      );

      const agentMsg: Message = {
        id: Date.now().toString() + '_response',
        role: 'model',
        content: agentResponse,
        agent: targetAgent,
        timestamp: new Date(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, agentMsg],
        isGenerating: false,
      }));

    } catch (error) {
      console.error("Error processing request:", error);
      const errorMsg: Message = {
        id: Date.now().toString() + '_error',
        role: 'system',
        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
        agent: AgentType.NAVIGATOR,
        timestamp: new Date(),
      };
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
        isRouting: false,
        isGenerating: false,
        activeAgent: AgentType.NAVIGATOR,
      }));
    }
  };

  const hasApiKey = !!process.env.API_KEY;

  if (!hasApiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-800 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Missing API Key</h1>
          <p>Please ensure <code className="bg-gray-200 px-1 rounded">process.env.API_KEY</code> is set in your environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Sidebar - Desktop hidden on mobile usually, but keeping simple for now */}
      <div className="hidden md:flex w-80 flex-col border-r border-gray-200 bg-gray-50/50">
        <Sidebar activeAgent={chatState.activeAgent} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Hospital System Navigator</h1>
            <p className="text-xs text-gray-500">AI Powered Multi-Agent System</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${chatState.isRouting || chatState.isGenerating ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-600">
              {chatState.isRouting ? 'Navigator Routing...' : 
               chatState.isGenerating ? `${AGENTS[chatState.activeAgent].name} working...` : 
               'Ready'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 relative scrollbar-hide">
          <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-4">
            <ChatArea messages={chatState.messages} />
            
            {/* Loading Indicators */}
            {chatState.isRouting && (
              <div className="flex items-center gap-2 text-sm text-gray-500 ml-4 animate-in fade-in slide-in-from-bottom-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Navigator sedang menganalisis permintaan...</span>
              </div>
            )}
            
            {chatState.isGenerating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 ml-4 animate-in fade-in slide-in-from-bottom-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span>{AGENTS[chatState.activeAgent].name} sedang mengetik...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-4 bg-white border-t border-gray-200 shrink-0">
          <div className="max-w-3xl mx-auto">
             <MessageInput 
                onSend={handleSendMessage} 
                disabled={chatState.isRouting || chatState.isGenerating} 
             />
          </div>
        </footer>
      </div>
    </div>
  );
};

// Simple Input Component extracted for cleanliness
const MessageInput: React.FC<{ onSend: (text: string) => void; disabled: boolean }> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Harap tunggu..." : "Ketik pesan Anda di sini..."}
        className="w-full bg-gray-100 text-gray-900 placeholder-gray-500 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl py-3 px-4 outline-none transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  );
};

export default App;