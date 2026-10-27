import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail';
import { ViajeCamaraPrototype } from './prototypes/ViajeCamaraPrototype'; // PROTOTIPO desechable

export const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/prototype/viaje" element={<ViajeCamaraPrototype />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);
