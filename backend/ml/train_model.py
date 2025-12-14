import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import json

# Carregar dataset
df = pd.read_csv('../data/Sleep_health_and_lifestyle_dataset.csv')

# Análise exploratória
print("Dataset shape:", df.shape)
print("\nColunas:", df.columns.tolist())
print("\nPrimeiras linhas:")
print(df.head())

# Preparar features
# Mapear variáveis categóricas
le_gender = LabelEncoder()
le_occupation = LabelEncoder()
le_bmi = LabelEncoder()
le_disorder = LabelEncoder()

df['Gender_encoded'] = le_gender.fit_transform(df['Gender'])
df['Occupation_encoded'] = le_occupation.fit_transform(df['Occupation'])
df['BMI Category_encoded'] = le_bmi.fit_transform(df['BMI Category'])

# Target: Sleep Disorder (None, Insomnia, Sleep Apnea)
df['Sleep Disorder'].fillna('None', inplace=True)
y = le_disorder.fit_transform(df['Sleep Disorder'])

# Features
feature_columns = [
    'Age', 'Sleep Duration', 'Quality of Sleep', 
    'Physical Activity Level', 'Stress Level',
    'Heart Rate', 'Daily Steps',
    'Gender_encoded', 'Occupation_encoded', 'BMI Category_encoded'
]

X = df[feature_columns]

# Normalizar features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split treino/teste
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# Treinar modelo
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
model.fit(X_train, y_train)

# Avaliar
train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)

print(f"\n✅ Modelo treinado!")
print(f"Acurácia treino: {train_score:.2%}")
print(f"Acurácia teste: {test_score:.2%}")

# Salvar modelo e preprocessadores
joblib.dump(model, '../models/sleep_disorder_model.pkl')
joblib.dump(scaler, '../models/scaler.pkl')
joblib.dump(le_disorder, '../models/label_encoder.pkl')

# Salvar mapeamentos para uso no Node.js
mappings = {
    'gender': {val: idx for idx, val in enumerate(le_gender.classes_)},
    'occupation': {val: idx for idx, val in enumerate(le_occupation.classes_)},
    'bmi': {val: idx for idx, val in enumerate(le_bmi.classes_)},
    'disorders': {idx: val for idx, val in enumerate(le_disorder.classes_)},
    'feature_names': feature_columns
}

with open('../models/mappings.json', 'w') as f:
    json.dump(mappings, f, indent=2)

print("\n✅ Modelo salvo em backend/models/")