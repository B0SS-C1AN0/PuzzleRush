import React from 'react';
import WordPuzzleGame from './components/WordPuzzleGame';
import { WalletConnectionProvider } from './components/wallet';

function App() {
  return (
    <WalletConnectionProvider>
      <div className="game-background">
        <WordPuzzleGame />
      </div>
    </WalletConnectionProvider>
  );
}

export default App;