const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/authController');
const aiServiceML = require('../services/aiServiceML');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RF04: Submeter questionário com análise ML
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { sleep, exercise, nutrition, stress } = req.body;
    const userId = req.userId;

    // Buscar dados do usuário para enriquecer análise ML
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, email, created_at')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (!sleep || !exercise || !nutrition || !stress) {
      return res.status(400).json({
        error: 'Dados do questionário incompletos',
        received: req.body
      });
    }

    console.log('📦 BODY:', JSON.stringify(req.body, null, 2));

    // Salvar questionário no banco
    const { data: questionnaireData, error: qError } = await supabase
      .from('questionnaires')
      .insert([{
        user_id: userId,
        sleep_duration: Number(sleep.duration), // Garantir que é número
        sleep_quality: Number(sleep.quality),
        exercise_frequency: Number(exercise.frequency),
        exercise_duration: Number(exercise.duration),
        exercise_intensity: exercise.intensity,
        nutrition_vegetables: Number(nutrition.vegetables),
        nutrition_fruits: Number(nutrition.fruits),
        nutrition_water: Number(nutrition.water), // Pode ser decimal
        nutrition_fast_food: Number(nutrition.fastFood),
        stress_level: Number(stress.level),
        quality_of_life: Number(stress.qualityOfLife)
      }])
      .select()
      .single();

    if (qError) throw qError;

    // RF05: Gerar diagnóstico com IA (ML + Regras + Hugging Face)
    console.log('🤖 Iniciando análise com ML...');
    const diagnosis = await aiServiceML.enrichDiagnosisWithAI(
      {
        nome: userData.name,
        idade: calculateAge(userData.created_at),
        userId
      },
      {
        sleep,
        exercise,
        nutrition,
        stress
      }
    );

    // Salvar diagnóstico - APENAS COM COLUNAS QUE EXISTEM
    const { data: diagnosisData, error: dError } = await supabase
      .from('diagnoses')
      .insert([{
        user_id: userId,
        questionnaire_id: questionnaireData.id,
        areas_of_concern: diagnosis.areasOfConcern,
        sleep_score: Number(diagnosis.scores.sleep),
        exercise_score: Number(diagnosis.scores.exercise),
        nutrition_score: Number(diagnosis.scores.nutrition),
        mental_health_score: Number(diagnosis.scores.mentalHealth),
        overall_score: Number(diagnosis.overallScore),
        explanations: diagnosis.explanations
        // Colunas ML não existem no banco, serão retornadas apenas na resposta
      }])
      .select()
      .single();

    if (dError) throw dError;

    // RF06: Gerar metas (priorizando insights ML)
    console.log('🎯 Gerando metas personalizadas...');
    const goals = await aiServiceML.generateGoals(
      diagnosis,
      { sleep, exercise, nutrition, stress }
    );

    // Salvar metas - APENAS COM COLUNAS QUE EXISTEM
    const goalsToInsert = goals.map(goal => ({
      user_id: userId,
      diagnosis_id: diagnosisData.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      difficulty: goal.difficulty || 'fácil',
      completed: false
      // 'priority' não existe na tabela goals
    }));

    const { data: goalsData, error: gError } = await supabase
      .from('goals')
      .insert(goalsToInsert)
      .select();

    if (gError) throw gError;

    // Resposta enriquecida
    res.json({
      message: 'Questionário processado com sucesso',
      diagnosis: {
        id: diagnosisData.id,
        overallScore: diagnosis.overallScore,
        areasOfConcern: diagnosis.areasOfConcern,
        scores: diagnosis.scores,
        explanations: diagnosis.explanations,
        // Insights ML (retornados mas não salvos no banco)
        mlInsights: diagnosis.mlInsights || null,
        // Mensagem personalizada gerada por IA
        personalizedMessage: diagnosis.personalizedMessage ||
          `Olá, ${userData.name}! Analisamos seus hábitos e preparamos um plano personalizado para você.`,
        processingTime: diagnosis.processingTimeMs
      },
      goals: goalsData.map(goal => ({
        ...goal,
        completed: false
      })),
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Análise completa para usuário ${userId} em ${diagnosis.processingTimeMs}ms`);

  } catch (error) {
    console.error('❌ Erro ao processar questionário:', error);

    res.status(500).json({
      error: 'Erro ao processar questionário',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Buscar último diagnóstico do usuário
router.get('/latest', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { data: diagnosis, error } = await supabase
      .from('diagnoses')
      .select(`
        *,
        questionnaires (
          sleep_duration,
          sleep_quality,
          exercise_frequency,
          stress_level
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          message: 'Nenhum diagnóstico encontrado. Faça o questionário primeiro!'
        });
      }
      throw error;
    }

    res.json({
      diagnosis,
      hasMLInsights: false // Não tem colunas ML no banco
    });

  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    res.status(500).json({ error: 'Erro ao buscar diagnóstico' });
  }
});

// GET: Histórico de diagnósticos
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const { data: history, error } = await supabase
      .from('diagnoses')
      .select('id, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      history,
      count: history.length
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Helper: Calcular idade aproximada
function calculateAge(createdAt) {
  // Retorna 25 como padrão (melhor adicionar campo birth_date na tabela users)
  return 25;
}

module.exports = router;