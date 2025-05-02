'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';

const ChatBox = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleSendQuery = async () => {
    if (query.trim() === '') return;

    // Add user message to messages
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('http://0.0.0.0:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMessage = { role: 'assistant', content: data.message };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again.' },
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please check your connection.' },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed right-0 top-0 w-[420px] h-screen border-l border-gray-200 bg-gray-50 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 bg-white hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-12">
            <svg className="w-8 h-8 mb-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"/>
            </svg>
            <p>Get started with Setu! Ask your onboarding-related question.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'}`}>
              <p className="text-sm text-gray-800">{msg.content}</p>
            </div>
          ))
        )}
        {loading && <p className="text-gray-400 italic text-sm">Setu is typing...</p>}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center space-x-3">
          <span className="text-gray-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Ask me anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 text-gray-700 border rounded-lg focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          />
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 bg-white hover:bg-gray-100" onClick={handleSendQuery}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l14-9v18l-14-9z" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
