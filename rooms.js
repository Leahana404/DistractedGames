```js
room.state.prompt = null;
room.state.durationMs = 0;
room.state.roundEndsAt = null;
room.state.submissions = new Map();
return true;
}


function endRound(code){
const room = get(code);
if (!room) return false;
room.state.phase = 'reveal';
room.state.roundEndsAt = null;
return true;
}


function submitAnswer(code, { id, name, answer }) {
const room = get(code);
if (!room || room.state.phase !== 'answering') return false;
room.state.submissions.set(id, { id, name, answer, ts: Date.now() });
return true;
}


function publicState(code){
const room = get(code);
if (!room) return null;
return {
code: room.code,
gameName: room.gameName,
phase: room.state.phase,
players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
};
}


function roundPublic(code){
const room = get(code);
if (!room) return null;
return {
phase: room.state.phase,
prompt: room.state.prompt,
durationMs: room.state.durationMs,
roundEndsAt: room.state.roundEndsAt,
};
}


function roundProgress(code){
const room = get(code);
if (!room) return null;
return {
submitted: room.state.submissions.size,
totalPlayers: room.players.size
};
}


function roundResults(code){
const room = get(code);
if (!room) return null;
return {
prompt: room.state.prompt,
answers: Array.from(room.state.submissions.values())
.sort((a,b)=> a.ts-b.ts)
.map((s, idx) => ({ order: idx+1, name: s.name || 'Player', answer: s.answer }))
};
}


return {
createRoom, has, get, destroy, isHost,
addPlayer, removePlayer,
startRound, endRound, resetRound, submitAnswer,
publicState, roundPublic, roundProgress, roundResults
};
}
```
