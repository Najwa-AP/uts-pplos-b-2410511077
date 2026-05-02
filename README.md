# uts-pplos-b-2410511077
UTS SE KELAS B SEMESTER 4

## Identitas 
Nama: Najwa Azahra Putri

NIM: 2410511077

Kelas: SE-B

## Panduan Instalasi dan Penggunaan
Sistem Pengaduan Mahasiswa ini dibangun dengan arsitektur microservices untuk mengelola pengaduan akademik/non-akademik, alur disposisi, hingga rating kepuasan. Proyek ini mengintegrasikan 3 layanan utama, yaitu Auth Service (Node.js) untuk keamanan, Complaints Service (PHP Native) untuk logika utama menangani komplain, dan Logs Service (Node.js) untuk pencatatan aktivitas sistem komplain.

### 1. Persiapan Environment.
Sebelum menjalankan layanan, pastikan telah mengonfigurasi file .env dan config.js di setiap folder service sesuai dengan kredensial database MySQL masing-masing. Pastikan juga semua service terhubung ke database yang sama agar sinkronisasi data terjaga.

### 2. Menjalankan XAMPP.
Sebelum menjalankan perintah untuk menyalakan service, pastikan terlebih dahulu start service Apache dan MySQL. Ini bertujuan supaya masing-masing service bisa terhubung ke database di Phpmyadmin.

### 3. Menjalankan Auth Service & Logs Service (Node.js).
Kedua layanan ini berbasis Node.js. Masuk ke direktori utama proyek melalui terminal, kemudian instal seluruh dependencies yang diperlukan dengan perintah:

`npm install`

Setelah proses instalasi selesai, buka 2 terminal terpisah dan jalankan masing-masing layanan menggunakan perintah:

`node gateway.js` (berjalan di port 4000), 

`node auth.js` (berjalan di port 4001), 

`node logs.js` (berjalan di port 4003).

Pastikan masuk ke dalam folder masing-masing sebelum eksekusi kode diatas untuk menghindari nilai .env masing-masing yang jadi undefined bila di-run di luar folder mereka sendiri.

### 4. Menjalankan Complaints Service (PHP Native)
Layanan pengaduan menggunakan PHP Native. Pastikan PHP sudah terinstal di sistem. Untuk menjalankan layanan ini agar bisa diakses oleh API Gateway, gunakan fitur built-in web server PHP dengan menjalankan perintah berikut di terminal pada folder complaints:

`php -S localhost:4002`

Dengan perintah ini, layanan Complaints akan siap menerima request dari API Gateway maupun instruksi log ke Logs Service.

## Endpoint
### Auth-service:
#### Public:
GET http://localhost:4000/auth/github (login dengan Github OAuth).✅

GET http://localhost:4000/auth/github/callback (halaman redirect jika berhasil login pakai Github OAuth). ✅

POST http://localhost:4000/auth/refresh-token (buat refresh token jika tokennya sudah expired).✅

POST http://localhost:4000/auth/register (regist manual user ke db dengan input (username, email, password)).✅

POST http://localhost:4000/auth/login (buat login manual jika sudah berhasil register).✅

POST http://localhost:4000/auth/logout (buat logout user).✅

#### Protected:
GET http://localhost:4000/auth/profile (nampilin data user bila user berhasil verifikasi diri). ✅

### Complaints:
#### Protected:
GET http://localhost:4000/complaints?page=1&per_page=2&status=Pending (nampilin semua pengaduan yang sesuai dengan statusnya, dilengkapi paging (page & per_page) dan filtering (unit_id/status)).✅

POST http://localhost:4000/complaints (buat pengaduan baru).✅

POST http://localhost:4000/complaints/rate (kasih rating pengaduan yang statusnya “Resolved”).✅

GET http://localhost:4000/complaints/view?id={id} (nampilin pengaduan berdasarkan id nya). ✅

### Logs:
#### Protected:
POST http://localhost:4000/logs (buat log baru).✅

GET http://localhost:4000/logs /{complaint_id} (nampilin log berdasarkan id nya).✅


## Link Youtube
https://youtu.be/b7uMgjkenNE?si=uVhWDF7E65ZFhNQd