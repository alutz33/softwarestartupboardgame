import { useGameStore } from './state/gameStore';
import {
  SetupScreen,
  CorporationSelection,
  StartupCardDraft,
  EngineerDraft,
  PlanningPhase,
  RevealPhase,
  ResolutionPhase,
  EventPhase,
  RoundEnd,
  GameEnd,
} from './components/game';
import { PuzzleGame } from './components/puzzle';
import { GameRulesHeader } from './components/GameRulesHeader';

function App() {
  const phase = useGameStore((state) => state.phase);

  const renderPhase = () => {
    switch (phase) {
      case 'setup':
        return <SetupScreen />;
      case 'startup-draft':
        return <StartupCardDraft />;
      case 'corporation-selection':
        return <CorporationSelection />; // Legacy, kept for backwards compatibility
      case 'engineer-draft':
        return <EngineerDraft />;
      case 'planning':
        return <PlanningPhase />;
      case 'reveal':
        return <RevealPhase />;
      case 'puzzle':
        return <PuzzleGame />;
      case 'resolution':
        return <ResolutionPhase />;
      case 'event':
        return <EventPhase />;
      case 'round-end':
        return <RoundEnd />;
      case 'game-end':
        return <GameEnd />;
      default:
        return <SetupScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <GameRulesHeader />
      {renderPhase()}
    </div>
  );
}

export default App;
