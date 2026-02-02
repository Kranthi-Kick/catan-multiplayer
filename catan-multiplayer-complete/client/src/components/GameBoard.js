import React from 'react';

function GameBoard({ gameState, playerId, onVertexClick, onEdgeClick, onHexClick, buildMode, pendingRobberMove }) {
  if (!gameState || !gameState.board) {
    return <div className="game-board">Loading board...</div>;
  }

  const { board } = gameState;
  
  // Hexagon coordinates for standard Catan board layout
  const hexPositions = [
    // Row 1 (top)
    { x: 300, y: 100 },
    { x: 400, y: 100 },
    { x: 500, y: 100 },
    // Row 2
    { x: 250, y: 175 },
    { x: 350, y: 175 },
    { x: 450, y: 175 },
    { x: 550, y: 175 },
    // Row 3 (middle)
    { x: 200, y: 250 },
    { x: 300, y: 250 },
    { x: 400, y: 250 },
    { x: 500, y: 250 },
    { x: 600, y: 250 },
    // Row 4
    { x: 250, y: 325 },
    { x: 350, y: 325 },
    { x: 450, y: 325 },
    { x: 550, y: 325 },
    // Row 5 (bottom)
    { x: 300, y: 400 },
    { x: 400, y: 400 },
    { x: 500, y: 400 }
  ];

  // Vertex positions - these would be calculated based on hex positions
  const vertexPositions = generateVertexPositions(hexPositions);
  
  // Edge positions - these would be calculated based on vertex connections
  const edgePositions = generateEdgePositions(vertexPositions);

  const getResourceColor = (resource) => {
    switch (resource) {
      case 'wood': return '#4a7c59';
      case 'brick': return '#a0522d';
      case 'sheep': return '#90ee90';
      case 'wheat': return '#ffd700';
      case 'ore': return '#696969';
      case 'desert': return '#daa520';
      default: return '#ccc';
    }
  };

  const getPlayerColor = (playerId) => {
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.color : 'gray';
  };

  const handleHexClick = (hexIndex) => {
    if (pendingRobberMove && onHexClick) {
      onHexClick(hexIndex);
    }
  };

  const handleVertexClick = (vertexIndex) => {
    if (buildMode && onVertexClick) {
      onVertexClick(vertexIndex);
    }
  };

  const handleEdgeClick = (edgeIndex) => {
    if (buildMode && onEdgeClick) {
      onEdgeClick(edgeIndex);
    }
  };

  const renderHex = (hex, index) => {
    const pos = hexPositions[index];
    if (!pos) return null;

    const points = generateHexagonPoints(pos.x, pos.y, 45);
    
    return (
      <g key={`hex-${hex.id}`}>
        {/* Hexagon */}
        <polygon
          points={points}
          fill={getResourceColor(hex.resource)}
          stroke="#333"
          strokeWidth="2"
          className={`hex ${hex.resource} ${hex.hasRobber ? 'has-robber' : ''} ${pendingRobberMove ? 'clickable' : ''}`}
          onClick={() => handleHexClick(index)}
          style={{ cursor: pendingRobberMove ? 'pointer' : 'default' }}
        />
        
        {/* Number token */}
        {hex.number && (
          <>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="20"
              fill="white"
              stroke="#333"
              strokeWidth="2"
            />
            <text
              x={pos.x}
              y={pos.y + 5}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill={hex.number === 6 || hex.number === 8 ? 'red' : 'black'}
            >
              {hex.number}
            </text>
            {/* Probability dots */}
            {(hex.number === 6 || hex.number === 8) && (
              <>
                <circle cx={pos.x - 8} cy={pos.y + 15} r="2" fill="red" />
                <circle cx={pos.x} cy={pos.y + 15} r="2" fill="red" />
                <circle cx={pos.x + 8} cy={pos.y + 15} r="2" fill="red" />
              </>
            )}
            {(hex.number === 5 || hex.number === 9) && (
              <>
                <circle cx={pos.x - 5} cy={pos.y + 15} r="2" fill="orange" />
                <circle cx={pos.x + 5} cy={pos.y + 15} r="2" fill="orange" />
              </>
            )}
            {(hex.number === 4 || hex.number === 10) && (
              <circle cx={pos.x} cy={pos.y + 15} r="2" fill="orange" />
            )}
          </>
        )}
        
        {/* Robber */}
        {hex.hasRobber && (
          <g>
            <circle
              cx={pos.x}
              cy={pos.y - 10}
              r="15"
              fill="black"
              stroke="red"
              strokeWidth="2"
            />
            <text
              x={pos.x}
              y={pos.y - 5}
              textAnchor="middle"
              fontSize="12"
              fill="white"
              fontWeight="bold"
            >
              👤
            </text>
          </g>
        )}
        
        {/* Resource label */}
        <text
          x={pos.x}
          y={pos.y - 25}
          textAnchor="middle"
          fontSize="10"
          fill="white"
          fontWeight="bold"
          textShadow="1px 1px 1px rgba(0,0,0,0.7)"
        >
          {hex.resource.toUpperCase()}
        </text>
      </g>
    );
  };

  const renderVertex = (vertex, index) => {
    const pos = vertexPositions[index];
    if (!pos) return null;

    const building = vertex.building;
    const isClickable = buildMode && (buildMode === 'settlement' || (buildMode === 'city' && building?.type === 'settlement' && building?.playerId === playerId));
    
    return (
      <g key={`vertex-${vertex.id}`}>
        {building ? (
          building.type === 'settlement' ? (
            <polygon
              points={`${pos.x},${pos.y-8} ${pos.x-8},${pos.y+8} ${pos.x+8},${pos.y+8}`}
              fill={getPlayerColor(building.playerId)}
              stroke="#333"
              strokeWidth="2"
              className="settlement"
            />
          ) : (
            <rect
              x={pos.x - 10}
              y={pos.y - 10}
              width="20"
              height="20"
              fill={getPlayerColor(building.playerId)}
              stroke="#333"
              strokeWidth="2"
              className="city"
            />
          )
        ) : (
          <circle
            cx={pos.x}
            cy={pos.y}
            r="5"
            fill="#666"
            stroke="#333"
            strokeWidth="1"
            className={`vertex ${isClickable ? 'clickable' : ''}`}
            onClick={() => handleVertexClick(index)}
            style={{ 
              cursor: isClickable ? 'pointer' : 'default',
              opacity: isClickable ? 1 : 0.3
            }}
          />
        )}
      </g>
    );
  };

  const renderEdge = (edge, index) => {
    const pos = edgePositions[index];
    if (!pos) return null;

    const road = edge.road;
    const isClickable = buildMode === 'road';
    
    return (
      <line
        key={`edge-${edge.id}`}
        x1={pos.x1}
        y1={pos.y1}
        x2={pos.x2}
        y2={pos.y2}
        stroke={road ? getPlayerColor(road.playerId) : '#999'}
        strokeWidth={road ? '6' : '3'}
        className={`edge ${road ? 'road' : ''} ${isClickable ? 'clickable' : ''}`}
        onClick={() => handleEdgeClick(index)}
        style={{ 
          cursor: isClickable ? 'pointer' : 'default',
          opacity: isClickable || road ? 1 : 0.3
        }}
      />
    );
  };

  return (
    <div className="game-board">
      <div className="board-container">
        <svg viewBox="0 0 800 500" className="board-svg">
          {/* Render hexes first (background) */}
          {board.hexes.map((hex, index) => renderHex(hex, index))}
          
          {/* Render edges (middle layer) */}
          {board.edges.map((edge, index) => renderEdge(edge, index))}
          
          {/* Render vertices last (foreground) */}
          {board.vertices.map((vertex, index) => renderVertex(vertex, index))}
          
          {/* Render ports */}
          {board.ports && board.ports.map((port, index) => (
            <g key={`port-${index}`}>
              <text
                x={50}
                y={50 + index * 20}
                fontSize="12"
                fill="#333"
              >
                {port.type === 'generic' ? '3:1' : `2:1 ${port.type}`}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* Build mode indicator */}
      {buildMode && (
        <div className="build-mode-indicator">
          <p>Click on {buildMode === 'settlement' ? 'a vertex' : buildMode === 'city' ? 'your settlement' : 'an edge'} to build {buildMode}</p>
        </div>
      )}
      
      {/* Robber move indicator */}
      {pendingRobberMove && (
        <div className="robber-mode-indicator">
          <p>🏴‍☠️ Click on a hex to move the robber</p>
        </div>
      )}
    </div>
  );
}

// Helper function to generate hexagon points
function generateHexagonPoints(centerX, centerY, radius) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

// Helper function to generate vertex positions based on hexagon positions
function generateVertexPositions(hexPositions) {
  // This is a simplified version - in a real implementation,
  // you'd calculate the exact vertex positions based on the hexagonal grid
  const vertices = [];
  
  hexPositions.forEach((hex, hexIndex) => {
    const radius = 45;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = hex.x + radius * Math.cos(angle);
      const y = hex.y + radius * Math.sin(angle);
      vertices.push({ x, y });
    }
  });
  
  // Remove duplicates and return first 54 unique vertices
  const uniqueVertices = [];
  vertices.forEach(vertex => {
    const existing = uniqueVertices.find(v => 
      Math.abs(v.x - vertex.x) < 5 && Math.abs(v.y - vertex.y) < 5
    );
    if (!existing && uniqueVertices.length < 54) {
      uniqueVertices.push(vertex);
    }
  });
  
  return uniqueVertices;
}

// Helper function to generate edge positions
function generateEdgePositions(vertexPositions) {
  const edges = [];
  
  // This is a simplified version - in a real implementation,
  // you'd define the exact connections between vertices
  for (let i = 0; i < Math.min(72, vertexPositions.length - 1); i++) {
    const v1 = vertexPositions[i];
    const v2 = vertexPositions[(i + 1) % vertexPositions.length];
    
    if (v1 && v2) {
      edges.push({
        x1: v1.x,
        y1: v1.y,
        x2: v2.x,
        y2: v2.y
      });
    }
  }
  
  return edges;
}

export default GameBoard;