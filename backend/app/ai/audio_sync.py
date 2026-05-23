import os
import wave
import subprocess
import numpy as np
import cv2
import logging
try:
    from moviepy import VideoFileClip
except ImportError:
    from moviepy.editor import VideoFileClip

from app.ai.preprocess import extract_frames, detect_faces, crop_face
from app.utils.config import settings

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def extract_audio_from_video(video_path: str, output_wav_path: str) -> bool:
    """
    Extracts the audio track from a video file and saves it as a WAV file.
    Uses MoviePy with a fallback to direct ffmpeg subprocess.
    
    Args:
        video_path (str): Path to source video file.
        output_wav_path (str): Target WAV audio file destination.
        
    Returns:
        bool: True if extraction succeeded, False otherwise.
    """
    if not os.path.exists(video_path):
        logger.error(f"Video file does not exist: {video_path}")
        return False
        
    # Attempt MoviePy extraction
    try:
        logger.info(f"Extracting audio using MoviePy: {video_path}")
        video_clip = VideoFileClip(video_path)
        if video_clip.audio is not None:
            # Write audio to 16kHz, mono WAV
            video_clip.audio.write_audiofile(
                output_wav_path,
                fps=16000,
                nbytes=2,
                codec='pcm_s16le',
                ffmpeg_params=["-ac", "1"],
                logger=None
            )
            video_clip.close()
            logger.info("Audio extracted successfully using MoviePy.")
            return True
        else:
            video_clip.close()
            logger.warning("No audio track detected in video (MoviePy).")
            return False
    except Exception as e:
        logger.warning(f"MoviePy audio extraction failed: {str(e)}. Attempting FFmpeg subprocess fallback...")
        
    # FFmpeg Subprocess Fallback (in case MoviePy/decorator dependencies are missing)
    try:
        command = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_wav_path
        ]
        # Run command quietly
        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0 and os.path.exists(output_wav_path) and os.path.getsize(output_wav_path) > 0:
            logger.info("Audio extracted successfully using FFmpeg subprocess.")
            return True
        else:
            logger.warning("FFmpeg audio extraction failed (no audio track or ffmpeg not installed).")
            return False
    except Exception as ex:
        logger.error(f"Both MoviePy and FFmpeg audio extraction failed: {str(ex)}")
        return False

def compute_audio_energy_profile(wav_path: str, timestamps: list, window_ms: int = 150) -> list:
    """
    Computes the RMS energy of the audio track in a window around each video frame timestamp.
    
    Args:
        wav_path (str): Path to WAV audio file (16kHz, 16-bit mono).
        timestamps (list): Float timestamps of the video frames.
        window_ms (int): Analysis window duration in milliseconds.
        
    Returns:
        list: Normalised audio energy values corresponding to each timestamp.
    """
    if not os.path.exists(wav_path):
        return [0.0] * len(timestamps)
        
    try:
        with wave.open(wav_path, 'rb') as w:
            sample_rate = w.getframerate()
            num_frames = w.getnframes()
            audio_bytes = w.readframes(num_frames)
            
        # Convert bytes to numpy 16-bit integers
        audio_signal = np.frombuffer(audio_bytes, dtype=np.int16)
        
        energies = []
        for ts in timestamps:
            # Map timestamp to sample index
            center_sample = int(ts * sample_rate)
            window_size = int((window_ms / 1000) * sample_rate)
            
            start_sample = max(0, center_sample - window_size // 2)
            end_sample = min(len(audio_signal), center_sample + window_size // 2)
            
            if start_sample >= end_sample:
                energies.append(0.0)
                continue
                
            # Compute Root Mean Square (RMS) energy
            segment = audio_signal[start_sample:end_sample].astype(np.float32)
            rms = np.sqrt(np.mean(segment**2)) if len(segment) > 0 else 0.0
            energies.append(rms)
            
        # Normalize energies to [0, 1] range
        max_energy = max(energies) if len(energies) > 0 else 0.0
        if max_energy > 0.0:
            normalized_energies = [float(e / max_energy) for e in energies]
        else:
            normalized_energies = [0.0] * len(timestamps)
            
        return normalized_energies
        
    except Exception as e:
        logger.error(f"Error computing audio profile: {str(e)}")
        return [0.0] * len(timestamps)

def estimate_mouth_opening(frame_bgr: np.ndarray, face_box: list) -> float:
    """
    Estimates the mouth opening level using computer vision heuristics on the mouth region.
    Looks for the dark lip cavity in the lower face area.
    
    Args:
        frame_bgr (np.ndarray): Original frame image.
        face_box (list): Bounding box [x, y, w, h] of the face.
        
    Returns:
        float: Mouth Opening Index (MOI), normalized value.
    """
    if frame_bgr is None or not face_box:
        return 0.0
        
    img_h, img_w = frame_bgr.shape[:2]
    fx, fy, fw, fh = face_box
    
    # 1. Define mouth ROI (lower-middle section of face bounding box)
    mx = fx + int(fw * 0.28)
    my = fy + int(fh * 0.65)
    mw = int(fw * 0.44)
    mh = int(fh * 0.22)
    
    # Ensure coordinates are within boundary limits
    mx_start = max(0, mx)
    my_start = max(0, my)
    mx_end = min(img_w, mx + mw)
    my_end = min(img_h, my + mh)
    
    mouth_roi = frame_bgr[my_start:my_end, mx_start:mx_end]
    
    if mouth_roi.size == 0:
        return 0.0
        
    # Convert to grayscale
    gray_mouth = cv2.cvtColor(mouth_roi, cv2.COLOR_BGR2GRAY)
    
    # Smooth to reduce noise
    blurred = cv2.GaussianBlur(gray_mouth, (5, 5), 0)
    
    # Find dark regions (representing the inner mouth cavity)
    # Thresholding: we segment very dark pixels (usually < 40 in gray scale)
    # In an open mouth, the inner mouth is dark shadow. In a closed mouth, skin/lip is brighter.
    _, thresh = cv2.threshold(blurred, 42, 255, cv2.THRESH_BINARY_INV)
    
    # Calculate ratio of dark pixels to total pixels in the mouth ROI
    dark_pixels = np.sum(thresh == 255)
    total_pixels = thresh.size
    
    moi = float(dark_pixels / total_pixels) if total_pixels > 0 else 0.0
    return moi

def analyze_audio_video_sync(video_path: str, max_frames: int = 30) -> dict:
    """
    Main evaluation pipeline. Compares structural mouth opening signals 
    against audio amplitude profiles to measure sync validation.
    
    Args:
        video_path (str): Path to source video file.
        max_frames (int): Sample frames to process.
        
    Returns:
        dict: Sync report containing metrics and alignment details.
    """
    report = {
        "audio_detected": False,
        "sync_score": 100.0,            # 100 is perfect sync, 0 is full mismatch
        "mismatch_detected": False,
        "mismatch_score": 0.0,          # Out of sync risk level [0, 100]
        "correlation_coefficient": 1.0,
        "estimated_lag_seconds": 0.0,
        "details": []
    }
    
    # 1. Setup temporary audio file path
    filename = f"temp_audio_{os.path.basename(video_path)}.wav"
    temp_wav_path = os.path.join(settings.OUTPUT_DIR, filename)
    
    # 2. Extract audio
    audio_extracted = extract_audio_from_video(video_path, temp_wav_path)
    
    # 3. Extract frames and timestamps
    frames_data = extract_frames(video_path, max_frames=max_frames)
    if not frames_data:
        # Clean up audio if existed
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
        return {"error": "Failed to analyze video streams"}
        
    timestamps = [f["timestamp"] for f in frames_data]
    
    # 4. Get mouth opening values (vision signal)
    mouth_openings = []
    analyzed_timestamps = []
    
    for frame_info in frames_data:
        frame_img = frame_info["image"]
        ts = frame_info["timestamp"]
        
        # Detect faces
        faces = detect_faces(frame_img)
        if len(faces) > 0:
            # Sort by face size and take largest
            faces = sorted(faces, key=lambda b: b[2] * b[3], reverse=True)
            moi = estimate_mouth_opening(frame_img, faces[0])
            mouth_openings.append(moi)
            analyzed_timestamps.append(ts)
        else:
            # If no face is detected, we ignore this timestamp to avoid dirty statistics
            pass
            
    # If too few frames with faces, we cannot run correlation
    if len(mouth_openings) < 10:
        logger.warning("Too few face-detected frames to perform audio-video sync analysis.")
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
        return {
            "audio_detected": audio_extracted,
            "sync_score": 100.0,
            "mismatch_detected": False,
            "mismatch_score": 0.0,
            "correlation_coefficient": 1.0,
            "message": "Insufficient face track frames to cross-correlate"
        }
        
    # 5. Get audio energy values (audio signal) corresponding to face-detected timestamps
    audio_energies = [0.0] * len(analyzed_timestamps)
    if audio_extracted:
        report["audio_detected"] = True
        audio_energies = compute_audio_energy_profile(temp_wav_path, analyzed_timestamps)
        
    # Clean up temporary audio file
    if os.path.exists(temp_wav_path):
        try:
            os.remove(temp_wav_path)
        except Exception as e:
            logger.warning(f"Could not delete temp WAV file: {str(e)}")

    # If audio wasn't extracted, sync is moot
    if not audio_extracted:
        return {
            "audio_detected": False,
            "sync_score": 100.0,
            "mismatch_detected": False,
            "mismatch_score": 0.0,
            "correlation_coefficient": 1.0,
            "message": "No audio stream available for synchronization analysis"
        }
        
    # Normalize mouth opening values to [0, 1] for correlation
    max_moi = max(mouth_openings) if len(mouth_openings) > 0 else 0.0
    normalized_moi = [float(m / max_moi) if max_moi > 0.0 else 0.0 for m in mouth_openings]
    
    # 6. Calculate correlation coefficient (Pearson correlation)
    # High correlation (> 0.4) means audio energy matches lip opening closely.
    # Lower correlation (< 0.1) suggests voice speaks while lips are closed or vice versa (dubbed/deepfaked).
    try:
        corr_matrix = np.corrcoef(normalized_moi, audio_energies)
        # Handle nan cases (if standard deviation is 0)
        if np.isnan(corr_matrix).any():
            corr = 0.0
        else:
            corr = float(corr_matrix[0, 1])
    except Exception as e:
        logger.error(f"Error calculating Pearson correlation: {str(e)}")
        corr = 0.0
        
    # 7. Cross correlation lag estimation
    # Shift mouth opening signal relative to audio and find peak correlation offset
    try:
        # Standardize signals
        vision_std = normalized_moi - np.mean(normalized_moi)
        audio_std = audio_energies - np.mean(audio_energies)
        
        # Calculate cross-correlation
        cross_corr = np.correlate(vision_std, audio_std, mode='full')
        lags = np.arange(-len(vision_std) + 1, len(vision_std))
        
        peak_idx = np.argmax(cross_corr)
        peak_lag_frames = lags[peak_idx]
        
        # Estimate lag in seconds
        avg_fps = len(frames_data) / (timestamps[-1] - timestamps[0]) if len(timestamps) > 1 else 30.0
        lag_seconds = float(peak_lag_frames / avg_fps)
    except Exception as e:
        logger.error(f"Error calculating lag: {str(e)}")
        lag_seconds = 0.0
        
    # 8. Score calculation
    # Define mismatch probability based on low correlation and high lag
    # Perfect correlation (1.0) with 0 lag gives 0 mismatch.
    # Negative correlation or lag > 0.3s gives higher mismatch score.
    mismatch_score = 0.0
    
    # Mismatch based on correlation: lower correlation = higher mismatch
    if corr < 0.35:
        mismatch_score += (0.35 - corr) * 100  # max 135 points
        
    # Mismatch based on lag: lag above 0.25 seconds is noticeable
    abs_lag = abs(lag_seconds)
    if abs_lag > 0.25:
        mismatch_score += min((abs_lag - 0.25) * 120, 50.0) # max 50 points
        
    # Clip mismatch score to [0.0, 100.0]
    mismatch_score = float(np.clip(mismatch_score, 0.0, 100.0))
    sync_score = float(100.0 - mismatch_score)
    
    report["sync_score"] = round(sync_score, 2)
    report["mismatch_score"] = round(mismatch_score, 2)
    report["mismatch_detected"] = mismatch_score > 40.0
    report["correlation_coefficient"] = round(corr, 4)
    report["estimated_lag_seconds"] = round(lag_seconds, 3)
    
    # Build detailed timeline values
    for i in range(len(analyzed_timestamps)):
        report["details"].append({
            "timestamp": round(analyzed_timestamps[i], 2),
            "mouth_opening_index": round(normalized_moi[i], 4),
            "audio_energy_index": round(audio_energies[i], 4)
        })
        
    return report
