const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/authController');
const aiService = require('../services/aiService');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RF04: Submeter questionário
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { sleep, exercise, nutrition, stress } = req.body;
    const userId = req.userId;

    // Salvar questionário no banco
    const { data: questionnaireData, error: qError } = await supabase
      .from('questionnaires')
      .insert([{
        user_id: userId,
        sleep_duration: sleep.duration,
        sleep_quality: sleep.quality,
        exercise_frequency: exercise.frequency,
        exercise_duration: exercise.duration,
        exercise_intensity: exercise.intensity,
        nutrition_vegetables: nutrition.vegetables,
        nutrition_fruits: nutrition.fruits,
        nutrition_water: nutrition.water,
        nutrition_fast_food: nutrition.fastFood,
        stress_level: stress.level,
        quality_of_life: stress.qualityOfLife
      }])
      .select()
      .single();

    if (qError) throw qError;

    // RF05: Gerar diagnóstico com IA
    const diagnosis = aiService.generateDiagnosis({
      sleep,
      exercise,
      nutrition,
      stress
    });

    // Salvar diagnóstico
    const { data: diagnosisData, error: dError } = await supabase
      .from('diagnoses')
      .insert([{
        user_id: userId,
        questionnaire_id: questionnaireData.id,
        areas_of_concern: diagnosis.areasOfConcern,
        sleep_score: diagnosis.scores.sleep,
        exercise_score: diagnosis.scores.exercise,
        nutrition_score: diagnosis.scores.nutrition,
        mental_health_score: diagnosis.scores.mentalHealth,
        overall_score: diagnosis.overallScore,
        explanations: diagnosis.explanations
      }])
      .select()
      .single();

    if (dError) throw dError;

    // RF06: Gerar metas
    const goals = aiService.generateGoals(diagnosis, { sleep, exercise, nutrition, stress });

    // Salvar metas
    const goalsToInsert = goals.map(goal => ({
      user_id: userId,
      diagnosis_id: diagnosisData.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      difficulty: goal.difficulty,
      completed: false
    }));

    const { data: goalsData, error: gError } = await supabase
      .from('goals')
      .insert(goalsToInsert)
      .select();

    if (gError) throw gError;

    res.json({
      message: 'Questionário processado com sucesso',
      diagnosis: {
        ...diagnosisData,
        ...diagnosis
      },
      goals: goalsData
    });
  } catch (error) {
    console.error('Erro ao processar questionário:', error);
    res.status(500).json({ error: 'Erro ao processar questionário' });
  }
});

module.exports = router;