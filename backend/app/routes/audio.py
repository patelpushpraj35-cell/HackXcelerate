import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, BackgroundTasks
from app.utils.config import settings
from app.ai.audio_sync import analyze_audio_video_sync

router = APIRouter(prefix="/api", tags=["Forensics"])

def delete_temp_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        pass

@router.post("/audio-sync-analysis")
async def api_audio_sync_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    max_frames: int = Query(30, description="Number of frames to sample for correlation analysis")
):
    """
    Extracts the audio track from an uploaded video and compares the audio amplitude/energy 
    over time against calculated mouth opening indices to test for dubbed lip-sync mismatches.
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
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    try:
        # Run sync analysis
        report = analyze_audio_video_sync(temp_file_path, max_frames=max_frames)
        report["original_filename"] = file.filename
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio-video synchronization analysis failed: {str(e)}")
        
    finally:
        background_tasks.add_task(delete_temp_file, temp_file_path)
