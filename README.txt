# WebGIS Pendaftaran Tanah

## Isi proyek
- `index.html`: halaman utama WebGIS
- `css/style.css`: tampilan aplikasi
- `js/main.js`: logika peta, layer, popup, pencarian, dan tabel
- `data/peta_kerja.geojson`: data dari `2.gpkg`
- `data/hasil_ukur.geojson`: data dari `1.gpkg`
- `data/perbandingan.json`: perbandingan luas berdasarkan nama bidang

## Catatan sistem koordinat
Anda mengonfirmasi CRS sebenarnya adalah EPSG:32748 (WGS 84 / UTM zone 48S).
Metadata internal kedua GeoPackage menyatakan EPSG:4326, tetapi nilai koordinatnya berupa angka UTM (Easting sekitar 534 ribu dan Northing sekitar 9,4 juta). Untuk proyek ini CRS sumber ditetapkan/di-override menjadi EPSG:32748, luas dihitung dalam meter persegi pada CRS tersebut, lalu salinan GeoJSON ditransformasikan ke EPSG:4326 agar dapat ditampilkan oleh Leaflet.

## Cara menjalankan di Windows
1. Ekstrak ZIP ke sebuah folder.
2. Pastikan Python sudah terpasang.
3. Buka Command Prompt di folder `webgis_pendaftaran_tanah`.
4. Jalankan:
   `py -m http.server 8000`
   Jika perintah `py` tidak tersedia, coba `python -m http.server 8000`.
5. Buka browser ke:
   `http://localhost:8000`

Jangan membuka `index.html` dengan double-click karena browser dapat memblokir pembacaan GeoJSON lokal.

## Data dan batasan
- `1.gpkg` diperlakukan sebagai hasil ukur.
- `2.gpkg` diperlakukan sebagai peta kerja.
- Hasil ukur berisi 5 bidang; peta kerja berisi 6 bidang.
- `Bidang3` hanya ada pada peta kerja sehingga tidak memiliki pasangan untuk perbandingan.
- Selisih luas dihitung sebagai luas hasil ukur dikurangi luas digitasi.
- Nilai RMSE 3,211746 ditampilkan sesuai nilai pada RMS.xlsx. Nilai tersebut belum diverifikasi ulang; periksa kembali pasangan titik dan rumus sebelum digunakan sebagai hasil final laporan.
- Peta dasar OpenStreetMap dan library Leaflet dimuat dari internet, sehingga koneksi internet diperlukan untuk basemap dan library CDN.

## Pengembangan berikutnya
Bisa ditambahkan layer titik koordinat, garis penghubung titik bersesuaian, grafik selisih luas, dan evaluasi RMSE per titik setelah pasangan titik dikonfirmasi.
