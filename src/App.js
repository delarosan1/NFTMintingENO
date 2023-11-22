import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Mint from './Mint';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Mint />} />
      </Routes>
    </Router>
  );
}

export default App;
