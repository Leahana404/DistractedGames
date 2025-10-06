```js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRoomStore } from './rooms.js';


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });


const rooms = createRoomStore();


app.get('/health', (_req, res) => res.json({ ok: true }));


io.on('connection', (socket) => {
socket.data.role = 'player'; // default role
socket.data.roomCode = null;
socket.data.name = null;


// Create room (caller becomes host of that room)
socket.on('host:createRoom', ({ gameName = 'QuickPoll' } = {}, cb) => {
const { code } = rooms.createRoom({ hostId: socket.id, gameName });
socket.join(code);
socket.data.role = 'host';
socket.data.roomCode = code;
cb?.({ ok: true, code, state: rooms.publicState(code) });
io.to(code).emit('room:update', rooms.publicState(code));
});


// Join an existing room as player (or host rejoin)
socket.on('player:joinRoom', ({ code, name }, cb) => {
code = (code||'').toUpperCase();
const exists = rooms.has(code);
if (!exists) return cb?.({ ok: false, error: 'Room not found' });


// If the host is reconnecting, allow role restore.
const isHost = rooms.get(code)?.hostId === socket.id;
if (isHost) socket.data.role = 'host';


const added = rooms.addPlayer(code, { id: socket.id, name: (name||'Player').slice(0,24) });
if (!added) return cb?.({ ok: false, error: 'Unable to join room' });


socket.join(code);
socket.data.roomCode = code;
socket.data.name = name;
cb?.({ ok: true, state: rooms.publicState(code) });
io.to(code).emit('room:update', rooms.publicState(code));
});


// Unified game controls (host only)
socket.on('host:startRound', ({ prompt, durationMs = 20000 } = {}, cb) => {
const code = socket.data.roomCode;
---
