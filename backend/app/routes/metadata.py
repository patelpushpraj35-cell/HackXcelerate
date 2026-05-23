import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.utils.config import settings
from app.ai.metadata_analysis import analyze_metadata

router = APIRouter(prefix="/api", tags=["Forensics"])

def delete_temp_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        pass

@router.post("/analyze-metadata")
async def api_analyze_metadata(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Accepts an uploaded image or video, parses metadata fields, 
    scans binary headers/footers for editor signatures, and outputs a suspicious anomaly report.
    """
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_filename = f"{file_id}{ext}"
    temp_file_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        # Run analysis
        report = analyze_metadata(temp_file_path)
        
        # Add general info
        report["original_filename"] = file.filename
        report["success"] = "error" not in report
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata analysis failed: {str(e)}")
        
    finally:
        background_tasks.add_task(delete_temp_file, temp_file_path)
