# Pindai In

Aplikasi tangkap data di HP yang masuk langsung ke komputer. Urutan pembuatannya ada di [MILESTONES.md](MILESTONES.md). Yang berjalan sekarang adalah M3: laptop menyusun formulir pekerjaan, dan HP menggambar isian dari situ. Satu kiriman menjadi satu baris dengan banyak kolom. QR untuk memasangkan HP tetap tautan yang dibuka kamera HP.

## Menjalankan

```bash
npm install
npm run dev
```

Buka https://localhost:5173 di komputer. Chrome memperingatkan sertifikat pengembangan; pilih lanjutkan. Halaman itu menampilkan QR dan kode sesi.

HP harus satu Wi-Fi dengan komputer. Pindai QR dengan kamera HP, atau buka alamat https yang tertulis di bawah QR. Di HP, Chrome menampilkan peringatan yang sama: ketuk Lanjutan, lalu Kunjungi situs. Alamat `http://` tidak dipakai lagi.

Tombol **Pindai kode** memakai kamera langsung di `localhost` atau HTTPS. Lewat alamat IP, pakai **Ambil foto kode**. Nilai yang terisi masih bisa diubah sebelum dikirim.

Di laptop, bagian **Susunan isian** mengatur nama formulir dan isiannya: teks, angka, tanggal, centang, pilihan, atau barcode. **Pakai formulir** mengganti layar HP tanpa membuat sesi baru.

**Sesi baru** di laptop menutup sesi yang sedang dipegang HP. HP lalu menampilkan **Pindai kode sesi** untuk QR yang baru, atau kolom kode 6 karakter. **Tempel tag NFC** mengisi isian yang sedang dipilih. Kalau tidak ada yang dipilih, isian teks pertama yang terisi. Tag tanpa teks mengisi UID chip. Itu hanya jalan di Chrome Android setelah peringatan sertifikat diterima. iPhone tidak bisa membaca NFC dari halaman web.

## Isi repo

- `server` menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
- `web` berisi halaman penerima dan halaman kirim.
- `shared` berisi bentuk pesan yang dipakai keduanya.
