const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    const fs = require('fs');
    if (fs.existsSync(path.join(__dirname, 'public', 'index.html'))) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// --- BELLEK ---
let serverPartyData = []; 
let currentMapUrl = null; 
let takenIdentities = []; 
let dmLogHistory = [];

function logToDM(type, sender, target, message) {
    const logEntry = {
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
        type: type, sender: sender, target: target, message: message
    };
    dmLogHistory.push(logEntry);
    io.emit('dm_log_update', logEntry);
}

io.on('connection', (socket) => {
  // GİRİŞ
  socket.emit('party_update_client', serverPartyData);
  if (currentMapUrl) socket.emit('map_update_client', currentMapUrl);
  socket.emit('update_taken_identities', takenIdentities);
  socket.emit('dm_log_history_load', dmLogHistory);

  // KİMLİK
  socket.on('claim_identity', (data) => {
      if (data.oldId !== undefined) takenIdentities = takenIdentities.filter(id => id !== data.oldId);
      if (data.newId && !takenIdentities.includes(data.newId)) takenIdentities.push(data.newId);
      io.emit('update_taken_identities', takenIdentities);
  });

  // OYUN
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  
  socket.on('party_update', (yeniVeri) => {
      serverPartyData = yeniVeri;
      socket.broadcast.emit('party_update_client', serverPartyData);
  });

  socket.on('map_change', (url) => { currentMapUrl = url; io.emit('map_update_client', url); });

  // İLETİŞİM
  socket.on('dm_whisper', (d) => { io.emit('receive_whisper', d); logToDM('dm-sent', 'DM', d.targetName, d.message); });
  socket.on('player_whisper', (d) => { io.emit('dm_receive_player_msg', d); logToDM('dm-received', d.sender, 'DM', d.message); });
  socket.on('p2p_whisper', (d) => { io.emit('p2p_whisper_relay', d); logToDM('p2p', d.senderName, d.targetName, d.message); });

  // ARAÇLAR
  socket.on('timer_start', (s) => io.emit('timer_update', s));
  socket.on('wheel_spin', (d) => io.emit('wheel_result', d));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda.`));
