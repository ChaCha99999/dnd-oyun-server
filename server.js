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
    } else if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.send('HATA: index.html bulunamadı!');
    }
});

let voteCounts = {}; // Oyları burada tutacağız

io.on('connection', (socket) => {
  // 1. TEMEL FONKSİYONLAR
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  socket.on('party_update', (yeniVeri) => socket.broadcast.emit('party_update_client', yeniVeri));
  socket.on('timer_start', (s) => io.emit('timer_update', s));
  socket.on('wheel_spin', (d) => io.emit('wheel_result', d));
  socket.on('dm_whisper', (d) => io.emit('receive_whisper', d));

  // 2. OYLAMA SİSTEMİ (MVP)
  socket.on('start_vote', () => {
      voteCounts = {}; // Oyları sıfırla
      io.emit('show_vote_screen'); // Herkese ekranı aç
  });

  socket.on('cast_vote', (name) => {
      // Oy ekle
      if (!voteCounts[name]) voteCounts[name] = 0;
      voteCounts[name]++;
  });

  socket.on('end_vote', () => {
      // Sonuçları hesapla
      let winner = "Kimse";
      let maxVotes = -1;
      
      // En çok oyu alanı bul
      Object.keys(voteCounts).forEach(candidate => {
          if (voteCounts[candidate] > maxVotes) {
              maxVotes = voteCounts[candidate];
              winner = candidate;
          }
      });
      
      // Herkese sonucu yolla
      io.emit('vote_result_announce', {winner: winner, votes: maxVotes});
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda.`));
