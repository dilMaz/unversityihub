import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config/appConfig";
import "./ModuleChat.css";

const ModuleChat = ({ moduleCode, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef(null);
  const currentUserId = currentUser?._id || currentUser?.id;

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/chat/${moduleCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    if (moduleCode) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [moduleCode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/chat/${moduleCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      const savedMessage = await response.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/chat/message/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: editText.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to edit message");
      }

      const updatedMessage = await response.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? updatedMessage : msg
        )
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/chat/message/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete message");
      }

      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Start editing
  const startEditing = (message) => {
    setEditingId(message._id);
    setEditText(message.message);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!currentUser) {
    return (
      <div className="module-chat login-prompt">
        <div className="chat-icon">💬</div>
        <h3>Join the Conversation</h3>
        <p>Please log in to participate in the {moduleCode} chat</p>
      </div>
    );
  }

  return (
    <div className="module-chat">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <h3>{moduleCode} Discussion</h3>
        </div>
        <span className="message-count">{messages.length} messages</span>
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Be the first to start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="chat-date-group">
              <div className="date-divider">
                <span>{formatDate(dateMessages[0].createdAt)}</span>
              </div>
              {dateMessages.map((message) => {
                const isOwnMessage =
                  message.user?._id === currentUserId ||
                  message.user === currentUserId;
                const userName = message.userName || message.user?.name || "Unknown";

                return (
                  <div
                    key={message._id}
                    className={`chat-message ${isOwnMessage ? "own" : "other"}`}
                  >
                    {!isOwnMessage && (
                      <div className="message-avatar">
                        {message.userAvatar ? (
                          <img
                            src={`${API_BASE_URL}/uploads/${message.userAvatar}`}
                            alt={userName}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      {!isOwnMessage && (
                        <div className="message-sender">{userName}</div>
                      )}
                      {editingId === message._id ? (
                        <div className="message-edit-form">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button
                              onClick={() => handleEditMessage(message._id)}
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="message-text">{message.message}</div>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                            {message.isEdited && (
                              <span className="edited-tag">(edited)</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {isOwnMessage && (
                      <div className="message-actions">
                        <button
                          onClick={() => startEditing(message)}
                          className="action-btn edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="action-btn delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ModuleChat;