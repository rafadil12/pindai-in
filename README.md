# Pindai In

Aplikasi tangkap data di HP yang masuk langsung ke komputer. Urutan pembuatannya ada di [MILESTONES.md](MILESTONES.md). Yang berjalan sekarang adalah M2: halaman kirim membaca barcode atau QR, dan penerima mengunduh tabel sebagai `.xlsx`. QR untuk memasangkan HP tetap tautan yang dibuka kamera HP.

## Menjalankan

```bash
npm install
npm run dev
```

Buka https://localhost:5173 di komputer. Chrome memperingatkan sertifikat pengembangan; pilih lanjutkan. Halaman itu menampilkan QR dan kode sesi.

HP harus satu Wi-Fi dengan komputer. Pindai QR dengan kamera HP, atau buka alamat https yang tertulis di bawah QR. Di HP, Chrome menampilkan peringatan yang sama: ketuk Lanjutan, lalu Kunjungi situs. Alamat `http://` tidak dipakai lagi.

Tombol **Pindai kode** memakai kamera langsung di `localhost` atau HTTPS. Lewat alamat IP, pakai **Ambil foto kode**. Nilai yang terisi masih bisa diubah sebelum dikirim.

**Sesi baru** di laptop menutup sesi yang sedang dipegang HP. HP lalu menampilkan **Pindai kode sesi** untuk QR yang baru, atau kolom kode 6 karakter. **Tempel tag NFC** mengisi teks yang tersimpan di tag. Kalau tag tidak berisi teks, yang diisi adalah UID chip. Itu hanya jalan di Chrome Android setelah peringatan sertifikat diterima. iPhone tidak bisa membaca NFC dari halaman web.

## Isi repo

- `server` menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
- `web` berisi halaman penerima dan halaman kirim.
- `shared` berisi bentuk pesan yang dipakai keduanya.
