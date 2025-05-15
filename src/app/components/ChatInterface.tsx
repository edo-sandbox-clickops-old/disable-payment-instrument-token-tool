// app/components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { chatWithAIAction } from '../actions/chatWithAI'; // Ensure path is correct

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  logs: string[];
  csvData: Record<string, string>[];
}

export default function ChatInterface({ logs, csvData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage: ChatMessage = { sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    startTransition(async () => {
       try {
         const aiResponseText = await chatWithAIAction(userMessage.text, logs, csvData);
         const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
         setMessages(prev => [...prev, aiMessage]);
       } catch (error) {
         console.error("Chat API error:", error);
         const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error processing your request.' };
         setMessages(prev => [...prev, errorMessage]);
       } finally {
         setIsLoading(false);
       }
    });
  };

  const headingClasses = "text-xl font-semibold text-slate-800"; // Match ProcessorForm
  const inputBaseClasses = "block w-full text-sm rounded-md shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const textInputClasses = `${inputBaseClasses} border-slate-300 focus:border-blue-500 focus:ring-blue-500`;
  const buttonPrimaryClasses = "px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50";


  return (
    <div className="space-y-4">
      <h3 className={headingClasses}>Ask about results or data:</h3>
      {/* Message Display Area */}
      <div className="h-80 overflow-y-auto border border-slate-200 rounded-lg p-4 space-y-4 bg-white">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`inline-block px-4 py-2.5 rounded-xl max-w-[85%] break-words text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {msg.text} {/* Consider using a markdown renderer here if AI can output markdown */}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <span className="inline-block px-3 py-2 rounded-lg bg-slate-100 text-slate-500 italic text-sm">
               AI is thinking...
             </span>
           </div>
         )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          disabled={isLoading}
          placeholder="Ask about status, data from file, errors..."
          className={`${textInputClasses} flex-grow py-2.5 px-3`}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()} className={buttonPrimaryClasses}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}