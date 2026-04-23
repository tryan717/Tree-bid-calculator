import React from 'react';
import { createRoot } from 'react-dom/client';
import TreeBidPhoneCalculator from './TreeBidPhoneCalculator.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TreeBidPhoneCalculator />
  </React.StrictMode>
);
