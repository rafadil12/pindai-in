# Changelog

Semua perubahan penting pada proyek ini dicatat di file ini.

Formatnya mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-10

### Added

- Halaman penerima membuat sesi, lalu menampilkan QR dan kode 6 karakter.
- HP yang membuka tautan QR dapat mengirim teks, dan barisnya langsung muncul di tabel penerima.
- Kiriman dengan ID yang sama tidak menambah baris kedua.
- Beberapa HP dapat masuk ke satu sesi, dan jumlah pengirim terlihat di penerima.
- Server menyimpan sesi di memori dan meneruskan kiriman lewat WebSocket.
