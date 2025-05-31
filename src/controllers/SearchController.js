import path from 'path';
import { readJSON } from '../utils/fileHelper.js';
import Fuse from 'fuse.js'; // Library fuzzy search

export default class SearchController {
  constructor() {
    this.basePath = path.resolve('static');
    this.searchIndex = {};
    this.initSearchIndex();
  }

  async initSearchIndex() {
    // Load semua data untuk diindeks
    const [provinces, regencies, districts, villages] = await Promise.all([
      this.loadAllData('provinces.json'),
      this.loadAllData('regencies.json'),
      this.loadAllData('districts.json'),
      this.loadAllData('villages.json')
    ]);

    // Konfigurasi Fuse.js untuk setiap tipe wilayah
    const fuseOptions = {
      keys: ['name', 'id'],
      threshold: 0.4,
      includeScore: true
    };

    // Buat indeks pencarian
    this.searchIndex = {
      provinces: new Fuse(provinces, fuseOptions),
      regencies: new Fuse(regencies, fuseOptions),
      districts: new Fuse(districts, fuseOptions),
      villages: new Fuse(villages, fuseOptions),
      all: new Fuse([...provinces, ...regencies, ...districts, ...villages], fuseOptions)
    };
  }

  async loadAllData(filename) {
    try {
      return await readJSON(path.join(this.basePath, filename));
    } catch (error) {
      console.error(`Gagal memuat data ${filename}:`, error);
      return [];
    }
  }

  async searchWilayah(req, res) {
    const { query, type, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Parameter query diperlukan'
      });
    }

    try {
      // Jika type tidak ditentukan, cari di semua tipe
      const searchTypes = type 
        ? [type.toLowerCase()] 
        : ['provinces', 'regencies', 'districts', 'villages'];

      const results = {};
      let totalResults = 0;

      for (const type of searchTypes) {
        if (!this.searchIndex[type]) continue;
        
        const searchResults = this.searchIndex[type]
          .search(query)
          .slice(0, limit)
          .map(result => ({
            ...result.item,
            score: result.score,
            type: type.slice(0, -1) // Hapus 's' di akhir (provinces -> province)
          }));

        if (searchResults.length > 0) {
          results[type] = searchResults;
          totalResults += searchResults.length;
        }
      }

      res.json({
        success: true,
        query,
        totalResults,
        results,
        suggestions: this.generateSuggestions(results)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat melakukan pencarian'
      });
    }
  }

  generateSuggestions(results) {
    const suggestions = [];
    
    // Gabungkan semua hasil
    const allResults = Object.values(results).flat();

    // Urutkan berdasarkan skor (yang terbaik pertama)
    allResults.sort((a, b) => a.score - b.score);

    // Ambil 5 teratas
    return allResults.slice(0, 5).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      hierarchy: this.getHierarchy(item)
    }));
  }

  async getHierarchy(item) {
    try {
      switch (item.type) {
        case 'village':
          const district = await readJSON(path.join(this.basePath, 'district', `${item.id.substring(0, 7)}.json`));
          const regency = await readJSON(path.join(this.basePath, 'regency', `${item.id.substring(0, 4)}.json`));
          const province = await readJSON(path.join(this.basePath, 'province', `${item.id.substring(0, 2)}.json`));
          return {
            district: district.name,
            regency: regency.name,
            province: province.name
          };
        
        case 'district':
          const parentRegency = await readJSON(path.join(this.basePath, 'regency', `${item.id.substring(0, 4)}.json`));
          const parentProvince = await readJSON(path.join(this.basePath, 'province', `${item.id.substring(0, 2)}.json`));
          return {
            regency: parentRegency.name,
            province: parentProvince.name
          };
        
        case 'regency':
          const parentProv = await readJSON(path.join(this.basePath, 'province', `${item.id.substring(0, 2)}.json`));
          return {
            province: parentProv.name
          };
        
        default:
          return {};
      }
    } catch (error) {
      console.error('Gagal mendapatkan hierarki:', error);
      return {};
    }
  }
}