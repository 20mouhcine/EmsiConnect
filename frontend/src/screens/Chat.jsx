import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const chatSocketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const maxReconnectAttempts = 5;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  // Fetch users once when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Use consistent token name - fixed "accessToken" to match what's used in WebSocket
        const token = localStorage.getItem("access_token");
        const response = await api.get(`/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Handle WebSocket connection whenever selectedUser changes
  useEffect(() => {
    // Close existing connection when changing users
    if (chatSocketRef.current) {
      chatSocketRef.current.close(1000, "Changing selected user");
    }

    const connectWebSocket = () => {
      if (!selectedUser) {
        setConnectionStatus("Select a user to connect");
        return;
      }

      setConnectionStatus("Connecting...");

      // Use consistent token name
      const token = localStorage.getItem("access_token");
      if (!token) {
        setConnectionStatus("Authentication error - No token found");
        return;
      }

      const wsUrl = `ws://127.0.0.1:8000/ws/api/${selectedUser}/?token=${token}`;
      chatSocketRef.current = new WebSocket(wsUrl);

      chatSocketRef.current.onopen = () => {
        console.log("WebSocket connection established"); // In your React code, add:
        console.log("Connecting with token:", token);
        setConnectionStatus("Connected");
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      chatSocketRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("Received message:", data);

          // Handle different message types
          if (data.type === "chat_message") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                sender: data.sender_id,
                sender_username: data.sender_username || "Unknown",
                content: data.message,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          } else if (data.type === "connection_established") {
            console.log("Connection confirmed for room:", data.room);
          }
        } catch (err) {
          console.error("Invalid message format:", err);
        }
      };

      chatSocketRef.current.onclose = (e) => {
        console.log(`WebSocket closed with code: ${e.code}`);
        setIsConnected(false);

        if (e.code === 4001) {
          setConnectionStatus("Authentication failed");
          return;
        }

        setConnectionStatus("Disconnected");

        if (
          selectedUser &&
          e.code !== 1000 &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            setConnectionStatus(
              `Reconnecting... (${
                reconnectAttempts + 1
              }/${maxReconnectAttempts})`
            );
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionStatus("Connection Failed - Max retries reached");
        }
      };

      chatSocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setConnectionStatus("Connection Error");
      };
    };

    if (selectedUser) {
      connectWebSocket();
    }

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [selectedUser, reconnectAttempts]);

  const handleSend = () => {
    if (!selectedUser) {
      alert("Please select a recipient.");
      return;
    }

    if (
      message.trim() &&
      chatSocketRef.current?.readyState === WebSocket.OPEN
    ) {
      // Simplified payload to match what the server expects
      const payload = {
        message: message.trim(),
      };

      chatSocketRef.current.send(JSON.stringify(payload));

      // Optimistically add message to UI
      const currentUserId = localStorage.getItem("user_id") || "you";
      const currentUsername = localStorage.getItem("username") || "You";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: currentUserId,
          sender_username: currentUsername,
          content: message.trim(),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get current user's ID for message display
  const currentUserId = localStorage.getItem("user_id") || "you";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Chat Room</h2>
        <div className="text-sm">
          Status:{" "}
          <span
            className={`${isConnected ? "text-green-600" : "text-red-600"}`}
          >
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium">
          Select User to Chat:
        </label>
        <select
          value={selectedUser}
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
            No messages yet. Select a user and start chatting!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 p-3 rounded ${
                msg.sender === currentUserId
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : "bg-white border max-w-[80%]"
              }`}
            >
              <div className="text-sm text-gray-600 font-semibold">
                {msg.sender_username || msg.sender}
              </div>
              <div className="break-words">{msg.content}</div>
              <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
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
          disabled={!isConnected}
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
