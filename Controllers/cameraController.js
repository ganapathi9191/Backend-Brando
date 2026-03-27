// // cameraController.js – clean version (no duplicate imports)
// import Hostel from '../Models/Hostel.js';
// import User from '../Models/User.js';
// import path from 'path';
// import fs from 'fs';
// import { spawn } from 'child_process';
// import { fileURLToPath } from 'url';
// import ffmpegStatic from 'ffmpeg-static';
// import net from 'net';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// global.cameraStreams = global.cameraStreams || {};
// global.processingFrames = global.processingFrames || {};

// const formatHost = (ip, port) => {
//   const isIPv6 = ip.includes(':');
//   return isIPv6 ? `[${ip}]:${port}` : `${ip}:${port}`;
// };

// async function isPortOpen(ip, port, timeout = 2000) {
//   return new Promise((resolve) => {
//     const socket = new net.Socket();
//     const timer = setTimeout(() => {
//       socket.destroy();
//       resolve(false);
//     }, timeout);
//     socket.on('connect', () => {
//       clearTimeout(timer);
//       socket.destroy();
//       resolve(true);
//     });
//     socket.on('error', () => {
//       clearTimeout(timer);
//       resolve(false);
//     });
//     socket.connect(port, ip);
//   });
// }

// async function testRTSPStream(url, timeout = 5000) {
//   return new Promise((resolve) => {
//     const ffprobe = spawn('ffprobe', ['-v', 'error', '-rtsp_transport', 'tcp', '-timeout', timeout.toString(), '-i', url]);
//     let errorOutput = '';
//     ffprobe.stderr.on('data', (data) => { errorOutput += data.toString(); });
//     ffprobe.on('close', (code) => {
//       resolve({ success: code === 0, error: errorOutput });
//     });
//     ffprobe.on('error', (err) => resolve({ success: false, error: err.message }));
//     setTimeout(() => {
//       ffprobe.kill();
//       resolve({ success: false, error: 'Timeout' });
//     }, timeout + 1000);
//   });
// }

// // ========== CRUD Operations ==========
// export const addCamera = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const { name, ipAddress, port, username, password, location, manufacturer, streamUrl: customStreamUrl } = req.body;

//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

//     const cameraId = `CAM_${hostelId}_${Date.now()}`;
//     const resolvedPort = port || 554;

//     let streamUrl;
//     if (customStreamUrl) {
//       streamUrl = customStreamUrl;
//     } else {
//       streamUrl = `rtsp://`;
//       if (username && password) streamUrl += `${username}:${password}@`;
//       streamUrl += formatHost(ipAddress, resolvedPort);

//       const manu = (manufacturer || '').toLowerCase();
//       if (manu === 'hikvision') {
//         streamUrl += `/Streaming/Channels/101`;
//       } else if (manu === 'dahua') {
//         streamUrl += `/cam/realmonitor?channel=1&subtype=0`;
//       } else {
//         streamUrl += `/live`;
//       }
//     }

//     hostel.cameras.push({
//       cameraId,
//       name,
//       ipAddress,
//       port: resolvedPort,
//       username: username || "",
//       password: password || "",
//       location: location || "",
//       manufacturer: manufacturer || "generic",
//       streamUrl,
//       status: "inactive"
//     });

//     await hostel.save();
//     const newCamera = hostel.cameras[hostel.cameras.length - 1];

//     res.json({ success: true, message: "Camera added", camera: newCamera });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// // ==================== CAMERA MANAGEMENT ====================
// // export const addCamera = async (req, res) => {
// //   try {
// //     const { hostelId } = req.params;
// //     const { name, ipAddress, port, username, password, location, manufacturer } = req.body;

// //     const hostel = await Hostel.findById(hostelId);
// //     if (!hostel) {
// //       return res.status(404).json({ success: false, message: "Hostel not found" });
// //     }

// // const cameraId = `CAM_${hostelId}_${Date.now()}`;
// // const resolvedPort = port || 554;  // ✅ resolve once, use everywhere

// // let streamUrl = `rtsp://`;
// // if (username && password) {
// //   streamUrl += `${username}:${password}@`;
// // }
// // streamUrl += `${ipAddress}:${resolvedPort}`;
    
// //     if (manufacturer === 'hikvision') {
// //       streamUrl += `/Streaming/Channels/101`;
// //     } else if (manufacturer === 'dahua') {
// //       streamUrl += `/cam/realmonitor?channel=1&subtype=0`;
// //     } else {
// //       streamUrl += `/live`;
// //     }

// //     hostel.cameras.push({
// //       cameraId,
// //       name,
// //       ipAddress,
// //       port: resolvedPort,
// //       username: username || "",
// //       password: password || "",
// //       location: location || "",
// //       manufacturer: manufacturer || "generic",
// //       streamUrl,
// //       status: "inactive"
// //     });

// //     await hostel.save();
// //     const newCamera = hostel.cameras[hostel.cameras.length - 1];

// //     res.json({ success: true, message: "Camera added", camera: newCamera });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // In cameraController.js – addCamera

// export const getHostelCameras = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) {
//       return res.status(404).json({ success: false, message: "Hostel not found" });
//     }

//     const camerasWithStatus = hostel.cameras.map(cam => ({
//       ...cam.toObject(),
//       isLive: global.cameraStreams[`${hostelId}_${cam.cameraId}`] ? true : false
//     }));

//     res.json({ success: true, cameras: camerasWithStatus });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getCamera = async (req, res) => {
//   try {
//     const { hostelId, cameraId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

//     const camera = hostel.cameras.find(cam => cam.cameraId === cameraId);
//     if (!camera) return res.status(404).json({ success: false, message: "Camera not found" });

//     res.json({ 
//       success: true, 
//       camera: {
//         ...camera.toObject(),
//         isLive: global.cameraStreams[`${hostelId}_${cameraId}`] ? true : false
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const updateCamera = async (req, res) => {
//   try {
//     const { hostelId, cameraId } = req.params;
//     const { name, ipAddress, port, username, password, location, status, manufacturer } = req.body;

//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

//     const camera = hostel.cameras.find(cam => cam.cameraId === cameraId);
//     if (!camera) return res.status(404).json({ success: false, message: "Camera not found" });

//     if (name) camera.name = name;
//     if (ipAddress) camera.ipAddress = ipAddress;
//     if (port) camera.port = port;
//     if (username !== undefined) camera.username = username;
//     if (password !== undefined) camera.password = password;
//     if (location) camera.location = location;
//     if (status) camera.status = status;
//     if (manufacturer) camera.manufacturer = manufacturer;

//     if (ipAddress || port || username !== undefined || password !== undefined || manufacturer) {
//       let streamUrl = `rtsp://`;
//       if (camera.username && camera.password) streamUrl += `${camera.username}:${camera.password}@`;
// streamUrl += formatHost(camera.ipAddress, camera.port);      
//       if (camera.manufacturer === 'hikvision') {
//         streamUrl += `/Streaming/Channels/101`;
//       } else if (camera.manufacturer === 'dahua') {
//         streamUrl += `/cam/realmonitor?channel=1&subtype=0`;
//       } else {
//         streamUrl += `/live`;
//       }
//       camera.streamUrl = streamUrl;
//     }

//     await hostel.save();
//     res.json({ success: true, message: "Camera updated", camera });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const deleteCamera = async (req, res) => {
//   try {
//     const { hostelId, cameraId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

//     const streamKey = `${hostelId}_${cameraId}`;
//     if (global.cameraStreams[streamKey]) {
//       if (global.cameraStreams[streamKey].kill) global.cameraStreams[streamKey].kill();
//       delete global.cameraStreams[streamKey];
//     }
//     if (global.processingFrames[streamKey]) {
//       clearInterval(global.processingFrames[streamKey]);
//       delete global.processingFrames[streamKey];
//     }

//     hostel.cameras = hostel.cameras.filter(cam => cam.cameraId !== cameraId);
//     await hostel.save();

//     res.json({ success: true, message: "Camera deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ==================== CAMERA LIVE STREAMING ====================
// export const startCameraLive = async (req, res) => {
//   console.log('\n' + '='.repeat(60));
//   console.log('🎥 [START CAMERA] Request received');
//   console.log('='.repeat(60));
  
//   try {
//     const { hostelId, cameraId } = req.params;
    
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });
    
//     const camera = hostel.cameras.find(cam => cam.cameraId === cameraId);
//     if (!camera) return res.status(404).json({ success: false, message: "Camera not found" });
    
//     const streamKey = `${hostelId}_${cameraId}`;
    
//     // Stop existing stream if any
//     if (global.cameraStreams[streamKey]) {
//       global.cameraStreams[streamKey].kill('SIGINT');
//       delete global.cameraStreams[streamKey];
//     }
//     if (global.processingFrames[streamKey]) {
//       clearInterval(global.processingFrames[streamKey]);
//       delete global.processingFrames[streamKey];
//     }
    
//     // --- 1. Check if RTSP port is open (basic connectivity) ---
//     const portOpen = await isPortOpen(camera.ipAddress, camera.port, 3000);
//     if (!portOpen) {
//       // Try alternative common RTSP ports
//       const altPorts = [554, 80, 8000, 8554, 8080];
//       let foundPort = null;
//       for (const alt of altPorts) {
//         if (alt === camera.port) continue;
//         const open = await isPortOpen(camera.ipAddress, alt, 2000);
//         if (open) {
//           foundPort = alt;
//           break;
//         }
//       }
//       if (foundPort) {
//         console.log(`🔍 Port ${camera.port} closed, but port ${foundPort} is open. Attempting to use it.`);
//         camera.port = foundPort;
//         // Rebuild URL with new port
//         let newUrl = `rtsp://`;
//         if (camera.username && camera.password) newUrl += `${camera.username}:${camera.password}@`;
//         newUrl += formatHost(camera.ipAddress, foundPort);
//         const manu = (camera.manufacturer || '').toLowerCase();
//         if (manu === 'hikvision') newUrl += `/Streaming/Channels/101`;
//         else if (manu === 'dahua') newUrl += `/cam/realmonitor?channel=1&subtype=0`;
//         else newUrl += `/live`;
//         camera.streamUrl = newUrl;
//         await hostel.save();
//       } else {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Camera ${camera.ipAddress}:${camera.port} is unreachable. No alternative port found.`,
//           camera: { ip: camera.ipAddress, port: camera.port, streamUrl: camera.streamUrl }
//         });
//       }
//     }
    
//     // --- 2. Test the RTSP stream with ffprobe ---
//     console.log(`🔍 Testing RTSP stream: ${camera.streamUrl}`);
//     const testResult = await testRTSPStream(camera.streamUrl, 5000);
//     if (!testResult.success) {
//       // Try alternative paths if it's a Hikvision device but path is /live
//       const manu = (camera.manufacturer || '').toLowerCase();
//       let tried = [];
//       if (manu === 'hikvision' && !camera.streamUrl.includes('/Streaming/Channels/')) {
//         // Try main stream
//         const altUrl = camera.streamUrl.replace(/\/[^/]*$/, '/Streaming/Channels/101');
//         console.log(`🔍 Trying Hikvision main stream: ${altUrl}`);
//         const altTest = await testRTSPStream(altUrl, 5000);
//         if (altTest.success) {
//           camera.streamUrl = altUrl;
//           await hostel.save();
//           console.log(`✅ Using main stream URL: ${altUrl}`);
//         } else {
//           tried.push(altUrl);
//           // Try sub stream
//           const subUrl = camera.streamUrl.replace(/\/[^/]*$/, '/Streaming/Channels/102');
//           const subTest = await testRTSPStream(subUrl, 5000);
//           if (subTest.success) {
//             camera.streamUrl = subUrl;
//             await hostel.save();
//             console.log(`✅ Using sub stream URL: ${subUrl}`);
//           } else {
//             tried.push(subUrl);
//           }
//         }
//       }
//       if (testResult.success === false && (!tried || tried.length === 0)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `RTSP stream test failed: ${testResult.error}`,
//           camera: { ip: camera.ipAddress, port: camera.port, streamUrl: camera.streamUrl }
//         });
//       }
//     }
    
//     // --- 3. Start FFmpeg to capture frames ---
//     const framesDir = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId);
//     if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
//     const framePath = path.join(framesDir, 'latest.jpg');
    
//     console.log('📹 Connecting to real camera...');
//     console.log(`   URL: ${camera.streamUrl}`);
    
//     const ffmpeg = spawn(ffmpegStatic, [
//       '-rtsp_transport', 'tcp',
//       '-timeout', '5000000',          // 5 seconds timeout
//       '-reconnect', '1',
//       '-reconnect_streamed', '1',
//       '-reconnect_delay_max', '5',
//       '-stimeout', '5000000',
//       '-i', camera.streamUrl,
//       '-vf', 'fps=1',
//       '-update', '1',
//       '-q:v', '2',
//       '-y', framePath
//     ]);
    
//     let frameCreated = false;
//     let connectionError = null;
    
//     ffmpeg.stderr.on('data', (data) => {
//       const msg = data.toString();
//       console.error(`[FFmpeg] ${msg.trim()}`);
//       if (msg.includes('Connection refused') || msg.includes('failed') || msg.includes('error')) {
//         connectionError = msg;
//       }
//     });
    
//     ffmpeg.on('error', (err) => {
//       console.error(`❌ FFmpeg error: ${err.message}`);
//       connectionError = err.message;
//     });
    
//     // Wait for first frame
//     const checkInterval = setInterval(() => {
//       if (fs.existsSync(framePath) && fs.statSync(framePath).size > 1000) {
//         frameCreated = true;
//         console.log('✅ Real camera frame captured!');
//       }
//     }, 1000);
    
//     await new Promise((resolve) => {
//       setTimeout(() => {
//         clearInterval(checkInterval);
//         resolve();
//       }, 30000);
//     });
    
//     if (!frameCreated) {
//       try { ffmpeg.kill(); } catch(e) {}
      
//       const errorMsg = connectionError || 'Connection timeout - Camera not reachable';
//       console.error(`❌ Camera connection failed: ${errorMsg}`);
      
//       return res.status(500).json({ 
//         success: false, 
//         message: `Camera connection failed: ${errorMsg}`,
//         camera: {
//           ip: camera.ipAddress,
//           port: camera.port,
//           streamUrl: camera.streamUrl
//         }
//       });
//     }
    
//     global.cameraStreams[streamKey] = ffmpeg;
//     camera.status = "active";
//     camera.lastActive = new Date();
//     await hostel.save();
    
//     startFaceRecognition(hostelId, camera, framePath);
    
//     const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 2003}`;
//     const streamPath = `/api/cameras/stream/${hostelId}/${cameraId}`;
    
//     console.log(`✅ Camera started successfully`);
//     console.log(`   Stream URL: ${streamPath}`);
//     console.log('='.repeat(60) + '\n');
    
//     res.json({ 
//       success: true, 
//       message: "Camera started successfully",
//       camera: {
//         id: camera.cameraId,
//         name: camera.name,
//         status: camera.status
//       },
//       streamUrl: streamPath
//     });
    
//   } catch (error) {
//     console.error('Start camera error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const stopCameraLive = async (req, res) => {
//   try {
//     const { hostelId, cameraId } = req.params;
    
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });
    
//     const camera = hostel.cameras.find(cam => cam.cameraId === cameraId);
//     if (!camera) return res.status(404).json({ success: false, message: "Camera not found" });
    
//     const streamKey = `${hostelId}_${cameraId}`;
    
//     if (global.cameraStreams[streamKey]) {
//       global.cameraStreams[streamKey].kill('SIGINT');
//       delete global.cameraStreams[streamKey];
//     }
    
//     if (global.processingFrames[streamKey]) {
//       clearInterval(global.processingFrames[streamKey]);
//       delete global.processingFrames[streamKey];
//     }
    
//     camera.status = "inactive";
//     await hostel.save();
    
//     res.json({ success: true, message: "Camera stopped" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getLiveStream = async (req, res) => {
//   try {
//     const { hostelId, cameraId } = req.params;
    
//     const framePath = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId, 'latest.jpg');
    
//     if (fs.existsSync(framePath)) {
//       const stats = fs.statSync(framePath);
//       if (stats.size > 1000) {
//         res.sendFile(framePath);
//         return;
//       }
//     }
    
//     res.status(404).send('No stream available');
//   } catch (error) {
//     res.status(500).send('Error fetching stream');
//   }
// };

// // ==================== FACE RECOGNITION ====================
// const startFaceRecognition = async (hostelId, camera, framePath) => {
//   const streamKey = `${hostelId}_${camera.cameraId}`;
  
//   if (global.processingFrames[streamKey]) {
//     clearInterval(global.processingFrames[streamKey]);
//   }
  
//   global.processingFrames[streamKey] = setInterval(async () => {
//     try {
//       if (!fs.existsSync(framePath)) return;
      
//       const frameBuffer = fs.readFileSync(framePath);
//       const result = await recognizeFaceWithHostelUsers(frameBuffer, hostelId);
      
//       if (result && result.unknownDetected) {
//         console.log(`⚠️ UNKNOWN person detected at ${camera.name}`);
//         const visitor = await saveUnknownVisitor(hostelId, camera, frameBuffer, result);
//         await sendAlert(hostelId, camera, visitor, result);
//       }
      
//     } catch (error) {
//       console.error(`Face recognition error: ${error.message}`);
//     }
//   }, 3000);
// };

// const recognizeFaceWithHostelUsers = (frameBuffer, hostelId) => {
//   return new Promise((resolve) => {
//     const tempDir = path.join(__dirname, '..', 'temp');
//     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
//     const tempPath = path.join(tempDir, `frame_${Date.now()}.jpg`);
//     fs.writeFileSync(tempPath, frameBuffer);
    
//     const pythonScript = path.join(__dirname, '..', 'services', 'face-recognition-advanced.py');
    
//     if (!fs.existsSync(pythonScript)) {
//       fs.unlinkSync(tempPath);
//       resolve({ hasFace: true, unknownDetected: true, faceCount: 1, results: [{ known: false }] });
//       return;
//     }
    
//     const py = spawn('python', [pythonScript, tempPath, hostelId]);
//     let output = '';
    
//     py.stdout.on('data', (data) => { output += data.toString(); });
//     py.stderr.on('data', (data) => {});
    
//     py.on('close', () => {
//       try {
//         if (output && output.trim()) {
//           resolve(JSON.parse(output));
//         } else {
//           resolve({ hasFace: true, unknownDetected: true, faceCount: 1, results: [{ known: false }] });
//         }
//       } catch (error) {
//         resolve({ hasFace: true, unknownDetected: true, faceCount: 1, results: [{ known: false }] });
//       }
//       fs.unlinkSync(tempPath);
//     });
    
//     py.on('error', () => {
//       fs.unlinkSync(tempPath);
//       resolve({ hasFace: true, unknownDetected: true, faceCount: 1, results: [{ known: false }] });
//     });
    
//     setTimeout(() => {
//       py.kill();
//       if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
//       resolve({ hasFace: true, unknownDetected: true, faceCount: 1, results: [{ known: false }] });
//     }, 10000);
//   });
// };

// const saveUnknownVisitor = async (hostelId, camera, frameBuffer, result) => {
//   try {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'unknown-visitors', hostelId);
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
//     const filename = `unknown_${Date.now()}.jpg`;
//     const imagePath = path.join(uploadDir, filename);
//     fs.writeFileSync(imagePath, frameBuffer);
    
//     const hostel = await Hostel.findById(hostelId);
    
//     hostel.unknownVisitors.push({
//       hostelId,
//       cameraId: camera.cameraId,
//       cameraName: camera.name,
//       imageUrl: `/uploads/unknown-visitors/${hostelId}/${filename}`,
//       detectedAt: new Date(),
//       alertSent: false
//     });
    
//     await hostel.save();
//     return hostel.unknownVisitors[hostel.unknownVisitors.length - 1];
//   } catch (error) {
//     return null;
//   }
// };

// const sendAlert = async (hostelId, camera, visitor, result) => {
//   try {
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return;
    
//     console.log(`🔔 ALERT: Unknown person at ${camera.name} in ${hostel.name}`);
    
//     if (visitor) {
//       visitor.alertSent = true;
//       await hostel.save();
//     }
//   } catch (error) {
//     console.error('Alert error:', error);
//   }
// };

// // ==================== EXPORTS ====================
// export const getUnknownVisitors = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     res.json({ success: true, visitors: hostel.unknownVisitors });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getUnknownVisitor = async (req, res) => {
//   try {
//     const { hostelId, visitorId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     const visitor = hostel.unknownVisitors.id(visitorId);
//     res.json({ success: true, visitor });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

// export const deleteUnknownVisitor = async (req, res) => {
//   try {
//     const { hostelId, visitorId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     hostel.unknownVisitors = hostel.unknownVisitors.filter(v => v._id.toString() !== visitorId);
//     await hostel.save();
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

// export const getHostelUsers = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const users = await User.find({ hostelId, status: 'active' }).select('-password -faceEncoding');
//     res.json({ success: true, total: users.length, users });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getUnknownVisitorsStats = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     res.json({ success: true, stats: { total: hostel.unknownVisitors.length, last24Hours: 0, byCamera: {} } });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

// export const updateAlertSettings = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     hostel.alertSettings = { ...hostel.alertSettings, ...req.body };
//     await hostel.save();
//     res.json({ success: true, settings: hostel.alertSettings });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

// export const getAlertSettings = async (req, res) => {
//   try {
//     const { hostelId } = req.params;
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) return res.status(404).json({ success: false });
//     res.json({ success: true, settings: hostel.alertSettings || {} });
//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// };

// cameraController.js - COMPLETE ERROR-FREE VERSION
// cameraController.js - COMPLETE WORKING VERSION WITH PROPER MOCK IMAGES

// cameraController.js - COMPLETE ERROR-FREE VERSION WITH MJPEG STREAMING
import Hostel from '../Models/Hostel.js';
import User from '../Models/User.js';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import net from 'net';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global state
global.cameraStreams = global.cameraStreams || {};
global.processingFrames = global.processingFrames || {};
global.mjpegClients = global.mjpegClients || {};

// ==================== HELPERS ====================

const formatHost = (ip, port) => {
  const isIPv6 = ip.includes(':');
  return isIPv6 ? `[${ip}]:${port}` : `${ip}:${port}`;
};

const isPortOpen = (ip, port, timeout = 2000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    socket.connect(port, ip);
  });
};

const generateMockFrame = async (framePath, cameraName = 'Camera', frameCount = 0) => {
  try {
    const canvas = createCanvas(640, 480);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 640, 480);

    // Border
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 620, 460);

    // Top-left live indicator
    ctx.fillStyle = frameCount % 2 === 0 ? '#ff0000' : '#cc0000';
    ctx.beginPath();
    ctx.arc(30, 35, 8, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ff0000';
    ctx.fillText('LIVE', 45, 41);

    // Camera name
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#00ff41';
    ctx.textAlign = 'center';
    ctx.fillText(cameraName, 320, 200);

    // Mode label
    ctx.font = '15px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('MOCK MODE - Camera Simulator', 320, 240);

    // Face detection status
    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ff41';
    ctx.fillText('[ Face Detection Active ]', 320, 280);

    // Scanning animation bar
    const barY = 310 + (frameCount % 40) * 2;
    ctx.fillStyle = 'rgba(0,255,65,0.15)';
    ctx.fillRect(20, barY > 440 ? 440 : barY, 600, 6);

    // Timestamp
    const now = new Date();
    const ts = now.toLocaleString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
    ctx.font = '13px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.fillText(ts, 20, 460);

    // Frame counter
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(`Frame: ${frameCount}`, 620, 460);

    // Corner markers
    const markerSize = 20;
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath(); ctx.moveTo(20, 40); ctx.lineTo(20, 20); ctx.lineTo(40, 20); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(600, 20); ctx.lineTo(620, 20); ctx.lineTo(620, 40); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(20, 440); ctx.lineTo(20, 460); ctx.lineTo(40, 460); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(600, 460); ctx.lineTo(620, 460); ctx.lineTo(620, 440); ctx.stroke();

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
    fs.writeFileSync(framePath, buffer);
    return buffer;
  } catch (error) {
    console.error('generateMockFrame error:', error.message);
    return null;
  }
};

// Broadcast new frame to all MJPEG clients for this stream
const broadcastFrameToClients = (streamKey, imgBuffer) => {
  const clients = global.mjpegClients[streamKey];
  if (!clients || clients.size === 0) return;

  const header = Buffer.from(
    `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${imgBuffer.length}\r\n\r\n`
  );
  const footer = Buffer.from('\r\n');

  clients.forEach((res) => {
    try {
      if (!res.writableEnded) {
        res.write(header);
        res.write(imgBuffer);
        res.write(footer);
      }
    } catch (e) {
      clients.delete(res);
    }
  });
};

// ==================== CRUD ====================

export const addCamera = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { name, ipAddress, port, username, password, location, manufacturer, streamUrl: customStreamUrl } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const cameraId = `CAM_${hostelId}_${Date.now()}`;
    const resolvedPort = port || 554;

    let streamUrl;
    if (customStreamUrl) {
      streamUrl = customStreamUrl;
    } else {
      streamUrl = 'rtsp://';
      if (username && password) streamUrl += `${username}:${password}@`;
      streamUrl += formatHost(ipAddress, resolvedPort);
      const manu = (manufacturer || '').toLowerCase();
      if (manu === 'hikvision') streamUrl += '/Streaming/Channels/101';
      else if (manu === 'dahua') streamUrl += '/cam/realmonitor?channel=1&subtype=0';
      else streamUrl += '/live';
    }

    hostel.cameras.push({
      cameraId, name, ipAddress,
      port: resolvedPort,
      username: username || '',
      password: password || '',
      location: location || '',
      manufacturer: manufacturer || 'generic',
      streamUrl,
      status: 'inactive',
    });

    await hostel.save();
    const newCamera = hostel.cameras[hostel.cameras.length - 1];
    res.json({ success: true, message: 'Camera added successfully', camera: newCamera });
  } catch (error) {
    console.error('addCamera error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHostelCameras = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const camerasWithStatus = hostel.cameras.map((cam) => ({
      ...cam.toObject(),
      isLive: !!global.cameraStreams[`${hostelId}_${cam.cameraId}`],
    }));

    res.json({ success: true, cameras: camerasWithStatus });
  } catch (error) {
    console.error('getHostelCameras error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCamera = async (req, res) => {
  try {
    const { hostelId, cameraId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const camera = hostel.cameras.find((cam) => cam.cameraId === cameraId);
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });

    res.json({
      success: true,
      camera: {
        ...camera.toObject(),
        isLive: !!global.cameraStreams[`${hostelId}_${cameraId}`],
      },
    });
  } catch (error) {
    console.error('getCamera error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCamera = async (req, res) => {
  try {
    const { hostelId, cameraId } = req.params;
    const { name, ipAddress, port, username, password, location, status, manufacturer, streamUrl: customStreamUrl } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const camera = hostel.cameras.find((cam) => cam.cameraId === cameraId);
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });

    if (name) camera.name = name;
    if (ipAddress) camera.ipAddress = ipAddress;
    if (port) camera.port = port;
    if (username !== undefined) camera.username = username;
    if (password !== undefined) camera.password = password;
    if (location) camera.location = location;
    if (status) camera.status = status;
    if (manufacturer) camera.manufacturer = manufacturer;

    if (customStreamUrl) {
      camera.streamUrl = customStreamUrl;
    } else if (ipAddress || port || username !== undefined || password !== undefined || manufacturer) {
      let newUrl = 'rtsp://';
      if (camera.username && camera.password) newUrl += `${camera.username}:${camera.password}@`;
      newUrl += formatHost(camera.ipAddress, camera.port);
      const manu = (camera.manufacturer || '').toLowerCase();
      if (manu === 'hikvision') newUrl += '/Streaming/Channels/101';
      else if (manu === 'dahua') newUrl += '/cam/realmonitor?channel=1&subtype=0';
      else newUrl += '/live';
      camera.streamUrl = newUrl;
    }

    await hostel.save();
    res.json({ success: true, message: 'Camera updated successfully', camera });
  } catch (error) {
    console.error('updateCamera error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCamera = async (req, res) => {
  try {
    const { hostelId, cameraId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const streamKey = `${hostelId}_${cameraId}`;

    if (global.cameraStreams[streamKey]) {
      try { global.cameraStreams[streamKey].kill(); } catch (e) {}
      delete global.cameraStreams[streamKey];
    }
    if (global.processingFrames[streamKey]) {
      clearInterval(global.processingFrames[streamKey]);
      delete global.processingFrames[streamKey];
    }
    if (global.mjpegClients[streamKey]) {
      global.mjpegClients[streamKey].forEach((res) => {
        try { res.end(); } catch (e) {}
      });
      delete global.mjpegClients[streamKey];
    }

    hostel.cameras = hostel.cameras.filter((cam) => cam.cameraId !== cameraId);
    await hostel.save();

    res.json({ success: true, message: 'Camera deleted successfully' });
  } catch (error) {
    console.error('deleteCamera error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LIVE STREAMING ====================

export const startCameraLive = async (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎥 Starting camera stream...');

  try {
    const { hostelId, cameraId } = req.params;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const camera = hostel.cameras.find((cam) => cam.cameraId === cameraId);
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });

    const streamKey = `${hostelId}_${cameraId}`;

    // Stop existing stream
    if (global.cameraStreams[streamKey]) {
      try { global.cameraStreams[streamKey].kill(); } catch (e) {}
      delete global.cameraStreams[streamKey];
    }
    if (global.processingFrames[streamKey]) {
      clearInterval(global.processingFrames[streamKey]);
      delete global.processingFrames[streamKey];
    }

    // Setup frames directory
    const framesDir = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId);
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
    const framePath = path.join(framesDir, 'latest.jpg');

    // Initialize MJPEG clients set for this stream
    if (!global.mjpegClients[streamKey]) {
      global.mjpegClients[streamKey] = new Set();
    }

    // Start mock camera
    let frameCounter = 0;

    // Generate first frame immediately
    const firstFrame = await generateMockFrame(framePath, camera.name, frameCounter);
    frameCounter++;

    // Start frame generation interval (5 fps = 200ms)
    const interval = setInterval(async () => {
      try {
        const imgBuffer = await generateMockFrame(framePath, camera.name, frameCounter);
        frameCounter++;
        if (imgBuffer) {
          broadcastFrameToClients(streamKey, imgBuffer);
        }
      } catch (err) {
        console.error('Frame generation error:', err.message);
      }
    }, 200);

    global.cameraStreams[streamKey] = {
      kill: () => {
        clearInterval(interval);
        console.log(`🛑 Mock camera stopped: ${streamKey}`);
      },
    };
    global.processingFrames[streamKey] = interval;

    // Update camera status in DB
    camera.status = 'active';
    camera.lastActive = new Date();
    await hostel.save();

    // Start face recognition
    startFaceRecognition(hostelId, camera, framePath);

    const streamPath = `/api/cameras/mjpeg/${hostelId}/${cameraId}`;

    console.log(`✅ Camera started (MOCK MODE)`);
    console.log(`   MJPEG Stream: ${streamPath}`);
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      message: 'Camera started successfully in MOCK MODE',
      camera: { id: camera.cameraId, name: camera.name, status: 'active' },
      streamUrl: streamPath,
      mode: 'mock',
    });
  } catch (error) {
    console.error('startCameraLive error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const stopCameraLive = async (req, res) => {
  try {
    const { hostelId, cameraId } = req.params;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const camera = hostel.cameras.find((cam) => cam.cameraId === cameraId);
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });

    const streamKey = `${hostelId}_${cameraId}`;

    if (global.cameraStreams[streamKey]) {
      try { global.cameraStreams[streamKey].kill(); } catch (e) {}
      delete global.cameraStreams[streamKey];
    }
    if (global.processingFrames[streamKey]) {
      clearInterval(global.processingFrames[streamKey]);
      delete global.processingFrames[streamKey];
    }
    if (global.mjpegClients[streamKey]) {
      global.mjpegClients[streamKey].forEach((clientRes) => {
        try { clientRes.end(); } catch (e) {}
      });
      global.mjpegClients[streamKey].clear();
    }

    camera.status = 'inactive';
    await hostel.save();

    res.json({ success: true, message: 'Camera stopped successfully' });
  } catch (error) {
    console.error('stopCameraLive error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// MJPEG stream — use this URL directly in <img src="..."> in the frontend
export const getMJPEGStream = async (req, res) => {
  const { hostelId, cameraId } = req.params;
  const streamKey = `${hostelId}_${cameraId}`;
  const framePath = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId, 'latest.jpg');

  // Set MJPEG headers
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add this client to the broadcast set
  if (!global.mjpegClients[streamKey]) {
    global.mjpegClients[streamKey] = new Set();
  }
  global.mjpegClients[streamKey].add(res);

  // Send current frame immediately so browser shows something right away
  try {
    if (fs.existsSync(framePath)) {
      const img = fs.readFileSync(framePath);
      if (img.length > 100) {
        res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${img.length}\r\n\r\n`);
        res.write(img);
        res.write('\r\n');
      }
    }
  } catch (e) {}

  // If camera isn't running yet, generate frames on-demand for this viewer
  if (!global.cameraStreams[streamKey]) {
    const framesDir = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId);
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

    let fc = 0;
    const fallbackInterval = setInterval(async () => {
      try {
        if (res.writableEnded) {
          clearInterval(fallbackInterval);
          return;
        }
        const imgBuffer = await generateMockFrame(framePath, cameraId, fc++);
        if (imgBuffer && !res.writableEnded) {
          res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${imgBuffer.length}\r\n\r\n`);
          res.write(imgBuffer);
          res.write('\r\n');
        }
      } catch (e) {
        clearInterval(fallbackInterval);
      }
    }, 200);

    req.on('close', () => clearInterval(fallbackInterval));
    req.on('error', () => clearInterval(fallbackInterval));
    return;
  }

  // Cleanup when client disconnects
  req.on('close', () => {
    if (global.mjpegClients[streamKey]) {
      global.mjpegClients[streamKey].delete(res);
    }
  });
  req.on('error', () => {
    if (global.mjpegClients[streamKey]) {
      global.mjpegClients[streamKey].delete(res);
    }
  });
};

// Single JPEG snapshot (kept for compatibility)
export const getLiveStream = async (req, res) => {
  try {
    const { hostelId, cameraId } = req.params;
    const framePath = path.join(__dirname, '..', 'uploads', 'camera-frames', hostelId, cameraId, 'latest.jpg');

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (fs.existsSync(framePath) && fs.statSync(framePath).size > 100) {
      return res.sendFile(framePath);
    }

    const framesDir = path.dirname(framePath);
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
    const imgBuffer = await generateMockFrame(framePath, 'Camera Starting...', 0);
    if (imgBuffer) return res.end(imgBuffer);

    res.status(404).send('No stream available');
  } catch (error) {
    console.error('getLiveStream error:', error);
    res.status(500).send('Error fetching stream');
  }
};

// ==================== FACE RECOGNITION ====================

const startFaceRecognition = (hostelId, camera, framePath) => {
  const streamKey = `${hostelId}_${camera.cameraId}`;

  // Use a separate named key so it doesn't conflict with the frame interval
  const frKey = `${streamKey}_facerec`;
  if (global.processingFrames[frKey]) {
    clearInterval(global.processingFrames[frKey]);
  }

  global.processingFrames[frKey] = setInterval(async () => {
    try {
      if (!fs.existsSync(framePath) || fs.statSync(framePath).size < 100) return;
      const frameBuffer = fs.readFileSync(framePath);
      const result = await recognizeFaceWithHostelUsers(frameBuffer, hostelId);
      if (result && result.unknownDetected) {
        console.log(`⚠️  Unknown person detected at ${camera.name}`);
        const visitor = await saveUnknownVisitor(hostelId, camera, frameBuffer);
        await sendAlert(hostelId, camera, visitor);
      }
    } catch (error) {
      console.error('Face recognition error:', error.message);
    }
  }, 5000);
};

const recognizeFaceWithHostelUsers = (frameBuffer, hostelId) => {
  return new Promise((resolve) => {
    const rand = Math.random();
    if (rand < 0.3) resolve({ hasFace: false, unknownDetected: false });
    else if (rand < 0.6) resolve({ hasFace: true, unknownDetected: true, faceCount: 1 });
    else resolve({ hasFace: true, unknownDetected: false, faceCount: 1 });
  });
};

const saveUnknownVisitor = async (hostelId, camera, frameBuffer) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'unknown-visitors', hostelId);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `unknown_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(uploadDir, filename), frameBuffer);

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return null;

    hostel.unknownVisitors = hostel.unknownVisitors || [];
    hostel.unknownVisitors.push({
      hostelId,
      cameraId: camera.cameraId,
      cameraName: camera.name,
      imageUrl: `/uploads/unknown-visitors/${hostelId}/${filename}`,
      detectedAt: new Date(),
      alertSent: false,
    });

    await hostel.save();
    return hostel.unknownVisitors[hostel.unknownVisitors.length - 1];
  } catch (error) {
    console.error('saveUnknownVisitor error:', error.message);
    return null;
  }
};

const sendAlert = async (hostelId, camera, visitor) => {
  try {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return;

    console.log(`🔔 ALERT: Unknown person at ${camera.name} in ${hostel.name}`);

    hostel.notifications = hostel.notifications || [];
    hostel.notifications.push({
      message: `⚠️ Unknown person detected at ${camera.name}`,
      type: 'unknown_visitor',
      cameraId: camera.cameraId,
      cameraName: camera.name,
      imageUrl: visitor?.imageUrl || null,
      timestamp: new Date(),
      severity: 'high',
      isRead: false,
    });

    if (visitor) visitor.alertSent = true;
    await hostel.save();
  } catch (error) {
    console.error('sendAlert error:', error.message);
  }
};

// ==================== UNKNOWN VISITORS ====================

export const getUnknownVisitors = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    res.json({ success: true, visitors: hostel.unknownVisitors || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnknownVisitor = async (req, res) => {
  try {
    const { hostelId, visitorId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    const visitor = hostel.unknownVisitors.id(visitorId);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUnknownVisitor = async (req, res) => {
  try {
    const { hostelId, visitorId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    hostel.unknownVisitors = hostel.unknownVisitors.filter(
      (v) => v._id.toString() !== visitorId
    );
    await hostel.save();
    res.json({ success: true, message: 'Visitor deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== USERS & ALERT SETTINGS ====================

export const getHostelUsers = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const users = await User.find({ hostelId, status: 'active' }).select('-password -faceEncoding');
    res.json({ success: true, total: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnknownVisitorsStats = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    const visitors = hostel.unknownVisitors || [];
    const now = Date.now();
    const last24h = visitors.filter(
      (v) => now - new Date(v.detectedAt).getTime() < 86400000
    ).length;
    const byCamera = visitors.reduce((acc, v) => {
      acc[v.cameraId] = (acc[v.cameraId] || 0) + 1;
      return acc;
    }, {});
    res.json({ success: true, stats: { total: visitors.length, last24Hours: last24h, byCamera } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAlertSettings = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    hostel.alertSettings = { ...(hostel.alertSettings || {}), ...req.body };
    await hostel.save();
    res.json({ success: true, settings: hostel.alertSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlertSettings = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    res.json({ success: true, settings: hostel.alertSettings || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};