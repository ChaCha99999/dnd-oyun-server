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

// --- SUNUCU HAFIZASI (RAM DB) ---
let serverPartyData = []; // Karakter verileri burada duracak
let currentMapUrl = null; // Açık olan harita burada duracak
let voteCounts = {}; 

io.on('connection', (socket) => {
  console.log('Bağlantı:', socket.id);

  // 1. YENİ GELENE VERİLERİ YOLLA (Senkronizasyon)
  socket.emit('party_update_client', serverPartyData);
  if (currentMapUrl) {
      socket.emit('map_update_client', currentMapUrl);
  }

  // 2. TEMEL EYLEMLER
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  
  // 3. VERİ GÜNCELLEME (Kalıcı Hafıza Simülasyonu)
  socket.on('party_update', (yeniVeri) => {
      serverPartyData = yeniVeri; // Sunucuda güncelle
      socket.broadcast.emit('party_update_client', serverPartyData); // Diğerlerine yay
  });

  // 4. HARİTA SİSTEMİ
  socket.on('map_change', (url) => {
      currentMapUrl = url;
      io.emit('map_update_client', url);
  });

  // 5. OYLAMA & WHISPER & TIMER
  socket.on('timer_start', (s) => io.emit('timer_update', s));
  socket.on('wheel_spin', (d) => io.emit('wheel_result', d));
  socket.on('dm_whisper', (d) => io.emit('receive_whisper', d));

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
