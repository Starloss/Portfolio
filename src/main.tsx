import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
import './tailwind.css';
import { App } from './modules/App';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
