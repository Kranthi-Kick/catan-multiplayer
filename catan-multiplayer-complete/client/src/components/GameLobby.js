import React, { useState } from 'react';

function GameLobby({ playerName, setPlayerName, onCreateGame, onJoinGame, error }) {
  const [gameIdToJoin, setGameIdToJoin] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame();
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (playerName.trim() && gameIdToJoin.trim()) {
      onJoinGame(gameIdToJoin);
    }
  };

  return (
    <div className="lobby">
      <h2>🏝️ Settlers of Catan</h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
        Join or create a game to start building your empire!
      </p>
      
      <form onSubmit={handleCreateGame}>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="player-input"
          required
          maxLength={20}
        />
        
        <button type="submit" className="create-button" disabled={!playerName.trim()}>
          🎮 Create New Game
        </button>
      </form>
      
      <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#999' }}>
        — OR —
      </div>
      
      <form onSubmit={handleJoinGame}>
        <div className="lobby-buttons">
          <input
            type="text"
            placeholder="Game ID (e.g., abc123de)"
            value={gameIdToJoin}
            onChange={(e) => setGameIdToJoin(e.target.value.toLowerCase())}
            className="game-id-input"
            maxLength={8}
          />
          <button 
            type="submit" 
            className="join-button" 
            disabled={!playerName.trim() || !gameIdToJoin.trim()}
          >
            🚪 Join Game
          </button>
        </div>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h4>How to Play:</h4>
        <ul style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>
          <li>2-4 players compete to reach 10 victory points</li>
          <li>Build settlements, cities, and roads</li>
          <li>Trade resources with other players</li>
          <li>Use development cards strategically</li>
          <li>Control the robber to disrupt opponents</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
        💡 Tip: Share the Game ID with friends to play together!
      </div>
    </div>
  );
}

export default GameLobby;