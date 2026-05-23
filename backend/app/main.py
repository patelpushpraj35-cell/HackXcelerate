import os
import tensorflow as tf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.utils.config import settings

# Import API Routers
from app.routes.predict import router as predict_router
from app.routes.heatmap import router as heatmap_router
from app.routes.metadata import router as metadata_router
from app.routes.audio import router as audio_router
from app.routes.analytics import router as analytics_router

app = FastAPI(
    title="TruthLens AI - Deepfake Detection Backend",
    description="CNN-powered deep learning backend for detecting facial and metadata manipulations in images and videos.",
    version="1.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
# Allows frontend applications to query our APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated output visual artifacts (heatmaps, extracted frames) statically
# This allows the frontend to fetch and display the generated images directly
app.mount("/outputs", StaticFiles(directory=settings.OUTPUT_DIR), name="outputs")

# Register APIRouters
app.include_router(predict_router)
app.include_router(heatmap_router)
app.include_router(metadata_router)
app.include_router(audio_router)
app.include_router(analytics_router)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """
    Diagnostic endpoint that reports the system health,
    active deepfake models, and hardware capabilities (GPU detection).
    """
    # Check GPU availability
    gpus = tf.config.list_physical_devices('GPU')
    gpu_available = len(gpus) > 0
    gpu_details = [gpu.name for gpu in gpus] if gpu_available else []
    
    # Check if necessary models directory and configuration exist
    xception_exists = os.path.exists(settings.MODEL_PATH_XCEPTION)
    mobilenet_exists = os.path.exists(settings.MODEL_PATH_MOBILENET)
    
    return {
        "status": "healthy",
        "system": {
            "tensorflow_version": tf.__version__,
            "gpu_available": gpu_available,
            "detected_gpus": gpu_details,
            "host": settings.HOST,
            "port": settings.PORT,
            "debug_mode": settings.DEBUG
        },
        "models": {
            "default_model_type": settings.DEFAULT_MODEL_TYPE,
            "xception_model_loaded_on_disk": xception_exists,
            "mobilenetv2_model_loaded_on_disk": mobilenet_exists,
            "model_paths": {
                "xception": settings.MODEL_PATH_XCEPTION,
                "mobilenetv2": settings.MODEL_PATH_MOBILENET
            }
        },
        "storage": {
            "uploads_directory_exists": os.path.exists(settings.UPLOAD_DIR),
            "outputs_directory_exists": os.path.exists(settings.OUTPUT_DIR)
        }
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to TruthLens AI Deepfake Detection API Engine.",
        "documentation": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
