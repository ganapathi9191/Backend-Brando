// Routes/cameraRoutes.js
import express from 'express';
import {
  addCamera,
  getHostelCameras,
  getCamera,
  updateCamera,
  deleteCamera,
  startCameraLive,
  stopCameraLive,
  getMJPEGStream,
  getLiveStream,
  getUnknownVisitors,
  getUnknownVisitor,
  deleteUnknownVisitor,
  getHostelUsers,
  getUnknownVisitorsStats,
  updateAlertSettings,
  getAlertSettings,
} from '../Controllers/cameraController.js';

const router = express.Router();

// ── Camera CRUD ──────────────────────────────────────────────
router.post('/addcameras/:hostelId', addCamera);
router.get('/allhostelcameras/:hostelId', getHostelCameras);
router.get('/hostelsinglecamera/:hostelId/:cameraId', getCamera);
router.put('/updatehostelcameras/:hostelId/:cameraId', updateCamera);
router.delete('/deletehostelcameras/:hostelId/:cameraId', deleteCamera);

// ── Live streaming ───────────────────────────────────────────
router.post('/startcamerasstreaming/:hostelId/:cameraId', startCameraLive);
router.post('/stopcamerasstreaming/:hostelId/:cameraId', stopCameraLive);

// MJPEG stream  ← use this URL in <img src="..."> on the frontend
router.get('/mjpeg/:hostelId/:cameraId', getMJPEGStream);

// Single JPEG snapshot (kept for compatibility)
router.get('/getstream/:hostelId/:cameraId', getLiveStream);

// ── Unknown visitors ─────────────────────────────────────────
router.get('/getunknown-visitors/:hostelId', getUnknownVisitors);
router.get('/getunknown-visitors/:hostelId/:visitorId', getUnknownVisitor);
router.delete('/deleteunknown-visitors/:hostelId/:visitorId', deleteUnknownVisitor);
router.get('/getunknown-visitors-stats/:hostelId', getUnknownVisitorsStats);

// ── Users & alert settings ───────────────────────────────────
router.get('/hostel-users/:hostelId', getHostelUsers);
router.get('/hostelalert/:hostelId', getAlertSettings);
router.put('/hostel/:hostelId/alert-settings', updateAlertSettings);

export default router;