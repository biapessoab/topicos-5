const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/authController');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RF08: Buscar metas do usuário
router.get('/goals', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Buscar metas mais recentes do usuário
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ goals: data || [] });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// RF07: Alternar status de conclusão da meta
router.put('/goals/:goalId/toggle', authenticate, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    // Buscar meta atual
    const { data: currentGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentGoal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    // Alternar status
    const newStatus = !currentGoal.completed;
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      message: 'Meta atualizada',
      goal: data 
    });
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

// Buscar diagnóstico mais recente
router.get('/diagnosis/latest', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ diagnosis: data || null });
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    res.status(500).json({ error: 'Erro ao buscar diagnóstico' });
  }
});

module.exports = router;
