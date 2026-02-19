# Musix AI Recommendation & Music Classification System

## Overview

This module implements an intelligent music recommendation and classification system for Musix, combining collaborative filtering, content-based recommendations, and deep learning models to provide personalized music suggestions and automatic genre/mood classification.

**Technology Stack:**
- **Deep Learning**: PyTorch
- **ML Frameworks**: scikit-learn, LightFM, FAISS
- **Audio Processing**: librosa, essentia
- **Data Science**: pandas, numpy, matplotlib, seaborn
- **API**: FastAPI (for model inference)
- **Data Source**: Spotify Web API + Kaggle datasets

---

## Implementation Map

### Phase 1: Setup & Foundation (Week 1)

#### 1.1 Python Dependencies
Install required ML libraries in virtual environment:

```bash
pip install -r requirements.txt
```

**Key packages:**
- `torch>=2.0.0` - Deep learning framework
- `scikit-learn>=1.3.0` - ML utilities & metrics
- `lightfm>=1.17` - Collaborative filtering
- `faiss-cpu>=1.7.4` - Efficient similarity search (use `faiss-gpu` for GPU)
- `librosa>=0.10.0` - Audio feature extraction
- `essentia>=2.1.0` - Advanced audio analysis
- `pandas>=2.0.0` - Data manipulation
- `numpy>=1.24.0` - Numerical computing
- `matplotlib>=3.7.0` - Visualization
- `seaborn>=0.12.0` - Statistical visualization
- `jupyter>=1.0.0` - Interactive notebooks

#### 1.2 Directory Structure
```
recommender/
├── README.md                   # This file
├── requirements.txt            # Python dependencies
├── data/
│   ├── spotify_dataset.csv        # Raw training data (downloaded from Kaggle)
│   ├── user_history.csv            # User listening history (from Spotify API)
│   └── processed/                  # Preprocessed data for training
│       ├── train.csv
│       ├── val.csv
│       └── test.csv
├── models/
│   ├── genre_classifier.pkl        # Trained genre classification model
│   ├── mood_classifier.pt          # Trained mood classification model (PyTorch)
│   ├── collab_filter.pkl           # Trained collaborative filtering model
│   ├── faiss_index.bin             # FAISS index for similarity search
│   ├── faiss_index.pkl             # FAISS index metadata
│   └── hybrid_ranker.pt            # Trained hybrid recommendation ranker
├── notebook/
│   ├── data_exploration.ipynb      # Exploratory Data Analysis (EDA)
│   ├── genre_classification.ipynb  # Genre classification model development
│   ├── mood_classification.ipynb   # Mood/vibe classification development
│   ├── recommendation_system.ipynb # Recommendation engine development
│   └── model_evaluation.ipynb      # Model evaluation & metrics
└── script/
    ├── preprocess.py               # Data loading & preprocessing
    ├── train_classifiers.py        # Train genre & mood classifiers
    ├── train_recommender.py        # Train recommendation models
    ├── model_server.py             # FastAPI server for inference
    ├── evaluate.py                 # Compute evaluation metrics
    └── utils.py                    # Helper functions
```

#### 1.3 Git Configuration
Add to `.gitignore` in project root:
```
# ML Data & Models
recommender/data/*.csv
recommender/data/processed/
recommender/models/*.pkl
recommender/models/*.pt
recommender/models/*.bin
recommender/models/*.joblib
*.pkl
*.pt
*.bin
.ipynb_checkpoints/

# Python
__pycache__/
*.pyc
*.pyo
.env
.venv/
venv/
```

Track only model configs and architectures, not binary artifacts.

---

## Phase 2: Music Classification Models (Weeks 2-3)

### 2.1 Genre Classification

**Objective**: Automatically predict genres for any track based on audio features.

**Model Details:**
- **Architecture**: LightFM (Factorization Machine) + XGBoost ensemble
- **Input Features** (normalized):
  - `danceability` (0-1) - How suitable for dancing
  - `energy` (0-1) - Intensity & activity
  - `valence` (0-1) - Musical positiveness
  - `tempo` (BPM) - Beats per minute
  - `acousticness` (0-1) - Acoustic vs. electric
  - `speechiness` (0-1) - Presence of spoken words
  - `instrumentalness` (0-1) - Lack of vocals
  - `liveness` (0-1) - Live performance indicator
  - `loudness` (dB) - Overall volume
  - `key` (0-11) - Musical key
  - `mode` (major/minor) - Major or minor scale
  - `time_signature` - Beats per bar

**Output:**
- Top-5 genre predictions with confidence scores
- Example: `[("pop", 0.92), ("dance", 0.78), ("Electronic", 0.65), ...]`

**Training Data:**
- Source: Spotify dataset from Kaggle (maharshipandya/spotify-tracks-dataset)
- Size: ~114K tracks with genre labels
- Split: 80% train, 10% val, 10% test

**Notebook**: `genre_classification.ipynb`

**Steps:**
1. Load Spotify dataset
2. Exploratory Data Analysis (EDA)
   - Genre distribution
   - Feature correlation heatmap & violin plots
   - Missing value analysis
3. Feature engineering
   - Normalize audio features to [0, 1]
   - Handle outliers using IQR method
   - Create interaction features (energy * valence, tempo / loudness ratios)
4. Model training
   - Train LightFM with user-item implicit feedback
   - Train XGBoost classifier for multi-class genre prediction
   - Ensemble scores: average LightFM & XGBoost predictions
5. Evaluation
   - Metrics: F1-score (macro, weighted), Precision@5, Recall@5
   - Confusion matrix for top genres
   - Per-genre performance analysis
6. Cross-validation (5-fold)
7. Hyperparameter tuning (Optuna or GridSearchCV)
8. Save model: `models/genre_classifier.pkl`

**Expected Performance:**
- F1-Score: 0.75-0.85 (multi-class, 10-20 genres)
- Precision@5: 0.80+
- Inference time: <10ms per track

---

### 2.2 Mood/Vibe Classification

**Objective**: Classify track mood/vibe for contextual recommendations.

**Model Details:**
- **Architecture**: PyTorch 2-layer Dense Neural Network
- **Input Features**: Audio features + derived mood indicators
  - Valence → happiness level
  - Energy → intensity
  - Tempo → rhythm speed
  - Acousticness → intimacy
  - Danceability → groove suitability
- **Output Classes**: 5 mood categories
  - `happy` - Uplifting, positive energy
  - `sad` - Melancholic, low valence
  - `energetic` - High energy, dance-worthy
  - `calm` - Relaxing, low tempo
  - `focus` - Instrumental or minimal vocals

**Network Architecture:**
```
Input (12 features)
  ↓
Dense(64, ReLU, BatchNorm, Dropout=0.3)
  ↓
Dense(32, ReLU, BatchNorm, Dropout=0.2)
  ↓
Output(5, Softmax)  → [happy, sad, energetic, calm, focus]
```

**Training Details:**
- **Loss**: CrossEntropyLoss
- **Optimizer**: Adam (lr=0.001)
- **Batch Size**: 32
- **Epochs**: 50 (with early stopping)
- **Validation Split**: 20%

**Notebook**: `mood_classification.ipynb`

**Steps:**
1. Create synthetic mood labels from audio features
   - Valence > 0.7 & Energy > 0.7 → `happy`
   - Valence < 0.4 → `sad`
   - Energy > 0.8 & Danceability > 0.7 → `energetic`
   - Tempo < 100 & Acousticness > 0.5 → `calm`
   - Instrumentalness > 0.6 & Speechiness < 0.1 → `focus`
2. Feature scaling (StandardScaler)
3. PyTorch dataset & dataloader
4. Model training with validation monitoring
5. Evaluation metrics: accuracy, F1-score, confusion matrix
6. Save model: `models/mood_classifier.pt`

**Expected Performance:**
- Accuracy: 0.75-0.85
- Inference time: <5ms per track

---

## Phase 3: Recommendation Engine (Weeks 4-5)

### 3.1 Collaborative Filtering

**Objective**: Learn user-track interactions from listening history.

**Model Details:**
- **Algorithm**: LightFM with Bayesian Personalized Ranking (BPR) loss
- **Approach**: Implicit feedback (user listened = positive signal)
- **Data Source**: User's top tracks from Spotify (via `/me/top/tracks` endpoint)
- **Embeddings**: 
  - User embeddings: 50-dimensional vectors
  - Track embeddings: 50-dimensional vectors
- **Training**:
  - Positive samples: User's top tracks
  - Negative samples: Random unheard tracks
  - Optimization: BPR loss (ranking-based)

**Output:**
- Candidate tracks ranked by collaborative score
- Cold-start handling: Use content-based fallback for new users

**Training Script**: `train_recommender.py` (Part 1)

**Steps:**
1. Fetch user's Spotify listening history (top 50 tracks)
2. Create user-track interaction matrix
3. LightFM model initialization
4. Train for 100-500 epochs
5. Generate recommendations for each user
6. Evaluate with metrics like NDCG@10, HitRate@10
7. Save model: `models/collab_filter.pkl`

**Expected Performance:**
- Hit Rate@10: 0.65+
- NDCG@10: 0.55+

---

### 3.2 Content-Based Filtering (FAISS)

**Objective**: Fast similarity search based on audio & metadata features.

**Model Details:**
- **Approach**: FAISS L2 distance index
- **Features** (concatenated & normalized):
  - Audio features (12 dims) - danceability, energy, valence, etc.
  - Genre embedding (10 dims) - from genre classifier
  - Mood probability (5 dims) - from mood classifier
  - Artist popularity (1 dim)
  - **Total**: 28-dimensional embedding
- **Index Type**: IndexFlatL2 (exact search) or IVF-PQ (fast approximate)

**Output:**
- K nearest neighbors for a given track
- Similarity scores (inverse distance)

**Process:**
1. Load all ~1M Spotify tracks
2. Extract/predict features for each track
3. Normalize embeddings (L2 norm)
4. Build FAISS index
5. Save index: `models/faiss_index.bin`
6. Save metadata: `models/faiss_index.pkl` (mapping to track IDs)

**Inference:**
```python
# Example usage
query_track_embedding = extract_features(current_track)
distances, indices = faiss_index.search(query_track_embedding.reshape(1, -1), k=10)
recommendations = [tracks[i] for i in indices[0]]
```

**Search Performance:**
- Latency: <5ms for 10 nearest neighbors

---

### 3.3 Hybrid Recommendation Ranker

**Objective**: Ensemble collaboratively filtered & content-based recommendations into a ranked list.

**Architecture**: PyTorch Neural Network
```
Collaborative score (1)  ─┐
Content score (1)        ─┤─ Dense(32, ReLU) ─ Dense(1, Sigmoid) → Final Score
User preference (1)      ─|
Freshness penalty (1)    ─|
Diversity factor (1)     ─┘
```

**Input Features:**
- **Collaborative Score** (0-1): From LightFM model
- **Content Score** (0-1): From FAISS similarity
- **User Preference**: User's taste vector (avg audio features)
- **Freshness Penalty**: Exponential decay over time
- **Diversity Factor**: Distance to already-recommended tracks

**Weighted Ensemble** (before neural network):
```
hybrid_score = (
    0.50 * collab_score +      # Collaborative filtering weight
    0.30 * content_score +     # Content-based weight
    0.10 * freshness_bonus +   # Penalize old tracks
    0.10 * diversity_bonus     # Encourage feature variance
)
```

**Neural Network Role:**
- Learn non-linear combination of above features
- Adapt weights based on user activity (active vs. inactive users)
- Learn timing patterns (different rec strategies for different times)

**Training Details:**
- **Data**: User feedback (clicked/played = 1, skipped = 0)
- **Loss**: Binary Cross-Entropy
- **Optimizer**: Adam
- **Epochs**: 30-50

**Output:**
- Ranked list of recommendations with:
  - Track metadata
  - Final score (0-1)
  - Explanation (which component contributed most)

**Notebook**: `recommendation_system.ipynb`

**Steps:**
1. Load trained genre & mood classifiers
2. Load trained collab & content models
3. Generate candidate set (union of collab + content top-50)
4. Compute features for each candidate
5. Train neural ranker on user feedback
6. Evaluate on holdout test set
7. Save model: `models/hybrid_ranker.pt`

**Expected Performance:**
- Precision@10: 0.65+
- NDCG@10: 0.60+
- Coverage: 70%+ of catalog

---

## Phase 4: API Integration (Week 6)

### 4.1 Backend Routes (Express/TypeScript)

Add to `/backend/src/routes/`:

#### `POST /api/ml/classify`
Classify a track's genre and mood.

**Request:**
```json
{
  "trackId": "spotify:track:...",
  "audioFeatures": {
    "danceability": 0.75,
    "energy": 0.85,
    "valence": 0.6,
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "genres": [
      { "name": "pop", "confidence": 0.92 },
      { "name": "dance", "confidence": 0.78 }
    ],
    "mood": {
      "primary": "energetic",
      "probabilities": {
        "happy": 0.65,
        "sad": 0.05,
        "energetic": 0.85,
        "calm": 0.10,
        "focus": 0.05
      }
    },
    "timestamp": "2026-02-17T10:30:00Z"
  }
}
```

#### `POST /api/ml/recommend`
Get hybrid recommendations for a user.

**Request:**
```json
{
  "userId": "user_123",
  "currentTrackId": "spotify:track:...",
  "limit": 10,
  "excludeIds": ["track_id_1", "track_id_2"],
  "timeRange": "medium_term"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "spotify:track:...",
        "name": "Track Name",
        "artist": "Artist Name",
        "score": 0.92,
        "reason": "70% collaborative + 20% content similarity + 10% freshness",
        "genre": ["pop", "electronic"],
        "mood": "energetic"
      }
    ],
    "source": "hybrid",
    "generatedAt": "2026-02-17T10:30:00Z"
  }
}
```

#### `POST /api/ml/train`
Trigger model retraining (admin only).

**Request:**
```json
{
  "model": "all",
  "limit": 50000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "training_started",
    "jobId": "job_123",
    "estimatedTime": "2 hours"
  }
}
```

---

### 4.2 Python Model Server (FastAPI)

Create `/recommender/script/model_server.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import torch
import numpy as np
from typing import List, Dict

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "https://musix.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
MODELS = {}

@app.on_event("startup")
async def load_models():
    """Load all models at startup"""
    MODELS['genre_classifier'] = joblib.load('models/genre_classifier.pkl')
    MODELS['mood_classifier'] = torch.load('models/mood_classifier.pt')
    MODELS['collab_filter'] = joblib.load('models/collab_filter.pkl')
    MODELS['faiss_index'] = load_faiss_index()
    MODELS['hybrid_ranker'] = torch.load('models/hybrid_ranker.pt')
    print("✓ All models loaded successfully")

@app.post("/classify")
async def classify_track(features: Dict):
    """Classify track genre & mood"""
    genre_scores = MODELS['genre_classifier'].predict(features)
    mood_probs = MODELS['mood_classifier'](torch.tensor(features))
    
    return {
        "genres": genre_scores,
        "mood": mood_probs.tolist()
    }

@app.post("/recommend")
async def get_recommendations(user_id: str, limit: int = 10):
    """Get hybrid recommendations"""
    # Implementation details...
    return {"recommendations": [...]}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "models_loaded": len(MODELS)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Running the server:**
```bash
cd recommender/script
python model_server.py
# Server runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

### 4.3 Frontend Integration

Update `/frontend/src/services/azureMlService.js`:

```javascript
// Add new methods
export const mlService = {
  async classifyTrack(trackId, audioFeatures) {
    return fetchJson(`${BACKEND_BASE_URL}/api/ml/classify`, {
      method: 'POST',
      body: JSON.stringify({
        trackId,
        audioFeatures
      })
    });
  },

  async getHybridRecommendations(userId, currentTrackId, limit = 10) {
    return fetchJson(`${BACKEND_BASE_URL}/api/ml/recommend`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        currentTrackId,
        limit
      })
    });
  }
};
```

**Display Classifications** in UI:
```jsx
// In TrackCard.jsx
const [classification, setClassification] = useState(null);

useEffect(() => {
  mlService.classifyTrack(track.id, track.audioFeatures)
    .then(setClassification);
}, [track.id]);

// Render
<div className="genres">
  {classification?.genres?.map(g => (
    <span key={g.name} className="badge">{g.name}</span>
  ))}
</div>
```

**Show "Why Recommended":**
```jsx
<div className="recommendation-reason">
  {recommendation.reason}
</div>
```

---

## Phase 5: Evaluation & Optimization (Week 7)

### 5.1 Offline Evaluation Metrics

Create `/recommender/script/evaluate.py`:

**Classification Metrics:**
```python
from sklearn.metrics import f1_score, precision_recall_fscore_support, confusion_matrix

# Genre Classification
genre_f1 = f1_score(y_true, y_pred, average='macro')
genre_precision, genre_recall, _, _ = precision_recall_fscore_support(y_true, y_pred)

# Mood Classification
mood_accuracy = (y_pred == y_true).mean()
mood_f1 = f1_score(y_true, y_pred, average='weighted')
```

**Recommendation Metrics:**
```python
from sklearn.metrics import ndcg_score, mean_reciprocal_rank

# Precision@K
precision_at_10 = sum(1 for i in range(10) if predictions[i] in ground_truth) / 10

# Recall@K
recall_at_10 = len(set(predictions[:10]) & set(ground_truth)) / len(ground_truth)

# NDCG (Normalized Discounted Cumulative Gain)
ndcg = ndcg_score([ground_truth], [predictions[:10]])

# Coverage (% of catalog recommended)
coverage = len(set(all_recommendations)) / total_catalog_size

# Diversity (audio feature variance)
diversities = [cosine_similarity(rec[i], rec[i+1]) for i in range(len(rec)-1)]
avg_diversity = np.mean(diversities)

# Catalog Coverage@100
coverage_100 = len(set(recommendations[:100])) / 1_000_000
```

**Notebook**: `model_evaluation.ipynb`

**Key Metrics to Track:**
| Metric | Target | Description |
|--------|--------|-------------|
| Genre F1-Score | 0.78+ | Multi-class classification quality |
| Mood Accuracy | 0.80+ | Mood prediction accuracy |
| Precision@10 | 0.65+ | Relevant items in top-10 |
| Recall@10 | 0.55+ | Coverage of user's preferences |
| NDCG@10 | 0.60+ | Quality of ranking |
| Coverage | 70%+ | % of catalog in recommendations |
| Diversity | 0.45-0.55 | Audio feature variance (cosine distance) |
| Inference Time | <100ms | End-to-end latency |

---

### 5.2 Online Evaluation (A/B Testing)

**Version A** (Control): Spotify API recommendations
**Version B** (Treatment): Hybrid ML recommendations

**Metrics to Compare:**
1. **Skip Rate**: Percentage of recommendations skipped within 30s
   - Target: <20% skip rate
   - Baseline: ~35% (Spotify)

2. **Add-to-Playlist Rate**: % of recommendations saved
   - Target: >8%
   - Baseline: ~3%

3. **Session Length**: Average tracks played per recommendation session
   - Target: 5+ tracks
   - Baseline: 3 tracks

4. **Repeat Listening**: % of recommended tracks played again
   - Target: >15%
   - Baseline: ~8%

**Implementation:**
```javascript
// Track recommendation performance
const logRecommendationEvent = (trackId, action) => {
  analytics.track('recommendation_action', {
    trackId,
    action,        // 'played', 'skipped', 'added_to_playlist'
    recommendedBy, // 'hybrid_ml', 'spotify_api'
    timestamp
  });
};
```

---

### 5.3 Model Monitoring & Drift Detection

**Monitoring Components:**

1. **Performance Dashboard**:
   - Real-time metrics (precision, recall, coverage)
   - User feedback loop (implicit: skips, saves)
   - Latency tracking

2. **Data Drift Detection**:
   - Compare audio feature distributions (current vs. training)
   - Alert if drift > 10% (KL divergence)
   - Trigger retraining

3. **Model Drift Detection**:
   - Monitor prediction distribution shift
   - Track unexplained variance in metrics
   - A/B test results

4. **Retraining Schedule**:
   - **Automatic**: Monthly (scheduled job)
   - **Triggered**: If metrics drop >5%
   - **Emergency**: If skip rate > 40%

**Retraining Pipeline**:
```python
# cron job every 1st of month
def monthly_retrain():
    # 1. Fetch fresh user data
    recent_top_tracks = fetch_user_top_tracks(time_range='medium_term')
    
    # 2. Update training data
    update_dataset(recent_top_tracks)
    
    # 3. Retrain models with same hyperparameters
    train_classifiers()
    train_recommender()
    
    # 4. Evaluate on holdout test set
    metrics = evaluate_models()
    
    # 5. A/B test new models (20% traffic)
    if metrics['precision@10'] > previous_metrics['precision@10']:
        deploy_new_models(traffic_split=0.20)
        gradually_increase_split()  # Over 1 week
    else:
        alert_team()
```

---

## Training & Execution Setup

### Data Preparation
```bash
cd recommender/script

# Download and preprocess data
python preprocess.py \
  --input data/spotify_dataset.csv \
  --output data/processed/ \
  --limit 100000
```

### Train All Models (Sequential)
```bash
# Phase 2: Classification
python train_classifiers.py --batch-size 32 --epochs 50

# Phase 3: Recommendation
python train_recommender.py --batch-size 32 --epochs 30

# Evaluate
python evaluate.py --test-size 0.1
```

### Run Model Server
```bash
python model_server.py --host 0.0.0.0 --port 8000
```

### Notebooks (Interactive)
```bash
# Start Jupyter
jupyter notebook notebook/

# Run in order:
# 1. data_exploration.ipynb
# 2. genre_classification.ipynb
# 3. mood_classification.ipynb
# 4. recommendation_system.ipynb
# 5. model_evaluation.ipynb
```

---

## Hyperparameter Reference

### Genre Classifier (LightFM + XGBoost)
```python
lightfm_params = {
    'no_components': 50,          # Embedding dimension
    'learning_schedule': 'adadelta',
    'loss': 'bpr',
    'k': 5,                       # Negative sample pool
}

xgboost_params = {
    'max_depth': 7,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
}
```

### Mood Classifier (PyTorch)
```python
model_params = {
    'input_dim': 12,
    'hidden_dims': [64, 32],
    'output_dim': 5,
    'dropout': 0.3,
    'learning_rate': 0.001,
    'batch_size': 32,
}
```

### Collab Filter (LightFM)
```python
collab_params = {
    'no_components': 50,
    'learning_schedule': 'adadelta',
    'loss': 'bpr',
    'epochs': 100,
    'num_threads': 4,
}
```

### FAISS Index
```python
faiss_params = {
    'dimension': 28,               # Feature dimension
    'metric': 'L2',                # Euclidean distance
    'index_type': 'IndexFlatL2',   # Exact search
    # For large scale: 'IVFFlat' with nlist=100
}
```

### Hybrid Ranker (PyTorch)
```python
ranker_params = {
    'input_dim': 5,                # [collab, content, preference, freshness, diversity]
    'hidden_dims': [32, 16],
    'learning_rate': 0.001,
    'batch_size': 64,
    'epochs': 50,
    'early_stopping_patience': 10,
}
```

---

## Troubleshooting

### Model Loading Issues
```python
# Check model compatibility
torch.cuda.is_available()  # For GPU
torch.__version__          # Version check
joblib.__version__

# Reload model
import importlib
importlib.reload(model_module)
```

### Memory Issues (Large Datasets)
```python
# Process in batches
chunk_size = 10000
for chunk in pd.read_csv('data.csv', chunksize=chunk_size):
    process_chunk(chunk)

# Use FAISS on GPU
faiss.index_factory(dimension, 'IVF100,Flat', faiss.METRIC_L2)
```

### Model Inference Bottleneck
```python
# Use batch inference
predictions = model.predict(batch_features)  # Not one-by-one

# Cache predictions
cache = {}
if track_id in cache:
    return cache[track_id]
```

---

## Success Criteria (Week 7)

✓ All 5 notebooks run without errors  
✓ Genre classifier F1-score > 0.75  
✓ Mood classifier accuracy > 0.78  
✓ Recommendation precision@10 > 0.65  
✓ Model server latency < 100ms P95  
✓ Backend routes integrated & tested  
✓ Frontend UI displays classifications  
✓ A/B test infrastructure ready  

---

## Next Steps

1. **Update `requirements.txt`** with all dependencies
2. **Create training scripts** (`preprocess.py`, `train_classifiers.py`, etc.)
3. **Run Phase 2 notebooks** (classification)
4. **Run Phase 3 notebooks** (recommendations)
5. **Set up FastAPI server** for inference
6. **Integrate with backend** REST routes
7. **Deploy frontend** with classification UI
8. **Monitor metrics** and iterate

---

## Contributors & References

**Related Docs:**
- [Spotify Audio Features](https://developer.spotify.com/documentation/web-api/reference/#/operations/get-audio-features)
- [LightFM Documentation](https://making.lyst.com/lightfm/docs/)
- [FAISS Tutorial](https://github.com/facebookresearch/faiss/wiki/Getting-started)
- [PyTorch Recommendations](https://github.com/pytorch/torchrec)

**Datasets:**
- [Spotify Tracks Dataset](https://www.kaggle.com/datasets/maharshipandya/spotify-tracks-dataset)
- [Spotify Dataset (Extended)](https://www.kaggle.com/datasets/vatsalmavani/spotify-dataset)

---

**Last Updated**: February 17, 2026  
**Status**: Planning Phase  
**Owner**: ML Team - Musix Project
