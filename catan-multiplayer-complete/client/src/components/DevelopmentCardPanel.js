import React, { useState } from 'react';

function DevelopmentCardPanel({ onClose, onPlayCard, developmentCards, newDevelopmentCards }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [yearOfPlentySelection, setYearOfPlentySelection] = useState({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
  const [monopolySelection, setMonopolySelection] = useState('');

  const cardDescriptions = {
    knight: "Move the robber to a new hex and steal a resource from an adjacent player.",
    victoryPoint: "Adds 1 victory point to your total (kept hidden until revealed).",
    roadBuilding: "Build 2 roads for free immediately.",
    yearOfPlenty: "Take any 2 resource cards from the bank.",
    monopoly: "All other players give you all their resource cards of one type."
  };

  const cardIcons = {
    knight: "⚔️",
    victoryPoint: "🏆", 
    roadBuilding: "🛤️",
    yearOfPlenty: "🌾",
    monopoly: "💰"
  };

  const getCardDisplayName = (cardType) => {
    const names = {
      knight: "Knight",
      victoryPoint: "Victory Point", 
      roadBuilding: "Road Building",
      yearOfPlenty: "Year of Plenty",
      monopoly: "Monopoly"
    };
    return names[cardType] || cardType;
  };

  const canPlayCard = (cardType) => {
    const totalCards = developmentCards[cardType] || 0;
    const newCards = newDevelopmentCards[cardType] || 0;
    const playableCards = totalCards - newCards;
    
    // Victory point cards are automatically played when bought
    return playableCards > 0 && cardType !== 'victoryPoint';
  };

  const playCard = (cardType) => {
    if (!canPlayCard(cardType)) return;

    let cardData = {};

    if (cardType === 'yearOfPlenty') {
      const totalSelected = Object.values(yearOfPlentySelection).reduce((sum, val) => sum + val, 0);
      if (totalSelected !== 2) {
        alert('You must select exactly 2 resources for Year of Plenty');
        return;
      }
      cardData.resources = Object.fromEntries(
        Object.entries(yearOfPlentySelection).filter(([_, value]) => value > 0)
      );
    }

    if (cardType === 'monopoly') {
      if (!monopolySelection) {
        alert('You must select a resource type for Monopoly');
        return;
      }
      cardData.resource = monopolySelection;
    }

    onPlayCard(cardType, cardData);
    setSelectedCard(null);
    
    // Reset selections
    setYearOfPlentySelection({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    setMonopolySelection('');
  };

  const renderYearOfPlentySelector = () => {
    const totalSelected = Object.values(yearOfPlentySelection).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="card-action-panel">
        <h4>Select 2 Resources</h4>
        <p>Remaining: {2 - totalSelected}</p>
        
        {Object.entries(yearOfPlentySelection).map(([resource, amount]) => (
          <div key={resource} className="resource-selector">
            <label>{resource.charAt(0).toUpperCase() + resource.slice(1)}:</label>
            <div className="resource-controls">
              <button
                onClick={() => setYearOfPlentySelection(prev => ({
                  ...prev,
                  [resource]: Math.max(0, prev[resource] - 1)
                }))}
                disabled={amount === 0}
                className="resource-button"
              >
                -
              </button>
              <span className="resource-amount">{amount}</span>
              <button
                onClick={() => setYearOfPlentySelection(prev => ({
                  ...prev,
                  [resource]: totalSelected < 2 ? prev[resource] + 1 : prev[resource]
                }))}
                disabled={totalSelected >= 2}
                className="resource-button"
              >
                +
              </button>
            </div>
          </div>
        ))}
        
        <button
          onClick={() => playCard('yearOfPlenty')}
          disabled={totalSelected !== 2}
          className="confirm-card-button"
        >
          Confirm Selection
        </button>
      </div>
    );
  };

  const renderMonopolySelector = () => {
    return (
      <div className="card-action-panel">
        <h4>Select Resource Type</h4>
        <p>All other players will give you all their cards of this type.</p>
        
        <div className="monopoly-selector">
          {['wood', 'brick', 'sheep', 'wheat', 'ore'].map(resource => (
            <label key={resource} className="monopoly-option">
              <input
                type="radio"
                name="monopoly-resource"
                value={resource}
                checked={monopolySelection === resource}
                onChange={(e) => setMonopolySelection(e.target.value)}
              />
              <span className="monopoly-resource">
                {resource.charAt(0).toUpperCase() + resource.slice(1)}
              </span>
            </label>
          ))}
        </div>
        
        <button
          onClick={() => playCard('monopoly')}
          disabled={!monopolySelection}
          className="confirm-card-button"
        >
          Confirm Selection
        </button>
      </div>
    );
  };

  const renderCardList = () => {
    const hasCards = Object.values(developmentCards).some(count => count > 0);
    
    if (!hasCards) {
      return (
        <div className="no-cards">
          <p>You don't have any development cards yet.</p>
          <p>Purchase them during your turn to gain powerful abilities!</p>
        </div>
      );
    }

    return Object.entries(developmentCards).map(([cardType, count]) => {
      if (count === 0) return null;
      
      const newCount = newDevelopmentCards[cardType] || 0;
      const playableCount = count - newCount;
      const canPlay = canPlayCard(cardType);
      
      return (
        <div key={cardType} className={`dev-card-item ${!canPlay ? 'disabled' : ''}`}>
          <div className="card-info">
            <div className="card-title">
              <span className="card-icon">{cardIcons[cardType]}</span>
              <span className="card-name">{getCardDisplayName(cardType)}</span>
              <span className="card-count">({count})</span>
            </div>
            <p className="card-description">{cardDescriptions[cardType]}</p>
            {newCount > 0 && (
              <p className="new-card-notice">
                {newCount} newly purchased (can't play until next turn)
              </p>
            )}
          </div>
          
          <div className="card-actions">
            {canPlay ? (
              <button
                onClick={() => {
                  if (cardType === 'yearOfPlenty' || cardType === 'monopoly') {
                    setSelectedCard(cardType);
                  } else {
                    playCard(cardType);
                  }
                }}
                className="play-card-button"
              >
                Play Card
              </button>
            ) : (
              <span className="cannot-play">
                {cardType === 'victoryPoint' ? 'Auto-played' : 'Cannot play'}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="dev-card-panel">
      <div className="dev-card-content">
        <div className="panel-header">
          <h2>🃏 Development Cards</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        {selectedCard ? (
          <div className="card-action-section">
            <h3>Playing {cardIcons[selectedCard]} {getCardDisplayName(selectedCard)}</h3>
            <button
              onClick={() => setSelectedCard(null)}
              className="back-button"
            >
              ← Back to Cards
            </button>
            
            {selectedCard === 'yearOfPlenty' && renderYearOfPlentySelector()}
            {selectedCard === 'monopoly' && renderMonopolySelector()}
          </div>
        ) : (
          <>
            <div className="dev-card-list">
              {renderCardList()}
            </div>
            
            <div className="card-help">
              <h4>💡 Development Card Tips:</h4>
              <ul>
                <li><strong>Knight:</strong> Use to block opponents or steal resources</li>
                <li><strong>Road Building:</strong> Great for extending to new settlements</li>
                <li><strong>Year of Plenty:</strong> Get the exact resources you need</li>
                <li><strong>Monopoly:</strong> Target resources your opponents hoard</li>
                <li><strong>Victory Point:</strong> Keep these secret until you win!</li>
              </ul>
              <p><em>Note: You cannot play development cards on the same turn you buy them.</em></p>
            </div>
          </>
        )}
        
        <div className="panel-footer">
          <button onClick={onClose} className="close-panel-button">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevelopmentCardPanel;