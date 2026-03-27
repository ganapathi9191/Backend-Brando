# services/face-detect.py (Simple version - fallback)
import cv2
import json
import sys
import os

def detect_faces(image_path):
    """
    Simple face detection using OpenCV
    """
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            return {"error": f"Image file not found: {image_path}"}
        
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Could not load image"}
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return {
                "hasFace": False,
                "unknownDetected": False,
                "faceCount": 0,
                "results": []
            }
        
        # Prepare face locations
        face_locations = []
        for (x, y, w, h) in faces:
            face_locations.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "top": int(y),
                "right": int(x + w),
                "bottom": int(y + h),
                "left": int(x)
            })
        
        return {
            "hasFace": True,
            "unknownDetected": True,  # Since no recognition, treat all as unknown
            "faceCount": len(faces),
            "faceData": {
                "faces": face_locations
            },
            "results": [{"known": False} for _ in faces],
            "message": f"Detected {len(faces)} face(s)"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "hasFace": False,
            "unknownDetected": False
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_faces(image_path)
    print(json.dumps(result))