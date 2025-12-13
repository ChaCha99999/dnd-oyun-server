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

io.on('connection', (socket) => {
  console.log('Bağlantı: ' + socket.id);

  // 1. ZAR VE KARAKTER (Eski özellikler)
  socket.on('zar_atildi', (veri) => socket.broadcast.emit('herkes_icin_zar', veri));
  socket.on('party_update', (yeniVeri) => socket.broadcast.emit('party_update_client', yeniVeri));

  // --- YENİ V2.0 ÖZELLİKLERİ ---

  // 2. GERİ SAYIM (Countdown)
  socket.on('timer_start', (seconds) => {
    io.emit('timer_update', seconds); // Herkese sayacı başlat
  });

  // 3. KADER ÇARKI (Wheel of Fate)
  socket.on('wheel_spin', (result) => {
    io.emit('wheel_result', result); // Herkese sonucu göster
  });

  // 4. GİZLİ FISILTI (Whisper)
  socket.on('dm_whisper', (data) => {
    // data = { targetCharId: 123, message: "..." }
    // Bunu herkese yolluyoruz ama Client tarafında "Bu mesaj bana mı?" kontrolü yapacağız.
    // (Login sistemi olmadığı için en pratik yöntem bu)
    io.emit('receive_whisper', data); 
  });

  // 5. MVP OYLAMASI
  socket.on('start_vote', () => {
    io.emit('show_vote_screen'); // Herkese oylama ekranını aç
  });

  socket.on('disconnect', () => console.log('Ayrıldı.'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda.`));
