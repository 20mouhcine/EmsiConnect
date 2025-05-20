import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useParams } from "react-router-dom";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastPollTimeRef = useRef(Date.now());
  const { selectedUser } = useParams();
  
  // CSS for fade-in animation
  const fadeInStyle = {
    animation: "fadeIn 0.5s ease",
  };
  
  // Add the animation to the document if it doesn't exist
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Better auto-scroll that always shows new messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Always scroll to bottom when receiving new messages
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  
  // Scroll when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 100);
  }, [messages.length, scrollToBottom]);
  
  // Mark messages as read - MOVED UP BEFORE IT'S USED
  const updateReadStatus = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const currentUserId = localStorage.getItem("user_id");
      const unreadMessages = messages.filter(
        msg => !msg.read && 
              msg.sender && 
              msg.sender.id && 
              currentUserId && 
              msg.sender.id.toString() !== currentUserId.toString()
      );

      if (unreadMessages.length > 0) {
        await api.post(`/api/conversation/${conversationId}/read/`, {
          message_ids: unreadMessages.map(msg => msg.id)
        });

        // Update local state to mark messages as read
        setMessages(prev => 
          prev.map(msg => 
            unreadMessages.some(unread => unread.id === msg.id) 
              ? {...msg, read: true} 
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  }, [messages]);
  
  // Throttled polling function to reduce visual refreshing
  const pollForMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    // Don't poll too frequently
    const now = Date.now();
    if (now - lastPollTimeRef.current < 2000) return;
    lastPollTimeRef.current = now;
    
    try {
      // Get the highest message ID we currently have
      const latestMessageId = messages.length > 0 
        ? Math.max(...messages.map(msg => typeof msg.id === 'string' && msg.id.startsWith('temp-') 
            ? 0 // Ignore temporary messages when calculating latest ID
            : msg.id)) 
        : 0;

      // Only fetch messages with IDs higher than what we already have
      const response = await api.get(
        `/api/conversation/${conversationId}/messages/?since_id=${latestMessageId}`
      );

      // Filter out messages we already have to avoid duplicates
      const existingMessageIds = new Set(messages.map(msg => msg.id));
      const newMessages = response.data.filter(msg => !existingMessageIds.has(msg.id));

      if (newMessages.length > 0) {
        // Add a property to identify new messages for animation
        const messagesWithAnimation = newMessages.map(msg => ({
          ...msg,
          isNew: true // Flag for animation
        }));
        
        // Add new messages without causing a visual refresh
        setMessages(prev => {
          const updated = [...prev, ...messagesWithAnimation];
          
          // Schedule animation removal
          setTimeout(() => {
            setMessages(current => 
              current.map(msg => ({
                ...msg,
                isNew: false
              }))
            );
          }, 500);
          
          return updated;
        });
        
        // Update read status for new messages
        await updateReadStatus(conversationId);
      }
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }, [messages, updateReadStatus]);
  
  // Setup polling with throttling
  const startPolling = useCallback((conversationId) => {
    if (!conversationId) return;
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Initial poll
    pollForMessages(conversationId);
    
    // Regular polling
    pollIntervalRef.current = setInterval(() => {
      pollForMessages(conversationId);
    }, 3000);
  }, [pollForMessages]);

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(`/users/`);
        const currentUserId = localStorage.getItem("user_id");
        setUsers(response.data.filter(user => user.id && currentUserId ? 
            user.id.toString() !== currentUserId : true));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Initialize conversation
  useEffect(() => {
    const startConversation = async () => {
      if (!selectedUser) return;

      // Clear any existing polling interval when starting a new conversation
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      try {
        const response = await api.post('/api/conversation/', {
          user_id: selectedUser
        });
        setConversation(response.data);
        
        // Load initial messages
        await loadMessages(response.data.id);
        
        // Start polling for new messages
        startPolling(response.data.id);
      } catch (error) {
        console.error("Error starting conversation:", error);
      }
    };

    startConversation();

    // Clean up polling when component unmounts or selectedUser changes
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedUser, startPolling]);
  
  // Load initial messages
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const response = await api.get(`/api/conversation/${conversationId}/messages/`);
      
      // Replace all messages with the ones from the server
      // This ensures we don't get duplicates when reloading
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSend = async () => {
    if (!conversation || !message.trim()) return;

    try {
      // Create a unique temporary ID
      const tempId = `temp-${Date.now()}`;
      
      const tempMessage = {
        id: tempId,
        content: message.trim(),
        sender: {
          id: localStorage.getItem("user_id"),
          username: "You"
        },
        timestamp: new Date().toISOString(),
        read: false,
        isOptimistic: true
      };

      // Add the temporary message to the UI
      setMessages(prev => [...prev, tempMessage]);
      const messageContent = message.trim();
      setMessage("");

      const baseUrl = api.defaults.baseURL || '';
      const apiPrefix = baseUrl.includes('/api') ? '' : '/api';

      const response = await api.post(`${apiPrefix}/conversation/${conversation.id}/messages/`, {
        content: messageContent
      });
      
      // Replace the temporary message with the real one from server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? response.data : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the temporary message if there was an error
      setMessages(prev => 
        prev.filter(msg => !msg.isOptimistic)
      );
    }
  };

  // Get the current user ID from localStorage
  const currentUserId = localStorage.getItem("user_id") || 
    (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).user_id : null);

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg flex flex-col h-[80vh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Chat</h2>
        
      </div>

      <div className="flex-grow overflow-y-auto border p-3 bg-gray-50 rounded mb-4">
        {messages.length === 0 ? (
          <div className="text-gray-500">
            {selectedUser ? "No messages yet. Start chatting!" : "Select a user to start chatting"}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={msg.isNew ? fadeInStyle : {}}
              className={`mb-3 p-3 rounded ${
                msg.sender && currentUserId && msg.sender.id && 
                msg.sender.id.toString() === currentUserId.toString()
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : "bg-white border max-w-[80%]"
              } ${msg.isOptimistic ? "opacity-70" : ""}`}
            >
              <div className="text-sm text-gray-600 font-semibold">
                {msg.sender?.username || "Unknown"}
              </div>
              <div className="break-words">{msg.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.read && msg.sender && currentUserId && msg.sender.id && 
                 msg.sender.id.toString() === currentUserId.toString() && (
                  <span className="ml-2 text-blue-500">✓✓</span>
                )}
                {msg.isOptimistic && <span className="ml-2">Sending...</span>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-stretch gap-2">
        <div className="flex-grow">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full border p-2 rounded"
            disabled={!selectedUser}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>
        <div className="flex-none">
          <button
            onClick={handleSend}
            className="h-full bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;