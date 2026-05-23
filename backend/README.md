# TruthLens AI - Deepfake Detection Backend Engine

TruthLens AI is a modular, high-performance, production-ready deepfake detection backend built using **FastAPI** and **TensorFlow**. It employs a transfer learning CNN architecture (supporting **XceptionNet** and a lightweight **MobileNetV2** fallback) to analyze visual facial components, audio-video synchronization discrepancies, and binary metadata anomalies to identify manipulated media.

---

## Key Features

1. **Dual CNN Architectures**:
   - **XceptionNet**: Transfer learning model with custom pooling, dense, and dropout layers. Optimised for maximum accuracy.
   - **MobileNetV2**: Lightweight fallback model optimised for edge deployment, CPU-bound environments, or faster execution.
2. **Robust Preprocessing Pipeline**:
   - Automatic frame sampling and extraction.
   - Haar-cascade face detection, padding adjustments, face cropping, and input normalization to `[-1, 1]`.
   - Batch data preparation helpers for pipeline compatibility.
3. **Grad-CAM Visual Explainability**:
   - Live gradient-based heatmap generation pinpointing regions of high convolutional activations (e.g. eyes, mouth shape anomalies).
   - Cyber-styled forensic bounding-box overlay output.
4. **Multi-modal Forensics**:
   - **Metadata Analysis**: Scan for EXIF tags, missing camera profiles, file edit traces, and binary signatures of popular editing platforms (Photoshop, FFmpeg, etc.).
   - **Audio-Video Lip-Sync Sync Analysis**: Extract audio wav stream, compute windowed RMS energy profiles, track facial Mouth Opening Indexes (MOI) over time, and calculate cross-correlation lag mismatch scoring.
5. **Hackathon-Ready Fallbacks**:
   - Automatically initializes, compiles, and saves untrained architecture graphs if model paths are empty, ensuring a functional, mock-inference endpoint from day one.

---

## Project Structure

```text
backend/
├── app/
│   ├── main.py                 # FastAPI configuration, CORS, and initialization
│   ├── routes/
│   │   ├── predict.py          # /predict-video, /predict-image, and /extract-frames APIs
│   │   ├── heatmap.py          # /heatmap (direct visual JPEG stream)
│   │   ├── metadata.py         # /analyze-metadata API
│   │   └── audio.py            # /audio-sync-analysis API
│   │
│   ├── ai/
│   │   ├── train.py            # Model definitions, generator settings, training logic
│   │   ├── preprocess.py       # Frame extraction, face crops, and normalization
│   │   ├── predict.py          # Frame/image inference pipelines & aggregation logic
│   │   ├── heatmap.py          # Grad-CAM computations and overlay creators
│   │   ├── metadata_analysis.py# EXIF and binary structure scans
│   │   └── audio_sync.py       # Speech energy & mouth opening alignment
│   │
│   ├── models/                 # Model weights directory (creates dynamically)
│   ├── uploads/                # Temporary directory for API file uploads
│   ├── outputs/                # Folder serving static forensic overlays
│   └── utils/
│       ├── config.py           # Configuration environment variables loader
│       └── __init__.py
│
├── requirements.txt            # System dependencies
├── Dockerfile                  # Application Docker container config
├── README.md                   # Setup and usage guide
└── .env.example                # Template configuration values
```

---

## Installation & Setup

### Prerequisites
* Python 3.9, 3.10, or 3.11
* FFmpeg (required for audio extraction in lip-sync checks)
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt-get install ffmpeg`
  - **Windows**: Download binaries and add to system Path.

### Step 1: Clone and Set Up Environment
```bash
# Navigate to the backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy the env template file and modify it if needed:
```bash
cp .env.example .env
```

---

## Dataset Folder Structure

Before starting training, you need to structure your datasets. The preprocess utility splits images into respective folders representing binary classes: `REAL` (0) and `FAKE` (1).

Your datasets should follow this convention:
```text
dataset/
├── train/
│   ├── real/
│   │   ├── face_sample_1.jpg
│   │   └── face_sample_2.jpg
│   └── fake/
│       ├── face_sample_3.jpg
│       └── face_sample_4.jpg
└── validation/ (Optional - ImageDataGenerator can perform split)
```

### Generating Dataset Frames from Raw Videos
Use the helper function in `app/ai/preprocess.py` to extract face crops automatically from raw folders of real/fake videos:
```python
from app.ai.preprocess import prepare_dataset

# Preprocess and extract faces for real videos
prepare_dataset(
    videos_dir="raw_videos/real",
    output_dataset_dir="dataset/train",
    label="real",
    max_frames_per_video=30
)

# Preprocess and extract faces for fake/manipulated videos
prepare_dataset(
    videos_dir="raw_videos/fake",
    output_dataset_dir="dataset/train",
    label="fake",
    max_frames_per_video=30
)
```

---

## Model Training

To trigger training on your structured dataset, use the module function in `app/ai/train.py`:

```python
from app.ai.train import train_model

# Trains the XceptionNet model on our dataset
train_model(
    dataset_dir="dataset/train",
    model_type="xception",
    epochs=15,
    batch_size=32,
    validation_split=0.2,
    output_dir="app/outputs"
)
```

The script will:
1. Build the selected architecture.
2. Initialize data augmentations with a validation split.
3. Configure `EarlyStopping` and `ModelCheckpoint` callbacks.
4. Save the best model automatically under `app/models/xception_deepfake_detector.h5` or `mobilenetv2_deepfake_detector.h5`.
5. Write `classification_report.txt` and `confusion_matrix.png` to the output folder.

---

## Running the Backend

### Development Server (Uvicorn)
To run the server locally with auto-reload enabled:
```bash
python app/main.py
```
Or use the uvicorn command directly:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Access the interactive API documentation at:
* **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Running with Docker
Build the docker image:
```bash
docker build -t truthlens-backend .
```

Run the container:
```bash
docker run -p 8000:8000 truthlens-backend
```

---

## API Documentation Quick Reference

### 1. Health Status
* **GET** `/api/health`
* **Response**: System statuses, TF version, GPU presence, active model files.

### 2. Predict Image
* **POST** `/api/predict-image`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  - `file`: (Image file)
  - `model_type`: `"xception"` or `"mobilenetv2"` (Query Param)
* **Response**: Predict class (`REAL`/`FAKE`), confidence score, number of faces, and a Grad-CAM overlay image URL.

### 3. Predict Video
* **POST** `/api/predict-video`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  - `file`: (Video file)
  - `model_type`: `"xception"` or `"mobilenetv2"` (Query Param)
  - `max_frames`: (Integer, Query Param)
* **Response**: Aggregated video prediction, reality scores, total face-detected frames, and a detailed frame-by-frame timeline array.

### 4. Direct Grad-CAM Heatmap Stream
* **POST** `/api/heatmap`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  - `file`: (Image file)
  - `model_type`: `"xception"` or `"mobilenetv2"` (Query Param)
* **Response**: Directly returns the JPEG binary file of the processed image with the Grad-CAM forensic overlay.

### 5. Audio-Video Lip-Sync Sync Analysis
* **POST** `/api/audio-sync-analysis`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  - `file`: (Video file)
  - `max_frames`: (Integer, Query Param)
* **Response**: Pearson correlation score, estimated speech-to-mouth delay in seconds, mismatch severity score (`0-100`), and frame-by-frame index logs.

### 6. Metadata Forensics
* **POST** `/api/analyze-metadata`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  - `file`: (Image/Video file)
* **Response**: Metadata availability status, software signatures (e.g. Adobe Premiere, FFmpeg, Photoshop), capture dates, and flagged anomalies.
