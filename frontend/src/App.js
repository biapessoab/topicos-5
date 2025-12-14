// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Questionnaire from './pages/Questionnaire';
import Diagnosis from './pages/Diagnosis';
import PrivateRoute from './components/PrivateRoute.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas Privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/questionario"
            element={
              <PrivateRoute>
                <Questionnaire />
              </PrivateRoute>
            }
          />
          <Route
            path="/diagnostico"
            element={
              <PrivateRoute>
                <Diagnosis />
              </PrivateRoute>
            }
          />
          
          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;