import os
from PIL import Image
from PIL.ExifTags import TAGS
import logging
from hachoir.parser import createParser
from hachoir.metadata import extractMetadata
from hachoir.core import config as hachoir_config

# Configure logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Disable hachoir logs/warnings to keep output clean
hachoir_config.quiet = True

# List of known editing tools / rendering softwares
SUSPICIOUS_SOFTWARE_SIGNATURES = [
    "photoshop", "gimp", "canva", "after effects", "premiere", "sony vegas", 
    "final cut", "da vinci", "blender", "ffmpeg", "lightroom", "nuke", 
    "adobe", "coreldraw", "lavf"
]

def analyze_image_metadata(image_path: str) -> dict:
    """
    Parses EXIF tags of an image file and scans for manipulation signatures.
    
    Args:
        image_path (str): File path.
        
    Returns:
        dict: Inspection report.
    """
    report = {
        "file_type": "image",
        "file_size_kb": round(os.path.getsize(image_path) / 1024, 2),
        "exif_found": False,
        "editing_software_detected": False,
        "detected_software": None,
        "camera_make": None,
        "camera_model": None,
        "creation_date": None,
        "anomalies": [],
        "suspicion_score": 0.0  # Range: [0.0, 1.0]
    }
    
    try:
        with Image.open(image_path) as img:
            # Basic specs
            report["dimensions"] = f"{img.width}x{img.height}"
            
            # Check EXIF
            exif_data = img._getexif()
            if exif_data:
                report["exif_found"] = True
                decoded_exif = {}
                for tag, value in exif_data.items():
                    decoded_tag = TAGS.get(tag, tag)
                    decoded_exif[decoded_tag] = value
                
                # Check for camera make & model
                report["camera_make"] = decoded_exif.get("Make", None)
                report["camera_model"] = decoded_exif.get("Model", None)
                report["creation_date"] = decoded_exif.get("DateTimeOriginal", decoded_exif.get("DateTime", None))
                
                # Check software tag
                software = decoded_exif.get("Software", "")
                if software:
                    report["detected_software"] = str(software)
                    for signature in SUSPICIOUS_SOFTWARE_SIGNATURES:
                        if signature in str(software).lower():
                            report["editing_software_detected"] = True
                            report["anomalies"].append(f"Editing software signature found in EXIF: {software}")
                            report["suspicion_score"] = min(report["suspicion_score"] + 0.6, 1.0)
                            break
                            
            # Check for lack of EXIF data on a large photo
            # Usually, real mobile/camera photos have exif. Generated/downloaded/screenshot images might not.
            if not report["exif_found"]:
                report["anomalies"].append("No EXIF metadata found (common in AI-generated, scraped, or compressed images)")
                report["suspicion_score"] = min(report["suspicion_score"] + 0.3, 1.0)
                
            # Scan raw binary for editing tool signatures if EXIF is clean/missing
            # Deepfakes might strip EXIF but leave strings in the binary footer
            binary_sigs = scan_binary_for_signatures(image_path)
            if binary_sigs:
                report["editing_software_detected"] = True
                report["detected_software"] = ", ".join(binary_sigs)
                for sig in binary_sigs:
                    report["anomalies"].append(f"Binary signature of editing tool detected: {sig}")
                report["suspicion_score"] = min(report["suspicion_score"] + 0.5, 1.0)
                
    except Exception as e:
        logger.error(f"Error reading image metadata for {image_path}: {str(e)}")
        report["error"] = str(e)
        
    return report

def scan_binary_for_signatures(file_path: str) -> list:
    """
    Performs a quick search in the binary of the file looking for software signature strings.
    
    Args:
        file_path (str): File path.
        
    Returns:
        list: Detected editing software signatures.
    """
    detected = []
    try:
        # Read the last 20KB of the file (metadata is often at start or end)
        file_size = os.path.getsize(file_path)
        read_size = min(file_size, 32768)
        
        with open(file_path, "rb") as f:
            # Check header
            header = f.read(read_size)
            # Check footer
            if file_size > read_size:
                f.seek(file_size - read_size)
                footer = f.read(read_size)
            else:
                footer = b""
                
        chunk = header + footer
        
        # Scan for terms
        for signature in SUSPICIOUS_SOFTWARE_SIGNATURES:
            # Encode term as bytes
            term_bytes = signature.encode('utf-8', errors='ignore')
            if term_bytes in chunk.lower():
                # Avoid duplicates
                if signature not in detected:
                    detected.append(signature)
    except Exception as e:
        logger.error(f"Failed to run binary scan on {file_path}: {str(e)}")
        
    return detected

def analyze_video_metadata(video_path: str) -> dict:
    """
    Extracts container metadata from video files using hachoir library.
    
    Args:
        video_path (str): Path to video.
        
    Returns:
        dict: Video inspection details.
    """
    report = {
        "file_type": "video",
        "file_size_mb": round(os.path.getsize(video_path) / (1024 * 1024), 2),
        "metadata_found": False,
        "editing_software_detected": False,
        "detected_software": None,
        "codec": None,
        "frame_rate": None,
        "duration_s": None,
        "creation_date": None,
        "anomalies": [],
        "suspicion_score": 0.0
    }
    
    parser = None
    try:
        parser = createParser(video_path)
        if parser:
            metadata = extractMetadata(parser)
            if metadata:
                report["metadata_found"] = True
                
                # Extract stats
                if metadata.has("duration"):
                    report["duration_s"] = round(metadata.get("duration").total_seconds(), 2)
                if metadata.has("frame_rate"):
                    report["frame_rate"] = round(metadata.get("frame_rate"), 2)
                if metadata.has("mime_type"):
                    report["codec"] = metadata.get("mime_type")
                if metadata.has("creation_date"):
                    report["creation_date"] = str(metadata.get("creation_date"))
                    
                # Scan properties for encoding software / authors
                # Look for typical keywords
                metadata_str = str(metadata.exportPlaintext())
                
                # Check for software signature tags
                for signature in SUSPICIOUS_SOFTWARE_SIGNATURES:
                    if signature in metadata_str.lower():
                        report["editing_software_detected"] = True
                        report["detected_software"] = signature
                        report["anomalies"].append(f"Video container contains encoder signature: {signature}")
                        report["suspicion_score"] = min(report["suspicion_score"] + 0.4, 1.0)
                        
            parser.exit()
            
        # Binary scan fallback/supplement
        binary_sigs = scan_binary_for_signatures(video_path)
        if binary_sigs:
            report["editing_software_detected"] = True
            report["detected_software"] = ", ".join(binary_sigs)
            for sig in binary_sigs:
                if f"Video container contains encoder signature: {sig}" not in report["anomalies"]:
                    report["anomalies"].append(f"Binary scan detected software signature: {sig}")
                    report["suspicion_score"] = min(report["suspicion_score"] + 0.35, 1.0)
                    
        # Check standard anomalies
        if report["duration_s"] is not None and report["duration_s"] < 0.5:
            report["anomalies"].append("Extremely short video duration (suspicious clip crop)")
            report["suspicion_score"] = min(report["suspicion_score"] + 0.2, 1.0)
            
    except Exception as e:
        logger.error(f"Error parsing video metadata for {video_path}: {str(e)}")
        report["error"] = str(e)
        if parser:
            try:
                parser.exit()
            except:
                pass
                
    return report

def analyze_metadata(file_path: str) -> dict:
    """
    Wrapper function that routes file to the correct analyzer depending on extension.
    
    Args:
        file_path (str): Path to file.
        
    Returns:
        dict: File analysis report.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in ('.jpg', '.jpeg', '.png', '.webp', '.bmp'):
        return analyze_image_metadata(file_path)
    elif ext in ('.mp4', '.avi', '.mov', '.mkv', '.webm', '.ogg'):
        return analyze_video_metadata(file_path)
    else:
        return {
            "error": f"Unsupported file type: {ext}",
            "suspicion_score": 0.0,
            "anomalies": ["Unsupported format for metadata scan"]
        }
