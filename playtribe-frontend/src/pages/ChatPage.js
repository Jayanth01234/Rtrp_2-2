import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  getTeamChat, 
  getMatchChat, 
  sendMessage, 
  getChatMessages 
} from '../services/chatService';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const { type, id } = useParams(); // type: 'team' or 'match', id: teamId or matchId
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoading(true);
        setError('');
        
        let chatData;
        if (type === 'team') {
          chatData = await getTeamChat(id);
          setChatInfo({
            name: chatData.team?.name || 'Team Chat',
            type: 'team',
            sport: chatData.team?.sport,
            city: chatData.team?.city
          });
        } else if (type === 'match') {
          chatData = await getMatchChat(id);
          const matchDate = new Date(chatData.match?.date).toLocaleDateString();
          setChatInfo({
            name: `${chatData.match?.sport} Match`,
            type: 'match',
            sport: chatData.match?.sport,
            city: chatData.match?.city,
            date: matchDate,
            time: chatData.match?.time
          });
        } else {
          throw new Error('Invalid chat type');
        }
        
        setChat(chatData);
        setMessages(chatData.messages || []);
      } catch (err) {
        console.error('Failed to load chat:', err);
        setError(err.response?.data?.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    if (type && id) {
      loadChat();
    }
  }, [type, id]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sendingMessage || !chat) return;
    
    try {
      setSendingMessage(true);
      const messageData = await sendMessage(chat._id, newMessage.trim());
      
      // Add message to local state immediately for better UX
      const messageWithSender = {
        ...messageData,
        sender: {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage
        }
      };
      
      setMessages(prev => [...prev, messageWithSender]);
      setNewMessage('');
      
      // Focus input after sending
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Format message time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message sender display name
  const getSenderName = (sender) => {
    return sender?.name || 'Unknown User';
  };

  // Get sender avatar
  const getSenderAvatar = (sender) => {
    if (sender?.profileImage) {
      return `http://localhost:5000/uploads/${sender.profileImage}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="page-content">
          <div className="container">
            <div className="chat-container">
              <div className="chat-loading">
                <p>Loading chat...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Navbar />
        <main className="page-content">
          <div className="container">
            <div className="chat-container">
              <div className="chat-error">
                <div className="alert alert-error">{error}</div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!chat || !chatInfo) {
    return (
      <div className="page">
        <Navbar />
        <main className="page-content">
          <div className="container">
            <div className="chat-container">
              <div className="chat-error">
                <p>Chat not found</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="container">
          <div className="chat-container">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <button 
                  className="btn btn-outline btn-small back-button"
                  onClick={() => navigate(-1)}
                >
                  ← Back
                </button>
                <div className="chat-title">
                  <h3>{chatInfo.name}</h3>
                  <div className="chat-details">
                    <span className="chat-type">{chatInfo.type === 'team' ? 'Team' : 'Match'} Chat</span>
                    {chatInfo.sport && <span className="chat-sport">• {chatInfo.sport}</span>}
                    {chatInfo.city && <span className="chat-city">• {chatInfo.city}</span>}
                    {chatInfo.date && <span className="chat-date">• {chatInfo.date}</span>}
                    {chatInfo.time && <span className="chat-time">• {chatInfo.time}</span>}
                  </div>
                </div>
              </div>
              <div className="chat-participants">
                <span className="participants-count">
                  {chat.participants?.length || 0} members
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.sender?._id === user._id;
                  const senderName = getSenderName(message.sender);
                  const senderAvatar = getSenderAvatar(message.sender);
                  
                  return (
                    <div 
                      key={message._id || index} 
                      className={`message ${isOwnMessage ? 'message-own' : 'message-other'}`}
                    >
                      <div className="message-avatar">
                        {senderAvatar ? (
                          <img 
                            src={senderAvatar} 
                            alt={senderName}
                          />
                        ) : (
                          senderName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="message-content">
                        {!isOwnMessage && (
                          <div className="message-sender">{senderName}</div>
                        )}
                        <div className="message-body">
                          <p className="message-text">{message.content}</p>
                        </div>
                        <div className="message-time">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="chat-input">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                  maxLength={500}
                  disabled={sendingMessage}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary send-button"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
              <div className="input-info">
                <span className="char-count">
                  {newMessage.length}/500
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
