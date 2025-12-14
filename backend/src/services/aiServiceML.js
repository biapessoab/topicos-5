const huggingfaceService = require('./huggingfaceService');
// Axios precisa ser instalado: npm install axios
let axios;
try {
  axios = require('axios');
} catch (err) {
  console.warn('⚠️ Axios não instalado. Execute: npm install axios');
}

// URL do microserviço Python ML
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Chama o modelo ML treinado (RandomForest) via microserviço Python
 */
async function callMLModel(userData, questionnaireData) {
  // Se axios não estiver instalado, retorna null
  if (!axios) {
    console.warn('⚠️ Axios não disponível. Instale com: npm install axios');
    return null;
  }

  try {
    const { sleep, exercise, nutrition, stress } = questionnaireData;
    
    // Preparar dados no formato esperado pelo modelo
    const mlPayload = {
      age: userData.idade || 25,
      sleep_duration: sleep.duration,
      quality_of_sleep: sleep.quality,
      physical_activity_level: calculateActivityLevel(exercise),
      stress_level: stress.level,
      heart_rate: estimateHeartRate(exercise),
      daily_steps: estimateDailySteps(exercise),
      gender: userData.gender || 'Male', // Você pode pegar do cadastro
      occupation: userData.occupation || 'Software Engineer',
      bmi_category: calculateBMICategory(userData) // Implementar se tiver dados
    };

    console.log('🔮 Chamando modelo ML com:', mlPayload);

    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      mlPayload,
      { timeout: 5000 }
    );

    console.log('✅ Predição ML recebida:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Erro ao chamar modelo ML:', error.message);
    
    // Se o serviço ML não estiver disponível, retorna null
    if (error.code === 'ECONNREFUSED') {
      console.warn('⚠️ Microserviço ML não está rodando. Inicie com: cd backend/ml && python ml_api.py');
    }
    
    return null;
  }
}

/**
 * Gera diagnóstico baseado nos dados do questionário
 */
function generateDiagnosis({ sleep, exercise, nutrition, stress }) {
  // Cálculo dos scores
  const sleepScore = calculateSleepScore(sleep);
  const exerciseScore = calculateExerciseScore(exercise);
  const nutritionScore = calculateNutritionScore(nutrition);
  const mentalHealthScore = calculateMentalHealthScore(stress);
  
  // Score geral (média ponderada)
  const overallScore = Math.round(
    (sleepScore * 0.3 + exerciseScore * 0.25 + nutritionScore * 0.25 + mentalHealthScore * 0.2)
  );

  // Identificar áreas de preocupação (scores abaixo de 6)
  const areasOfConcern = [];
  if (sleepScore < 6) areasOfConcern.push('sleep');
  if (exerciseScore < 6) areasOfConcern.push('exercise');
  if (nutritionScore < 6) areasOfConcern.push('nutrition');
  if (mentalHealthScore < 6) areasOfConcern.push('mental_health');

  // Explicações para cada área
  const explanations = {
    sleep: generateSleepExplanation(sleep, sleepScore),
    exercise: generateExerciseExplanation(exercise, exerciseScore),
    nutrition: generateNutritionExplanation(nutrition, nutritionScore),
    mentalHealth: generateMentalHealthExplanation(stress, mentalHealthScore)
  };

  return {
    scores: {
      sleep: sleepScore,
      exercise: exerciseScore,
      nutrition: nutritionScore,
      mentalHealth: mentalHealthScore
    },
    overallScore,
    areasOfConcern,
    explanations,
    processingTimeMs: 0
  };
}

/**
 * Enriquece o diagnóstico com insights de IA (ML + Hugging Face)
 */
async function enrichDiagnosisWithAI(userData, questionnaireData) {
  const startTime = Date.now();
  
  // 1. Gera o diagnóstico base com regras
  const diagnosis = generateDiagnosis(questionnaireData);
  
  // 2. CHAMA O MODELO ML TREINADO (RandomForest)
  const mlPrediction = await callMLModel(userData, questionnaireData);
  
  if (mlPrediction) {
    diagnosis.mlInsights = {
      disorder: mlPrediction.disorder,
      risk_level: mlPrediction.risk_level,
      confidence: mlPrediction.confidence,
      probabilities: mlPrediction.probabilities
    };

    // Ajusta o score geral baseado na predição ML
    if (mlPrediction.disorder !== 'None') {
      // Reduz o score se houver risco de distúrbio
      const penaltyMap = { 'Alto': 3, 'Médio': 2, 'Baixo': 1 };
      const penalty = penaltyMap[mlPrediction.risk_level] || 0;
      diagnosis.overallScore = Math.max(0, diagnosis.overallScore - penalty);
      
      // Adiciona área de preocupação se não estiver
      if (!diagnosis.areasOfConcern.includes('sleep')) {
        diagnosis.areasOfConcern.unshift('sleep');
      }
    }

    console.log(`🤖 ML detectou: ${mlPrediction.disorder} (confiança: ${(mlPrediction.confidence * 100).toFixed(1)}%)`);
  } else {
    console.log('⚠️ Modelo ML não disponível, usando apenas regras');
  }
  
  // 3. Gera mensagem personalizada com Hugging Face
  if (huggingfaceService.isEnabled()) {
    try {
      const aiMessage = await huggingfaceService.generatePersonalizedMessage(
        userData,
        { ...questionnaireData, ...diagnosis }
      );

      if (aiMessage) {
        diagnosis.personalizedMessage = aiMessage;
      }
    } catch (error) {
      console.error('⚠️ Erro ao gerar mensagem personalizada:', error.message);
    }
  }

  diagnosis.processingTimeMs = Date.now() - startTime;
  return diagnosis;
}

/**
 * Gera metas personalizadas baseadas no diagnóstico (priorizando ML)
 */
async function generateGoals(diagnosis, questionnaireData) {
  const goals = [];
  const { areasOfConcern, scores, mlInsights } = diagnosis;

  // Se ML detectou distúrbio, prioriza isso
  if (mlInsights && mlInsights.disorder !== 'None') {
    goals.push({
      title: `Atenção: Risco de ${mlInsights.disorder}`,
      description: `O modelo detectou risco ${mlInsights.risk_level.toLowerCase()} de ${mlInsights.disorder}. Recomendamos consultar um profissional de saúde para avaliação.`,
      category: 'sleep',
      difficulty: 'difícil', // Mudado de 'alta' para 'difícil'
      priority: 'alta'
    });
  }

  // Prioriza áreas com scores mais baixos
  const priorityAreas = areasOfConcern.sort((a, b) => {
    const scoreA = scores[a] || scores[mapAreaToScore(a)];
    const scoreB = scores[b] || scores[mapAreaToScore(b)];
    return scoreA - scoreB;
  });

  // Gera metas para cada área de preocupação (máximo 3 adicionais)
  const maxGoals = mlInsights && mlInsights.disorder !== 'None' ? 2 : 3;
  for (const area of priorityAreas.slice(0, maxGoals)) {
    const goal = generateGoalForArea(area, questionnaireData, scores);
    if (goal) goals.push(goal);
  }

  // Se não houver áreas de preocupação, gera metas de manutenção
  if (goals.length === 0) {
    goals.push({
      title: 'Manter hábitos saudáveis',
      description: 'Continue mantendo seus bons hábitos de saúde!',
      category: 'geral',
      difficulty: 'fácil',
      priority: 'baixa'
    });
  }

  return goals;
}

// ========== FUNÇÕES AUXILIARES PARA O MODELO ML ==========

function calculateActivityLevel(exercise) {
  // Converte frequência e duração em nível de atividade física (0-100)
  const baseLevel = exercise.frequency * 10; // 0-70
  const durationBonus = Math.min(30, exercise.duration); // 0-30
  return Math.min(100, baseLevel + durationBonus);
}

function estimateHeartRate(exercise) {
  // Estima frequência cardíaca baseada na intensidade
  const baseRate = 70;
  const intensityMap = { 'leve': 5, 'moderada': 15, 'intensa': 25 };
  const bonus = intensityMap[exercise.intensity] || 0;
  return baseRate + bonus;
}

function estimateDailySteps(exercise) {
  // Estima passos diários baseado na frequência de exercícios
  const baseSteps = 3000;
  return baseSteps + (exercise.frequency * 1000);
}

function calculateBMICategory(userData) {
  // Se você tiver peso e altura no cadastro, calcule o IMC real
  // Por enquanto, retorna 'Normal' como padrão
  return userData.bmi_category || 'Normal';
}

// ========== FUNÇÕES DE CÁLCULO DE SCORES ==========

function calculateSleepScore(sleep) {
  let score = 0;
  
  // Duração do sono (0-5 pontos)
  if (sleep.duration >= 7 && sleep.duration <= 9) score += 5;
  else if (sleep.duration >= 6 && sleep.duration <= 10) score += 3;
  else score += 1;
  
  // Qualidade do sono (0-5 pontos)
  score += Math.min(5, sleep.quality * 0.5);
  
  return Math.round(score);
}

function calculateExerciseScore(exercise) {
  let score = 0;
  
  // Frequência (0-4 pontos)
  if (exercise.frequency >= 5) score += 4;
  else if (exercise.frequency >= 3) score += 3;
  else if (exercise.frequency >= 1) score += 2;
  else score += 0;
  
  // Duração (0-3 pontos)
  if (exercise.duration >= 30) score += 3;
  else if (exercise.duration >= 20) score += 2;
  else if (exercise.duration >= 10) score += 1;
  
  // Intensidade (0-3 pontos)
  const intensityMap = { 'leve': 1, 'moderada': 2, 'intensa': 3 };
  score += intensityMap[exercise.intensity] || 0;
  
  return Math.round(score);
}

function calculateNutritionScore(nutrition) {
  let score = 0;
  
  // Vegetais (0-3 pontos)
  score += Math.min(3, nutrition.vegetables);
  
  // Frutas (0-3 pontos)
  score += Math.min(3, nutrition.fruits);
  
  // Água (0-2 pontos)
  score += Math.min(2, nutrition.water);
  
  // Fast food (penalidade: 0 a -2 pontos)
  score -= Math.min(2, nutrition.fastFood);
  
  return Math.max(0, Math.min(10, score));
}

function calculateMentalHealthScore(stress) {
  let score = 0;
  
  // Nível de estresse invertido (0-5 pontos)
  score += Math.max(0, 5 - stress.level * 0.5);
  
  // Qualidade de vida (0-5 pontos)
  score += Math.min(5, stress.qualityOfLife * 0.5);
  
  return Math.round(score);
}

// Funções de explicação
function generateSleepExplanation(sleep, score) {
  if (score >= 8) return 'Excelente qualidade de sono! Continue assim.';
  if (score >= 6) return 'Boa qualidade de sono, mas há espaço para melhorias.';
  return 'Sua qualidade de sono precisa de atenção. Considere ajustar sua rotina.';
}

function generateExerciseExplanation(exercise, score) {
  if (score >= 8) return 'Ótima rotina de exercícios!';
  if (score >= 6) return 'Você se exercita regularmente, mas pode aumentar a frequência.';
  return 'Aumentar a atividade física traria grandes benefícios à sua saúde.';
}

function generateNutritionExplanation(nutrition, score) {
  if (score >= 8) return 'Alimentação muito equilibrada!';
  if (score >= 6) return 'Boa alimentação, mas tente consumir mais frutas e vegetais.';
  return 'Sua nutrição precisa de melhorias significativas.';
}

function generateMentalHealthExplanation(stress, score) {
  if (score >= 8) return 'Excelente saúde mental e controle do estresse.';
  if (score >= 6) return 'Nível de estresse moderado. Considere técnicas de relaxamento.';
  return 'Seu nível de estresse está alto. Priorize seu bem-estar mental.';
}

function mapAreaToScore(area) {
  const map = {
    'mental_health': 'mentalHealth',
    'sleep': 'sleep',
    'exercise': 'exercise',
    'nutrition': 'nutrition'
  };
  return map[area] || area;
}

function generateGoalForArea(area, data, scores) {
  const goalTemplates = {
    sleep: {
      title: 'Melhorar qualidade do sono',
      description: `Estabeleça uma rotina de sono regular, indo dormir e acordando no mesmo horário. Meta: ${data.sleep.duration < 7 ? '7-8 horas' : 'manter'} por noite.`,
      category: 'sleep',
      difficulty: 'médio', // Valores aceitos: 'fácil', 'médio', 'difícil'
      priority: scores.sleep < 5 ? 'alta' : 'normal'
    },
    exercise: {
      title: 'Aumentar atividade física',
      description: `Aumente gradualmente sua frequência de exercícios. Meta: ${data.exercise.frequency < 3 ? '3-4 vezes' : '5+ vezes'} por semana.`,
      category: 'exercise',
      difficulty: 'médio', // Corrigido de 'fácil' para 'médio'
      priority: scores.exercise < 5 ? 'alta' : 'normal'
    },
    nutrition: {
      title: 'Melhorar alimentação',
      description: 'Aumente o consumo de frutas e vegetais. Meta: pelo menos 3 porções de cada por dia.',
      category: 'nutrition',
      difficulty: 'fácil',
      priority: scores.nutrition < 5 ? 'alta' : 'normal'
    },
    mental_health: {
      title: 'Reduzir estresse',
      description: 'Pratique técnicas de relaxamento como meditação, respiração profunda ou yoga por 10 minutos diários.',
      category: 'mental_health',
      difficulty: 'fácil',
      priority: scores.mentalHealth < 5 ? 'alta' : 'normal'
    }
  };

  return goalTemplates[area] || null;
}

module.exports = {
  generateDiagnosis,
  enrichDiagnosisWithAI,
  generateGoals
};