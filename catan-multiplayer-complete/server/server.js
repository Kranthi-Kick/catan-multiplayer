const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Game = require('./game/Game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active games
const games = new Map();
const playerSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create or join game
  socket.on('createGame', (playerName) => {
    const gameId = uuidv4().substring(0, 8);
    const game = new Game(gameId);
    const playerId = game.addPlayer(playerName, socket.id);
    
    games.set(gameId, game);
    playerSockets.set(socket.id, { gameId, playerId });
    
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, playerId, game: game.getGameState() });
    
    console.log(`Game ${gameId} created by ${playerName}`);
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    
    if (game.players.length >= 4) {
      socket.emit('error', 'Game is full');
      return;
    }
    
    const playerId = game.addPlayer(playerName, socket.id);
    playerSockets.set(socket.id, { gameId, playerId });
    
    socket.join(gameId);
    socket.emit('gameJoined', { gameId, playerId, game: game.getGameState() });
    socket.to(gameId).emit('playerJoined', { playerId, playerName });
    
    console.log(`${playerName} joined game ${gameId}`);
  });

  // Start game
  socket.on('startGame', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    if (game.players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }
    
    game.startGame();
    io.to(playerInfo.gameId).emit('gameStarted', game.getGameState());
    
    console.log(`Game ${playerInfo.gameId} started`);
  });

  // Game actions
  socket.on('rollDice', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.rollDice(playerInfo.playerId);
    if (result.success) {
      io.to(playerInfo.gameId).emit('diceRolled', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('endTurn', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.endTurn(playerInfo.playerId);
    if (result.success) {
      io.to(playerInfo.gameId).emit('turnEnded', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('buildSettlement', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.buildSettlement(playerInfo.playerId, data.vertex);
    if (result.success) {
      io.to(playerInfo.gameId).emit('settlementBuilt', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('buildRoad', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.buildRoad(playerInfo.playerId, data.edge);
    if (result.success) {
      io.to(playerInfo.gameId).emit('roadBuilt', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('buildCity', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.buildCity(playerInfo.playerId, data.vertex);
    if (result.success) {
      io.to(playerInfo.gameId).emit('cityBuilt', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('buyDevCard', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.buyDevelopmentCard(playerInfo.playerId);
    if (result.success) {
      socket.emit('devCardBought', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('playDevCard', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.playDevelopmentCard(playerInfo.playerId, data.cardType, data.data);
    if (result.success) {
      io.to(playerInfo.gameId).emit('devCardPlayed', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('moveRobber', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.moveRobber(playerInfo.playerId, data.hexIndex, data.targetPlayerId);
    if (result.success) {
      io.to(playerInfo.gameId).emit('robberMoved', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('tradeOffer', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.createTradeOffer(playerInfo.playerId, data.offer, data.want, data.targetPlayerId);
    if (result.success) {
      io.to(playerInfo.gameId).emit('tradeOfferCreated', result);
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('tradeResponse', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.respondToTradeOffer(playerInfo.playerId, data.tradeId, data.accept);
    if (result.success) {
      io.to(playerInfo.gameId).emit('tradeOfferResponded', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('discardCards', (data) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.gameId);
    if (!game) return;
    
    const result = game.discardCards(playerInfo.playerId, data.cards);
    if (result.success) {
      io.to(playerInfo.gameId).emit('cardsDiscarded', result);
      io.to(playerInfo.gameId).emit('gameStateUpdate', game.getGameState());
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameId);
      if (game) {
        game.removePlayer(playerInfo.playerId);
        socket.to(playerInfo.gameId).emit('playerLeft', { playerId: playerInfo.playerId });
        
        // Clean up empty games
        if (game.players.length === 0) {
          games.delete(playerInfo.gameId);
        }
      }
      playerSockets.delete(socket.id);
    }
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Server running on port ${port}`));