const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/authController');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RF09: Buscar dicas educativas
router.get('/tips', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    res.json({ tips: data || [] });
  } catch (error) {
    console.error('Erro ao buscar dicas:', error);
    res.status(500).json({ error: 'Erro ao buscar dicas' });
  }
});

// RF10: Criar novo conteúdo educativo (admin)
router.post('/tips', authenticate, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.userId;

    // Verificar se é admin (simplificado para MVP)
    // TODO: Implementar verificação real de admin
    
    const { data, error } = await supabase
      .from('educational_content')
      .insert([{
        title,
        content,
        category,
        created_by: userId,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Conteúdo criado com sucesso',
      tip: data
    });
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({ error: 'Erro ao criar conteúdo' });
  }
});

module.exports = router;