import React, { useState, useEffect, useRef } from 'react';

function ChatPanel({ socket, playerId, players }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('chatMessage', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    socket.on('gameEvent', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: data.message,
        timestamp: new Date()
      }]);
    });

    return () => {
      socket.off('chatMessage');
      socket.off('gameEvent');
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('chatMessage', {
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const getPlayerName = (id) => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };

  const getPlayerColor = (id) => {
    const player = players.find(p => p.id === id);
    return player ? player.color : 'gray';
  };

  const renderMessage = (msg) => {
    if (msg.type === 'system') {
      return (
        <div key={msg.id} className="chat-message system">
          <div className="message-content">
            <span className="system-icon">📢</span>
            <span className="message-text">{msg.message}</span>
          </div>
          <div className="message-time">
            {msg.timestamp.toLocaleTimeString()}
          </div>
        </div>
      );
    }

    const isMyMessage = msg.playerId === playerId;
    
    return (
      <div key={msg.id} className={`chat-message ${isMyMessage ? 'own' : ''}`}>
        <div className="message-header">
          <span 
            className={`player-name ${getPlayerColor(msg.playerId)}`}
            style={{ color: getPlayerColor(msg.playerId) }}
          >
            {isMyMessage ? 'You' : msg.playerName}
          </span>
          <span className="message-time">
            {msg.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <div className="message-content">
          {msg.message}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 Chat</h3>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={200}
        />
        <button type="submit" className="send-button" disabled={!inputMessage.trim()}>
          Send
        </button>
      </form>
      
      <div className="chat-help">
        <details>
          <summary>Quick Messages</summary>
          <div className="quick-messages">
            <button onClick={() => setInputMessage("Good luck everyone! 🍀")}>
              Good luck!
            </button>
            <button onClick={() => setInputMessage("Anyone want to trade? 🤝")}>
              Want to trade?
            </button>
            <button onClick={() => setInputMessage("Nice move! 👏")}>
              Nice move!
            </button>
            <button onClick={() => setInputMessage("That robber is annoying! 😤")}>
              Robber complaint
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

export default ChatPanel;