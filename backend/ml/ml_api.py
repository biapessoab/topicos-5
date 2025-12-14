from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json

app = Flask(__name__)
CORS(app)

# Carregar modelo e preprocessadores
model = joblib.load('../models/sleep_disorder_model.pkl')
scaler = joblib.load('../models/scaler.pkl')
le_disorder = joblib.load('../models/label_encoder.pkl')

with open('../models/mappings.json', 'r') as f:
    mappings = json.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Prediz risco de distúrbio do sono
    
    Exemplo de request:
    {
      "age": 27,
      "sleep_duration": 6.5,
      "quality_of_sleep": 6,
      "physical_activity_level": 42,
      "stress_level": 7,
      "heart_rate": 77,
      "daily_steps": 5000,
      "gender": "Male",
      "occupation": "Software Engineer",
      "bmi_category": "Normal"
    }
    """
    try:
        data = request.json
        
        # Preparar features
        features = [
            data['age'],
            data['sleep_duration'],
            data['quality_of_sleep'],
            data['physical_activity_level'],
            data['stress_level'],
            data['heart_rate'],
            data['daily_steps'],
            mappings['gender'].get(data['gender'], 0),
            mappings['occupation'].get(data['occupation'], 0),
            mappings['bmi'].get(data['bmi_category'], 0)
        ]
        
        # Normalizar
        features_scaled = scaler.transform([features])
        
        # Predição
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Interpretar resultado
        disorder = mappings['disorders'][str(prediction)]
        confidence = float(max(probabilities))
        
        # Calcular risco
        risk_level = 'Baixo'
        if disorder != 'None':
            if confidence > 0.7:
                risk_level = 'Alto'
            elif confidence > 0.5:
                risk_level = 'Médio'
        
        return jsonify({
            'disorder': disorder,
            'risk_level': risk_level,
            'confidence': confidence,
            'probabilities': {
                mappings['disorders'][str(i)]: float(prob) 
                for i, prob in enumerate(probabilities)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': True})

if __name__ == '__main__':
    app.run(port=5001, debug=True)