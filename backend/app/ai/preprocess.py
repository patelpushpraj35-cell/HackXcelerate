import os
import cv2
import numpy as np
from PIL import Image
import logging

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Initialize Haar Cascade Face Detector from OpenCV
# cv2.data.haarcascades contains the path to built-in XML files
HAAR_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)

if face_cascade.empty():
    logger.error("Failed to load Haar Cascade face detector. Face detection will not function properly.")

def extract_frames(video_path: str, max_frames: int = 30, frame_rate: float = None) -> list:
    """
    Extracts frames from a video.
    
    Args:
        video_path (str): Path to the source video.
        max_frames (int): Maximum number of frames to extract.
        frame_rate (float): Extract 1 frame per 'frame_rate' seconds. If None, samples evenly.
        
    Returns:
        list: A list of dicts containing frame indexes and OpenCV BGR images.
    """
    if not os.path.exists(video_path):
        logger.error(f"Video path does not exist: {video_path}")
        return []
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Unable to open video: {video_path}")
        return []
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    if total_frames <= 0 or fps <= 0:
        logger.error(f"Invalid video metadata for {video_path}")
        cap.release()
        return []
        
    duration = total_frames / fps
    logger.info(f"Video loaded: {video_path} | FPS: {fps:.2f} | Frames: {total_frames} | Duration: {duration:.2f}s")
    
    frames_to_extract = []
    
    if frame_rate is not None and frame_rate > 0:
        # Extract at a specific time interval (e.g., every 0.5s)
        interval = int(fps * frame_rate)
        if interval <= 0:
            interval = 1
        for f_idx in range(0, total_frames, interval):
            if len(frames_to_extract) >= max_frames:
                break
            frames_to_extract.append(f_idx)
    else:
        # Evenly distribute the frames to extract
        if total_frames <= max_frames:
            frames_to_extract = list(range(total_frames))
        else:
            frames_to_extract = [int(i * total_frames / max_frames) for i in range(max_frames)]
            
    extracted = []
    for f_idx in frames_to_extract:
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        success, frame = cap.read()
        if not success:
            break
        # Save both index and frame
        extracted.append({
            "frame_idx": f_idx,
            "timestamp": f_idx / fps,
            "image": frame
        })
        
    cap.release()
    logger.info(f"Successfully extracted {len(extracted)} frames from {video_path}")
    return extracted

def detect_faces(image: np.ndarray, scale_factor: float = 1.1, min_neighbors: int = 5) -> list:
    """
    Detects faces in an image using OpenCV's Haar Cascade classifier.
    
    Args:
        image (np.ndarray): Image in BGR or Grayscale format.
        scale_factor (float): Parameter specifying how much the image size is reduced at each image scale.
        min_neighbors (float): Parameter specifying how many neighbors each candidate rectangle should have to retain it.
        
    Returns:
        list: List of bounding boxes [x, y, w, h] for detected faces.
    """
    if image is None:
        return []
        
    # Convert to grayscale for Haar Cascade
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=scale_factor,
        minNeighbors=min_neighbors,
        minSize=(30, 30)
    )
    
    # Convert numpy format to list of standard Python integers
    return [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces]

def crop_face(image: np.ndarray, bbox: list, padding_ratio: float = 0.15) -> np.ndarray:
    """
    Crops a detected face from the image, adding padding for contextual facial features.
    
    Args:
        image (np.ndarray): Original image (BGR).
        bbox (list): Bounding box of the face [x, y, w, h].
        padding_ratio (float): Percentage of width/height to add as padding.
        
    Returns:
        np.ndarray: Cropped face image, or None if cropping fails.
    """
    if image is None or not bbox:
        return None
        
    x, y, w, h = bbox
    img_h, img_w = image.shape[:2]
    
    # Calculate padding
    pad_w = int(w * padding_ratio)
    pad_h = int(h * padding_ratio)
    
    # Add padding and ensure boundaries are within image
    x_start = max(0, x - pad_w)
    y_start = max(0, y - pad_h)
    x_end = min(img_w, x + w + pad_w)
    y_end = min(img_h, y + h + pad_h)
    
    # Crop
    cropped = image[y_start:y_end, x_start:x_end]
    
    # Check if cropped image is valid
    if cropped.size == 0:
        return None
        
    return cropped

def preprocess_face(face_image: np.ndarray, target_size: tuple = (224, 224), model_type: str = 'xception') -> np.ndarray:
    """
    Resizes and normalizes the cropped face for neural network input.
    
    Args:
        face_image (np.ndarray): Cropped face image (BGR).
        target_size (tuple): Target output resolution (height, width).
        model_type (str): CNN architecture target ('xception' or 'mobilenetv2').
        
    Returns:
        np.ndarray: Preprocessed image tensor, ready for inference (shape: [1, H, W, C]).
    """
    if face_image is None or face_image.size == 0:
        return None
        
    # Convert BGR (OpenCV default) to RGB (TensorFlow/PIL default)
    rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
    
    # Resize image
    resized = cv2.resize(rgb_image, target_size, interpolation=cv2.INTER_CUBIC)
    
    # Convert to float32
    img_array = resized.astype(np.float32)
    
    # Normalize values to [-1, 1] as expected by standard Keras Xception/MobileNetV2 preprocess_input
    # Formula: (x / 127.5) - 1.0
    normalized = (img_array / 127.5) - 1.0
    
    # Add batch dimension: (H, W, C) -> (1, H, W, C)
    batch_tensor = np.expand_dims(normalized, axis=0)
    
    return batch_tensor

def prepare_dataset(videos_dir: str, output_dataset_dir: str, label: str, max_frames_per_video: int = 30):
    """
    Utility function to process a directory of videos, extract faces, and save them.
    This structures the dataset for Keras ImageDataGenerator training.
    
    Args:
        videos_dir (str): Directory containing video files.
        output_dataset_dir (str): Destination parent directory (e.g., 'dataset/train').
        label (str): Subfolder name corresponding to target class ('real' or 'fake').
        max_frames_per_video (int): Maximum frames to process per video.
    """
    target_class_dir = os.path.join(output_dataset_dir, label)
    os.makedirs(target_class_dir, exist_ok=True)
    
    video_files = [f for f in os.listdir(videos_dir) if f.lower().endswith(('.mp4', '.avi', '.mov', '.mkv'))]
    logger.info(f"Found {len(video_files)} videos in {videos_dir}. Processing class '{label}'...")
    
    face_counter = 0
    for v_idx, video_file in enumerate(video_files):
        video_path = os.path.join(videos_dir, video_file)
        logger.info(f"[{v_idx+1}/{len(video_files)}] Processing: {video_file}")
        
        # Extract frames
        frames = extract_frames(video_path, max_frames=max_frames_per_video)
        
        for frame_data in frames:
            frame_img = frame_data["image"]
            frame_num = frame_data["frame_idx"]
            
            # Detect faces
            faces = detect_faces(frame_img)
            
            for f_idx, bbox in enumerate(faces):
                cropped = crop_face(frame_img, bbox)
                if cropped is not None:
                    # Resize to standard size (we save as raw images, train generator handles rescaling)
                    resized = cv2.resize(cropped, (224, 224), interpolation=cv2.INTER_CUBIC)
                    
                    # Generate unique file name
                    video_name = os.path.splitext(video_file)[0]
                    output_filename = f"{video_name}_fr{frame_num}_face{f_idx}.jpg"
                    output_path = os.path.join(target_class_dir, output_filename)
                    
                    # Save face image
                    cv2.imwrite(output_path, resized)
                    face_counter += 1
                    
    logger.info(f"Dataset preparation complete for class '{label}'. Saved {face_counter} face images.")
