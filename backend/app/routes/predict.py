import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, BackgroundTasks
from app.utils.config import settings
from app.ai.predict import load_deepfake_model, predict_image, predict_video
from app.utils.db import save_scan
from app.ai.preprocess import extract_frames
from app.ai.heatmap import generate_and_save_heatmap
import cv2

router = APIRouter(prefix="/api", tags=["Prediction"])

# Helper to clean up files in background tasks
def delete_temp_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        # Log error quietly
        pass

@router.post("/predict-image")
async def api_predict_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_type: str = Query("xception", description="Model architecture: 'xception' or 'mobilenetv2'")
):
    """
    Accepts an uploaded image, runs face detection, runs deepfake classification 
    (REAL or FAKE), and generates a Grad-CAM explainability heatmap.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    # Create a unique filename to prevent collisions
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_filename = f"{file_id}{ext}"
    temp_file_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    # Save the file locally
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {str(e)}")

    try:
        # Load cached model
        model = load_deepfake_model(model_type=model_type)
        
        # Run prediction
        prediction_results = predict_image(temp_file_path, model, model_type)
        
        # Generate Grad-CAM Heatmap overlay
        heatmap_filename = f"heatmap_{file_id}.jpg"
        heatmap_path = os.path.join(settings.OUTPUT_DIR, heatmap_filename)
        generate_and_save_heatmap(temp_file_path, model, model_type, heatmap_path)
        
        # Construct static URL for the generated heatmap image
        # Assuming FastAPI mounts output directory under '/static-outputs'
        heatmap_url = f"/outputs/{heatmap_filename}"
        
        # Save to database
        scan_id = file_id
        verdict = "MANIPULATED" if prediction_results["classification"] == "FAKE" else "AUTHENTIC"
        reality_score = prediction_results["reality_score"]
        threat_level = "CRITICAL" if reality_score < 30 else "HIGH" if reality_score < 60 else "MEDIUM" if reality_score < 85 else "LOW"
        confidence = prediction_results["confidence"]
        
        payload = {
            "success": True,
            "scan_id": scan_id,
            "filename": file.filename,
            "prediction": prediction_results["classification"],
            "reality_score": reality_score,
            "confidence": confidence,
            "face_detected": prediction_results["face_detected"],
            "num_faces_detected": prediction_results["num_faces"],
            "faces_breakdown": prediction_results["faces_details"],
            "heatmap_url": heatmap_url,
            "verdict": verdict,
            "threat_level": threat_level
        }
        save_scan(scan_id, file.filename, verdict, threat_level, reality_score, confidence, payload)
        
        # Return response
        return payload
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
        
    finally:
        # Schedule cleanup of the uploaded image
        background_tasks.add_task(delete_temp_file, temp_file_path)

@router.post("/predict-video")
async def api_predict_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_type: str = Query("xception", description="Model architecture: 'xception' or 'mobilenetv2'"),
    max_frames: int = Query(settings.MAX_FRAMES_PER_VIDEO, description="Max frames to analyze from the video")
):
    """
    Accepts an uploaded video, extracts sampled frames, runs face detection, 
    evaluates deepfake scores on all detected faces, and returns an aggregated classification verdict.
    """
    if not file.content_type.startswith("video/"):
         raise HTTPException(status_code=400, detail="Uploaded file must be a video.")
         
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_filename = f"{file_id}{ext}"
    temp_file_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")
        
    try:
        # Load cached model
        model = load_deepfake_model(model_type=model_type)
        
        # Run prediction pipeline
        results = predict_video(temp_file_path, model, model_type, max_frames=max_frames)
        
        # Save to database
        scan_id = file_id
        verdict = "MANIPULATED" if results.get("classification") == "FAKE" else "AUTHENTIC"
        reality_score = results.get("reality_score", 0.0)
        threat_level = "CRITICAL" if reality_score < 30 else "HIGH" if reality_score < 60 else "MEDIUM" if reality_score < 85 else "LOW"
        confidence = results.get("confidence", 0.0)
        
        payload = {
            "success": True,
            "scan_id": scan_id,
            "filename": file.filename,
            "prediction": results.get("classification"),
            "reality_score": reality_score,
            "confidence": confidence,
            "total_frames_analyzed": results.get("total_frames_analyzed"),
            "frames_with_faces": results.get("frames_with_faces"),
            "average_fake_probability": results.get("average_fake_probability"),
            "max_fake_probability": results.get("max_fake_probability"),
            "timeline": results.get("timeline"),
            "verdict": verdict,
            "threat_level": threat_level
        }
        save_scan(scan_id, file.filename, verdict, threat_level, reality_score, confidence, payload)
        
        return payload
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
        
    finally:
        background_tasks.add_task(delete_temp_file, temp_file_path)

@router.post("/extract-frames")
async def api_extract_frames(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    max_frames: int = Query(10, description="Number of frames to extract")
):
    """
    Utility endpoint to extract and save frames from an uploaded video.
    Returns static URLs to access the extracted frame image files.
    """
    if not file.content_type.startswith("video/"):
         raise HTTPException(status_code=400, detail="Uploaded file must be a video.")
         
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_filename = f"{file_id}{ext}"
    temp_file_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")
        
    try:
        # Extract frames
        frames = extract_frames(temp_file_path, max_frames=max_frames)
        
        # Create output directory for this extract batch
        batch_dir_name = f"extract_{file_id}"
        batch_dir_path = os.path.join(settings.OUTPUT_DIR, batch_dir_name)
        os.makedirs(batch_dir_path, exist_ok=True)
        
        extracted_frame_urls = []
        
        for frame_data in frames:
            frame_img = frame_data["image"]
            idx = frame_data["frame_idx"]
            ts = frame_data["timestamp"]
            
            frame_filename = f"frame_{idx}.jpg"
            frame_filepath = os.path.join(batch_dir_path, frame_filename)
            
            # Save frame image
            cv2.imwrite(frame_filepath, frame_img)
            
            # Generate static URL
            url = f"/outputs/{batch_dir_name}/{frame_filename}"
            extracted_frame_urls.append({
                "frame_idx": idx,
                "timestamp_seconds": round(ts, 2),
                "url": url
            })
            
        return {
            "success": True,
            "total_extracted": len(extracted_frame_urls),
            "frames": extracted_frame_urls
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame extraction failed: {str(e)}")
        
    finally:
        background_tasks.add_task(delete_temp_file, temp_file_path)
