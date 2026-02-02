const Board = require('./Board');
const Player = require('./Player');
const { v4: uuidv4 } = require('uuid');

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [];
    this.board = new Board();
    this.currentPlayerIndex = 0;
    this.phase = 'waiting'; // waiting, setup, playing, finished
    this.turn = 1;
    this.diceRolled = false;
    this.robberActive = false;
    this.setupRounds = 0;
    this.developmentCards = this.initializeDevelopmentCards();
    this.tradeOffers = [];
    this.winner = null;
    
    // Game constants
    this.VICTORY_POINTS_TO_WIN = 10;
    this.RESOURCE_TYPES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
    this.DEVELOPMENT_CARD_TYPES = ['knight', 'victoryPoint', 'roadBuilding', 'yearOfPlenty', 'monopoly'];
  }

  initializeDevelopmentCards() {
    const cards = [];
    // Add development cards according to standard Catan rules
    for (let i = 0; i < 14; i++) cards.push('knight');
    for (let i = 0; i < 5; i++) cards.push('victoryPoint');
    for (let i = 0; i < 2; i++) cards.push('roadBuilding');
    for (let i = 0; i < 2; i++) cards.push('yearOfPlenty');
    for (let i = 0; i < 2; i++) cards.push('monopoly');
    
    // Shuffle the deck
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return cards;
  }

  addPlayer(name, socketId) {
    const playerId = uuidv4();
    const playerColors = ['red', 'blue', 'white', 'orange'];
    const color = playerColors[this.players.length];
    
    const player = new Player(playerId, name, socketId, color);
    this.players.push(player);
    
    return playerId;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  startGame() {
    if (this.players.length < 2) return false;
    
    this.phase = 'setup';
    this.board.initialize();
    
    // Shuffle players for random turn order
    for (let i = this.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
    }
    
    return true;
  }

  rollDice(playerId) {
    if (this.phase !== 'playing') {
      return { success: false, message: 'Cannot roll dice during setup phase' };
    }
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (this.diceRolled) {
      return { success: false, message: 'Dice already rolled this turn' };
    }
    
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    
    this.diceRolled = true;
    
    if (total === 7) {
      this.activateRobber();
      return { 
        success: true, 
        dice: [die1, die2], 
        total, 
        robberActivated: true,
        playersToDiscard: this.getPlayersWhoMustDiscard()
      };
    } else {
      this.distributeResources(total);
      return { 
        success: true, 
        dice: [die1, die2], 
        total, 
        resourcesDistributed: true 
      };
    }
  }

  activateRobber() {
    this.robberActive = true;
    // Players with more than 7 cards must discard half
  }

  getPlayersWhoMustDiscard() {
    return this.players.filter(player => {
      const cardCount = Object.values(player.resources).reduce((sum, count) => sum + count, 0);
      return cardCount > 7;
    }).map(player => ({
      playerId: player.id,
      cardCount: Object.values(player.resources).reduce((sum, count) => sum + count, 0),
      mustDiscard: Math.floor(Object.values(player.resources).reduce((sum, count) => sum + count, 0) / 2)
    }));
  }

  discardCards(playerId, cards) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    const totalToDiscard = Math.floor(Object.values(player.resources).reduce((sum, count) => sum + count, 0) / 2);
    const totalDiscarded = Object.values(cards).reduce((sum, count) => sum + count, 0);
    
    if (totalDiscarded !== totalToDiscard) {
      return { success: false, message: `Must discard exactly ${totalToDiscard} cards` };
    }
    
    // Check if player has enough cards to discard
    for (const [resource, count] of Object.entries(cards)) {
      if (player.resources[resource] < count) {
        return { success: false, message: `Not enough ${resource} cards` };
      }
    }
    
    // Remove cards from player
    for (const [resource, count] of Object.entries(cards)) {
      player.resources[resource] -= count;
    }
    
    player.hasDiscarded = true;
    
    // Check if all players who needed to discard have done so
    const playersWhoMustDiscard = this.getPlayersWhoMustDiscard();
    const allDiscarded = playersWhoMustDiscard.every(p => this.getPlayer(p.playerId).hasDiscarded);
    
    return { success: true, allDiscarded };
  }

  distributeResources(diceRoll) {
    const hexes = this.board.getHexesByNumber(diceRoll);
    
    hexes.forEach(hex => {
      if (hex.hasRobber) return; // No resources if robber is on this hex
      
      const adjacentVertices = this.board.getAdjacentVertices(hex.index);
      adjacentVertices.forEach(vertex => {
        const building = vertex.building;
        if (building && building.playerId) {
          const player = this.getPlayer(building.playerId);
          if (player) {
            const amount = building.type === 'city' ? 2 : 1;
            player.resources[hex.resource] = (player.resources[hex.resource] || 0) + amount;
          }
        }
      });
    });
  }

  moveRobber(playerId, hexIndex, targetPlayerId) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.robberActive) {
      return { success: false, message: 'Robber is not active' };
    }
    
    const hex = this.board.hexes[hexIndex];
    if (!hex) {
      return { success: false, message: 'Invalid hex' };
    }
    
    // Move robber from current position
    this.board.hexes.forEach(h => h.hasRobber = false);
    hex.hasRobber = true;
    
    let stolenResource = null;
    if (targetPlayerId) {
      const targetPlayer = this.getPlayer(targetPlayerId);
      if (targetPlayer) {
        const resources = Object.keys(targetPlayer.resources).filter(r => targetPlayer.resources[r] > 0);
        if (resources.length > 0) {
          const randomResource = resources[Math.floor(Math.random() * resources.length)];
          targetPlayer.resources[randomResource]--;
          this.getCurrentPlayer().resources[randomResource] = (this.getCurrentPlayer().resources[randomResource] || 0) + 1;
          stolenResource = randomResource;
        }
      }
    }
    
    this.robberActive = false;
    this.getCurrentPlayer().playersToDiscard = [];
    
    // Reset discard flags
    this.players.forEach(player => player.hasDiscarded = false);
    
    return { success: true, hexIndex, targetPlayerId, stolenResource };
  }

  buildSettlement(playerId, vertexId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.phase === 'setup') {
      return this.buildSetupSettlement(playerId, vertexId);
    }
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.diceRolled) {
      return { success: false, message: 'Must roll dice first' };
    }
    
    // Check resources
    const cost = { wood: 1, brick: 1, sheep: 1, wheat: 1 };
    if (!this.playerHasResources(player, cost)) {
      return { success: false, message: 'Insufficient resources' };
    }
    
    // Check if vertex is available and connected to player's road
    const vertex = this.board.getVertex(vertexId);
    if (!vertex || vertex.building) {
      return { success: false, message: 'Cannot build settlement here' };
    }
    
    if (!this.board.isVertexConnectedToPlayerRoad(vertexId, playerId)) {
      return { success: false, message: 'Settlement must be connected to your road' };
    }
    
    // Check distance rule (no adjacent settlements)
    if (this.board.hasAdjacentSettlement(vertexId)) {
      return { success: false, message: 'Cannot build adjacent to another settlement' };
    }
    
    // Build settlement
    vertex.building = { type: 'settlement', playerId };
    this.deductResources(player, cost);
    player.settlements++;
    player.victoryPoints++;
    
    // Check for victory
    if (player.victoryPoints >= this.VICTORY_POINTS_TO_WIN) {
      this.phase = 'finished';
      this.winner = playerId;
    }
    
    return { success: true, vertexId, playerId };
  }

  buildSetupSettlement(playerId, vertexId) {
    const player = this.getPlayer(playerId);
    const vertex = this.board.getVertex(vertexId);
    
    if (!vertex || vertex.building) {
      return { success: false, message: 'Cannot build settlement here' };
    }
    
    if (this.board.hasAdjacentSettlement(vertexId)) {
      return { success: false, message: 'Cannot build adjacent to another settlement' };
    }
    
    vertex.building = { type: 'settlement', playerId };
    player.settlements++;
    player.victoryPoints++;
    
    // In setup phase, collect resources from second settlement
    if (this.setupRounds >= this.players.length) {
      const adjacentHexes = this.board.getAdjacentHexes(vertexId);
      adjacentHexes.forEach(hex => {
        if (hex.resource && hex.resource !== 'desert') {
          player.resources[hex.resource] = (player.resources[hex.resource] || 0) + 1;
        }
      });
    }
    
    player.setupSettlementsBuilt++;
    this.checkSetupPhaseComplete();
    
    return { success: true, vertexId, playerId, setupPhase: true };
  }

  buildRoad(playerId, edgeId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.phase === 'setup') {
      return this.buildSetupRoad(playerId, edgeId);
    }
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.diceRolled) {
      return { success: false, message: 'Must roll dice first' };
    }
    
    // Check resources
    const cost = { wood: 1, brick: 1 };
    if (!this.playerHasResources(player, cost)) {
      return { success: false, message: 'Insufficient resources' };
    }
    
    // Check if edge is available and connected
    const edge = this.board.getEdge(edgeId);
    if (!edge || edge.road) {
      return { success: false, message: 'Cannot build road here' };
    }
    
    if (!this.board.isEdgeConnectedToPlayer(edgeId, playerId)) {
      return { success: false, message: 'Road must be connected to your network' };
    }
    
    // Build road
    edge.road = { playerId };
    this.deductResources(player, cost);
    player.roads++;
    
    // Check for longest road
    this.updateLongestRoad();
    
    return { success: true, edgeId, playerId };
  }

  buildSetupRoad(playerId, edgeId) {
    const player = this.getPlayer(playerId);
    const edge = this.board.getEdge(edgeId);
    
    if (!edge || edge.road) {
      return { success: false, message: 'Cannot build road here' };
    }
    
    // In setup, road must be adjacent to the settlement just built
    const lastSettlement = player.lastSettlementVertex;
    if (!this.board.isEdgeAdjacentToVertex(edgeId, lastSettlement)) {
      return { success: false, message: 'Road must be adjacent to your settlement' };
    }
    
    edge.road = { playerId };
    player.roads++;
    player.setupRoadsBuilt++;
    
    this.checkSetupPhaseComplete();
    
    return { success: true, edgeId, playerId, setupPhase: true };
  }

  buildCity(playerId, vertexId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.diceRolled) {
      return { success: false, message: 'Must roll dice first' };
    }
    
    // Check resources
    const cost = { wheat: 2, ore: 3 };
    if (!this.playerHasResources(player, cost)) {
      return { success: false, message: 'Insufficient resources' };
    }
    
    // Check if vertex has player's settlement
    const vertex = this.board.getVertex(vertexId);
    if (!vertex || !vertex.building || vertex.building.type !== 'settlement' || vertex.building.playerId !== playerId) {
      return { success: false, message: 'Must upgrade your own settlement' };
    }
    
    // Upgrade to city
    vertex.building.type = 'city';
    this.deductResources(player, cost);
    player.settlements--;
    player.cities++;
    player.victoryPoints++;
    
    // Check for victory
    if (player.victoryPoints >= this.VICTORY_POINTS_TO_WIN) {
      this.phase = 'finished';
      this.winner = playerId;
    }
    
    return { success: true, vertexId, playerId };
  }

  buyDevelopmentCard(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.diceRolled) {
      return { success: false, message: 'Must roll dice first' };
    }
    
    if (this.developmentCards.length === 0) {
      return { success: false, message: 'No development cards left' };
    }
    
    // Check resources
    const cost = { sheep: 1, wheat: 1, ore: 1 };
    if (!this.playerHasResources(player, cost)) {
      return { success: false, message: 'Insufficient resources' };
    }
    
    // Buy card
    const card = this.developmentCards.pop();
    this.deductResources(player, cost);
    
    player.developmentCards[card] = (player.developmentCards[card] || 0) + 1;
    player.newDevelopmentCards[card] = (player.newDevelopmentCards[card] || 0) + 1;
    
    if (card === 'victoryPoint') {
      player.victoryPoints++;
      if (player.victoryPoints >= this.VICTORY_POINTS_TO_WIN) {
        this.phase = 'finished';
        this.winner = playerId;
      }
    }
    
    return { success: true, cardType: card };
  }

  playDevelopmentCard(playerId, cardType, data) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    // Check if player has the card and it's not newly bought
    const availableCards = player.developmentCards[cardType] - (player.newDevelopmentCards[cardType] || 0);
    if (availableCards <= 0) {
      return { success: false, message: 'Card not available to play' };
    }
    
    player.developmentCards[cardType]--;
    
    let result = { success: true, cardType };
    
    switch (cardType) {
      case 'knight':
        player.knightsPlayed++;
        this.robberActive = true;
        this.updateLargestArmy();
        result.knightPlayed = true;
        result.mustMoveRobber = true;
        break;
        
      case 'roadBuilding':
        result.freeRoads = 2;
        player.freeRoads = 2;
        break;
        
      case 'yearOfPlenty':
        if (data && data.resources) {
          const totalResources = Object.values(data.resources).reduce((sum, count) => sum + count, 0);
          if (totalResources === 2) {
            for (const [resource, count] of Object.entries(data.resources)) {
              player.resources[resource] = (player.resources[resource] || 0) + count;
            }
            result.resourcesGained = data.resources;
          } else {
            return { success: false, message: 'Must choose exactly 2 resources' };
          }
        }
        break;
        
      case 'monopoly':
        if (data && data.resource) {
          let totalStolen = 0;
          this.players.forEach(otherPlayer => {
            if (otherPlayer.id !== playerId) {
              const count = otherPlayer.resources[data.resource] || 0;
              totalStolen += count;
              otherPlayer.resources[data.resource] = 0;
            }
          });
          player.resources[data.resource] = (player.resources[data.resource] || 0) + totalStolen;
          result.resourceStolen = data.resource;
          result.totalStolen = totalStolen;
        }
        break;
    }
    
    return result;
  }

  updateLargestArmy() {
    const threshold = 3;
    let maxKnights = 0;
    let playerWithMostKnights = null;
    
    this.players.forEach(player => {
      if (player.knightsPlayed >= threshold && player.knightsPlayed > maxKnights) {
        maxKnights = player.knightsPlayed;
        playerWithMostKnights = player;
      }
    });
    
    // Update largest army holder
    this.players.forEach(player => {
      if (player.hasLargestArmy && player !== playerWithMostKnights) {
        player.hasLargestArmy = false;
        player.victoryPoints -= 2;
      }
    });
    
    if (playerWithMostKnights && !playerWithMostKnights.hasLargestArmy) {
      playerWithMostKnights.hasLargestArmy = true;
      playerWithMostKnights.victoryPoints += 2;
      
      if (playerWithMostKnights.victoryPoints >= this.VICTORY_POINTS_TO_WIN) {
        this.phase = 'finished';
        this.winner = playerWithMostKnights.id;
      }
    }
  }

  updateLongestRoad() {
    const threshold = 5;
    let maxRoadLength = 0;
    let playerWithLongestRoad = null;
    
    this.players.forEach(player => {
      const roadLength = this.board.calculateLongestRoadForPlayer(player.id);
      if (roadLength >= threshold && roadLength > maxRoadLength) {
        maxRoadLength = roadLength;
        playerWithLongestRoad = player;
      }
    });
    
    // Update longest road holder
    this.players.forEach(player => {
      if (player.hasLongestRoad && player !== playerWithLongestRoad) {
        player.hasLongestRoad = false;
        player.victoryPoints -= 2;
      }
    });
    
    if (playerWithLongestRoad && !playerWithLongestRoad.hasLongestRoad) {
      playerWithLongestRoad.hasLongestRoad = true;
      playerWithLongestRoad.victoryPoints += 2;
      
      if (playerWithLongestRoad.victoryPoints >= this.VICTORY_POINTS_TO_WIN) {
        this.phase = 'finished';
        this.winner = playerWithLongestRoad.id;
      }
    }
  }

  createTradeOffer(playerId, offer, want, targetPlayerId) {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, message: 'Player not found' };
    
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (!this.playerHasResources(player, offer)) {
      return { success: false, message: 'Insufficient resources to offer' };
    }
    
    const tradeId = uuidv4();
    const trade = {
      id: tradeId,
      fromPlayerId: playerId,
      toPlayerId: targetPlayerId || null,
      offer,
      want,
      status: 'pending'
    };
    
    this.tradeOffers.push(trade);
    
    return { success: true, trade };
  }

  respondToTradeOffer(playerId, tradeId, accept) {
    const trade = this.tradeOffers.find(t => t.id === tradeId);
    if (!trade) return { success: false, message: 'Trade offer not found' };
    
    if (trade.toPlayerId && trade.toPlayerId !== playerId) {
      return { success: false, message: 'Trade not intended for you' };
    }
    
    if (trade.status !== 'pending') {
      return { success: false, message: 'Trade already responded to' };
    }
    
    const fromPlayer = this.getPlayer(trade.fromPlayerId);
    const toPlayer = this.getPlayer(playerId);
    
    if (!fromPlayer || !toPlayer) {
      return { success: false, message: 'Player not found' };
    }
    
    trade.status = accept ? 'accepted' : 'rejected';
    
    if (accept) {
      // Verify both players still have the resources
      if (!this.playerHasResources(fromPlayer, trade.offer) || !this.playerHasResources(toPlayer, trade.want)) {
        return { success: false, message: 'One or both players no longer have the required resources' };
      }
      
      // Execute trade
      this.deductResources(fromPlayer, trade.offer);
      this.deductResources(toPlayer, trade.want);
      
      for (const [resource, amount] of Object.entries(trade.offer)) {
        toPlayer.resources[resource] = (toPlayer.resources[resource] || 0) + amount;
      }
      
      for (const [resource, amount] of Object.entries(trade.want)) {
        fromPlayer.resources[resource] = (fromPlayer.resources[resource] || 0) + amount;
      }
    }
    
    // Remove trade offer
    this.tradeOffers = this.tradeOffers.filter(t => t.id !== tradeId);
    
    return { success: true, trade, executed: accept };
  }

  endTurn(playerId) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    if (this.phase === 'setup') {
      return this.endSetupTurn();
    }
    
    if (!this.diceRolled) {
      return { success: false, message: 'Must roll dice before ending turn' };
    }
    
    // Reset turn state
    this.diceRolled = false;
    this.robberActive = false;
    
    // Clear new development cards (they can now be played)
    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.newDevelopmentCards = {};
    
    // Clear trade offers
    this.tradeOffers = [];
    
    // Next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.turn++;
    
    return { success: true, nextPlayer: this.getCurrentPlayer().id };
  }

  endSetupTurn() {
    const currentPlayer = this.getCurrentPlayer();
    
    // Check if current player has completed their setup turn
    if (this.setupRounds < this.players.length) {
      // First round - need settlement and road
      if (currentPlayer.setupSettlementsBuilt < 1) {
        return { success: false, message: 'Must build settlement first' };
      }
      if (currentPlayer.setupRoadsBuilt < 1) {
        return { success: false, message: 'Must build road after settlement' };
      }
    } else {
      // Second round - need second settlement and road
      if (currentPlayer.setupSettlementsBuilt < 2) {
        return { success: false, message: 'Must build second settlement' };
      }
      if (currentPlayer.setupRoadsBuilt < 2) {
        return { success: false, message: 'Must build second road' };
      }
    }
    
    // Advance to next player or complete setup
    if (this.setupRounds < this.players.length) {
      // First round - go to next player
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      if (this.currentPlayerIndex === 0) {
        this.setupRounds = this.players.length;
        this.currentPlayerIndex = this.players.length - 1; // Start second round in reverse
      }
    } else if (this.setupRounds < this.players.length * 2) {
      // Second round - go to previous player
      this.currentPlayerIndex--;
      if (this.currentPlayerIndex < 0) {
        // Setup complete, start main game
        this.phase = 'playing';
        this.currentPlayerIndex = 0;
        this.setupRounds = this.players.length * 2;
      }
    }
    
    return { success: true, nextPlayer: this.getCurrentPlayer().id, setupComplete: this.phase === 'playing' };
  }

  checkSetupPhaseComplete() {
    const allPlayersReady = this.players.every(player => 
      player.setupSettlementsBuilt === 2 && player.setupRoadsBuilt === 2
    );
    
    if (allPlayersReady) {
      this.phase = 'playing';
      this.currentPlayerIndex = 0;
    }
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  playerHasResources(player, cost) {
    for (const [resource, amount] of Object.entries(cost)) {
      if ((player.resources[resource] || 0) < amount) {
        return false;
      }
    }
    return true;
  }

  deductResources(player, cost) {
    for (const [resource, amount] of Object.entries(cost)) {
      player.resources[resource] = (player.resources[resource] || 0) - amount;
    }
  }

  getGameState() {
    return {
      gameId: this.gameId,
      phase: this.phase,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.id,
      turn: this.turn,
      diceRolled: this.diceRolled,
      robberActive: this.robberActive,
      setupRounds: this.setupRounds,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        resources: Object.values(p.resources).reduce((sum, count) => sum + count, 0),
        developmentCards: Object.values(p.developmentCards).reduce((sum, count) => sum + count, 0),
        victoryPoints: p.victoryPoints,
        settlements: p.settlements,
        cities: p.cities,
        roads: p.roads,
        knightsPlayed: p.knightsPlayed,
        hasLargestArmy: p.hasLargestArmy,
        hasLongestRoad: p.hasLongestRoad
      })),
      board: this.board.getState(),
      tradeOffers: this.tradeOffers,
      winner: this.winner
    };
  }

  getPrivateGameState(playerId) {
    const gameState = this.getGameState();
    const player = this.getPlayer(playerId);
    
    if (player) {
      gameState.playerResources = player.resources;
      gameState.playerDevelopmentCards = player.developmentCards;
      gameState.playerNewDevelopmentCards = player.newDevelopmentCards;
    }
    
    return gameState;
  }
}

module.exports = Game;