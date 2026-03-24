import ffmpeg from 'fluent-ffmpeg';
import { recognizeFaces, loadModels } from './faceService.js';

let isProcessing = false;
let ffmpegProcess = null;

export async function startCameraStream() {
  const modelsLoaded = await loadModels();
  
  if (!modelsLoaded) {
    console.log('❌ Models failed to load. Camera stream stopped.');
    return;
  }

  const cameraUrl = process.env.CAMERA_URL || '';
  if (!cameraUrl) {
    console.log('📹 No camera URL provided. Skipping camera stream.');
    return;
  }

  console.log('📹 Starting camera stream...');
  
  // Kill any existing process
  if (ffmpegProcess) {
    ffmpegProcess.kill();
  }
  
  ffmpegProcess = ffmpeg(cameraUrl)
    .inputOptions([
      '-rtsp_transport tcp',
      '-re',
      '-timeout 1000000'
    ])
    .format('image2pipe')
    .fps(1) // 1 frame per second
    .outputOptions([
      '-pix_fmt rgb24',
      '-vframes 1',
      '-update 1' // Update the same file
    ])
    .on('start', (commandLine) => {
      console.log('FFmpeg started:', commandLine);
    })
    .on('data', async (frameBuffer) => {
      if (isProcessing) {
        console.log('⏳ Still processing previous frame, skipping...');
        return;
      }
      
      isProcessing = true;
      try {
        const results = await recognizeFaces(frameBuffer);
        if (results.length > 0) {
          results.forEach(res => {
            if (res.label === 'unknown') {
              console.log('⚠️ ALERT: Unknown user detected!');
            } else {
              console.log('✅ Matched user:', res.label);
            }
          });
        }
      } catch (err) {
        console.log('❌ Error processing frame:', err.message);
      } finally {
        isProcessing = false;
      }
    })
    .on('error', (err) => {
      console.log('❌ FFMPEG Error:', err.message);
      // Attempt to restart after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to restart camera stream...');
        startCameraStream();
      }, 5000);
    })
    .on('end', () => {
      console.log('📹 Camera stream ended');
      // Attempt to restart after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to restart camera stream...');
        startCameraStream();
      }, 5000);
    })
    .run();
    
  return ffmpegProcess;
}

// Optional: Add function to stop the stream
export function stopCameraStream() {
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT');
    ffmpegProcess = null;
    console.log('📹 Camera stream stopped');
  }
}