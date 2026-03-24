// IMPORTANT: This must be the first import in this file
import './polyfill.js';

// Force pure JS version by importing specific paths
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js'; // Use ESM version
import * as tf from '@tensorflow/tfjs'; // Pure JS version
import canvas from 'canvas';
import fetch from 'node-fetch';
import User from '../Models/User.js';

const { Canvas, Image, ImageData } = canvas;

// Set environment to use pure JS backend
tf.setBackend('cpu'); // Force CPU backend

// Monkey patch environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// --- Load models from CDN ---
export async function loadModels() {
  try {
    const MODEL_URL = 'https://just-a-cdn.com/models'; // replace with your real CDN
    console.log('Loading face-api models from CDN...');
    
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    
    console.log('✅ Face-api models loaded');
    return true;
  } catch (error) {
    console.error('❌ Failed to load models:', error);
    return false;
  }
}

// --- Helper: load image from URL ---
async function loadImageFromUrl(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.buffer();
    return await canvas.loadImage(buffer);
  } catch (error) {
    throw new Error(`Failed to load image from URL: ${error.message}`);
  }
}

// --- Recognize faces from frame buffer ---
export async function recognizeFaces(frameBuffer) {
  try {
    const img = await canvas.loadImage(frameBuffer);

    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) return [];

    const users = await User.find();
    const labeledDescriptors = await Promise.all(
      users.map(async user => {
        try {
          if (!user.profileImage) return null;
          
          const userImg = await loadImageFromUrl(user.profileImage);
          const detection = await faceapi.detectSingleFace(userImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
            
          if (!detection) return null;
          return new faceapi.LabeledFaceDescriptors(user._id.toString(), [detection.descriptor]);
        } catch (err) {
          console.log('⚠️ Error loading user image:', err.message);
          return null;
        }
      })
    );

    const filtered = labeledDescriptors.filter(d => d !== null);
    
    if (filtered.length === 0) {
      return detections.map(() => ({
        label: 'unknown',
        distance: 1
      }));
    }

    const faceMatcher = new faceapi.FaceMatcher(filtered, 0.6);

    return detections.map(d => {
      const bestMatch = faceMatcher.findBestMatch(d.descriptor);
      return {
        label: bestMatch.label,
        distance: bestMatch.distance
      };
    });
  } catch (error) {
    console.error('❌ Error in recognizeFaces:', error);
    return [];
  }
}