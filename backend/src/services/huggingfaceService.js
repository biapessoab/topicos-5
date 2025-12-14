// backend/src/services/huggingfaceService.js
// Serviço para integração com Hugging Face API
// Gera mensagens personalizadas usando LLMs

const { HfInference } = require('@huggingface/inference');

class HuggingFaceService {
  constructor() {
    // Só inicializa se a API key estiver configurada
    if (process.env.HUGGINGFACE_API_KEY) {
      this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
      this.enabled = true;
      console.log('✅ Hugging Face habilitado');
    } else {
      this.enabled = false;
      console.log('⚠️ Hugging Face desabilitado (sem API key)');
    }
  }

  /**
   * Verifica se o serviço está habilitado
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Gera mensagem motivacional personalizada usando LLM
   * @param {Object} userData - Dados do usuário (nome, idade)
   * @param {Object} diagnosis - Diagnóstico gerado
   * @returns {Promise<string|null>} Mensagem personalizada ou null
   */
  async generatePersonalizedMessage(userData, diagnosis) {
    if (!this.enabled) {
      return null;
    }

    try {
      const prompt = this.buildPrompt(userData, diagnosis);
      
      console.log('🤖 Gerando mensagem com Hugging Face...');
      
      const response = await this.hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1
        }
      });

      // Extrair só a resposta (remover o prompt)
      let message = response.generated_text;
      
      // Limpar resposta (remover prompt duplicado se houver)
      if (message.includes('\n\n')) {
        const parts = message.split('\n\n');
        message = parts[parts.length - 1];
      }

      // Limitar tamanho
      if (message.length > 300) {
        message = message.substring(0, 297) + '...';
      }

      console.log('✅ Mensagem gerada com sucesso');
      return message.trim();

    } catch (error) {
      console.error('❌ Erro ao gerar mensagem com Hugging Face:', error.message);
      return null;
    }
  }

  /**
   * Constrói o prompt para o LLM
   */
  buildPrompt(userData, diagnosis) {
    const nome = userData.nome || 'você';
    const idade = userData.idade || '';
    const score = diagnosis.overallScore || 0;
    const areas = diagnosis.areasOfConcern || [];

    let prompt = `Você é um assistente de saúde preventiva empático e motivador. 

Usuário: ${nome}${idade ? `, ${idade} anos` : ''}
Score de saúde: ${score}/10
Áreas que precisam de atenção: ${areas.length > 0 ? areas.join(', ') : 'Nenhuma'}

Gere uma mensagem motivacional personalizada em português do Brasil (máximo 100 palavras), com tom empático, encorajador e prático. Seja específico sobre as áreas mencionadas.

Mensagem:`;

    return prompt;
  }

  /**
   * Analisa sentimento de um texto (feedback do usuário)
   * @param {string} text - Texto para análise
   * @returns {Promise<Object|null>} Resultado da análise ou null
   */
  async analyzeSentiment(text) {
    if (!this.enabled) {
      return null;
    }

    try {
      console.log('🔍 Analisando sentimento...');
      
      const result = await this.hf.textClassification({
        model: 'nlptown/bert-base-multilingual-uncased-sentiment',
        inputs: text
      });

      console.log('✅ Sentimento analisado');
      return result[0]; // { label: '5 stars', score: 0.95 }

    } catch (error) {
      console.error('❌ Erro ao analisar sentimento:', error.message);
      return null;
    }
  }

  /**
   * Gera sugestões de metas personalizadas usando IA
   * (Alternativa mais avançada para o futuro)
   */
  async generateGoalSuggestions(userData, diagnosis) {
    if (!this.enabled) {
      return null;
    }

    try {
      const prompt = `Com base no perfil de saúde:
- Score: ${diagnosis.overallScore}/10
- Áreas de atenção: ${diagnosis.areasOfConcern.join(', ')}

Liste 3 metas SMART (específicas, mensuráveis, alcançáveis) para esta semana em português:`;

      const response = await this.hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.8
        }
      });

      return response.generated_text;

    } catch (error) {
      console.error('❌ Erro ao gerar sugestões de metas:', error);
      return null;
    }
  }

  /**
   * Responde dúvidas do usuário sobre saúde (chatbot simples)
   * RF: Feature futura para Entrega 3
   */
  async answerHealthQuestion(question, userContext = {}) {
    if (!this.enabled) {
      return 'Desculpe, o assistente de IA não está disponível no momento.';
    }

    try {
      const prompt = `Você é um assistente de saúde preventiva. Responda a pergunta do usuário de forma clara, empática e baseada em evidências científicas.

Contexto do usuário: ${JSON.stringify(userContext, null, 2)}

Pergunta: ${question}

Resposta (máximo 150 palavras):`;

      const response = await this.hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7
        }
      });

      return response.generated_text;

    } catch (error) {
      console.error('❌ Erro ao responder pergunta:', error);
      return 'Desculpe, não consegui processar sua pergunta. Tente novamente.';
    }
  }
}

// Exportar instância única (Singleton)
module.exports = new HuggingFaceService();