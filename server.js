const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// 'public' klasöründeki dosyaları (html, resim, ses) internete aç
app.use(express.static('public'));

// Birisi siteye bağlandığında
io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı');

  // İleride buraya zar atma kodlarını ekleyeceğiz
  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});