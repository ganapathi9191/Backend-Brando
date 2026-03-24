# services/face-recognition.py - FIXED VERSION
import cv2
import json
import sys
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb+srv://ganapathipixelmindsolutions_db_user:Brando-App@cluster22.1plyi5a.mongodb.net/Brando?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client['Brando']
users_collection = db['users']

class FaceRecognizer:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.known_users = []
        self.load_users()
    
    def load_users(self):
        """Load users from database"""
        users = users_collection.find({ "profileImage": { "$exists": True, "$ne": None } })
        
        for user in users:
            self.known_users.append({
                "id": str(user['_id']),
                "name": user.get('name', 'Unknown'),
                "phone": user.get('phoneNumber', user.get('mobileNumber', 'N/A')),
            })
    
    def detect_faces(self, image_path):
        """Detect faces using OpenCV"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return {"hasFace": False}
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                return {"hasFace": False}
            
            # For now, return unknown (face detected but not recognized)
            return {
                "hasFace": True,
                "matchedUser": None,
                "confidence": 0,
                "faceCount": len(faces)
            }
            
        except Exception as e:
            return {"hasFace": False}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    recognizer = FaceRecognizer()
    result = recognizer.detect_faces(image_path)
    print(json.dumps(result))