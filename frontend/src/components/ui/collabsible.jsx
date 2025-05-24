import React, { useState, useRef, useEffect } from "react";
import { MoveUp, MoveDown, Send } from "lucide-react";

const CollapsibleChat = ({ open = false, title = "Chat", currentUserId }) => {
  const [isOpen, setIsOpen] = useState(open);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: { id: currentUserId, username: "You" },
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 w-[350px] bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-100 rounded-t-lg">
        <button onClick={handleToggle} className="flex items-center w-full">
          {!isOpen ? <MoveUp size={15} fontStretch={50} /> : <MoveDown size={15} />}
          <h2 className="font-semibold text-gray-700">{title}</h2>
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col h-[400px]">
          {/* Chat messages */}
          <div className="flex-grow overflow-y-auto p-3 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet. Start chatting!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 p-2 rounded max-w-[80%] ${
                    msg.sender.id === currentUserId
                      ? "ml-auto bg-green-100"
                      : "bg-white border"
                  }`}
                >
                  <div className="text-xs text-gray-700 font-medium">
                    {msg.sender.username}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input field */}
          <div className="flex border-t px-3 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-grow border rounded px-2 py-1 mr-2"
            />
            <button
              onClick={handleSend}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleChat;
