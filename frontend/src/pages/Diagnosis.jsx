import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Diagnosis() {
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiagnosis();
  }, []);

  const loadDiagnosis = async () => {
    try {
      // Tentar carregar do localStorage primeiro
      const localDiagnosis = localStorage.getItem('latestDiagnosis');
      if (localDiagnosis) {
        setDiagnosis(JSON.parse(localDiagnosis));
        setLoading(false);
        return;
      }

      // Se não houver local, buscar do backend
      const response = await api.get('/api/progress/diagnosis/latest');
      if (response.data.diagnosis) {
        setDiagnosis(response.data.diagnosis);
      }
    } catch (error) {
      console.error('Erro ao carregar diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-indigo-600">Carregando diagnóstico...</div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Nenhum diagnóstico encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não respondeu o questionário.
            </p>
            <button
              onClick={() => navigate('/questionario')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Fazer Questionário
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excelente';
    if (score >= 6) return 'Bom';
    if (score >= 4) return 'Regular';
    return 'Precisa atenção';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Seu Diagnóstico Personalizado
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              Voltar ao Dashboard
            </button>
          </div>

          {/* Score Geral */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pontuação Geral
            </h2>
            <div className="flex items-center justify-center">
              <div className="text-6xl font-bold text-indigo-600">
                {diagnosis.overall_score || diagnosis.overallScore}/10
              </div>
            </div>
          </div>

          {/* Scores por Área */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                😴 Sono
              </h3>
              <div className={`text-3xl font-bold ${getScoreColor(diagnosis.sleep_score || diagnosis.scores?.sleep)}`}>
                {diagnosis.sleep_score || diagnosis.scores?.sleep}/10
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getScoreLabel(diagnosis.sleep_score || diagnosis.scores?.sleep)}
              </p>
              {diagnosis.explanations?.sleep && (
                <p className="text-sm text-gray-700 mt-4">
                  {diagnosis.explanations.sleep}
                </p>
              )}
            </div>

            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🏃‍♂️ Exercícios
              </h3>
              <div className={`text-3xl font-bold ${getScoreColor(diagnosis.exercise_score || diagnosis.scores?.exercise)}`}>
                {diagnosis.exercise_score || diagnosis.scores?.exercise}/10
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getScoreLabel(diagnosis.exercise_score || diagnosis.scores?.exercise)}
              </p>
              {diagnosis.explanations?.exercise && (
                <p className="text-sm text-gray-700 mt-4">
                  {diagnosis.explanations.exercise}
                </p>
              )}
            </div>

            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🥗 Alimentação
              </h3>
              <div className={`text-3xl font-bold ${getScoreColor(diagnosis.nutrition_score || diagnosis.scores?.nutrition)}`}>
                {diagnosis.nutrition_score || diagnosis.scores?.nutrition}/10
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getScoreLabel(diagnosis.nutrition_score || diagnosis.scores?.nutrition)}
              </p>
              {diagnosis.explanations?.nutrition && (
                <p className="text-sm text-gray-700 mt-4">
                  {diagnosis.explanations.nutrition}
                </p>
              )}
            </div>

            <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🧠 Saúde Mental
              </h3>
              <div className={`text-3xl font-bold ${getScoreColor(diagnosis.mental_health_score || diagnosis.scores?.mentalHealth)}`}>
                {diagnosis.mental_health_score || diagnosis.scores?.mentalHealth}/10
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getScoreLabel(diagnosis.mental_health_score || diagnosis.scores?.mentalHealth)}
              </p>
              {diagnosis.explanations?.mentalHealth && (
                <p className="text-sm text-gray-700 mt-4">
                  {diagnosis.explanations.mentalHealth}
                </p>
              )}
            </div>
          </div>

          {/* Áreas de Preocupação */}
          {(diagnosis.areas_of_concern || diagnosis.areasOfConcern)?.length > 0 && (
            <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ⚠️ Áreas que Precisam de Atenção
              </h2>
              <div className="flex flex-wrap gap-2">
                {(diagnosis.areas_of_concern || diagnosis.areasOfConcern).map((area, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-full font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Ver Minhas Metas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Diagnosis;