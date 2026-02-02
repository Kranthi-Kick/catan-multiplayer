import React from 'react';

function PlayerPanel({ players, currentPlayerId, myPlayerId, gameState }) {
  const getPlayer = (id) => players.find(p => p.id === id);
  const myPlayer = getPlayer(myPlayerId);
  
  const renderResourceIcon = (resource) => {
    return <div className={`resource-icon ${resource}`}></div>;
  };

  const renderPlayerResources = (playerId) => {
    // Only show detailed resources for the current player
    if (playerId !== myPlayerId || !gameState.playerResources) {
      return <div className="resource-count">Cards: {getPlayer(playerId)?.totalResources || 0}</div>;
    }

    return (
      <div className="resource-grid">
        {Object.entries(gameState.playerResources).map(([resource, count]) => (
          <div key={resource} className="resource-item">
            {renderResourceIcon(resource)}
            <span>{count}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDevelopmentCards = (playerId) => {
    if (playerId !== myPlayerId || !gameState.playerDevelopmentCards) {
      return <div className="dev-card-count">Dev Cards: {getPlayer(playerId)?.totalDevelopmentCards || 0}</div>;
    }

    const totalCards = Object.values(gameState.playerDevelopmentCards).reduce((sum, count) => sum + count, 0);
    if (totalCards === 0) return <div className="dev-card-count">No development cards</div>;

    return (
      <div className="dev-cards-detail">
        {Object.entries(gameState.playerDevelopmentCards).map(([cardType, count]) => {
          if (count === 0) return null;
          
          const isNew = gameState.playerNewDevelopmentCards && gameState.playerNewDevelopmentCards[cardType] > 0;
          
          return (
            <div key={cardType} className={`dev-card-item ${isNew ? 'new' : ''}`}>
              <span>{getCardDisplayName(cardType)}</span>
              <span>{count}</span>
              {isNew && <span className="new-indicator">NEW</span>}
            </div>
          );
        })}
      </div>
    );
  };

  const getCardDisplayName = (cardType) => {
    switch (cardType) {
      case 'knight': return '🗡️ Knight';
      case 'victoryPoint': return '🏆 Victory Point';
      case 'roadBuilding': return '🛣️ Road Building';
      case 'yearOfPlenty': return '🌾 Year of Plenty';
      case 'monopoly': return '💰 Monopoly';
      default: return cardType;
    }
  };

  const renderPlayerInfo = (player) => {
    const isCurrentPlayer = player.id === currentPlayerId;
    const isMe = player.id === myPlayerId;
    
    return (
      <div key={player.id} className={`player-info ${isCurrentPlayer ? 'current' : ''} ${isMe ? 'me' : ''}`}>
        <div className="player-name">
          <div className={`player-color-indicator ${player.color}`}></div>
          <span>{player.name}</span>
          {isCurrentPlayer && <span className="current-turn">🎯</span>}
          {isMe && <span className="me-indicator">(You)</span>}
        </div>
        
        <div className="victory-points">
          🏆 {player.victoryPoints} Victory Points
          {player.victoryPoints >= 10 && <span className="winner-badge">🎉 WINNER!</span>}
        </div>
        
        <div className="player-stats">
          <div className="stat">
            <span>🏘️ Settlements:</span>
            <span>{player.settlements}</span>
          </div>
          <div className="stat">
            <span>🏰 Cities:</span>
            <span>{player.cities}</span>
          </div>
          <div className="stat">
            <span>🛣️ Roads:</span>
            <span>{player.roads}</span>
          </div>
          <div className="stat">
            <span>⚔️ Knights:</span>
            <span>{player.knightsPlayed}</span>
          </div>
        </div>
        
        {player.hasLargestArmy && (
          <div className="achievement">
            🛡️ Largest Army (+2 VP)
          </div>
        )}
        
        {player.hasLongestRoad && (
          <div className="achievement">
            🛣️ Longest Road (+2 VP)
          </div>
        )}
        
        <div className="resources-section">
          {renderPlayerResources(player.id)}
        </div>
        
        <div className="dev-cards-section">
          {renderDevelopmentCards(player.id)}
        </div>
      </div>
    );
  };

  return (
    <div className="player-panel">
      <h3>Players</h3>
      
      {/* Current player's turn indicator */}
      {currentPlayerId && (
        <div className="current-turn-info">
          <p>
            {currentPlayerId === myPlayerId ? "🎯 Your turn!" : `🎯 ${getPlayer(currentPlayerId)?.name}'s turn`}
          </p>
          {gameState.phase === 'setup' && (
            <p className="phase-info">Setup Phase - Build settlements and roads</p>
          )}
          {gameState.phase === 'playing' && !gameState.diceRolled && (
            <p className="phase-info">Roll dice to start turn</p>
          )}
        </div>
      )}
      
      {/* Game statistics */}
      {gameState.turn && (
        <div className="game-stats">
          <div className="stat-item">
            <span>Turn:</span>
            <span>{gameState.turn}</span>
          </div>
          <div className="stat-item">
            <span>Phase:</span>
            <span>{gameState.phase}</span>
          </div>
        </div>
      )}
      
      {/* Players list - current player first, then others, then me if not current */}
      <div className="players-list">
        {/* Current player first (if not me) */}
        {currentPlayerId && currentPlayerId !== myPlayerId && renderPlayerInfo(getPlayer(currentPlayerId))}
        
        {/* My player info (prominent position) */}
        {myPlayer && renderPlayerInfo(myPlayer)}
        
        {/* Other players */}
        {players
          .filter(p => p.id !== currentPlayerId && p.id !== myPlayerId)
          .map(player => renderPlayerInfo(player))}
      </div>
      
      {/* Game status */}
      {gameState.winner && (
        <div className="game-winner">
          <h3>🎉 Game Over!</h3>
          <p>{getPlayer(gameState.winner)?.name} wins with {getPlayer(gameState.winner)?.victoryPoints} victory points!</p>
        </div>
      )}
      
      {/* Trading status */}
      {gameState.tradeOffers && gameState.tradeOffers.length > 0 && (
        <div className="active-trades">
          <h4>📈 Active Trades</h4>
          {gameState.tradeOffers.map(trade => (
            <div key={trade.id} className="trade-offer">
              <p>{getPlayer(trade.fromPlayerId)?.name} wants to trade</p>
              <div className="trade-details">
                <div>Offering: {Object.entries(trade.offer).map(([resource, amount]) => `${amount} ${resource}`).join(', ')}</div>
                <div>Wanting: {Object.entries(trade.want).map(([resource, amount]) => `${amount} ${resource}`).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlayerPanel;