'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';

interface Message {
  from: 'user' | 'ai';
  text: string;
}

export default function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'ai', text: 'Hi there! Tell me what you’re looking for in a roommate.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(m => [...m, { from: 'user', text: input }]);
    setInput('');

    // Mock AI “matching” response
    setTimeout(() => {
      setMessages(m => [
        ...m,
        {
          from: 'ai',
          text: 'Great! Based on that, I see a match in Berkeley—$750/mo, 2BR, early riser preferred. Interested?'
        }
      ]);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-4 shadow-md">
      <div className="h-64 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                px-4 py-2 rounded-lg max-w-[70%]
                ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
