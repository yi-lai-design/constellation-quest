import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'game' | 'end'

  return (
    <>
      {screen === 'home' && <HomeScreen onStart={() => setScreen('game')} />}
      {screen === 'game' && <GameScreen onComplete={() => setScreen('end')} />}
      {screen === 'end'  && <EndScreen  onRestart={() => setScreen('home')} />}
    </>
  );
}
