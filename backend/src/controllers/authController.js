// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ============================================
// RF01: CADASTRO DE USUÁRIO
// ============================================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validação de senha (mínimo 8 caracteres, 1 letra, 1 número)
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 8 caracteres' 
      });
    }
    
    if (!/[A-Za-z]/.test(password)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos uma letra' 
      });
    }
    
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos um número' 
      });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // RNF04: Hash da senha com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário no banco
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          name, 
          email, 
          password: hashedPassword 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: data.id, 
        email: data.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id: data.id,
        name: data.name,
        email: data.email
      }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

// ============================================
// RF02: AUTENTICAÇÃO DE USUÁRIO
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação de campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha com bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// ============================================
// RF03: RECUPERAÇÃO DE SENHA
// ============================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se usuário existe
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    // Por segurança, sempre retornar sucesso (mesmo se email não existir)
    // Isso evita que hackers descubram quais emails estão cadastrados
    if (!user) {
      return res.json({ 
        message: 'Se o email existir, você receberá instruções de recuperação' 
      });
    }

    // Gerar token temporário de reset (válido por 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        type: 'reset' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Implementar envio de email real (SendGrid, NodeMailer, etc)
    // Para MVP, apenas logar o token
    console.log(`==========================================`);
    console.log(`TOKEN DE RESET PARA: ${email}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Expira em: 1 hora`);
    console.log(`==========================================`);

    res.json({ 
      message: 'Se o email existir, você receberá instruções de recuperação',
      // Remover em produção - apenas para desenvolvimento:
      devToken: resetToken 
    });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

// ============================================
// RF03: REDEFINIR SENHA (usando token)
// ============================================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    // Validar nova senha
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 8 caracteres, incluindo letras e números' 
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'reset') {
        return res.status(401).json({ error: 'Token inválido' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Token expirado ou inválido' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', decoded.userId);

    if (error) throw error;

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};

// ============================================
// MIDDLEWARE: AUTENTICAÇÃO
// Protege rotas que requerem login
// ============================================
exports.authenticate = (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato esperado: "Bearer token_aqui"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar userId ao request para uso nas rotas
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Falha na autenticação' });
  }
};

// ============================================
// MIDDLEWARE: VERIFICAR SE É ADMIN
// RF10 - Gestão de Conteúdo
// ============================================
exports.isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId; // Vem do middleware authenticate

    // Verificar se usuário é admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// ============================================
// OBTER PERFIL DO USUÁRIO
// ============================================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

// ============================================
// ATUALIZAR PERFIL
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', userId)
      .select('id, name, email')
      .single();

    if (error) throw error;

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      user: data 
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

// ============================================
// DELETAR CONTA (RF17 - Desejável)
// ============================================
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para deletar conta' });
    }

    // Verificar senha antes de deletar
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Deletar usuário (CASCADE irá deletar dados relacionados)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
};

module.exports = exports;