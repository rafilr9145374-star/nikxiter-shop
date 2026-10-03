# NIKXITER SHOP — Web Order Online

Website toko versi web dari alur bot NIKXITER. Pembeli bisa pilih produk/durasi, buat order, bayar via QRIS, upload bukti pembayaran, cek status order, dan menerima key setelah admin approve. Admin punya panel untuk order, bukti pembayaran, approve/reject, harga, status produk, kelola produk, toggle toko, dan restock key.

## Fitur pembeli
- Produk & durasi mengikuti data dari bot.
- Quantity 1–10.
- Checkout nama + WhatsApp.
- ID pembayaran otomatis `NX-XXXXXX`.
- QRIS dari aset toko.
- Upload bukti pembayaran JPG/PNG/WEBP maksimal 8 MB.
- Halaman cek status order.
- Setelah admin approve, key otomatis diambil dari stok dan tampil di order.

## Fitur admin
- Login admin.
- Dashboard + jumlah bukti yang menunggu verifikasi.
- Notifikasi browser saat ada bukti baru (jika izin browser diberikan).
- Lihat bukti pembayaran.
- Approve/reject pembayaran.
- Auto-potong stok key saat approve.
- Atur harga.
- ON / MAINTENANCE / PATCH.
- Toggle toko.
- Tambah/ubah/hapus produk.
- Restock key, satu key per baris atau `Key: 12345`.

## Jalankan lokal
1. Node.js 18+.
2. `npm install`
3. Copy `.env.example` menjadi `.env` dan isi password admin.
4. `npm start`
5. Buka `http://localhost:3000`.

## Deploy online
Project sudah disiapkan untuk hosting Node.js dan persistent disk. `render.yaml` menggunakan persistent disk agar data order dan bukti pembayaran tidak hilang saat service restart/redeploy.

### Render
1. Upload folder ini ke GitHub.
2. Di Render pilih **New → Blueprint** lalu pilih repository.
3. Isi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di Environment.
4. Deploy.
5. Render akan memberi URL `*.onrender.com` yang bisa dibagikan ke pembeli.

Catatan: konfigurasi `render.yaml` memakai persistent disk (`starter`) supaya order/upload tetap tersimpan. Jangan memakai filesystem sementara untuk toko produksi.

## Pembayaran
QRIS yang dipakai adalah QRIS statis dari aset toko. Website tidak bisa mengetahui uang masuk hanya dari gambar QRIS. Alur saat ini: pembeli bayar → upload bukti → admin cek → approve/reject. Jika ingin verifikasi otomatis tanpa upload bukti, perlu payment gateway yang menyediakan webhook.

## Keamanan
- Password admin disimpan sebagai environment variable, bukan di frontend.
- Jangan commit `.env` atau credential produksi.
- Bukti pembayaran disimpan di folder upload pada persistent disk hosting.
