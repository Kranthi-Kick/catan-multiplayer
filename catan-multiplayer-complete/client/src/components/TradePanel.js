import React, { useState } from 'react';

function TradePanel({ players, onClose, onCreateTrade, onRespondToTrade, tradeOffers, playerId }) {
  const [offering, setOffering] = useState({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0
  });
  
  const [wanting, setWanting] = useState({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0
  });
  
  const [selectedPlayer, setSelectedPlayer] = useState('');

  const handleOfferingChange = (resource, value) => {
    setOffering(prev => ({
      ...prev,
      [resource]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const handleWantingChange = (resource, value) => {
    setWanting(prev => ({
      ...prev,
      [resource]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const createTrade = () => {
    const offerTotal = Object.values(offering).reduce((sum, val) => sum + val, 0);
    const wantTotal = Object.values(wanting).reduce((sum, val) => sum + val, 0);
    
    if (offerTotal === 0) {
      alert('You must offer at least one resource');
      return;
    }
    
    if (wantTotal === 0) {
      alert('You must want at least one resource');
      return;
    }
    
    // Filter out zero values
    const cleanOffer = Object.fromEntries(
      Object.entries(offering).filter(([_, value]) => value > 0)
    );
    const cleanWant = Object.fromEntries(
      Object.entries(wanting).filter(([_, value]) => value > 0)
    );
    
    onCreateTrade(cleanOffer, cleanWant, selectedPlayer || null);
    
    // Reset form
    setOffering({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    setWanting({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    setSelectedPlayer('');
  };

  const respondToTrade = (tradeId, accept) => {
    onRespondToTrade(tradeId, accept);
  };

  const renderResourceSelector = (resources, onChange, title, bgColor) => {
    const resourceNames = { 
      wood: '🌲 Wood', 
      brick: '🧱 Brick', 
      sheep: '🐑 Sheep', 
      wheat: '🌾 Wheat', 
      ore: '⛰️ Ore' 
    };
    
    return (
      <div className={`trade-section ${bgColor}`}>
        <h3>{title}</h3>
        {Object.entries(resources).map(([resource, amount]) => (
          <div key={resource} className="resource-selector">
            <label>{resourceNames[resource]}</label>
            <input
              type="number"
              min="0"
              max="10"
              value={amount}
              onChange={(e) => onChange(resource, e.target.value)}
            />
          </div>
        ))}
      </div>
    );
  };

  const getPlayerName = (id) => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown';
  };

  const renderTradeOffers = () => {
    if (!tradeOffers || tradeOffers.length === 0) {
      return <div className="no-trades">No active trade offers</div>;
    }

    return tradeOffers.map(trade => {
      const isMyTrade = trade.fromPlayerId === playerId;
      const isForMe = trade.toPlayerId === playerId || trade.toPlayerId === null;
      
      return (
        <div key={trade.id} className={`trade-offer ${isMyTrade ? 'my-trade' : ''}`}>
          <div className="trade-header">
            <h4>
              {isMyTrade ? 'Your Trade Offer' : `${getPlayerName(trade.fromPlayerId)}'s Trade Offer`}
            </h4>
            {trade.toPlayerId && (
              <span className="trade-target">
                → {getPlayerName(trade.toPlayerId)}
              </span>
            )}
          </div>
          
          <div className="trade-content">
            <div className="trade-side offering">
              <h5>Offering:</h5>
              {Object.entries(trade.offer).map(([resource, amount]) => (
                <div key={resource} className="resource-amount">
                  {amount} {resource}
                </div>
              ))}
            </div>
            
            <div className="trade-arrow">⇄</div>
            
            <div className="trade-side wanting">
              <h5>Wanting:</h5>
              {Object.entries(trade.want).map(([resource, amount]) => (
                <div key={resource} className="resource-amount">
                  {amount} {resource}
                </div>
              ))}
            </div>
          </div>
          
          {!isMyTrade && isForMe && (
            <div className="trade-actions">
              <button
                onClick={() => respondToTrade(trade.id, true)}
                className="accept-trade-button"
              >
                ✅ Accept
              </button>
              <button
                onClick={() => respondToTrade(trade.id, false)}
                className="reject-trade-button"
              >
                ❌ Reject
              </button>
            </div>
          )}
          
          {isMyTrade && (
            <div className="trade-status">
              <span>Waiting for response...</span>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="trade-panel">
      <div className="trade-content">
        <div className="trade-header">
          <h2>🤝 Trade Resources</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="create-trade-section">
          <h3>Create New Trade</h3>
          
          <div className="player-selector">
            <label htmlFor="target-player">Trade with:</label>
            <select
              id="target-player"
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="player-select"
            >
              <option value="">Anyone</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="trade-form">
            {renderResourceSelector(offering, handleOfferingChange, "I'm Offering", "offering")}
            {renderResourceSelector(wanting, handleWantingChange, "I Want", "wanting")}
          </div>
          
          <div className="trade-buttons">
            <button onClick={createTrade} className="create-trade-button">
              📤 Create Trade Offer
            </button>
          </div>
        </div>
        
        <div className="existing-trades-section">
          <h3>Current Trade Offers</h3>
          <div className="trade-offers-list">
            {renderTradeOffers()}
          </div>
        </div>
        
        <div className="trade-help">
          <h4>💡 Trading Tips:</h4>
          <ul>
            <li>You can trade with ports at fixed ratios (3:1 or 2:1)</li>
            <li>Player trades can be any ratio you both agree on</li>
            <li>Consider what others need - mutual benefit leads to better deals</li>
            <li>Don't help players who are close to winning!</li>
          </ul>
        </div>
        
        <div className="trade-footer">
          <button onClick={onClose} className="close-trade-button">
            Close Trading
          </button>
        </div>
      </div>
    </div>
  );
}

export default TradePanel;