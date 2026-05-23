import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    # Server configuration
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Directory configuration
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    OUTPUT_DIR: str = os.path.join(BASE_DIR, "outputs")
    MODEL_DIR: str = os.path.join(BASE_DIR, "models")

    # Default Model Configuration
    DEFAULT_MODEL_TYPE: str = os.getenv("DEFAULT_MODEL_TYPE", "xception")
    MODEL_PATH_XCEPTION: str = os.path.join(MODEL_DIR, "xception_deepfake_detector.h5")
    MODEL_PATH_MOBILENET: str = os.path.join(MODEL_DIR, "mobilenetv2_deepfake_detector.h5")

    # Preprocessing Parameters
    FRAME_RATE_FPS: int = int(os.getenv("FRAME_RATE_FPS", 2))
    MAX_FRAMES_PER_VIDEO: int = int(os.getenv("MAX_FRAMES_PER_VIDEO", 30))
    FACE_DETECTION_MIN_CONFIDENCE: float = float(os.getenv("FACE_DETECTION_MIN_CONFIDENCE", 0.5))
    IMAGE_SIZE: int = int(os.getenv("IMAGE_SIZE", 224))

    # CORS settings
    ALLOWED_ORIGINS: list = ["*"]  # In production, specify exact domains

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.MODEL_DIR]:
    os.makedirs(directory, exist_ok=True)
