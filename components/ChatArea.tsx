import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, AgentType } from '../types';
import { AGENTS } from '../constants';
import { User, Bot, ArrowRight } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages }) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {messages.map((msg) => {
        if (msg.isInternalLog) {
            return <SystemLog key={msg.id} content={msg.content} />;
        }
        return <ChatBubble key={msg.id} message={msg} />;
      })}
    </div>
  );
};

const SystemLog: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex items-center gap-2 px-4 py-2 my-2 bg-gray-100/80 rounded-lg border border-gray-200 mx-auto max-w-xl animate-in fade-in zoom-in-95 duration-300">
    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    <div className="text-xs text-gray-500 font-mono flex-1">
        <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </div>
);

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const agentConfig = message.agent ? AGENTS[message.agent] : AGENTS[AgentType.NAVIGATOR];

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm
          ${isUser ? 'bg-gray-800' : agentConfig.color}
        `}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          {!isUser && (
            <span className="text-xs font-bold text-gray-500 ml-1">
              {agentConfig.name}
            </span>
          )}
          
          <div className={`
            p-4 rounded-2xl shadow-sm text-sm leading-relaxed
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
          `}>
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ul:pl-4">
              <ReactMarkdown
                 components={{
                    p: ({node, ...props}) => <p className={isUser ? 'text-white' : 'text-gray-800'} {...props} />,
                    strong: ({node, ...props}) => <strong className={isUser ? 'font-bold text-white' : 'font-bold text-gray-900'} {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-4" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                 }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          
          <span className={`text-[10px] text-gray-400 ${isUser ? 'mr-1 text-right' : 'ml-1'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;