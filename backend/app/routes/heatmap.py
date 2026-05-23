import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.utils.config import settings
from app.ai.predict import load_deepfake_model
from app.ai.heatmap import generate_and_save_heatmap

router = APIRouter(prefix="/api", tags=["Explainability"])

def delete_temp_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        pass

@router.post("/heatmap")
async def api_generate_heatmap(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_type: str = Query("xception", description="Model architecture: 'xception' or 'mobilenetv2'")
):
    """
    Accepts an uploaded image, generates the Grad-CAM forensic visual heatmap, 
    and directly returns the modified JPEG image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_filename = f"{file_id}{ext}"
    temp_file_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    # Save upload
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    try:
        # Load model
        model = load_deepfake_model(model_type=model_type)
        
        # Save overlay
        output_filename = f"direct_cam_{file_id}.jpg"
        output_path = os.path.join(settings.OUTPUT_DIR, output_filename)
        generate_and_save_heatmap(temp_file_path, model, model_type, output_path)
        
        # We want to schedule the deletion of both files after response is sent
        background_tasks.add_task(delete_temp_file, temp_file_path)
        background_tasks.add_task(delete_temp_file, output_path)
        
        # Return the image response directly
        return FileResponse(output_path, media_type="image/jpeg", filename=f"heatmap_{file.filename}")
        
    except Exception as e:
        # If error occurs, cleanup immediately
        delete_temp_file(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to generate Grad-CAM heatmap: {str(e)}")
