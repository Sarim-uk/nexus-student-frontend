import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { RecommendationsProvider } from './context/RecommendationsContext';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <RecommendationsProvider>
        <AppRoutes />
      </RecommendationsProvider>
    </BrowserRouter>
  );
}

export default App;
