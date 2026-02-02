class Player {
  constructor(id, name, socketId, color) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.color = color;
    
    // Resources
    this.resources = {
      wood: 0,
      brick: 0,
      sheep: 0,
      wheat: 0,
      ore: 0
    };
    
    // Buildings
    this.settlements = 0;
    this.cities = 0;
    this.roads = 0;
    
    // Development cards
    this.developmentCards = {
      knight: 0,
      victoryPoint: 0,
      roadBuilding: 0,
      yearOfPlenty: 0,
      monopoly: 0
    };
    
    // New development cards (can't be played on same turn)
    this.newDevelopmentCards = {
      knight: 0,
      victoryPoint: 0,
      roadBuilding: 0,
      yearOfPlenty: 0,
      monopoly: 0
    };
    
    // Victory points and achievements
    this.victoryPoints = 0;
    this.knightsPlayed = 0;
    this.hasLargestArmy = false;
    this.hasLongestRoad = false;
    
    // Setup phase tracking
    this.setupSettlementsBuilt = 0;
    this.setupRoadsBuilt = 0;
    this.lastSettlementVertex = null;
    
    // Special states
    this.freeRoads = 0; // From road building card
    this.hasDiscarded = false; // For robber 7 roll
    this.playersToDiscard = []; // Players that must discard when robber is activated
  }
  
  // Get total resource count
  getTotalResources() {
    return Object.values(this.resources).reduce((total, count) => total + count, 0);
  }
  
  // Get total development card count
  getTotalDevelopmentCards() {
    return Object.values(this.developmentCards).reduce((total, count) => total + count, 0);
  }
  
  // Check if player has enough resources for a cost
  canAfford(cost) {
    for (const [resource, amount] of Object.entries(cost)) {
      if (this.resources[resource] < amount) {
        return false;
      }
    }
    return true;
  }
  
  // Spend resources
  spendResources(cost) {
    for (const [resource, amount] of Object.entries(cost)) {
      this.resources[resource] -= amount;
    }
  }
  
  // Add resources
  addResources(resources) {
    for (const [resource, amount] of Object.entries(resources)) {
      this.resources[resource] += amount;
    }
  }
  
  // Calculate visible victory points (excluding hidden victory point cards)
  getVisibleVictoryPoints() {
    let points = 0;
    
    // Points from buildings
    points += this.settlements; // 1 point per settlement
    points += this.cities * 2; // 2 points per city
    
    // Points from achievements
    if (this.hasLargestArmy) points += 2;
    if (this.hasLongestRoad) points += 2;
    
    return points;
  }
  
  // Calculate total victory points (including hidden victory point cards)
  getTotalVictoryPoints() {
    return this.getVisibleVictoryPoints() + this.developmentCards.victoryPoint;
  }
  
  // Get safe representation for other players (no private info)
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      settlements: this.settlements,
      cities: this.cities,
      roads: this.roads,
      victoryPoints: this.getVisibleVictoryPoints(),
      knightsPlayed: this.knightsPlayed,
      hasLargestArmy: this.hasLargestArmy,
      hasLongestRoad: this.hasLongestRoad,
      totalResources: this.getTotalResources(),
      totalDevelopmentCards: this.getTotalDevelopmentCards()
    };
  }
  
  // Get full representation for the player themselves
  getPrivateInfo() {
    return {
      ...this.getPublicInfo(),
      resources: { ...this.resources },
      developmentCards: { ...this.developmentCards },
      newDevelopmentCards: { ...this.newDevelopmentCards },
      freeRoads: this.freeRoads,
      totalVictoryPoints: this.getTotalVictoryPoints()
    };
  }
  
  // Reset turn-specific state
  resetTurn() {
    this.hasDiscarded = false;
    this.freeRoads = 0;
    
    // Move new development cards to playable cards
    for (const [cardType, count] of Object.entries(this.newDevelopmentCards)) {
      if (count > 0) {
        this.newDevelopmentCards[cardType] = 0;
      }
    }
  }
}

module.exports = Player;