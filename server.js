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

// --- SUNUCU HAFIZASI ---
let serverPartyData = []; 
let currentMapUrl = null; 
let voteCounts = {}; 
let takenIdentities = []; 
let dmLogHistory = []; // DM İÇİN GİZLİ LOG KAYITLARI

// DM Loguna Ekleme Fonksiyonu
function logToDM(type, sender, target, message) {
    const logEntry = {
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
        type: type, // 'dm-sent', 'dm-received', 'p2p'
        sender: sender,
        target: target,
        message: message
    };
    dmLogHistory.push(logEntry);
    // Tüm socketlere yolla ama sadece DM açabilecek
    io.emit('dm_log_update', logEntry);
}

io.on('connection', (socket) => {
  // GİRİŞTE VERİLERİ YÜKLE
  socket.emit('party_update_client', serverPartyData);
  if (currentMapUrl) socket.emit('map_update_client', currentMapUrl);
  socket.emit('update_taken_identities', takenIdentities);
  socket.emit('dm_log_history_load', dmLogHistory); // Yeni giren DM ise geçmişi görsün

  // KİMLİK
  socket.on('claim_identity', (data) => {
      if (data.oldId !== null) takenIdentities = takenIdentities.filter(id => id !== data.oldId);
      if (data.newId !== null && !takenIdentities.includes(data.newId)) takenIdentities.push(data.newId);
      io.emit('update_taken_identities', takenIdentities);
  });

  // OYUN İÇİ
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  socket.on('party_update', (yeniVeri) => {
      serverPartyData = yeniVeri;
      socket.broadcast.emit('party_update_client', serverPartyData);
  });
  socket.on('map_change', (url) => { currentMapUrl = url; io.emit('map_update_client', url); });

  // --- İLETİŞİM & LOGLAMA ---
  
  // DM -> Oyuncu
  socket.on('dm_whisper', (d) => {
      io.emit('receive_whisper', d);
      logToDM('dm-sent', 'DM', d.targetName, d.message);
  });
  
  // Oyuncu -> DM
  socket.on('player_whisper', (d) => {
      io.emit('dm_receive_player_msg', d);
      logToDM('dm-received', d.sender, 'DM', d.message);
  });

  // Oyuncu -> Oyuncu
  socket.on('p2p_whisper', (d) => {
      io.emit('p2p_whisper_relay', d);
      logToDM('p2p', d.senderName, d.targetName, d.message); // DM bunu da görür!
  });

  // ARAÇLAR
  socket.on('timer_start', (s) => io.emit('timer_update', s));
  socket.on('wheel_spin', (d) => io.emit('wheel_result', d));
  socket.on('start_vote', () => { voteCounts = {}; io.emit('show_vote_screen'); });
  socket.on('cast_vote', (name) => { if (!voteCounts[name]) voteCounts[name]=0; voteCounts[name]++; });
  socket.on('end_vote', () => {
      let winner = "Kimse", max = -1;
      Object.keys(voteCounts).forEach(c => { if(voteCounts[c]>max){max=voteCounts[c]; winner=c;} });
      io.emit('vote_result_announce', {winner, votes:max});
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda.`));
