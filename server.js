const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

// --- AKILLI DOSYA BULMA SİSTEMİ ---
// 1. Önce 'public' klasörüne bak
app.use(express.static(path.join(__dirname, 'public')));

// 2. Bulamazsan ana klasöre bak
app.use(express.static(__dirname));

// 3. Ana sayfaya girildiğinde index.html'i zorla
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
        res.send('HATA: index.html dosyası bulunamadı!');
    }
});

// --- OYUN BAĞLANTILARI ---
io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı: ' + socket.id);

  // 1. ZAR ATMA OLAYI
  socket.on('zar_atildi', (veri) => {
    // Zarı atan kişi zaten sonucunu görüyor.
    // Bu yüzden "broadcast" kullanarak zarı atan HARİÇ herkese yolluyoruz.
    socket.broadcast.emit('herkes_icin_zar', veri); 
  });

  // 2. KARAKTER GÜNCELLEME OLAYI (YENİ)
  socket.on('party_update', (yeniVeri) => {
    // Listeyi biri güncellediğinde, diğer herkesin ekranını güncelliyoruz.
    socket.broadcast.emit('party_update_client', yeniVeri);
  });

  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
