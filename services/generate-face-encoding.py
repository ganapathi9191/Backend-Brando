import cv2
import json
import sys
import os

def detect_faces(image_path, hostel_id):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"hasFace": False, "unknownDetected": False, "faceCount": 0, "results": []}
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return {"hasFace": False, "unknownDetected": False, "faceCount": 0, "results": []}
        
        results = []
        for (x, y, w, h) in faces:
            results.append({
                "known": False,
                "faceLocation": {
                    "top": int(y),
                    "right": int(x + w),
                    "bottom": int(y + h),
                    "left": int(x)
                }
            })
        
        return {
            "hasFace": True,
            "unknownDetected": True,
            "faceCount": len(faces),
            "results": results
        }
    except Exception as e:
        return {"hasFace": False, "unknownDetected": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    hostel_id = sys.argv[2]
    
    if not os.path.exists(image_path):
        print(json.dumps({"error": "Image not found"}))
        sys.exit(1)
    
    result = detect_faces(image_path, hostel_id)
    print(json.dumps(result))