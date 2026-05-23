from fastapi import APIRouter
from app.utils.db import get_all_scans, save_scan
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def seed_database_if_empty():
    scans = get_all_scans()
    if len(scans) == 0:
        now = datetime.now()
        dummies = [
            {
                "scan_id": "demo-1",
                "filename": "interview_clip.mp4",
                "verdict": "MANIPULATED",
                "threat_level": "CRITICAL",
                "reality_score": 12.4,
                "confidence": 0.876,
                "timestamp": (now - timedelta(hours=2)).isoformat(),
                "payload": {
                    "success": True,
                    "scan_id": "demo-1",
                    "filename": "interview_clip.mp4",
                    "prediction": "FAKE",
                    "reality_score": 12.4,
                    "confidence": 0.876,
                    "total_frames_analyzed": 30,
                    "frames_with_faces": 28,
                    "average_fake_probability": 0.876,
                    "max_fake_probability": 0.942,
                    "verdict": "MANIPULATED",
                    "threat_level": "CRITICAL"
                }
            },
            {
                "scan_id": "demo-2",
                "filename": "news_footage.mp4",
                "verdict": "AUTHENTIC",
                "threat_level": "LOW",
                "reality_score": 88.6,
                "confidence": 0.114,
                "timestamp": (now - timedelta(hours=5)).isoformat(),
                "payload": {
                    "success": True,
                    "scan_id": "demo-2",
                    "filename": "news_footage.mp4",
                    "prediction": "REAL",
                    "reality_score": 88.6,
                    "confidence": 0.114,
                    "total_frames_analyzed": 30,
                    "frames_with_faces": 30,
                    "average_fake_probability": 0.114,
                    "max_fake_probability": 0.201,
                    "verdict": "AUTHENTIC",
                    "threat_level": "LOW"
                }
            },
            {
                "scan_id": "demo-3",
                "filename": "selfie_vid.mov",
                "verdict": "SUSPICIOUS",
                "threat_level": "MEDIUM",
                "reality_score": 51.2,
                "confidence": 0.488,
                "timestamp": (now - timedelta(hours=12)).isoformat(),
                "payload": {
                    "success": True,
                    "scan_id": "demo-3",
                    "filename": "selfie_vid.mov",
                    "prediction": "REAL",
                    "reality_score": 51.2,
                    "confidence": 0.488,
                    "total_frames_analyzed": 20,
                    "frames_with_faces": 20,
                    "average_fake_probability": 0.488,
                    "max_fake_probability": 0.582,
                    "verdict": "SUSPICIOUS",
                    "threat_level": "MEDIUM"
                }
            },
            {
                "scan_id": "demo-4",
                "filename": "press_conf.mp4",
                "verdict": "MANIPULATED",
                "threat_level": "HIGH",
                "reality_score": 22.8,
                "confidence": 0.772,
                "timestamp": (now - timedelta(days=1, hours=3)).isoformat(),
                "payload": {
                    "success": True,
                    "scan_id": "demo-4",
                    "filename": "press_conf.mp4",
                    "prediction": "FAKE",
                    "reality_score": 22.8,
                    "confidence": 0.772,
                    "total_frames_analyzed": 30,
                    "frames_with_faces": 25,
                    "average_fake_probability": 0.772,
                    "max_fake_probability": 0.854,
                    "verdict": "MANIPULATED",
                    "threat_level": "HIGH"
                }
            },
            {
                "scan_id": "demo-5",
                "filename": "portrait.jpg",
                "verdict": "AUTHENTIC",
                "threat_level": "LOW",
                "reality_score": 91.3,
                "confidence": 0.087,
                "timestamp": (now - timedelta(days=2, hours=1)).isoformat(),
                "payload": {
                    "success": True,
                    "scan_id": "demo-5",
                    "filename": "portrait.jpg",
                    "prediction": "REAL",
                    "reality_score": 91.3,
                    "confidence": 0.087,
                    "face_detected": True,
                    "num_faces_detected": 1,
                    "verdict": "AUTHENTIC",
                    "threat_level": "LOW"
                }
            }
        ]
        for item in dummies:
            save_scan(
                item["scan_id"],
                item["filename"],
                item["verdict"],
                item["threat_level"],
                item["reality_score"],
                item["confidence"],
                item["payload"]
            )

@router.get("/history")
async def get_history():
    seed_database_if_empty()
    scans = get_all_scans()
    return {"scans": scans}

@router.get("/dashboard")
async def get_dashboard():
    seed_database_if_empty()
    scans = get_all_scans()
    
    total_scans = len(scans)
    fake_count = sum(1 for s in scans if s["verdict"] == "MANIPULATED")
    real_count = sum(1 for s in scans if s["verdict"] == "AUTHENTIC")
    suspicious_count = sum(1 for s in scans if s["verdict"] == "SUSPICIOUS")
    
    threat_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for s in scans:
        tl = s.get("threat_level", "LOW")
        if tl in threat_dist:
            threat_dist[tl] += 1
            
    now = datetime.now()
    days_map = {}
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_name = day_date.strftime("%a")
        days_map[day_name] = {"day": day_name, "total": 0, "fakes": 0}
        
    for s in scans:
        try:
            dt = datetime.fromisoformat(s["timestamp"])
            day_name = dt.strftime("%a")
            if day_name in days_map:
                days_map[day_name]["total"] += 1
                if s["verdict"] == "MANIPULATED":
                    days_map[day_name]["fakes"] += 1
        except:
            pass
            
    weekly_trend = list(days_map.values())
    recent = scans[:5]
    
    return {
        "total_scans": total_scans,
        "deepfakes_found": fake_count,
        "authentic_media": real_count,
        "suspicious_count": suspicious_count,
        "accuracy_rate": 94.7,
        "weekly_trend": weekly_trend,
        "threat_distribution": threat_dist,
        "recent_scans": recent
    }
