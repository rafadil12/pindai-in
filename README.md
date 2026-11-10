# Pindai In

Aplikasi tangkap data di HP yang masuk langsung ke komputer. Urutan pembuatannya ada di [MILESTONES.md](MILESTONES.md). Yang berjalan sekarang adalah M2: halaman kirim membaca barcode atau QR, dan penerima mengunduh tabel sebagai `.xlsx`. QR untuk memasangkan HP tetap tautan yang dibuka kamera HP.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173 di komputer. Halaman itu menampilkan QR dan kode sesi.

HP harus satu Wi-Fi dengan komputer. Pindai QR dengan kamera HP, atau buka alamat yang tertulis di bawah QR. Alamat itu memakai IP komputer, jadi halaman kirim bisa dibuka dari HP. Kalau Windows meminta izin jaringan untuk Node, izinkan di jaringan privat.

Tombol **Pindai kode** memakai kamera langsung di `localhost` atau HTTPS. Lewat alamat IP biasa, pakai **Ambil foto kode**. Nilai yang terisi masih bisa diubah sebelum dikirim.

**Sesi baru** di laptop menutup sesi yang sedang dipegang HP. HP lalu menampilkan **Pindai kode sesi** untuk QR yang baru, atau kolom kode 6 karakter. **Tempel tag NFC** mengisi nilai dari tag, dan hanya jalan di Chrome Android lewat HTTPS.

## Isi repo

- `server` menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
- `web` berisi halaman penerima dan halaman kirim.
- `shared` berisi bentuk pesan yang dipakai keduanya.
