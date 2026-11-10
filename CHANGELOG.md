# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.

Formatnya mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-10

### Added

- Halaman kirim membaca barcode dan QR lewat kamera, dan nilainya masih bisa diubah sebelum dikirim.
- Kode bisa diambil dari foto bila kamera langsung tidak tersedia.
- Penerima mengunduh tabel sebagai berkas Excel berisi nomor, waktu, dan isi.
- Sesi baru di laptop menutup sesi di HP, lalu HP meminta kode sesi yang baru.
- Tombol NFC mengisi teks dari tag. Kalau tag tidak berisi teks, yang diisi adalah UID chip.

### Changed

- Server pengembangan melayani HTTPS supaya Chrome di Android bisa membaca NFC.

### Fixed

- ID kiriman tetap dibuat saat halaman dibuka lewat alamat IP.

## [0.1.0] - 2026-11-10

### Added

- Halaman penerima membuat sesi, lalu menampilkan QR dan kode 6 karakter.
- HP yang membuka tautan QR dapat mengirim teks, dan barisnya langsung muncul di tabel penerima.
- Kiriman dengan ID yang sama tidak menambah baris kedua.
- Beberapa HP dapat masuk ke satu sesi, dan jumlah pengirim terlihat di penerima.
- Server menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
