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

// --- İLETİŞİM MERKEZİ ---
io.on('connection', (socket) => {
  console.log('Birisi bağlandı!');

  // 1. Biri ZAR atarsa:
  socket.on('zar_atildi', (veri) => {
    // Sunucu bunu alır ve HERKESE (io.emit) geri yollar
    io.emit('herkes_icin_zar', veri); 
  });

  socket.on('disconnect', () => {
    console.log('Birisi ayrıldı.');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
