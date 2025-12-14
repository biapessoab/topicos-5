// RF04: Questionário de Hábitos - MELHORADO
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    // Sono
    sleepDuration: 7,
    sleepQuality: 7,
    
    // Exercício
    exerciseFrequency: 3,
    exerciseDuration: 30,
    exerciseIntensity: 'moderada',
    
    // Alimentação
    nutritionVegetables: 2,
    nutritionFruits: 2,
    nutritionWater: 2,
    nutritionFastFood: 2,
    
    // Saúde Mental
    stressLevel: 5,
    qualityOfLife: 7
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes('Intensity') ? value : Number(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mostrar modal de confirmação antes de enviar
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    console.log('🚀 Enviando questionário:', formData);

    try {
      // Enviar questionário para o backend (RF04)
      const response = await api.post('/api/questionnaire/submit', {
        sleep: {
          duration: formData.sleepDuration,
          quality: formData.sleepQuality
        },
        exercise: {
          frequency: formData.exerciseFrequency,
          duration: formData.exerciseDuration,
          intensity: formData.exerciseIntensity
        },
        nutrition: {
          vegetables: formData.nutritionVegetables,
          fruits: formData.nutritionFruits,
          water: formData.nutritionWater,
          fastFood: formData.nutritionFastFood
        },
        stress: {
          level: formData.stressLevel,
          qualityOfLife: formData.qualityOfLife
        }
      });

      // RNF03: Geração do diagnóstico deve ser rápida (< 5s)
      if (response.data.diagnosis) {
        // Salvar diagnóstico localmente para exibição
        localStorage.setItem('latestDiagnosis', JSON.stringify(response.data.diagnosis));
        localStorage.setItem('latestGoals', JSON.stringify(response.data.goals));
        
        console.log('✅ Diagnóstico recebido:', response.data.diagnosis);
        
        // Navegar para página de diagnóstico
        navigate('/diagnostico');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar questionário:', error);
      alert('Erro ao processar questionário. Tente novamente.');
      setShowConfirm(false); // Resetar confirmação em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Modal de Confirmação
  if (showConfirm && step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📋 Confirme suas respostas
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">😴 Sono</h3>
                <p className="text-gray-600">Duração: {formData.sleepDuration}h | Qualidade: {formData.sleepQuality}/10</p>
              </div>
              
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">🏃‍♂️ Exercício</h3>
                <p className="text-gray-600">
                  {formData.exerciseFrequency}x/semana | {formData.exerciseDuration}min | Intensidade: {formData.exerciseIntensity}
                </p>
              </div>
              
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">🥗 Alimentação</h3>
                <p className="text-gray-600">
                  Vegetais: {formData.nutritionVegetables} | Frutas: {formData.nutritionFruits} | 
                  Água: {formData.nutritionWater}L | Fast Food: {formData.nutritionFastFood}x/semana
                </p>
              </div>
              
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-700">🧠 Saúde Mental</h3>
                <p className="text-gray-600">
                  Estresse: {formData.stressLevel}/10 | Qualidade de vida: {formData.qualityOfLife}/10
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                disabled={loading}
              >
                Revisar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analisando...
                  </>
                ) : (
                  'Confirmar e Enviar'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RNF01: Questionário deve ser respondido em menos de 5 minutos
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Questionário de Hábitos de Saúde
            </h1>
            <p className="text-gray-600">
              Responda com sinceridade para receber recomendações personalizadas
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Progresso</span>
                <span className="text-sm text-gray-600">{step}/4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Sono */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  😴 Hábitos de Sono
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantas horas você dorme por noite em média?
                  </label>
                  <input
                    type="range"
                    name="sleepDuration"
                    min="3"
                    max="12"
                    step="0.5"
                    value={formData.sleepDuration}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>3h</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.sleepDuration}h
                    </span>
                    <span>12h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Como você avalia a qualidade do seu sono?
                  </label>
                  <input
                    type="range"
                    name="sleepQuality"
                    min="1"
                    max="10"
                    value={formData.sleepQuality}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Péssimo (1)</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.sleepQuality}
                    </span>
                    <span>Excelente (10)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Exercícios */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  🏃‍♂️ Atividade Física
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantas vezes por semana você pratica exercícios?
                  </label>
                  <input
                    type="range"
                    name="exerciseFrequency"
                    min="0"
                    max="7"
                    value={formData.exerciseFrequency}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0x</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.exerciseFrequency}x por semana
                    </span>
                    <span>7x</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração média de cada sessão (minutos)
                  </label>
                  <input
                    type="range"
                    name="exerciseDuration"
                    min="10"
                    max="120"
                    step="10"
                    value={formData.exerciseDuration}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>10min</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.exerciseDuration} minutos
                    </span>
                    <span>120min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intensidade dos exercícios
                  </label>
                  <select
                    name="exerciseIntensity"
                    value={formData.exerciseIntensity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="baixa">Baixa (caminhada leve)</option>
                    <option value="moderada">Moderada (caminhada rápida, ciclismo)</option>
                    <option value="alta">Alta (corrida, HIIT)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Alimentação */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  🥗 Hábitos Alimentares
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porções de vegetais por dia
                  </label>
                  <input
                    type="range"
                    name="nutritionVegetables"
                    min="0"
                    max="6"
                    value={formData.nutritionVegetables}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.nutritionVegetables} porções
                    </span>
                    <span>6+</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porções de frutas por dia
                  </label>
                  <input
                    type="range"
                    name="nutritionFruits"
                    min="0"
                    max="6"
                    value={formData.nutritionFruits}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.nutritionFruits} porções
                    </span>
                    <span>6+</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Litros de água por dia
                  </label>
                  <input
                    type="range"
                    name="nutritionWater"
                    min="0.5"
                    max="4"
                    step="0.5"
                    value={formData.nutritionWater}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0.5L</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.nutritionWater}L
                    </span>
                    <span>4L</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vezes que come fast food por semana
                  </label>
                  <input
                    type="range"
                    name="nutritionFastFood"
                    min="0"
                    max="7"
                    value={formData.nutritionFastFood}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0x</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.nutritionFastFood}x
                    </span>
                    <span>7x</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Saúde Mental */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  🧠 Saúde Mental e Bem-estar
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qual seu nível de estresse atual?
                  </label>
                  <input
                    type="range"
                    name="stressLevel"
                    min="1"
                    max="10"
                    value={formData.stressLevel}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Baixo (1)</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.stressLevel}
                    </span>
                    <span>Alto (10)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Como você avalia sua qualidade de vida?
                  </label>
                  <input
                    type="range"
                    name="qualityOfLife"
                    min="1"
                    max="10"
                    value={formData.qualityOfLife}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Péssima (1)</span>
                    <span className="font-semibold text-indigo-600">
                      {formData.qualityOfLife}
                    </span>
                    <span>Excelente (10)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancelar
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Processando...' : 'Revisar e Finalizar'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Questionnaire;