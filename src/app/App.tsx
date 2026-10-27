import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail';
import { LayoutHomePrototype } from './prototypes/LayoutHomePrototype'; // PROTOTIPO desechable
import { CasoEstudioPrototype } from './prototypes/CasoEstudioPrototype'; // PROTOTIPO desechable

export const App: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/prototype/layout" element={<LayoutHomePrototype />} />
            <Route path="/prototype/caso" element={<CasoEstudioPrototype />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);
