import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import TradePanel from './components/TradePanel';
import DevelopmentCardPanel from './components/DevelopmentCardPanel';
import ChatPanel from './components/ChatPanel';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  
  // UI state
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [showDevCardPanel, setShowDevCardPanel] = useState(false);
  const [selectedHex, setSelectedHex] = useState(null);
  const [buildMode, setBuildMode] = useState(null); // 'settlement', 'city', 'road'
  const [pendingRobberMove, setPendingRobberMove] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [discardCount, setDiscardCount] = useState(0);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('gameCreated', (data) => {
      setGameId(data.gameId);
      setPlayerId(data.playerId);
      setGameState(data.game);
      setError('');
    });

    newSocket.on('gameJoined', (data) => {
      setGameId(data.gameId);
      setPlayerId(data.playerId);
      setGameState(data.game);
      setError('');
    });

    newSocket.on('playerJoined', (data) => {
      console.log('Player joined:', data.playerName);
    });

    newSocket.on('gameStarted', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('gameStateUpdate', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('diceRolled', (data) => {
      console.log('Dice rolled:', data.dice, 'Total:', data.total);
      
      if (data.robberActivated) {
        setPendingRobberMove(true);
        
        // Check if current player needs to discard
        const currentPlayer = data.playersToDiscard.find(p => p.playerId === playerId);
        if (currentPlayer) {
          setPendingDiscard(true);
          setDiscardCount(currentPlayer.mustDiscard);
        }
      }
    });

    newSocket.on('robberMoved', (data) => {
      setPendingRobberMove(false);
      console.log('Robber moved to hex:', data.hexIndex);
    });

    newSocket.on('cardsDiscarded', (data) => {
      setPendingDiscard(false);
      setDiscardCount(0);
      console.log('Cards discarded');
    });

    newSocket.on('settlementBuilt', (data) => {
      console.log('Settlement built at vertex:', data.vertexId);
      setBuildMode(null);
    });

    newSocket.on('roadBuilt', (data) => {
      console.log('Road built at edge:', data.edgeId);
      setBuildMode(null);
    });

    newSocket.on('cityBuilt', (data) => {
      console.log('City built at vertex:', data.vertexId);
      setBuildMode(null);
    });

    newSocket.on('devCardBought', (data) => {
      console.log('Development card bought:', data.cardType);
    });

    newSocket.on('devCardPlayed', (data) => {
      console.log('Development card played:', data.cardType);
      
      if (data.mustMoveRobber) {
        setPendingRobberMove(true);
      }
    });

    newSocket.on('tradeOfferCreated', (data) => {
      console.log('Trade offer created:', data.trade);
    });

    newSocket.on('tradeOfferResponded', (data) => {
      console.log('Trade offer responded:', data);
    });

    newSocket.on('turnEnded', (data) => {
      console.log('Turn ended, next player:', data.nextPlayer);
      setBuildMode(null);
      setPendingRobberMove(false);
    });

    newSocket.on('error', (message) => {
      setError(message);
      console.error('Game error:', message);
    });

    return () => {
      newSocket.close();
    };
  }, [playerId]);

  const createGame = () => {
    if (playerName.trim() && socket) {
      socket.emit('createGame', playerName.trim());
    }
  };

  const joinGame = (gameId) => {
    if (playerName.trim() && socket) {
      socket.emit('joinGame', { gameId: gameId.trim(), playerName: playerName.trim() });
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  const rollDice = () => {
    if (socket) {
      socket.emit('rollDice');
    }
  };

  const endTurn = () => {
    if (socket) {
      socket.emit('endTurn');
    }
  };

  const buildSettlement = (vertexId) => {
    if (socket) {
      socket.emit('buildSettlement', { vertex: vertexId });
    }
  };

  const buildRoad = (edgeId) => {
    if (socket) {
      socket.emit('buildRoad', { edge: edgeId });
    }
  };

  const buildCity = (vertexId) => {
    if (socket) {
      socket.emit('buildCity', { vertex: vertexId });
    }
  };

  const buyDevelopmentCard = () => {
    if (socket) {
      socket.emit('buyDevCard');
    }
  };

  const playDevelopmentCard = (cardType, data) => {
    if (socket) {
      socket.emit('playDevCard', { cardType, data });
    }
  };

  const moveRobber = (hexIndex, targetPlayerId) => {
    if (socket) {
      socket.emit('moveRobber', { hexIndex, targetPlayerId });
    }
  };

  const createTradeOffer = (offer, want, targetPlayerId) => {
    if (socket) {
      socket.emit('tradeOffer', { offer, want, targetPlayerId });
    }
  };

  const respondToTrade = (tradeId, accept) => {
    if (socket) {
      socket.emit('tradeResponse', { tradeId, accept });
    }
  };

  const discardCards = (cards) => {
    if (socket) {
      socket.emit('discardCards', { cards });
    }
  };

  const getCurrentPlayer = () => {
    if (!gameState || !gameState.players) return null;
    return gameState.players.find(p => p.id === gameState.currentPlayerId);
  };

  const getPlayer = (id) => {
    if (!gameState || !gameState.players) return null;
    return gameState.players.find(p => p.id === id);
  };

  const isCurrentPlayer = () => {
    return gameState && gameState.currentPlayerId === playerId;
  };

  if (!connected) {
    return (
      <div className="app">
        <div className="connection-status">
          <h2>Connecting to server...</h2>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="app">
        <GameLobby
          playerName={playerName}
          setPlayerName={setPlayerName}
          onCreateGame={createGame}
          onJoinGame={joinGame}
          error={error}
        />
      </div>
    );
  }

  if (gameState.phase === 'waiting') {
    return (
      <div className="app">
        <div className="lobby">
          <h2>Game Lobby - {gameId}</h2>
          <div className="players">
            <h3>Players ({gameState.players.length}/4):</h3>
            {gameState.players.map(player => (
              <div key={player.id} className={`player ${player.color}`}>
                {player.name} ({player.color})
              </div>
            ))}
          </div>
          {gameState.players.length >= 2 && (
            <button onClick={startGame} className="start-button">
              Start Game
            </button>
          )}
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-header">
        <h1>Settlers of Catan - {gameId}</h1>
        <div className="game-info">
          <span>Turn: {gameState.turn}</span>
          <span>Phase: {gameState.phase}</span>
          {gameState.winner && <span className="winner">Winner: {getPlayer(gameState.winner)?.name}</span>}
        </div>
      </div>

      <div className="game-container">
        <div className="game-main">
          <GameBoard
            gameState={gameState}
            playerId={playerId}
            onVertexClick={buildMode === 'settlement' ? buildSettlement : (buildMode === 'city' ? buildCity : null)}
            onEdgeClick={buildMode === 'road' ? buildRoad : null}
            onHexClick={pendingRobberMove ? (hexId) => moveRobber(hexId, null) : null}
            buildMode={buildMode}
            pendingRobberMove={pendingRobberMove}
          />
          
          <div className="game-controls">
            {isCurrentPlayer() && gameState.phase === 'playing' && (
              <>
                {!gameState.diceRolled && (
                  <button onClick={rollDice} className="dice-button">
                    Roll Dice
                  </button>
                )}
                
                <div className="build-buttons">
                  <button
                    onClick={() => setBuildMode(buildMode === 'settlement' ? null : 'settlement')}
                    className={`build-button ${buildMode === 'settlement' ? 'active' : ''}`}
                  >
                    Build Settlement
                  </button>
                  <button
                    onClick={() => setBuildMode(buildMode === 'city' ? null : 'city')}
                    className={`build-button ${buildMode === 'city' ? 'active' : ''}`}
                  >
                    Build City
                  </button>
                  <button
                    onClick={() => setBuildMode(buildMode === 'road' ? null : 'road')}
                    className={`build-button ${buildMode === 'road' ? 'active' : ''}`}
                  >
                    Build Road
                  </button>
                </div>
                
                <button onClick={buyDevelopmentCard} className="dev-card-button">
                  Buy Development Card
                </button>
                
                <button onClick={() => setShowDevCardPanel(true)} className="play-dev-card-button">
                  Play Development Card
                </button>
                
                <button onClick={() => setShowTradePanel(true)} className="trade-button">
                  Trade
                </button>
                
                {gameState.diceRolled && (
                  <button onClick={endTurn} className="end-turn-button">
                    End Turn
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="game-sidebar">
          <PlayerPanel
            players={gameState.players}
            currentPlayerId={gameState.currentPlayerId}
            myPlayerId={playerId}
            gameState={gameState}
          />
          
          {pendingDiscard && (
            <div className="discard-panel">
              <h3>Discard {discardCount} Cards</h3>
              <p>You must discard half your cards due to rolling a 7.</p>
              {/* Add discard interface here */}
            </div>
          )}
        </div>
      </div>

      {showTradePanel && (
        <TradePanel
          players={gameState.players.filter(p => p.id !== playerId)}
          onClose={() => setShowTradePanel(false)}
          onCreateTrade={createTradeOffer}
          onRespondToTrade={respondToTrade}
          tradeOffers={gameState.tradeOffers}
          playerId={playerId}
        />
      )}

      {showDevCardPanel && (
        <DevelopmentCardPanel
          onClose={() => setShowDevCardPanel(false)}
          onPlayCard={playDevelopmentCard}
          developmentCards={gameState.playerDevelopmentCards || {}}
          newDevelopmentCards={gameState.playerNewDevelopmentCards || {}}
        />
      )}

      {error && (
        <div className="error-overlay">
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;