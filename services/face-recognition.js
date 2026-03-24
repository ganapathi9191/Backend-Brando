// face-recognition.js
import canvas from 'canvas';
import * as faceapi from '@vladmandic/face-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Canvas setup
const { Canvas, Image, ImageData, loadImage } = canvas;

// Polyfill for TextEncoder - YAHI PE SET KARO
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

console.log('✅ Polyfills loaded');

// Monkey patch face-api environment
faceapi.env.monkeyPatch({
  Canvas: Canvas,
  Image: Image,
  ImageData: ImageData,
  fetch: fetch,
  readFile: (path) => fs.readFileSync(path) // Direct file read
});

// Model loading function
export async function loadFaceModels() {
  try {
    console.log('📥 Loading face detection models...');
    
    const modelPath = 'https://justadudewhohacks.github.io/face-api.js/models';
    
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
    
    console.log('✅ Models loaded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Model loading failed:', error.message);
    return false;
  }
}

// Face detection function - Image file se
export async function detectFacesFromFile(imagePath) {
  try {
    console.log(`🔍 Detecting faces in: ${imagePath}`);
    
    // Image ko canvas mein load karo
    const image = await loadImage(imagePath);
    
    // Canvas banao
    const canvasEl = canvas.createCanvas(image.width, image.height);
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // Face detection
    const detections = await faceapi
      .detectAllFaces(canvasEl)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    console.log(`👤 Detected ${detections.length} face(s)`);
    
    return detections;
  } catch (error) {
    console.error('❌ Detection failed:', error.message);
    return [];
  }
}

// Face detection function - Buffer se (tumhare camera ke liye)
export async function detectFacesFromBuffer(buffer) {
  try {
    // Buffer se image load karo
    const image = await loadImage(buffer);
    
    // Canvas banao
    const canvasEl = canvas.createCanvas(image.width, image.height);
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // Face detection
    const detections = await faceapi
      .detectAllFaces(canvasEl)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    return detections;
  } catch (error) {
    console.error('❌ Detection failed:', error.message);
    return [];
  }
}

// Compare faces
export async function compareFaces(face1Path, face2Path) {
  try {
    const [face1, face2] = await Promise.all([
      detectFacesFromFile(face1Path),
      detectFacesFromFile(face2Path)
    ]);
    
    if (face1.length === 0 || face2.length === 0) {
      console.log('❌ No faces detected in one or both images');
      return null;
    }
    
    const descriptor1 = face1[0].descriptor;
    const descriptor2 = face2[0].descriptor;
    
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
    
    console.log(`📊 Face similarity: ${similarity.toFixed(2)}%`);
    console.log(`📏 Distance: ${distance.toFixed(4)}`);
    
    return {
      distance,
      similarity,
      isMatch: distance < 0.6
    };
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
    return null;
  }
}

// Test function
export async function testFaceRecognition() {
  console.log('🚀 Testing face recognition...');
  
  const modelsLoaded = await loadFaceModels();
  if (!modelsLoaded) return;
  
  // Pehle check karo ke file exist karti hai
  const testImage = path.join(__dirname, '..', 'test-face.jpg');
  
  if (!fs.existsSync(testImage)) {
    console.log('⚠️ Test image not found. Creating a test file...');
    
    // Ek simple canvas banao test ke liye
    const testCanvas = canvas.createCanvas(300, 300);
    const ctx = testCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Test Image', 50, 150);
    
    const buffer = testCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(testImage, buffer);
    console.log('✅ Test image created');
  }
  
  try {
    const faces = await detectFacesFromFile(testImage);
    console.log(`✅ Test successful! Found ${faces.length} faces`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export all functions
export default {
  loadFaceModels,
  detectFacesFromFile,
  detectFacesFromBuffer,
  compareFaces,
  testFaceRecognition
};