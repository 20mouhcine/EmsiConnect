import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const chatSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  // Fetch users and exclude current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(`/users/`);
        const currentUserId = localStorage.getItem("user_id");
        setUsers(response.data.filter(user => user.id.toString() !== currentUserId));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Start or get conversation when user is selected
  useEffect(() => {
    const startConversation = async () => {
      if (!selectedUser) return;

      try {
        const response = await api.post('/conversation/', {
          user_id: selectedUser
        });
        setConversation(response.data);
        loadMessages(response.data.id);
      } catch (error) {
        console.error("Error starting conversation:", error);
      }
    };

    startConversation();
  }, [selectedUser]);

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages/`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Handle WebSocket connection when conversation changes
  useEffect(() => {
    if (!conversation) return;

    const connectWebSocket = () => {
      setConnectionStatus("Connecting...");

      const token = localStorage.getItem("access_token");
      if (!token) {
        setConnectionStatus("Authentication error - No token found");
        return;
      }

      const wsUrl = `ws://${window.location.host}/ws/chat/${conversation.id}/`;
      chatSocketRef.current = new WebSocket(wsUrl);

      chatSocketRef.current.onopen = () => {
        console.log("WebSocket connection established");
        setConnectionStatus("Connected");
        setIsConnected(true);
      };

      chatSocketRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("Received message:", data);

          if (data.type === 'chat_message') {
            setMessages(prev => [...prev, data.message]);
          } else if (data.type === 'read_receipt') {
            setMessages(prev => prev.map(msg => 
              msg.id === data.message_id ? {...msg, read: true} : msg
            ));
          }
        } catch (err) {
          console.error("Invalid message format:", err);
        }
      };

      chatSocketRef.current.onclose = (e) => {
        console.log(`WebSocket closed with code: ${e.code}`);
        setIsConnected(false);
        setConnectionStatus("Disconnected");
      };

      chatSocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setConnectionStatus("Connection Error");
      };
    };

    connectWebSocket();

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [conversation]);

  const handleSend = () => {
    if (!conversation || !message.trim()) return;

    if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
      chatSocketRef.current.send(JSON.stringify({
        type: 'chat_message',
        content: message.trim()
      }));

      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentUserId = localStorage.getItem("user_id");

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Chat</h2>
        <div className="text-sm">
          Status:{" "}
          <span className={`${isConnected ? "text-green-600" : "text-red-600"}`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium">
          Select User to Chat:
        </label>
        <select
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">-- Select a user --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
      </div>

      <div className="h-80 overflow-y-auto border p-3 bg-gray-50 rounded mb-4">
        {messages.length === 0 ? (
          <div className="text-gray-500">
            {selectedUser ? "No messages yet. Start chatting!" : "Select a user to start chatting"}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 p-3 rounded ${
                msg.sender.id.toString() === currentUserId
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : "bg-white border max-w-[80%]"
              }`}
            >
              <div className="text-sm text-gray-600 font-semibold">
                {msg.sender.username}
              </div>
              <div className="break-words">{msg.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.read && msg.sender.id.toString() === currentUserId && (
                  <span className="ml-2 text-blue-500">✓✓</span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border p-2 rounded"
          disabled={!isConnected || !selectedUser}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={!message.trim() || !selectedUser || !isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;