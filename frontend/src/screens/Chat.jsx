import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { SendHorizontal, Trash2, MoreHorizontal } from "lucide-react";
import SideBar from "@/components/SideBar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [deletingMessages, setDeletingMessages] = useState(new Set());
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
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .fade-out {
        animation: fadeOut 0.3s ease forwards;
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
  const updateReadStatus = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      try {
        const currentUserId = localStorage.getItem("user_id");
        const unreadMessages = messages.filter(
          (msg) =>
            !msg.read &&
            msg.sender &&
            msg.sender.id &&
            currentUserId &&
            msg.sender.id.toString() !== currentUserId.toString()
        );

        if (unreadMessages.length > 0) {
          await api.post(`/api/conversation/${conversationId}/read/`, {
            message_ids: unreadMessages.map((msg) => msg.id),
          });

          // Update local state to mark messages as read
          setMessages((prev) =>
            prev.map((msg) =>
              unreadMessages.some((unread) => unread.id === msg.id)
                ? { ...msg, read: true }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("Error updating read status:", error);
      }
    },
    [messages]
  );

  // Throttled polling function to reduce visual refreshing
  const pollForMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      // Don't poll too frequently
      const now = Date.now();
      if (now - lastPollTimeRef.current < 2000) return;
      lastPollTimeRef.current = now;

      try {
        // Get the highest message ID we currently have
        const latestMessageId =
          messages.length > 0
            ? Math.max(
                ...messages.map((msg) =>
                  typeof msg.id === "string" && msg.id.startsWith("temp-")
                    ? 0 // Ignore temporary messages when calculating latest ID
                    : msg.id
                )
              )
            : 0;

        // Only fetch messages with IDs higher than what we already have
        const response = await api.get(
          `/api/conversation/${conversationId}/messages/?since_id=${latestMessageId}`
        );

        // Filter out messages we already have to avoid duplicates
        const existingMessageIds = new Set(messages.map((msg) => msg.id));
        const newMessages = response.data.filter(
          (msg) => !existingMessageIds.has(msg.id)
        );

        if (newMessages.length > 0) {
          // Add a property to identify new messages for animation
          const messagesWithAnimation = newMessages.map((msg) => ({
            ...msg,
            isNew: true, // Flag for animation
          }));

          // Add new messages without causing a visual refresh
          setMessages((prev) => {
            const updated = [...prev, ...messagesWithAnimation];

            // Schedule animation removal
            setTimeout(() => {
              setMessages((current) =>
                current.map((msg) => ({
                  ...msg,
                  isNew: false,
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
    },
    [messages, updateReadStatus]
  );

  // Setup polling with throttling
  const startPolling = useCallback(
    (conversationId) => {
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
    },
    [pollForMessages]
  );

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(`/users/`);
        const currentUserId = localStorage.getItem("user_id");
        setUsers(
          response.data.filter((user) =>
            user.id && currentUserId
              ? user.id.toString() !== currentUserId
              : true
          )
        );
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
        const response = await api.post("/api/conversation/", {
          user_id: selectedUser,
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
      const response = await api.get(
        `/api/conversation/${conversationId}/messages/`
      );

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
          username: "You",
        },
        timestamp: new Date().toISOString(),
        read: false,
        isOptimistic: true,
      };

      // Add the temporary message to the UI
      setMessages((prev) => [...prev, tempMessage]);
      const messageContent = message.trim();
      setMessage("");

      const baseUrl = api.defaults.baseURL || "";
      const apiPrefix = baseUrl.includes("/api") ? "" : "/api";

      const response = await api.post(
        `${apiPrefix}/conversation/${conversation.id}/messages/`,
        {
          content: messageContent,
        }
      );

      // Replace the temporary message with the real one from server
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the temporary message if there was an error
      setMessages((prev) => prev.filter((msg) => !msg.isOptimistic));
    }
  };

  // Modified delete message function to replace content instead of removing
  const deleteMsg = async (messageId) => {
    if (!conversation || !messageId) return;

    // Check if user can delete this message (only their own messages)
    const currentUserId = JSON.parse(localStorage.getItem("user")).user_id;
    const messageToDelete = messages.find(msg => msg.id === messageId);
    
    if (!messageToDelete) {
      console.error("Message not found");
      return;
    }
    
    if (!messageToDelete.sender || !messageToDelete.sender.id) {
      console.error("Message sender information missing");
      return;
    }
    
    if (!currentUserId) {
      console.error("Current user ID not found");
      return;
    }
    
    // More flexible comparison - handle both string and number types
    const messageSenderId = messageToDelete.sender.id;
    const isOwner = messageSenderId.toString() === currentUserId.toString() ||
                   messageSenderId === currentUserId ||
                   parseInt(messageSenderId) === parseInt(currentUserId);
    

    


    // Add to deleting set for UI feedback
    setDeletingMessages(prev => new Set(prev).add(messageId));

    try {
      const baseUrl = api.defaults.baseURL || "";
      const apiPrefix = baseUrl.includes("/api") ? "" : "/api";

      // Call API to delete message
      await api.delete(`${apiPrefix}/conversation/${conversation.id}/messages/${messageId}/`);

      // Replace the message content with "message supprimé" instead of removing it
      setMessages((prev) => prev.map((msg) => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: "message supprimé", 
              isDeleted: true 
            }
          : msg
      ));

      // Remove from deleting set
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });

    } catch (error) {
      console.error("Error deleting message:", error);
      
      // Remove from deleting set on error
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      
      // Show error message to user
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to delete message";
      alert(`Could not delete message: ${errorMsg}`);
    }
  };

  // Get the current user ID from localStorage
  const currentUserId =
    localStorage.getItem("user_id") ||
    (localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")).user_id
      : null);

  return (
<div className="flex flex-col sm:flex-row items-stretch justify-center min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="w-full sm:w-auto flex-grow max-w-full sm:max-w-4xl md:max-w-6xl bg-white rounded-lg shadow-lg flex flex-col sm:flex-row overflow-hidden">
        {/* Sidebar hidden on small screens */}
        <div className="hidden sm:block">
          <SideBar />
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow p-2 sm:p-4">
          <NavBar className="mb-4 sm:mb-6" />

          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-2xl font-bold">Chat</h2>
            </div>

            <div className="flex-grow overflow-y-auto border p-2 sm:p-3 bg-gray-50 rounded mb-3 sm:mb-4">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-sm sm:text-base text-center py-8">
                  {selectedUser
                    ? "No messages yet. Start chatting!"
                    : "Select a user to start chatting"}
                </div>
              ) : (
                messages.map((msg) => {
                  const localUserId =
                    localStorage.getItem("user_id") ||
                    (localStorage.getItem("user")
                      ? JSON.parse(localStorage.getItem("user")).user_id
                      : null);

                  const isOwner =
                    msg.sender?.id &&
                    localUserId &&
                    msg.sender.id.toString() === localUserId.toString();

                  return (
                    <div
                      key={msg.id}
                      data-message-id={msg.id}
                      style={msg.isNew ? fadeInStyle : {}}
                      className={`mb-2 sm:mb-3 p-2 sm:p-3 rounded ${
                        isOwner
                          ? "bg-green-100 ml-auto max-w-[85%] sm:max-w-[80%] md:max-w-[70%]"
                          : "bg-white border max-w-[85%] sm:max-w-[80%] md:max-w-[70%]"
                      } rounded-2xl ${msg.isOptimistic ? "opacity-70" : ""} ${
                        deletingMessages.has(msg.id) ? "opacity-50" : ""
                      } ${msg.isDeleted ? "opacity-60" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-grow min-w-0">
                          <div className="text-xs sm:text-sm text-black font-semibold truncate">
                            {msg.sender?.username || "Unknown"}
                          </div>
                          <div
                            className={`text-sm sm:text-base break-words ${
                              msg.isDeleted
                                ? "text-gray-500 italic"
                                : "text-gray-700"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>

                        {isOwner && !msg.isOptimistic && !msg.isDeleted && (
                          <div className="flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9"
                                  disabled={deletingMessages.has(msg.id)}
                                >
                                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => deleteMsg(msg.id)}
                                  disabled={deletingMessages.has(msg.id)}
                                  className="cursor-pointer flex items-center bg-white p-2 rounded-lg text-sm"
                                >
                                  <Trash2 className="text-red-500 mr-2 h-4 w-4" />
                                  <span className="text-red-500 text-xs sm:text-sm">
                                    {deletingMessages.has(msg.id)
                                      ? "Deleting..."
                                      : "Supprimer"}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-1">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        {msg.read &&
                          msg.sender &&
                          localUserId &&
                          msg.sender.id &&
                          msg.sender.id.toString() === localUserId.toString() && (
                            <span className="text-blue-500">✓✓</span>
                          )}
                        {msg.isOptimistic && <span>Sending...</span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full border p-2 sm:p-3 rounded text-sm sm:text-base"
                disabled={!selectedUser}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded disabled:opacity-50 flex items-center justify-center min-w-[44px]"
                disabled={!selectedUser}
              >
                <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;