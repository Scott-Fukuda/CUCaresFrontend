import React from 'react';
import AppContent from './AppContent';
import { BrowserRouter as Router } from 'react-router-dom';
import 'react-tooltip/dist/react-tooltip.css';

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;