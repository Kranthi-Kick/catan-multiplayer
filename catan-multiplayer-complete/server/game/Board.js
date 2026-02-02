class Board {
  constructor() {
    this.hexes = [];
    this.vertices = [];
    this.edges = [];
    this.ports = [];
    this.robberPosition = -1;
    
    // Standard Catan board configuration
    this.BOARD_SIZE = 19; // 19 hexes total
    this.VERTEX_COUNT = 54; // 54 vertices
    this.EDGE_COUNT = 72; // 72 edges
  }

  initialize() {
    this.createHexes();
    this.createVertices();
    this.createEdges();
    this.createPorts();
    this.placeNumbers();
    this.placeRobber();
  }

  createHexes() {
    // Standard Catan resource distribution
    const resources = [
      'wood', 'wood', 'wood', 'wood',
      'brick', 'brick', 'brick',
      'sheep', 'sheep', 'sheep', 'sheep',
      'wheat', 'wheat', 'wheat', 'wheat',
      'ore', 'ore', 'ore',
      'desert'
    ];
    
    // Shuffle resources
    for (let i = resources.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resources[i], resources[j]] = [resources[j], resources[i]];
    }
    
    // Create hexes with shuffled resources
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      this.hexes.push({
        id: i,
        resource: resources[i],
        number: null, // Will be assigned later
        hasRobber: resources[i] === 'desert', // Robber starts on desert
        adjacentVertices: this.getHexAdjacentVertices(i),
        adjacentEdges: this.getHexAdjacentEdges(i)
      });
      
      if (resources[i] === 'desert') {
        this.robberPosition = i;
      }
    }
  }

  createVertices() {
    for (let i = 0; i < this.VERTEX_COUNT; i++) {
      this.vertices.push({
        id: i,
        building: null, // { type: 'settlement'|'city', playerId }
        adjacentHexes: this.getVertexAdjacentHexes(i),
        adjacentVertices: this.getVertexAdjacentVertices(i),
        adjacentEdges: this.getVertexAdjacentEdges(i)
      });
    }
  }

  createEdges() {
    for (let i = 0; i < this.EDGE_COUNT; i++) {
      this.edges.push({
        id: i,
        road: null, // { playerId }
        vertices: this.getEdgeVertices(i),
        adjacentEdges: this.getEdgeAdjacentEdges(i)
      });
    }
  }

  createPorts() {
    // Define ports (3:1 and 2:1 resource ports)
    this.ports = [
      { vertices: [0, 1], type: 'generic', ratio: 3 },
      { vertices: [3, 4], type: 'wood', ratio: 2 },
      { vertices: [14, 15], type: 'generic', ratio: 3 },
      { vertices: [17, 18], type: 'brick', ratio: 2 },
      { vertices: [26, 37], type: 'generic', ratio: 3 },
      { vertices: [28, 38], type: 'sheep', ratio: 2 },
      { vertices: [45, 46], type: 'generic', ratio: 3 },
      { vertices: [50, 51], type: 'ore', ratio: 2 },
      { vertices: [47, 57], type: 'wheat', ratio: 2 }
    ];
  }

  placeNumbers() {
    // Standard Catan number tokens
    const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    
    // Shuffle numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // Assign numbers to non-desert hexes
    let numberIndex = 0;
    for (let i = 0; i < this.hexes.length; i++) {
      if (this.hexes[i].resource !== 'desert') {
        this.hexes[i].number = numbers[numberIndex++];
      }
    }
  }

  placeRobber() {
    // Find desert hex and place robber there
    const desertHex = this.hexes.find(hex => hex.resource === 'desert');
    if (desertHex) {
      desertHex.hasRobber = true;
      this.robberPosition = desertHex.id;
    }
  }

  // Get hexes that produce resources for a dice roll
  getHexesByNumber(number) {
    return this.hexes.filter(hex => hex.number === number);
  }

  // Get vertices adjacent to a hex
  getHexAdjacentVertices(hexId) {
    // This is a simplified mapping - in a real implementation, 
    // you'd need the exact vertex layout for the hexagonal board
    const vertexMappings = {
      0: [0, 1, 2, 8, 9, 10],
      1: [2, 3, 4, 10, 11, 12],
      2: [4, 5, 6, 12, 13, 14],
      3: [7, 8, 9, 17, 18, 19],
      4: [9, 10, 11, 19, 20, 21],
      5: [11, 12, 13, 21, 22, 23],
      6: [13, 14, 15, 23, 24, 25],
      7: [16, 17, 18, 27, 28, 29],
      8: [18, 19, 20, 29, 30, 31],
      9: [20, 21, 22, 31, 32, 33],
      10: [22, 23, 24, 33, 34, 35],
      11: [24, 25, 26, 35, 36, 37],
      12: [27, 28, 38, 39, 40],
      13: [28, 29, 30, 40, 41, 42],
      14: [30, 31, 32, 42, 43, 44],
      15: [32, 33, 34, 44, 45, 46],
      16: [34, 35, 36, 46, 47, 48],
      17: [36, 37, 38, 48, 49, 50],
      18: [39, 40, 41, 51, 52, 53]
    };
    
    return vertexMappings[hexId] || [];
  }

  // Get edges adjacent to a hex
  getHexAdjacentEdges(hexId) {
    // Simplified mapping for hex to edges
    const edgeMappings = {
      0: [0, 1, 6, 7, 12, 13],
      1: [2, 3, 8, 9, 14, 15],
      2: [4, 5, 10, 11, 16, 17],
      3: [12, 13, 18, 19, 24, 25],
      4: [14, 15, 20, 21, 26, 27],
      5: [16, 17, 22, 23, 28, 29],
      6: [18, 19, 30, 31, 36, 37],
      7: [24, 25, 32, 33, 38, 39],
      8: [26, 27, 34, 35, 40, 41],
      9: [28, 29, 36, 37, 42, 43],
      10: [30, 31, 38, 39, 44, 45],
      11: [32, 33, 40, 41, 46, 47],
      12: [42, 43, 48, 49, 54, 55],
      13: [44, 45, 50, 51, 56, 57],
      14: [46, 47, 52, 53, 58, 59],
      15: [48, 49, 54, 55, 60, 61],
      16: [50, 51, 56, 57, 62, 63],
      17: [52, 53, 58, 59, 64, 65],
      18: [60, 61, 66, 67, 68, 69]
    };
    
    return edgeMappings[hexId] || [];
  }

  // Get hexes adjacent to a vertex
  getVertexAdjacentHexes(vertexId) {
    const adjacentHexes = [];
    
    for (let i = 0; i < this.hexes.length; i++) {
      const hexVertices = this.getHexAdjacentVertices(i);
      if (hexVertices.includes(vertexId)) {
        adjacentHexes.push(i);
      }
    }
    
    return adjacentHexes;
  }

  // Get vertices adjacent to a vertex
  getVertexAdjacentVertices(vertexId) {
    // This would need the specific board layout
    // For now, return a simplified version
    const adjacentVertices = [];
    
    // Check through edges to find connected vertices
    for (let i = 0; i < this.EDGE_COUNT; i++) {
      const edgeVertices = this.getEdgeVertices(i);
      if (edgeVertices.includes(vertexId)) {
        adjacentVertices.push(...edgeVertices.filter(v => v !== vertexId));
      }
    }
    
    return [...new Set(adjacentVertices)]; // Remove duplicates
  }

  // Get edges adjacent to a vertex
  getVertexAdjacentEdges(vertexId) {
    const adjacentEdges = [];
    
    for (let i = 0; i < this.EDGE_COUNT; i++) {
      const edgeVertices = this.getEdgeVertices(i);
      if (edgeVertices.includes(vertexId)) {
        adjacentEdges.push(i);
      }
    }
    
    return adjacentEdges;
  }

  // Get the two vertices that an edge connects
  getEdgeVertices(edgeId) {
    // This is a simplified mapping - would need proper board layout
    // Each edge connects exactly 2 vertices
    const edgeVertexMappings = {
      0: [0, 1], 1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [5, 6],
      6: [0, 8], 7: [2, 10], 8: [3, 11], 9: [4, 12], 10: [5, 13], 11: [6, 14],
      12: [7, 8], 13: [8, 9], 14: [9, 10], 15: [10, 11], 16: [11, 12], 17: [12, 13],
      18: [13, 14], 19: [14, 15], 20: [16, 17], 21: [17, 18], 22: [18, 19], 23: [19, 20],
      24: [20, 21], 25: [21, 22], 26: [22, 23], 27: [23, 24], 28: [24, 25], 29: [25, 26],
      30: [7, 16], 31: [9, 18], 32: [11, 20], 33: [13, 22], 34: [15, 24], 35: [26, 37],
      36: [27, 28], 37: [28, 29], 38: [29, 30], 39: [30, 31], 40: [31, 32], 41: [32, 33],
      42: [33, 34], 43: [34, 35], 44: [35, 36], 45: [36, 37], 46: [38, 39], 47: [39, 40],
      48: [40, 41], 49: [41, 42], 50: [42, 43], 51: [43, 44], 52: [44, 45], 53: [45, 46],
      54: [46, 47], 55: [47, 48], 56: [48, 49], 57: [49, 50], 58: [50, 51], 59: [51, 52],
      60: [52, 53], 61: [38, 51], 62: [40, 53], 63: [41, 54], 64: [42, 55], 65: [43, 56],
      66: [44, 57], 67: [45, 58], 68: [46, 59], 69: [47, 60], 70: [48, 61], 71: [49, 62]
    };
    
    return edgeVertexMappings[edgeId] || [];
  }

  // Get edges adjacent to an edge (connected edges)
  getEdgeAdjacentEdges(edgeId) {
    const adjacentEdges = [];
    const edgeVertices = this.getEdgeVertices(edgeId);
    
    // Find all edges that share a vertex with this edge
    for (let i = 0; i < this.EDGE_COUNT; i++) {
      if (i === edgeId) continue;
      
      const otherEdgeVertices = this.getEdgeVertices(i);
      const hasSharedVertex = edgeVertices.some(v => otherEdgeVertices.includes(v));
      
      if (hasSharedVertex) {
        adjacentEdges.push(i);
      }
    }
    
    return adjacentEdges;
  }

  // Check if a vertex is connected to a player's road network
  isVertexConnectedToPlayerRoad(vertexId, playerId) {
    const adjacentEdges = this.getVertexAdjacentEdges(vertexId);
    
    return adjacentEdges.some(edgeId => {
      const edge = this.edges[edgeId];
      return edge.road && edge.road.playerId === playerId;
    });
  }

  // Check if an edge is connected to a player's road network or settlement
  isEdgeConnectedToPlayer(edgeId, playerId) {
    const edgeVertices = this.getEdgeVertices(edgeId);
    
    // Check if connected to player's settlement/city
    const connectedToBuilding = edgeVertices.some(vertexId => {
      const vertex = this.vertices[vertexId];
      return vertex.building && vertex.building.playerId === playerId;
    });
    
    if (connectedToBuilding) return true;
    
    // Check if connected to player's existing roads
    const adjacentEdges = this.getEdgeAdjacentEdges(edgeId);
    const connectedToRoad = adjacentEdges.some(adjEdgeId => {
      const edge = this.edges[adjEdgeId];
      return edge.road && edge.road.playerId === playerId;
    });
    
    return connectedToRoad;
  }

  // Check if an edge is adjacent to a vertex
  isEdgeAdjacentToVertex(edgeId, vertexId) {
    const edgeVertices = this.getEdgeVertices(edgeId);
    return edgeVertices.includes(vertexId);
  }

  // Check if a vertex has any adjacent settlements
  hasAdjacentSettlement(vertexId) {
    const adjacentVertices = this.getVertexAdjacentVertices(vertexId);
    
    return adjacentVertices.some(adjVertexId => {
      const vertex = this.vertices[adjVertexId];
      return vertex.building !== null;
    });
  }

  // Get a vertex by ID
  getVertex(vertexId) {
    return this.vertices[vertexId];
  }

  // Get an edge by ID
  getEdge(edgeId) {
    return this.edges[edgeId];
  }

  // Get a hex by ID
  getHex(hexId) {
    return this.hexes[hexId];
  }

  // Get hexes adjacent to a vertex (for resource collection)
  getAdjacentHexes(vertexId) {
    const adjacentHexIndices = this.getVertexAdjacentHexes(vertexId);
    return adjacentHexIndices.map(hexId => this.hexes[hexId]);
  }

  // Get vertices adjacent to a hex (for resource distribution)
  getAdjacentVertices(hexId) {
    const adjacentVertexIndices = this.getHexAdjacentVertices(hexId);
    return adjacentVertexIndices.map(vertexId => this.vertices[vertexId]);
  }

  // Calculate longest road for a player using depth-first search
  calculateLongestRoadForPlayer(playerId) {
    const playerEdges = this.edges
      .map((edge, index) => ({ ...edge, id: index }))
      .filter(edge => edge.road && edge.road.playerId === playerId);
    
    if (playerEdges.length === 0) return 0;
    
    let maxLength = 0;
    
    // Try starting from each edge
    for (const startEdge of playerEdges) {
      const visited = new Set();
      const length = this.dfsLongestRoad(startEdge.id, playerId, visited);
      maxLength = Math.max(maxLength, length);
    }
    
    return maxLength;
  }

  dfsLongestRoad(edgeId, playerId, visited) {
    visited.add(edgeId);
    let maxLength = 1;
    
    const adjacentEdges = this.getEdgeAdjacentEdges(edgeId);
    
    for (const adjEdgeId of adjacentEdges) {
      const adjEdge = this.edges[adjEdgeId];
      
      // Check if this edge belongs to the player and hasn't been visited
      if (!visited.has(adjEdgeId) && adjEdge.road && adjEdge.road.playerId === playerId) {
        // Check if the roads are connected (not blocked by opponent's settlement)
        const sharedVertices = this.getEdgeVertices(edgeId).filter(v => 
          this.getEdgeVertices(adjEdgeId).includes(v)
        );
        
        if (sharedVertices.length > 0) {
          const sharedVertex = this.vertices[sharedVertices[0]];
          
          // Road is blocked if there's an opponent's settlement at the shared vertex
          if (sharedVertex.building && sharedVertex.building.playerId !== playerId) {
            continue;
          }
          
          const length = 1 + this.dfsLongestRoad(adjEdgeId, playerId, new Set(visited));
          maxLength = Math.max(maxLength, length);
        }
      }
    }
    
    return maxLength;
  }

  // Get players who have settlements/cities adjacent to a hex (for robber stealing)
  getPlayersAdjacentToHex(hexId) {
    const adjacentVertices = this.getAdjacentVertices(hexId);
    const players = new Set();
    
    adjacentVertices.forEach(vertex => {
      if (vertex.building && vertex.building.playerId) {
        players.add(vertex.building.playerId);
      }
    });
    
    return Array.from(players);
  }

  // Get board state for client
  getState() {
    return {
      hexes: this.hexes.map(hex => ({
        id: hex.id,
        resource: hex.resource,
        number: hex.number,
        hasRobber: hex.hasRobber
      })),
      vertices: this.vertices.map(vertex => ({
        id: vertex.id,
        building: vertex.building
      })),
      edges: this.edges.map(edge => ({
        id: edge.id,
        road: edge.road
      })),
      ports: this.ports,
      robberPosition: this.robberPosition
    };
  }
}

module.exports = Board;