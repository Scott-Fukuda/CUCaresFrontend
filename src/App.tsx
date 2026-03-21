import React from 'react';
import AppContent from './AppContent';
import { BrowserRouter as Router } from 'react-router-dom';
import 'react-tooltip/dist/react-tooltip.css';
import ScrollToTop from "./components/ScrollToTop";

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;