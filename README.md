# Pindai In

Aplikasi tangkap data di HP yang masuk langsung ke komputer. Urutan pembuatannya ada di [MILESTONES.md](MILESTONES.md). Yang berjalan sekarang adalah M1: QR pairing, kirim teks, dan tabel langsung.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173 di komputer. Halaman itu menampilkan QR dan kode sesi.

HP harus satu Wi-Fi dengan komputer. Pindai QR dengan kamera HP, atau buka alamat yang tertulis di bawah QR. Alamat itu memakai IP komputer, jadi halaman kirim bisa dibuka dari HP. Kalau Windows meminta izin jaringan untuk Node, izinkan di jaringan privat.

## Isi repo

- `server` menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
- `web` berisi halaman penerima dan halaman kirim.
- `shared` berisi bentuk pesan yang dipakai keduanya.
