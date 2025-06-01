const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    // State
    const provinces = ref([]);
    const regencies = ref([]);
    const districts = ref([]);
    const villages = ref([]);
    const selectedProvince = ref('');
    const selectedRegency = ref('');
    const selectedDistrict = ref('');
    const selectedVillage = ref('');
    const selectedArea = ref(null);
    const hierarchyData = ref(null);
    const searchQuery = ref('');
    const searchType = ref('all');
    const searchResults = ref([]);
    const searchIndex = ref(null);
    const concatenatedId = ref('');
    const concatenatedResults = ref(null);
    const isLoading = ref(false);
    const lastUpdated = ref('');

    // Inisialisasi data
    const initData = async () => {
      try {
        isLoading.value = true;
        
        // Load semua data utama
        const [provs, regs, dists, vills] = await Promise.all([
          fetchData('provinces.json'),
          fetchData('regencies.json'),
          fetchData('districts.json'),
          fetchData('villages.json')
        ]);
        
        provinces.value = provs;
        regencies.value = regs;
        districts.value = dists;
        villages.value = vills;
        
        // Buat search index
        createSearchIndex(provs, regs, dists, vills);
        
        
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Fetch data dari file JSON
    const fetchData = async (file) => {
      const response = await fetch(`api/${file}`);
      return await response.json();
    };

    // Buat search index dengan Fuse.js
    const createSearchIndex = (provs, regs, dists, vills) => {
      const allData = [
        ...provs.map(p => ({ ...p, type: 'province' })),
        ...regs.map(r => ({ ...r, type: 'regency' })),
        ...dists.map(d => ({ ...d, type: 'district' })),
        ...vills.map(v => ({ ...v, type: 'village' }))
      ];
      
      searchIndex.value = new Fuse(allData, {
        keys: ['name', 'id'],
        threshold: 0.4,
        includeScore: true
      });
    };

    // Pencarian wilayah
    const searchWilayah = () => {
      if (!searchQuery.value || !searchIndex.value) {
        searchResults.value = [];
        return;
      }
      
      let results = searchIndex.value.search(searchQuery.value);
      
      // Filter berdasarkan tipe jika dipilih
      if (searchType.value !== 'all') {
        results = results.filter(r => r.item.type === searchType.value);
      }
      
      // Ambil 10 hasil terbaik
      searchResults.value = results.slice(0, 10).map(r => r.item);
    };

    // Pilih hasil pencarian
    const selectSearchResult = async (result) => {
      selectedArea.value = result;
      searchQuery.value = '';
      searchResults.value = [];
      
      // Load hierarchy data
      await loadHierarchyData(result);
    };

    // Load data hierarki
    const loadHierarchyData = async (area) => {
      try {
        hierarchyData.value = {};
        
        if (area.type === 'village') {
          const districtId = area.id.substring(0, 7);
          const regencyId = area.id.substring(0, 4);
          const provinceId = area.id.substring(0, 2);
          
          const [district, regency, province] = await Promise.all([
            fetchData(`district/${districtId}.json`),
            fetchData(`regency/${regencyId}.json`),
            fetchData(`province/${provinceId}.json`)
          ]);
          
          hierarchyData.value = {
            district: district.name,
            regency: regency.name,
            province: province.name
          };
        } else if (area.type === 'district') {
          const regencyId = area.id.substring(0, 4);
          const provinceId = area.id.substring(0, 2);
          
          const [regency, province] = await Promise.all([
            fetchData(`regency/${regencyId}.json`),
            fetchData(`province/${provinceId}.json`)
          ]);
          
          hierarchyData.value = {
            regency: regency.name,
            province: province.name
          };
        } else if (area.type === 'regency') {
          const provinceId = area.id.substring(0, 2);
          const province = await fetchData(`province/${provinceId}.json`);
          hierarchyData.value = { province: province.name };
        }
      } catch (error) {
        console.error('Gagal memuat hierarki:', error);
      }
    };

    // Load kabupaten berdasarkan provinsi
    const loadRegencies = async () => {
      selectedRegency.value = '';
      selectedDistrict.value = '';
      selectedVillage.value = '';
      selectedArea.value = null;
      
      if (!selectedProvince.value) {
        regencies.value = [];
        return;
      }
      
      try {
        const data = await fetchData(`regencies/${selectedProvince.value}.json`);
        regencies.value = data;
      } catch (error) {
        console.error('Gagal memuat kabupaten:', error);
        regencies.value = [];
      }
    };

    // Load kecamatan berdasarkan kabupaten
    const loadDistricts = async () => {
      selectedDistrict.value = '';
      selectedVillage.value = '';
      selectedArea.value = null;
      
      if (!selectedRegency.value) {
        districts.value = [];
        return;
      }
      
      try {
        const data = await fetchData(`districts/${selectedRegency.value}.json`);
        districts.value = data;
      } catch (error) {
        console.error('Gagal memuat kecamatan:', error);
        districts.value = [];
      }
    };

    // Load desa berdasarkan kecamatan
    const loadVillages = async () => {
      selectedVillage.value = '';
      selectedArea.value = null;
      
      if (!selectedDistrict.value) {
        villages.value = [];
        return;
      }
      
      try {
        const data = await fetchData(`villages/${selectedDistrict.value}.json`);
        villages.value = data;
      } catch (error) {
        console.error('Gagal memuat desa:', error);
        villages.value = [];
      }
    };

    // Pilih wilayah dari dropdown
    const selectArea = async (type) => {
      let areaId, areaData;
      
      switch (type) {
        case 'province':
          areaId = selectedProvince.value;
          if (!areaId) return;
          areaData = provinces.value.find(p => p.id === areaId);
          break;
        case 'regency':
          areaId = selectedRegency.value;
          if (!areaId) return;
          areaData = regencies.value.find(r => r.id === areaId);
          break;
        case 'district':
          areaId = selectedDistrict.value;
          if (!areaId) return;
          areaData = districts.value.find(d => d.id === areaId);
          break;
        case 'village':
          areaId = selectedVillage.value;
          if (!areaId) return;
          areaData = villages.value.find(v => v.id === areaId);
          break;
      }
      
      if (areaData) {
        selectedArea.value = { ...areaData, type };
        await loadHierarchyData(selectedArea.value);
      }
    };

    // Lookup concatenated ID
    const lookupConcatenatedId = async () => {
      if (!concatenatedId.value || !/^\d{10}$/.test(concatenatedId.value)) {
        concatenatedResults.value = null;
        return;
      }
      
      const id = concatenatedId.value;
      const ids = {
        province: id.substring(0, 2),
        regency: id.substring(0, 4),
        district: id.substring(0, 7),
        village: id
      };
      
      try {
        const [province, regency, district, village] = await Promise.all([
          fetchData(`province/${ids.province}.json`),
          fetchData(`regency/${ids.regency}.json`),
          fetchData(`district/${ids.district}.json`),
          fetchData(`village/${ids.village}.json`).catch(() => null)
        ]);
        
        concatenatedResults.value = {
          province: { ...province, id: ids.province },
          regency: { ...regency, id: ids.regency },
          district: { ...district, id: ids.district },
          village: village ? { ...village, id: ids.village } : null
        };
        
        // Set selected area
        selectedArea.value = village ? 
          { ...village, type: 'village' } : 
          { ...district, type: 'district' };
          
        await loadHierarchyData(selectedArea.value);
      } catch (error) {
        console.error('Gagal memuat data:', error);
        concatenatedResults.value = null;
      }
    };

    // Watch for dropdown changes
    const watchSelections = () => {
      watch(selectedProvince, selectArea.bind(null, 'province'));
      watch(selectedRegency, selectArea.bind(null, 'regency'));
      watch(selectedDistrict, selectArea.bind(null, 'district'));
      watch(selectedVillage, selectArea.bind(null, 'village'));
    };

    // Initialize
    onMounted(() => {
      initData();
      watchSelections();
    });

    return {
      provinces,
      regencies,
      districts,
      villages,
      selectedProvince,
      selectedRegency,
      selectedDistrict,
      selectedVillage,
      selectedArea,
      hierarchyData,
      searchQuery,
      searchType,
      searchResults,
      concatenatedId,
      concatenatedResults,
      isLoading,
      lastUpdated,
      searchWilayah,
      selectSearchResult,
      loadRegencies,
      loadDistricts,
      loadVillages,
      lookupConcatenatedId
    };
  }
}).mount('#app');