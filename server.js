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
let takenIdentities = []; // Alınan kimliklerin listesi (ID'ler)

io.on('connection', (socket) => {
  // 1. GİRİŞ VERİLERİ
  socket.emit('party_update_client', serverPartyData);
  if (currentMapUrl) socket.emit('map_update_client', currentMapUrl);
  socket.emit('update_taken_identities', takenIdentities); // Dolu kimlikleri gönder

  // 2. KİMLİK YÖNETİMİ (YENİ)
  socket.on('claim_identity', (data) => {
      // data = { oldId: 123, newId: 456 }
      // Eski kimliği serbest bırak
      if (data.oldId !== null) {
          takenIdentities = takenIdentities.filter(id => id !== data.oldId);
      }
      // Yeni kimliği kilitle (DM hariç)
      if (data.newId !== null && !takenIdentities.includes(data.newId)) {
          takenIdentities.push(data.newId);
      }
      // Herkese duyur
      io.emit('update_taken_identities', takenIdentities);
  });

  // 3. OYUN İÇİ EYLEMLER
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  
  socket.on('party_update', (yeniVeri) => {
      serverPartyData = yeniVeri;
      socket.broadcast.emit('party_update_client', serverPartyData);
  });

  socket.on('map_change', (url) => { currentMapUrl = url; io.emit('map_update_client', url); });

  // 4. İLETİŞİM
  socket.on('dm_whisper', (d) => io.emit('receive_whisper', d));
  
  socket.on('player_whisper', (data) => {
      io.emit('dm_receive_player_msg', data); 
  });

  // 5. ARAÇLAR
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
