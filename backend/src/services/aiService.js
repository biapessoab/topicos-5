// backend/src/services/aiService.js
// Sistema de Regras para Diagnóstico e Recomendações (RF05, RF06)
// RNF03: Geração rápida (< 5 segundos)

class AIService {
  // ============================================
  // RF05: GERAÇÃO DE DIAGNÓSTICO
  // ============================================
  generateDiagnosis(questionnaireData) {
    const startTime = Date.now();
    
    const { sleep, exercise, nutrition, stress } = questionnaireData;
    
    const areas = [];
    const scores = {};
    const explanations = {};

    // Análise de cada área de saúde
    const sleepResult = this.analyzeSleep(sleep);
    scores.sleep = sleepResult.score;
    explanations.sleep = sleepResult.explanation;
    if (sleepResult.score < 7) {
      areas.push('Sono');
    }

    const exerciseResult = this.analyzeExercise(exercise);
    scores.exercise = exerciseResult.score;
    explanations.exercise = exerciseResult.explanation;
    if (exerciseResult.score < 7) {
      areas.push('Exercícios');
    }

    const nutritionResult = this.analyzeNutrition(nutrition);
    scores.nutrition = nutritionResult.score;
    explanations.nutrition = nutritionResult.explanation;
    if (nutritionResult.score < 7) {
      areas.push('Alimentação');
    }

    const mentalHealthResult = this.analyzeMentalHealth(stress);
    scores.mentalHealth = mentalHealthResult.score;
    explanations.mentalHealth = mentalHealthResult.explanation;
    if (mentalHealthResult.score < 7) {
      areas.push('Saúde Mental');
    }

    // Calcular score geral
    const overallScore = Math.round(
      (scores.sleep + scores.exercise + scores.nutrition + scores.mentalHealth) / 4
    );

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`✅ Diagnóstico gerado em ${processingTime}ms`);

    return {
      areasOfConcern: areas,
      scores,
      explanations,
      overallScore,
      timestamp: new Date().toISOString(),
      processingTimeMs: processingTime
    };
  }

  // ============================================
  // ANÁLISE DE SONO
  // ============================================
  analyzeSleep(sleepData) {
    const { duration, quality } = sleepData;
    let score = 10;
    let explanation = '';

    // Duração do sono (ideal: 7-9 horas)
    if (duration < 6) {
      score -= 4;
      explanation += `Sua duração de sono está baixa (${duration}h). O recomendado é 7-9 horas por noite. `;
    } else if (duration < 7) {
      score -= 2;
      explanation += `Você está dormindo ${duration}h, um pouco abaixo do ideal (7-9h). `;
    } else if (duration > 9) {
      score -= 2;
      explanation += `Você está dormindo muito (${duration}h). Excesso de sono pode indicar outros problemas de saúde. `;
    }

    // Qualidade do sono
    if (quality <= 3) {
      score -= 4;
      explanation += `Sua qualidade de sono está muito baixa (${quality}/10). Isso afeta memória, humor e saúde. `;
    } else if (quality <= 5) {
      score -= 3;
      explanation += `Sua qualidade de sono está baixa (${quality}/10). `;
    } else if (quality <= 7) {
      score -= 1;
      explanation += `Sua qualidade de sono é razoável (${quality}/10), mas pode melhorar. `;
    }

    // Feedback positivo
    if (score >= 8) {
      explanation = `Excelente! Seus hábitos de sono estão muito bons (${duration}h, qualidade ${quality}/10). Continue assim!`;
    } else if (score >= 7) {
      explanation += 'Com pequenos ajustes, você pode melhorar ainda mais seu sono.';
    }

    return { 
      score: Math.max(1, Math.min(10, score)), 
      explanation: explanation.trim() 
    };
  }

  // ============================================
  // ANÁLISE DE EXERCÍCIO
  // ============================================
  analyzeExercise(exerciseData) {
    const { frequency, duration, intensity } = exerciseData;
    let score = 10;
    let explanation = '';

    // Calcular minutos totais por semana
    const weeklyMinutes = frequency * duration;

    // OMS recomenda 150 min/semana de atividade moderada
    // ou 75 min/semana de atividade intensa
    const recommendedMinutes = intensity === 'alta' ? 75 : 150;

    if (weeklyMinutes === 0) {
      score = 2;
      explanation = `Você não está praticando exercícios. Seu corpo precisa de movimento! Comece com caminhadas leves de 15 minutos, 3x por semana.`;
    } else if (weeklyMinutes < recommendedMinutes * 0.5) {
      score -= 5;
      explanation += `Você está praticando ${weeklyMinutes} minutos de exercício por semana (intensidade ${intensity}). O recomendado são ${recommendedMinutes} minutos. `;
    } else if (weeklyMinutes < recommendedMinutes) {
      score -= 3;
      explanation += `Você está no caminho certo com ${weeklyMinutes} minutos por semana! Faltam apenas ${recommendedMinutes - weeklyMinutes} minutos para atingir a meta. `;
    }

    // Frequência
    if (frequency < 2) {
      score -= 2;
      explanation += `Tente se exercitar pelo menos 3 vezes por semana para melhores resultados. `;
    } else if (frequency >= 5 && intensity === 'alta') {
      score -= 1;
      explanation += `Cuidado com overtraining! Seu corpo precisa de descanso. Considere intercalar dias de descanso. `;
    }

    // Feedback positivo
    if (score >= 8) {
      explanation = `Parabéns! Sua rotina de exercícios está excelente (${frequency}x/semana, ${duration}min, intensidade ${intensity}). Continue assim!`;
    }

    return { 
      score: Math.max(1, Math.min(10, score)), 
      explanation: explanation.trim() 
    };
  }

  // ============================================
  // ANÁLISE DE ALIMENTAÇÃO
  // ============================================
  analyzeNutrition(nutritionData) {
    const { vegetables, fruits, water, fastFood } = nutritionData;
    let score = 10;
    let explanation = '';

    // Vegetais (recomendado: 3+ porções/dia)
    if (vegetables < 1) {
      score -= 3;
      explanation += `Você não está consumindo vegetais suficientes (${vegetables} porções/dia). O ideal são pelo menos 3. `;
    } else if (vegetables < 2) {
      score -= 2;
      explanation += `Aumente o consumo de vegetais. Você está em ${vegetables} porções/dia, o ideal são 3+. `;
    }

    // Frutas (recomendado: 2+ porções/dia)
    if (fruits < 1) {
      score -= 3;
      explanation += `Você precisa comer mais frutas (${fruits} porções/dia). O ideal são pelo menos 2. `;
    } else if (fruits < 2) {
      score -= 1;
      explanation += `Tente adicionar mais uma fruta por dia. `;
    }

    // Água (recomendado: 2-3L/dia)
    if (water < 1.5) {
      score -= 2;
      explanation += `Sua ingestão de água está baixa (${water}L/dia). Aumente para 2-3L. A desidratação afeta concentração e energia. `;
    } else if (water < 2) {
      score -= 1;
      explanation += `Beba um pouco mais de água. Você está em ${water}L, tente chegar a 2-3L por dia. `;
    }

    // Fast Food (máximo recomendado: 1-2x/semana)
    if (fastFood > 4) {
      score -= 4;
      explanation += `Você está consumindo fast food demais (${fastFood}x/semana). Isso prejudica sua saúde. Tente reduzir para 1-2x/semana. `;
    } else if (fastFood > 2) {
      score -= 2;
      explanation += `Reduza o consumo de fast food. Você está em ${fastFood}x/semana, o ideal é máximo 2x. `;
    }

    // Feedback positivo
    if (score >= 8) {
      explanation = `Excelente! Seus hábitos alimentares estão muito bons. Continue priorizando alimentos naturais!`;
    }

    return { 
      score: Math.max(1, Math.min(10, score)), 
      explanation: explanation.trim() 
    };
  }

  // ============================================
  // ANÁLISE DE SAÚDE MENTAL
  // ============================================
  analyzeMentalHealth(stressData) {
    const { level, qualityOfLife } = stressData;
    let score = 10;
    let explanation = '';

    // Nível de estresse
    if (level >= 9) {
      score -= 5;
      explanation += `Seu nível de estresse está muito alto (${level}/10). Isso é preocupante e pode afetar sua saúde física. `;
    } else if (level >= 7) {
      score -= 3;
      explanation += `Seu nível de estresse está elevado (${level}/10). `;
    } else if (level >= 5) {
      score -= 1;
      explanation += `Seu estresse está em nível moderado (${level}/10). `;
    }

    // Qualidade de vida
    if (qualityOfLife <= 4) {
      score -= 4;
      explanation += `Sua percepção de qualidade de vida está baixa (${qualityOfLife}/10). Isso é um sinal de alerta. `;
    } else if (qualityOfLife <= 6) {
      score -= 2;
      explanation += `Sua qualidade de vida pode melhorar (${qualityOfLife}/10). `;
    }

    // Recomendações baseadas na severidade
    if (score < 5) {
      explanation += `IMPORTANTE: Considere buscar apoio profissional de um psicólogo ou terapeuta. Sua saúde mental é prioridade. `;
    } else if (score < 7) {
      explanation += `Pratique técnicas de relaxamento como meditação, respiração profunda ou yoga. Tire pausas regulares durante o dia. `;
    }

    // Feedback positivo
    if (score >= 8) {
      explanation = `Ótimo! Sua saúde mental está em bom estado (estresse ${level}/10, qualidade de vida ${qualityOfLife}/10). Continue cuidando de si!`;
    }

    return { 
      score: Math.max(1, Math.min(10, score)), 
      explanation: explanation.trim() 
    };
  }

  // ============================================
  // RF06: RECOMENDAÇÃO DE METAS
  // ============================================
  generateGoals(diagnosis, questionnaireData) {
    const goals = [];
    const { scores } = diagnosis;

    // Ordenar áreas pela pontuação (menor primeiro = mais crítico)
    const sortedAreas = Object.entries(scores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3) // Pegar as 3 piores áreas
      .map(([area]) => area);

    // Gerar metas para cada área crítica
    sortedAreas.forEach(area => {
      const areaGoals = this.getGoalsForArea(area, questionnaireData);
      goals.push(...areaGoals);
    });

    // Limitar a 3 metas para não sobrecarregar o usuário
    const selectedGoals = goals.slice(0, 3).map((goal, index) => ({
      id: index + 1,
      ...goal,
      completed: false
    }));

    console.log(`✅ ${selectedGoals.length} metas geradas`);

    return selectedGoals;
  }

  // ============================================
  // METAS ESPECÍFICAS POR ÁREA
  // ============================================
  getGoalsForArea(area, data) {
    const goalsByArea = {
      sleep: [
        {
          title: 'Dormir 7-8 horas por noite',
          description: 'Estabeleça um horário fixo para dormir (ex: 23h) e acordar (ex: 7h)',
          category: 'Sono',
          difficulty: 'fácil'
        },
        {
          title: 'Evitar telas 1h antes de dormir',
          description: 'Desligue celular, TV e computador 1 hora antes de deitar. Leia um livro ou medite.',
          category: 'Sono',
          difficulty: 'médio'
        },
        {
          title: 'Criar rotina relaxante noturna',
          description: 'Tome banho morno, alongue-se e pratique respiração profunda antes de dormir',
          category: 'Sono',
          difficulty: 'fácil'
        }
      ],
      exercise: [
        {
          title: 'Caminhar 30 minutos, 3x na semana',
          description: 'Escolha dias fixos (ex: Seg, Qua, Sex) e horários para caminhar no parque ou bairro',
          category: 'Exercícios',
          difficulty: 'fácil'
        },
        {
          title: 'Fazer 10 minutos de alongamento diário',
          description: 'Ao acordar ou antes de dormir, alongue pescoço, ombros, costas e pernas',
          category: 'Exercícios',
          difficulty: 'fácil'
        },
        {
          title: 'Subir escadas em vez de elevador',
          description: 'Sempre que possível, escolha as escadas. Ótimo exercício cardiovascular!',
          category: 'Exercícios',
          difficulty: 'fácil'
        }
      ],
      nutrition: [
        {
          title: 'Comer 1 fruta no café da manhã',
          description: 'Adicione banana, maçã ou mamão à sua primeira refeição do dia',
          category: 'Alimentação',
          difficulty: 'fácil'
        },
        {
          title: 'Beber 2 litros de água por dia',
          description: 'Use uma garrafa de 500ml e complete 4 vezes ao dia. Coloque lembretes no celular.',
          category: 'Alimentação',
          difficulty: 'fácil'
        },
        {
          title: 'Reduzir fast food para 1x na semana',
          description: 'Planeje suas refeições, cozinhe em casa e leve marmita para trabalho/faculdade',
          category: 'Alimentação',
          difficulty: 'médio'
        },
        {
          title: 'Incluir vegetais no almoço e jantar',
          description: 'Adicione salada ou legumes cozidos em pelo menos 2 refeições por dia',
          category: 'Alimentação',
          difficulty: 'fácil'
        }
      ],
      mentalHealth: [
        {
          title: 'Praticar 10 minutos de meditação',
          description: 'Use apps como Meditopia, Calm ou apenas respire fundo focando na respiração',
          category: 'Saúde Mental',
          difficulty: 'fácil'
        },
        {
          title: 'Fazer 1 pausa de 15 min a cada 2h',
          description: 'Levante, caminhe, estique o corpo e descanse a mente. Use a técnica Pomodoro.',
          category: 'Saúde Mental',
          difficulty: 'fácil'
        },
        {
          title: 'Praticar gratidão diária',
          description: 'Antes de dormir, escreva 3 coisas pelas quais você é grato no dia',
          category: 'Saúde Mental',
          difficulty: 'fácil'
        },
        {
          title: 'Conversar com amigos/família 3x/semana',
          description: 'Conexões sociais reduzem estresse. Ligue ou encontre pessoas queridas.',
          category: 'Saúde Mental',
          difficulty: 'fácil'
        }
      ]
    };

    return goalsByArea[area] || [];
  }
}

// Exportar instância única (Singleton)
module.exports = new AIService();