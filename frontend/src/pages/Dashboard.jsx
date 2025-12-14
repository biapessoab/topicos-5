// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [tips, setTips] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);

      // Carregar metas do usuário (RF06, RF08)
      const goalsResponse = await api.get('/api/progress/goals');
      setGoals(goalsResponse.data.goals || []);

      // Calcular progresso (RF08)
      const completedGoals = goalsResponse.data.goals?.filter(g => g.completed).length || 0;
      const totalGoals = goalsResponse.data.goals?.length || 1;
      setProgress(Math.round((completedGoals / totalGoals) * 100));

      // Carregar dicas educativas (RF09)
      const tipsResponse = await api.get('/api/content/tips');
      setTips(tipsResponse.data.tips || []);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setLoading(false);
    }
  };

  // RF07: Registro de Progresso
  const toggleGoalComplete = async (goalId) => {
    try {
      await api.put(`/api/progress/goals/${goalId}/toggle`);
      
      // Atualizar estado local
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: !goal.completed }
          : goal
      ));

      // Recalcular progresso
      const newGoals = goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: !goal.completed }
          : goal
      );
      const completed = newGoals.filter(g => g.completed).length;
      setProgress(Math.round((completed / goals.length) * 100));
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-indigo-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Olá, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo ao seu painel de saúde
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>

        {/* RF08: Visualização de Progresso */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Seu Progresso Semanal
          </h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Progresso
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-indigo-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* RF07: Registro de Progresso - Metas Semanais */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Suas Metas Semanais
            </h2>
            
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Você ainda não tem metas definidas.
                </p>
                <button
                  onClick={() => navigate('/questionario')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Fazer Questionário
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-lg border-2 transition ${
                      goal.completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoalComplete(goal.id)}
                        className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="ml-3 flex-1">
                        <h3
                          className={`font-semibold ${
                            goal.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-800'
                          }`}
                        >
                          {goal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {goal.description}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {goal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RF09: Conteúdo Educativo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Dicas Para Você 💡
            </h2>
            <div className="space-y-4">
              {tips.length === 0 ? (
                <p className="text-gray-600">
                  Nenhuma dica disponível no momento.
                </p>
              ) : (
                tips.map((tip, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-500"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-sm text-gray-700">{tip.content}</p>
                    {tip.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {tip.category}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Ações Rápidas
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/questionario')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Refazer Questionário
            </button>
            <button
              onClick={() => navigate('/diagnostico')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Ver Diagnóstico Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;