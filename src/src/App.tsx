import './index.css';
import { WindowContainer } from './components/layout/WindowContainer';
import { useVisorToggle } from './hooks/useVisorToggle';
import { usePersistence } from './hooks/usePersistence';

function App() {
  const { state } = useVisorToggle();
  usePersistence();

  const animClass = state === 'visible'
    ? 'animate-slide-down'
    : state === 'hiding'
      ? 'animate-slide-up'
      : '';

  return (
    <div className={`visor-root ${animClass}`}>
      <WindowContainer />
    </div>
  );
}

export default App;
