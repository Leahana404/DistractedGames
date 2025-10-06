```js
socket.data.name = name;
cb?.({ ok: true, state: rooms.publicState(code) });
io.to(code).emit('room:update', rooms.publicState(code));
});


// Unified game controls (host only)
socket.on('host:startRound', ({ prompt, durationMs = 20000 } = {}, cb) => {
const code = socket.data.roomCode;
if (!code || !rooms.isHost(code, socket.id)) return cb?.({ ok: false, error: 'Not host' });
rooms.startRound(code, { prompt, durationMs });
io.to(code).emit('round:started', rooms.roundPublic(code));
cb?.({ ok: true });


const { roundEndsAt } = rooms.get(code).state;
if (roundEndsAt) {
setTimeout(() => {
if (rooms.get(code)?.state.phase === 'answering') {
rooms.endRound(code);
io.to(code).emit('round:ended', rooms.roundResults(code));
io.to(code).emit('room:update', rooms.publicState(code));
}
}, Math.max(0, roundEndsAt - Date.now()));
}
});


socket.on('host:endRound', (_p, cb) => {
const code = socket.data.roomCode;
if (!code || !rooms.isHost(code, socket.id)) return cb?.({ ok: false, error: 'Not host' });
rooms.endRound(code);
io.to(code).emit('round:ended', rooms.roundResults(code));
io.to(code).emit('room:update', rooms.publicState(code));
cb?.({ ok: true });
});


socket.on('host:resetRound', (_p, cb) => {
const code = socket.data.roomCode;
if (!code || !rooms.isHost(code, socket.id)) return cb?.({ ok: false, error: 'Not host' });
rooms.resetRound(code);
io.to(code).emit('round:reset', rooms.roundPublic(code));
io.to(code).emit('room:update', rooms.publicState(code));
cb?.({ ok: true });
});


// Player submission
socket.on('player:submitAnswer', ({ answer }, cb) => {
const code = socket.data.roomCode;
if (!code) return cb?.({ ok: false, error: 'Not in room' });
const ok = rooms.submitAnswer(code, { id: socket.id, name: socket.data.name, answer: (answer||'').toString().slice(0,280) });
cb?.({ ok });
if (ok) io.to(code).emit('round:progress', rooms.roundProgress(code));
});


// Disconnect
socket.on('disconnect', () => {
const code = socket.data.roomCode;
if (!code) return;
if (rooms.isHost(code, socket.id)) {
io.to(code).emit('room:closed');
rooms.destroy(code);
io.in(code).socketsLeave(code);
} else {
rooms.removePlayer(code, socket.id);
io.to(code).emit('room:update', rooms.publicState(code));
}
});
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Unified jackbox-lite on http://localhost:${PORT}`));
```
