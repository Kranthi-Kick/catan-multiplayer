# 🏝️ Digital Settlers of Catan

A complete digital implementation of the classic board game Settlers of Catan with full multiplayer support, real-time gameplay, and all core game mechanics.

## ✨ Features

### Complete Game Implementation
- **Full Catan Rules**: Resource gathering, trading, building, dice rolling, robber mechanics, development cards
- **Victory Conditions**: First to 10 victory points wins
- **All Building Types**: Settlements, cities, and roads with proper placement rules
- **Development Cards**: Knight, Victory Point, Road Building, Year of Plenty, and Monopoly cards
- **Robber Mechanics**: Block resource production and steal from opponents
- **Longest Road & Largest Army**: Special achievements for bonus victory points

### Multiplayer Support
- **2-4 Players**: Support for 2-4 players per game
- **Real-time Gameplay**: Live updates for all players using Socket.io
- **Turn Management**: Proper turn-based gameplay with setup phase
- **Player Trading**: Direct player-to-player resource trading
- **Game Rooms**: Create or join games with unique game IDs

### User Interface
- **Intuitive Design**: Clean, modern interface that captures the board game feel
- **Interactive Board**: Click-to-place buildings and roads
- **Resource Management**: Visual resource cards and development card management
- **Trade System**: Easy-to-use trading interface
- **Game Status**: Real-time game state and player information
- **Mobile Friendly**: Responsive design works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd catan-game
   ```

2. **Install Dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Start the Game**
   ```bash
   # This will start both server and client simultaneously
   npm run dev
   ```

4. **Open Your Browser**
   - Navigate to `http://localhost:3000`
   - The server runs on `http://localhost:3001`

### Alternative Setup (Manual)

If you prefer to run the server and client separately:

```bash
# Terminal 1 - Start the server
npm run server

# Terminal 2 - Start the client
npm run client
```

## 🎮 How to Play

### Starting a Game

1. **Enter Your Name** and choose to either:
   - **Create New Game**: Start a new game and share the Game ID with friends
   - **Join Existing Game**: Enter a Game ID to join someone else's game

2. **Wait for Players**: Games support 2-4 players. Once everyone has joined, any player can start the game.

### Game Phases

#### Setup Phase
- Each player places 2 settlements and 2 roads
- Second settlement placement gives initial resources
- Placement follows standard Catan distance rules

#### Main Game
1. **Roll Dice**: Current player rolls dice to generate resources
2. **Resource Production**: All players with settlements/cities on the rolled number receive resources
3. **Robber (Rolling 7)**: Players with 8+ cards discard half, move robber to block a hex
4. **Build & Trade**: Current player can build, trade, and buy development cards
5. **End Turn**: Pass turn to next player

### Building

- **Settlements** (🏘️): Cost 1 Wood, 1 Brick, 1 Sheep, 1 Wheat → +1 Victory Point
- **Cities** (🏰): Cost 2 Wheat, 3 Ore (upgrade settlement) → +1 Victory Point (total +2)
- **Roads** (🛣️): Cost 1 Wood, 1 Brick → Enable settlement placement

### Development Cards

- **Knight** (⚔️): Move robber and steal resource
- **Victory Point** (🏆): Hidden +1 victory point
- **Road Building** (🛤️): Build 2 free roads
- **Year of Plenty** (🌾): Take any 2 resources
- **Monopoly** (💰): Take all cards of one resource type from opponents

### Trading

- **Player Trading**: Negotiate resource exchanges with other players
- **Port Trading**: Use ports for 3:1 or 2:1 resource exchanges (if implemented)

### Winning

First player to reach 10 victory points wins! Points come from:
- Settlements (1 point each)
- Cities (2 points each)
- Longest Road (2 points, minimum 5 roads)
- Largest Army (2 points, minimum 3 knights)
- Victory Point development cards (1 point each, hidden)

## 🔧 Technical Details

### Tech Stack
- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, HTML5 Canvas/SVG for game board
- **Real-time Communication**: WebSocket connections for live updates
- **State Management**: Server-side game state with client synchronization

### Project Structure
```
catan-game/
├── server/
│   ├── server.js          # Main server file with Socket.io
│   └── game/
│       ├── Game.js        # Core game logic and rules
│       ├── Player.js      # Player state management
│       └── Board.js       # Board generation and spatial logic
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js         # Main React application
│       ├── components/    # React components
│       └── styles/        # CSS styling
├── package.json          # Server dependencies and scripts
└── README.md
```

### API Events

#### Client to Server
- `createGame` - Create new game room
- `joinGame` - Join existing game
- `startGame` - Begin the game
- `rollDice` - Roll dice for current turn
- `buildSettlement/buildRoad/buildCity` - Place buildings
- `buyDevCard/playDevCard` - Development card actions
- `tradeOffer/tradeResponse` - Trading system
- `moveRobber` - Move robber after rolling 7 or playing knight
- `endTurn` - End current player's turn

#### Server to Client
- `gameCreated/gameJoined` - Game room events
- `gameStarted` - Game begins
- `gameStateUpdate` - Broadcast game state changes
- `diceRolled` - Dice roll results and resource distribution
- `error` - Error messages and validation failures

## 🛠️ Development

### Adding Features
- Game logic is centralized in `server/game/Game.js`
- Board mechanics are in `server/game/Board.js`
- UI components are modular in `client/src/components/`

### Testing
- Test locally by opening multiple browser tabs
- Use browser dev tools to simulate different players
- Game state is logged to server console for debugging

### Customization
- Modify game constants in `Game.js` (victory points, card counts, etc.)
- Adjust board layout in `Board.js`
- Customize styling in CSS files
- Add new development cards or game variants

## 🐛 Troubleshooting

### Common Issues

1. **Can't connect to game**
   - Check that both server (3001) and client (3000) ports are available
   - Verify Node.js version compatibility

2. **Build errors**
   - Delete `node_modules` and `package-lock.json`, then reinstall
   - Ensure all dependencies are installed in both root and client directories

3. **Game state desync**
   - Refresh the browser to reconnect
   - Check browser console for error messages

### Performance Tips
- Game supports up to 4 players efficiently
- Close unused browser tabs to improve performance
- Use modern browsers for best experience

## 📝 Game Rules Reference

This implementation follows standard Settlers of Catan rules:
- Setup phase with reverse turn order for second settlement
- Distance rule: settlements must be 2+ intersections apart
- Connectivity rule: roads and settlements must connect to existing network
- Resource distribution based on dice rolls and adjacent buildings
- Robber blocks resource production and enables stealing
- Development cards cannot be played on the turn they're purchased
- Victory achieved at 10 points with immediate win condition

## 🎯 Future Enhancements

Potential features for future development:
- **Expansions**: Seafarers, Cities & Knights
- **AI Players**: Computer opponents with different difficulty levels
- **Spectator Mode**: Watch games in progress
- **Game History**: Replay and statistics
- **Custom Maps**: Different board layouts and scenarios
- **Audio**: Sound effects and background music
- **Tournaments**: Multi-game competitions

## 🤝 Contributing

Feel free to contribute improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. Settlers of Catan is a trademark of Catan GmbH.

---

**Enjoy building your settlements and cities! May the dice roll in your favor! 🎲🏝️**