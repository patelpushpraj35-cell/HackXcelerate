import os
import cv2
import numpy as np
import tensorflow as tf
import logging

# Import preprocessing utilities and model builders
from app.ai.preprocess import extract_frames, detect_faces, crop_face, preprocess_face
from app.ai.train import build_xception_model, build_mobilenetv2_model
from app.utils.config import settings

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Global model cache to avoid reloading model on every request
_model_cache = {}

def load_deepfake_model(model_path: str = None, model_type: str = None) -> tf.keras.Model:
    """
    Loads a trained Keras H5 model. Cache the model in memory.
    If the model doesn't exist, builds a new one and saves it as a hackathon fallback.
    
    Args:
        model_path (str): Path to the H5 file.
        model_type (str): 'xception' or 'mobilenetv2'.
        
    Returns:
        tf.keras.Model: The loaded or newly initialized model.
    """
    global _model_cache
    
    # Use defaults from settings if not provided
    if model_type is None:
        model_type = settings.DEFAULT_MODEL_TYPE
        
    if model_path is None:
        model_path = settings.MODEL_PATH_XCEPTION if model_type == 'xception' else settings.MODEL_PATH_MOBILENET

    cache_key = f"{model_type}_{model_path}"
    if cache_key in _model_cache:
        logger.info(f"Retrieving cached model: {cache_key}")
        return _model_cache[cache_key]

    if not os.path.exists(model_path):
        logger.warning(f"Model file not found at {model_path}. "
                       f"Generating a freshly initialized {model_type} model as a fallback...")
        
        # Build corresponding architecture
        if model_type.lower() == 'xception':
            model = build_xception_model()
        elif model_type.lower() == 'mobilenetv2':
            model = build_mobilenetv2_model()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
            
        # Create directory and save model weights
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)
        logger.info(f"Fresh model saved to {model_path}")
    else:
        logger.info(f"Loading model weights from {model_path}...")
        try:
            model = tf.keras.models.load_model(model_path)
        except Exception as e:
            logger.error(f"Error loading model from {model_path}: {str(e)}. Rebuilding fresh model.")
            if model_type.lower() == 'xception':
                model = build_xception_model()
            else:
                model = build_mobilenetv2_model()
            model.save(model_path)

    # Cache the model
    _model_cache[cache_key] = model
    return model

def predict_single_face(face_img: np.ndarray, model: tf.keras.Model, model_type: str = 'xception') -> float:
    """
    Predicts fake probability for a single cropped face image.
    
    Args:
        face_img (np.ndarray): Cropped face (BGR format).
        model (tf.keras.Model): Loaded TF model.
        model_type (str): Model architecture name.
        
    Returns:
        float: Probability that the face is FAKE (0.0 to 1.0).
    """
    # Preprocess image (BGR to RGB -> Resize -> Scale to [-1, 1] -> Expand dim)
    target_size = (299, 299) if model_type == 'xception' else (224, 224)
    tensor = preprocess_face(face_img, target_size=target_size, model_type=model_type)
    if tensor is None:
        return 0.0
        
    # Run prediction
    prediction = model.predict(tensor, verbose=0)
    fake_prob = float(prediction[0][0])
    
    return fake_prob

def predict_image(image_path_or_array, model: tf.keras.Model, model_type: str = 'xception') -> dict:
    """
    Performs deepfake prediction on an image. Detects face(s), predicts, and returns detailed dictionary.
    
    Args:
        image_path_or_array (str or np.ndarray): Image file path or pre-loaded BGR image.
        model (tf.keras.Model): Model instance.
        model_type (str): Model type name.
        
    Returns:
        dict: Result details containing classification, confidence, faces details, and metadata.
    """
    # Load image if a string path is passed
    if isinstance(image_path_or_array, str):
        if not os.path.exists(image_path_or_array):
            raise FileNotFoundError(f"Image not found at path: {image_path_or_array}")
        image = cv2.imread(image_path_or_array)
    else:
        image = image_path_or_array
        
    if image is None:
        raise ValueError("Failed to load or read input image.")
        
    # 1. Detect faces
    faces = detect_faces(image)
    
    faces_results = []
    
    if len(faces) == 0:
        # Fallback: predict on the center crop of the image if no face detected
        h, w = image.shape[:2]
        crop_size = min(h, w)
        x_start = (w - crop_size) // 2
        y_start = (h - crop_size) // 2
        fallback_crop = image[y_start:y_start+crop_size, x_start:x_start+crop_size]
        
        fake_prob = predict_single_face(fallback_crop, model, model_type)
        faces_results.append({
            "box": [x_start, y_start, crop_size, crop_size],
            "fake_probability": fake_prob,
            "label": "FAKE" if fake_prob > 0.5 else "REAL",
            "is_fallback": True
        })
        face_detected = False
    else:
        # Run predictions on all detected faces
        for i, box in enumerate(faces):
            cropped = crop_face(image, box)
            if cropped is not None:
                fake_prob = predict_single_face(cropped, model, model_type)
                faces_results.append({
                    "box": box,
                    "fake_probability": fake_prob,
                    "label": "FAKE" if fake_prob > 0.5 else "REAL",
                    "is_fallback": False
                })
        face_detected = True
        
    # Aggregate scores (use the max fake probability for a conservative check, i.e. if any face is fake, the image is suspicious)
    if len(faces_results) > 0:
        max_fake_prob = max([f["fake_probability"] for f in faces_results])
        avg_fake_prob = sum([f["fake_probability"] for f in faces_results]) / len(faces_results)
    else:
        max_fake_prob = 0.5
        avg_fake_prob = 0.5
        
    # Standard classification decision (using average or max, max is safer for deepfakes)
    final_fake_prob = max_fake_prob
    classification = "FAKE" if final_fake_prob > 0.5 else "REAL"
    
    # Calculate confidence and reality scores
    confidence = final_fake_prob if classification == "FAKE" else (1.0 - final_fake_prob)
    reality_score = (1.0 - final_fake_prob) * 100
    
    return {
        "classification": classification,
        "reality_score": round(reality_score, 2),
        "confidence": round(confidence, 4),
        "face_detected": face_detected,
        "num_faces": len(faces),
        "faces_details": faces_results
    }

def predict_video(video_path: str, model: tf.keras.Model, model_type: str = 'xception', 
                  max_frames: int = 30) -> dict:
    """
    Performs deepfake prediction on a video by analyzing frames and aggregating results.
    
    Args:
        video_path (str): Path to the video file.
        model (tf.keras.Model): Loaded Keras model.
        model_type (str): 'xception' or 'mobilenetv2'.
        max_frames (int): Max frames to analyze.
        
    Returns:
        dict: Compiled classification and timeline.
    """
    # 1. Extract frames
    frames_data = extract_frames(video_path, max_frames=max_frames)
    if not frames_data:
        return {
            "classification": "UNKNOWN",
            "reality_score": 0.0,
            "confidence": 0.0,
            "error": "Failed to extract frames from video"
        }
        
    frame_results = []
    fake_probabilities = []
    faces_detected_count = 0
    
    # 2. Predict frame by frame
    for frame_info in frames_data:
        frame_img = frame_info["image"]
        frame_idx = frame_info["frame_idx"]
        timestamp = frame_info["timestamp"]
        
        # Detect faces in frame
        faces = detect_faces(frame_img)
        
        frame_fake_prob = 0.0
        frame_faces = []
        
        if len(faces) > 0:
            faces_detected_count += 1
            # Predict on each face found in this frame
            for box in faces:
                cropped = crop_face(frame_img, box)
                if cropped is not None:
                    prob = predict_single_face(cropped, model, model_type)
                    frame_faces.append({
                        "box": box,
                        "fake_probability": prob
                    })
            # Take max probability among faces on the frame
            frame_fake_prob = max([f["fake_probability"] for f in frame_faces])
            frame_results.append({
                "frame_idx": frame_idx,
                "timestamp": round(timestamp, 2),
                "face_detected": True,
                "fake_probability": frame_fake_prob,
                "num_faces": len(faces),
                "faces": frame_faces
            })
            fake_probabilities.append(frame_fake_prob)
        else:
            # No face detected in this frame, we track it but skip for classification score
            frame_results.append({
                "frame_idx": frame_idx,
                "timestamp": round(timestamp, 2),
                "face_detected": False,
                "fake_probability": 0.0,
                "num_faces": 0,
                "faces": []
            })
            
    # 3. Aggregate Frame Predictions
    if len(fake_probabilities) > 0:
        # Calculate scores
        avg_fake_prob = sum(fake_probabilities) / len(fake_probabilities)
        max_fake_prob = max(fake_probabilities)
        
        # If at least 15% of face frames are highly suspicious, classify video as FAKE
        suspicious_frames = sum(1 for p in fake_probabilities if p > 0.6)
        suspicious_ratio = suspicious_frames / len(fake_probabilities)
        
        # Aggregate logic: weight average + peak anomaly
        # In a real environment, deepfakes might contain only a few manipulated clips.
        # So we combine average and maximum probabilities.
        aggregated_fake_score = (avg_fake_prob * 0.6) + (max_fake_prob * 0.4)
        
        if suspicious_ratio >= 0.15:
            classification = "FAKE"
            aggregated_fake_score = max(aggregated_fake_score, 0.6) # boost fake score
        else:
            classification = "FAKE" if aggregated_fake_score > 0.5 else "REAL"
    else:
        # Fallback if no faces detected in the entire video (predict on center crops of frames)
        fallback_probs = []
        for frame_info in frames_data:
            frame_img = frame_info["image"]
            h, w = frame_img.shape[:2]
            crop_size = min(h, w)
            x_start = (w - crop_size) // 2
            y_start = (h - crop_size) // 2
            fallback_crop = frame_img[y_start:y_start+crop_size, x_start:x_start+crop_size]
            prob = predict_single_face(fallback_crop, model, model_type)
            fallback_probs.append(prob)
            
        avg_fake_prob = sum(fallback_probs) / len(fallback_probs)
        aggregated_fake_score = avg_fake_prob
        classification = "FAKE" if aggregated_fake_score > 0.5 else "REAL"
        
    confidence = aggregated_fake_score if classification == "FAKE" else (1.0 - aggregated_fake_score)
    reality_score = (1.0 - aggregated_fake_score) * 100
    
    return {
        "classification": classification,
        "reality_score": round(reality_score, 2),
        "confidence": round(confidence, 4),
        "total_frames_analyzed": len(frames_data),
        "frames_with_faces": faces_detected_count,
        "average_fake_probability": round(avg_fake_prob if 'avg_fake_prob' in locals() else aggregated_fake_score, 4),
        "max_fake_probability": round(max(fake_probabilities) if len(fake_probabilities) > 0 else aggregated_fake_score, 4),
        "timeline": frame_results
    }
