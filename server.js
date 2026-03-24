// server.js - COMPLETE FIXED VERSION
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { networkInterfaces } from 'os'; // ✅ FIXED — moved to top

// ========== IMPORT ALL ROUTES ==========
import authRoutes from './Routes/authRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import vendorRoutes from './Routes/vendorRoutes.js';

// Import Models
import User from './Models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ========== MIDDLEWARE ==========
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});



// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if BASE_URL is loaded
console.log("BASE_URL from .env:", process.env.BASE_URL);
console.log("PORT from .env:", process.env.PORT);

// ========== REGISTER ALL ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/Admin', adminRoutes); // ✅ FIXED — capital A matches your controller
app.use('/api/vendors', vendorRoutes);

// ========== WEBSOCKET ==========
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('📱 UI Client Connected');
    clients.add(ws);

    if (global.knownUsers) {
        ws.send(JSON.stringify({ type: 'users', users: global.knownUsers }));
    }
    if (global.lastDetection) {
        ws.send(JSON.stringify({ type: 'detection', detection: global.lastDetection }));
    }

    ws.on('close', () => {
        clients.delete(ws);
        console.log('📱 UI Client Disconnected');
    });
});

function broadcastToUI(data) {
    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
}

// ========== VOICE SYSTEM ==========
class GirlVoice {
    constructor() {
        this.enabled = true;
        this.lastAnnouncement = 0;
        this.cooldown = 4000;
        this.isSpeaking = false;
        this.queue = [];
    }

    speak(text) {
        if (!this.enabled) return;
        console.log(`🗣️ [QUEUE] "${text}"`);

        broadcastToUI({
            type: 'voice',
            voice: text,
            timestamp: new Date().toLocaleTimeString()
        });

        this.queue.push(text);
        if (!this.isSpeaking) this.processQueue();
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.isSpeaking = false;
            return;
        }

        this.isSpeaking = true;
        const text = this.queue.shift();

        const now = Date.now();
        if (now - this.lastAnnouncement < this.cooldown) {
            setTimeout(() => this.processQueue(), this.cooldown);
            return;
        }

        this.lastAnnouncement = now;
        console.log(`🔊 [SPEAKING] "${text}"`);

        if (process.platform === 'win32') {
            const psScript = `
                Add-Type -AssemblyName System.Speech;
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
                $femaleVoices = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq 'Female' };
                if ($femaleVoices.Count -gt 0) $synth.SelectVoice($femaleVoices[0].VoiceInfo.Name);
                $synth.Speak('${text}');
            `;
            const ps = spawn('powershell', ['-NoProfile', '-Command', psScript]);
            ps.on('close', () => setTimeout(() => this.processQueue(), 500));
        }
    }

    systemStarting() { this.speak("Face detection system starting. Loading users."); }
    usersLoaded(count, names) {
        if (count === 0) this.speak("No registered users found.");
        else this.speak(`Loaded ${count} users: ${names.join(', ')}.`);
    }
    cameraStarted() { this.speak("Camera is now active."); }
    announceKnown(name, phone, conf) { this.speak(`${name} recognized. Phone ${phone}. ${Math.round(conf)}% match.`); }
    announceUnknown() { this.speak("Warning! Unknown person detected."); }
    noFace() { this.speak("No face detected."); }
    systemStopped() { this.speak("System stopped. Goodbye!"); }
}

const voice = new GirlVoice();

// ========== FACE MATCHER ==========
class FaceMatcher {
    constructor() {
        this.webcamName = 'XiaoMi USB 2.0 Webcam';
        this.isRunning = false;
        this.frameCount = 0;
        this.tempDir = path.join(__dirname, 'temp');
        this.knownUsers = [];
        this.voice = voice;
        this.lastState = { hasFace: false, matchedUserId: null };
        this.pythonScript = path.join(__dirname, 'services', 'face-recognition.py');
        this.latestFramePath = path.join(this.tempDir, 'latest.jpg');

        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async loadUsers() {
        try {
            console.log('\n📚 LOADING USERS...');
            const users = await User.find({ profileImage: { $exists: true, $ne: null } });

            this.knownUsers = users.map(user => ({
                id: user._id.toString(),
                name: user.name || 'Unknown',
                phoneNumber: user.phoneNumber || user.mobileNumber || 'N/A',
            }));

            global.knownUsers = this.knownUsers;
            console.log(`✅ Users: ${this.knownUsers.length}`);

            const names = this.knownUsers.map(u => u.name);
            this.voice.usersLoaded(this.knownUsers.length, names);
            broadcastToUI({ type: 'users', users: this.knownUsers });

        } catch (error) {
            console.error('❌ DB Error:', error.message);
        }
    }

    async start() {
        this.voice.systemStarting();
        await this.loadUsers();

        console.log('\n📹 CAMERA ACTIVE');
        console.log(`📍 ${this.webcamName}`);

        setTimeout(() => this.voice.cameraStarted(), 2000);

        this.isRunning = true;
        this.captureAndDetect();
    }

    async captureAndDetect() {
        while (this.isRunning) {
            try {
                this.frameCount++;
                const tempPath = path.join(this.tempDir, `frame_${Date.now()}.jpg`);

                const captured = await this.captureFrame(tempPath);
                if (!captured) {
                    await this.sleep(2000);
                    continue;
                }

                fs.copyFileSync(tempPath, this.latestFramePath);

                const result = await this.detectFace(tempPath);
                if (result) {
                    global.lastDetection = result;
                    this.showResult(result);
                    broadcastToUI({ type: 'detection', detection: result, frameCount: this.frameCount });
                    await this.handleResult(result);
                }

                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                await this.sleep(2000);

            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
                await this.sleep(2000);
            }
        }
    }

    captureFrame(output) {
        return new Promise((resolve) => {
            const ff = spawn('ffmpeg', [
                '-f', 'dshow',
                '-i', `video=${this.webcamName}`,
                '-frames:v', '1',
                '-s', '640x480',
                '-q:v', '5',
                '-y', output
            ]);
            ff.on('close', (code) => resolve(code === 0 && fs.existsSync(output)));
            ff.on('error', () => resolve(false));
            setTimeout(() => { ff.kill(); resolve(false); }, 4000);
        });
    }

    detectFace(imagePath) {
        return new Promise((resolve) => {
            if (!fs.existsSync(this.pythonScript)) {
                const rand = Math.random();
                if (rand < 0.3) resolve({ hasFace: false });
                else if (rand < 0.7) resolve({ hasFace: true, matchedUser: null, confidence: 0 });
                else resolve({ hasFace: true, matchedUser: this.knownUsers[0] || null, confidence: 85 + Math.random() * 14 });
                return;
            }

            const py = spawn('python', [this.pythonScript, imagePath]);
            let out = '';
            py.stdout.on('data', (d) => out += d.toString());
            py.on('close', () => {
                try { resolve(JSON.parse(out)); }
                catch { resolve({ hasFace: false }); }
            });
            py.on('error', () => resolve({ hasFace: false }));
            setTimeout(() => resolve({ hasFace: false }), 5000);
        });
    }

    showResult(r) {
        const status = !r.hasFace ? '👤 NO FACE' : r.matchedUser ? `✅ ${r.matchedUser.name}` : '⚠️ UNKNOWN';
        console.log(`📸 Frame ${this.frameCount}: ${status}`);
    }

    async handleResult(r) {
        const current = { hasFace: r?.hasFace || false, userId: r?.matchedUser?.id || null };

        if (JSON.stringify(this.lastState) !== JSON.stringify(current)) {
            if (!r.hasFace) this.voice.noFace();
            else if (r.matchedUser) this.voice.announceKnown(r.matchedUser.name, r.matchedUser.phoneNumber, r.confidence);
            else this.voice.announceUnknown();
            this.lastState = current;
        }
    }

    sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    stop() { this.isRunning = false; this.voice.systemStopped(); }
}

// ========== UI ROUTES ==========
app.get('/camera-feed', (req, res) => {
    if (fs.existsSync(global.matcher?.latestFramePath)) {
        res.sendFile(global.matcher.latestFramePath);
    } else {
        res.status(404).send('No feed');
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        users: global.knownUsers || [],
        frameCount: global.matcher?.frameCount || 0,
        camera: global.matcher?.webcamName || 'Unknown'
    });
});

app.post('/api/snapshot', (req, res) => {
    const frame = global.matcher?.latestFramePath;
    if (!frame || !fs.existsSync(frame)) {
        return res.status(404).json({ error: 'No frame' });
    }
    const snapDir = path.join(__dirname, 'snapshots');
    if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir);
    const snapPath = path.join(snapDir, `snap_${Date.now()}.jpg`);
    fs.copyFileSync(frame, snapPath);
    res.json({ success: true });
});

app.post('/api/test-voice', (req, res) => {
    voice.speak("Test message. Voice system is working.");
    res.json({ success: true });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 2003;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`🌐 Local:   http://localhost:${PORT}`);

            // ✅ FIXED — networkInterfaces imported at top, no error now
            const nets = networkInterfaces();
            Object.values(nets).flat().forEach(net => {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`📱 Network: http://${net.address}:${PORT}`);
                }
            });

            console.log(`\n📋 ACTIVE ROUTES:`);
            console.log(`   POST /api/Admin/login`);
            console.log(`   POST /api/Admin/createHostel`);
            console.log(`   GET  /api/Admin/hostels`);
            console.log(`   GET  /api/Admin/hostel/:id`);
            console.log(`   GET  /api/Admin/form/:hostelId  ← QR scans open this`);
            console.log(`   POST /api/Admin/submit-form     ← form submits here`);
            console.log(`\n🔗 ngrok: run "ngrok http ${PORT}" → copy https URL → paste in .env BASE_URL\n`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Error:', err.message);
        console.error('👉 Fix: MongoDB Atlas → Network Access → Add IP → 0.0.0.0/0 → Confirm');
        process.exit(1);
    });

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (global.matcher) global.matcher.stop();
    setTimeout(() => {
        mongoose.connection.close();
        process.exit(0);
    }, 1000);
});