# 🗺️ API Wilayah Indonesia ![Static Badge](https://img.shields.io/badge/status-active-brightgreen) ![Static Badge](https://img.shields.io/badge/data-static%20JSON-blue)

API untuk data wilayah Indonesia (provinsi, kabupaten/kota, kecamatan, desa/kelurahan) yang bekerja dengan file statis JSON.

---

## 🚀 Fitur Utama

- ✅ **Tanpa Database** – Gunakan file statis JSON.
- ⚡ **Pencarian Cepat** – In-memory indexing.
- 🌐 **Hierarki Lengkap** – Navigasi antar tingkatan wilayah.
- 🔍 **Fuzzy Search** – Temukan wilayah meskipun ada typo.
- 🧬 **Concatenated ID** – Auto-decode ID wilayah terstruktur.

---

## 📦 Persyaratan

- **Node.js** v18+
- **PHP** 8.0+ (untuk generator)
- **NPM**

---

## ⚙️ Instalasi

### 1. Clone repositori

```bash
git clone https://github.com/username/wilayah-indonesia-api.git
cd wilayah-indonesia-api 
```

---

### 2. Install dependencies
```bash
npm install
composer install
```

---

### 3. Generate file JSON dari CSV
```bash
npm run generate
```

---

## 🔗 Endpoint API
### 📍 Daftar Wilayah
```
GET /api/provinces

GET /api/regencies

GET /api/districts

GET /api/villages
```

#### Contoh Response
```json

{
  "success": true,
  "data": [
    {
      "id": "31",
      "name": "DKI JAKARTA"
    },
    //dst...
  ]
}
```
### 🧾 Detail Wilayah
```
GET /api/provinces/{id}
```
```
GET /api/regencies/{id}
```
```
GET /api/districts/{id}
```
```
GET /api/villages/{id}
```

---

## 🧭 Wilayah Berdasarkan Parent
```
GET /api/regencies/province/{province_id}
```
```
GET /api/districts/regency/{regency_id}
```
```
GET /api/villages/district/{district_id}
```
---

## 🔡 Concatenated ID Lookup
```
GET /api/wilayah?q=1101010001
```
### Panjang ID	Keterangan
2 digit	Provinsi
4 digit	Kabupaten/Kota
7 digit	Kecamatan
10 digit	Desa/Kelurahan

## 🔎 Pencarian
```
GET /api/search?query=jakarta
```
Parameter Opsional
type: provinces, regencies, districts, villages

limit: Jumlah hasil (default: 10)

## 🔄 Pembaruan Data
### Update file CSV di folder data/

#### Jalankan:

```bash
npm run generate
```
---
## ⚙️ Environment Variables
### Buat file .env:

```env
NODE_ENV=production
PORT=3000
ENABLE_CACHE=true
```
---
## 📄 Lisensi
MIT License

