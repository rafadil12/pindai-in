# Urutan pembuatan Pindai In

Pindai In dibangun dari atas ke bawah. Milestone berikutnya memakai hasil yang sudah jalan di milestone sebelumnya.

Yang ada di kode sekarang: **M2 — Barcode dan berkas Excel**.

| | Milestone | Hasil yang terlihat |
|---|---|---|
| selesai | [M1 Saluran langsung](#m1--saluran-langsung) | QR di komputer, teks dari HP masuk ke tabel |
| sekarang | [M2 Barcode dan Excel](#m2--barcode-dan-berkas-excel) | Kamera membaca kode barang, tabel diunduh sebagai `.xlsx` |
| | [M3 Formulir pekerjaan](#m3--formulir-pekerjaan) | Satu pekerjaan punya formulir sendiri |
| | [M4 Antrean offline](#m4--antrean-offline) | Sinyal putus tidak menghilangkan kiriman |
| | [M5 Terkunci di perangkat](#m5--terkunci-di-perangkat) | Server hanya meneruskan isi yang terkunci |
| | [M6 Google Sheets](#m6--google-sheets) | Baris masuk ke spreadsheet yang dipilih |
| | [M7 Excel dan Word](#m7--excel-dan-word) | Add-in menulis ke dokumen yang sedang terbuka |
| | [M8 Foto dan lokasi](#m8--foto-dan-lokasi) | Kiriman bisa membawa foto dan titik GPS |
| | [M9 NFC dan OCR](#m9--nfc-dan-ocr) | Nilai terisi dari tag NFC atau teks di kamera |

## M1 — Saluran langsung

Komputer dan HP masuk ke satu sesi. HP mengirim teks. Baris muncul di komputer tanpa memuat ulang halaman.

Selesai ketika:

- Penerima membuat sesi dan menampilkan QR beserta kode 6 karakter.
- Tautan di QR membuka halaman kirim.
- Teks yang dikirim muncul di tabel penerima lewat saluran yang sama.
- ID kiriman yang sama tidak menambah baris kedua.
- Beberapa HP bisa masuk ke satu QR, dan jumlah pengirim terlihat di penerima.

Batas tahap ini: isi kiriman masih teks. Sesi disimpan di memori server dan hilang saat server dimatikan. Server masih bisa membaca isi pesan.

## M2 — Barcode dan berkas Excel

Halaman kirim membaca barcode dan QR barang lewat kamera. QR untuk pairing di M1 tetap tautan yang dibuka kamera HP, bukan pemindai di dalam halaman.

Selesai ketika:

- Kamera mengisi nilai dari barcode atau QR, dan nilai itu masih bisa dikoreksi sebelum dikirim.
- Ketik manual dari M1 tetap bisa dipakai.
- Penerima mengunduh `.xlsx` yang berisi waktu dan isi setiap baris.

## M3 — Formulir pekerjaan

Satu jenis pekerjaan punya satu formulir. Definisi formulir disimpan sebagai JSON, dan HP menggambar layar dari situ.

Selesai ketika:

- Formulir bisa disusun dari teks, angka, tanggal, centang, pilihan, dan barcode dari M2.
- Satu kiriman menjadi satu baris dengan banyak kolom.
- Mengganti formulir mengubah layar HP tanpa mengubah saluran di M1.

Foto, GPS, NFC, dan OCR belum masuk di tahap ini.

## M4 — Antrean offline

HP menyimpan kiriman dulu di perangkat, lalu mengirim saat ada sambungan.

Selesai ketika:

- Menutup jaringan tidak membuang kiriman yang baru diisi.
- Kiriman yang tertahan berstatus antre, lalu terkirim setelah sambungan kembali.
- Server membalas dengan ID yang sama, dan kiriman ulang tidak menambah baris baru.

## M5 — Terkunci di perangkat

QR membawa kunci penerima. HP mengunci isi sebelum meninggalkan perangkat. Komputer yang memegang kunci membuka isi itu untuk ditampilkan.

Selesai ketika:

- Isi yang lewat dan tersimpan di server tidak terbaca sebagai teks asli.
- Penerima yang berpasangan menampilkan teks aslinya di tabel.
- Memutus saluran dan menyambung lagi tetap bisa membuka kiriman yang sudah terkunci.

## M6 — Google Sheets

Baris yang sudah terbuka di penerima ditulis ke spreadsheet.

Selesai ketika:

- Pengguna memilih spreadsheet tujuan.
- Kiriman dari HP menambah baris di spreadsheet itu.
- Kolom mengikuti formulir dari M3.

## M7 — Excel dan Word

Add-in Office menjadi penerima tambahan. Saluran dan bentuk pesan dari milestone sebelumnya tidak diganti.

Selesai ketika:

- Add-in Excel menambah baris di lembar yang sedang terbuka.
- Add-in Word menambah baris pada tabel dokumen yang sedang terbuka.
- Satu HP bisa memasok Excel dan Word yang sudah dipasangkan.

## M8 — Foto dan lokasi

Formulir mendapat dua jenis isian baru.

Selesai ketika:

- Isian foto mengambil gambar dari kamera HP dan gambarnya sampai di penerima.
- Isian lokasi mengirim titik GPS bersama kiriman.
- Kedua isian tetap mengikuti antrean M4 dan kunci M5.

## M9 — NFC dan OCR

Dua cara isi nilai, setelah foto dan lokasi sudah jalan.

Selesai ketika:

- Isian NFC mengisi nilai dari tag yang ditempel ke HP.
- Isian OCR mengisi nilai dari teks yang terlihat di kamera.
- Keduanya masuk sebagai kolom formulir, sama seperti barcode di M3.
