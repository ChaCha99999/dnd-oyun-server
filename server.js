const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');


// 1. Önce 'public' klasörüne bak (Standart Yöntem)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Bulamazsan ana klasöre bak (Eğer public klasörü oluşmadıysa kurtarıcı)
app.use(express.static(__dirname));

// 3. Hala bulamazsan ve ana sayfaya girildiyse, elle index.html'i zorla
app.get('/', (req, res) => {
    const fs = require('fs');
    // Public içinde index.html var mı?
    if (fs.existsSync(path.join(__dirname, 'public', 'index.html'))) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } 
    // Yoksa ana dizinde index.html var mı?
    else if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
    else {
        res.send('HATA: index.html dosyası bulunamadı! Lütfen dosya adının "index.html" olduğundan emin olun.');
    }
});

// --- OYUN BAĞLANTILARI ---
io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı');
  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
