class AddressService {
  constructor() {
    this.cache = {
      provinces: null,
      amphures: null,
      tambons: null
    };
  }

  async fetchJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return [];
    }
  }

  async getProvinces() {
    if (!this.cache.provinces) {
      this.cache.provinces = await this.fetchJSON('/data/province.json');
    }
    return this.cache.provinces;
  }

  async getAmphures() {
    if (!this.cache.amphures) {
      this.cache.amphures = await this.fetchJSON('/data/amphure.json');
    }
    return this.cache.amphures;
  }

  async getTambons() {
    if (!this.cache.tambons) {
      this.cache.tambons = await this.fetchJSON('/data/tambon.json');
    }
    return this.cache.tambons;
  }

  async getAmphuresByProvince(provinceId) {
    const amphures = await this.getAmphures();
    return amphures.filter(amphure => amphure.province_id === provinceId);
  }

  async getTambonsByAmphure(amphureId) {
    const tambons = await this.getTambons();
    return tambons.filter(tambon => tambon.amphure_id === amphureId);
  }

  async getAddressByPostalCode(postalCode) {
    const [provinces, amphures, tambons] = await Promise.all([
      this.getProvinces(),
      this.getAmphures(),
      this.getTambons()
    ]);

    const tambon = tambons.find(t => t.zip_code === postalCode);
    if (!tambon) return null;

    const amphure = amphures.find(a => a.id === tambon.amphure_id);
    if (!amphure) return null;

    const province = provinces.find(p => p.id === amphure.province_id);
    if (!province) return null;

    return {
      province,
      amphure,
      tambon,
      postal_code: postalCode
    };
  }

  async searchTambonsByPostalCode(postalCode) {
    const tambons = await this.getTambons();
    return tambons.filter(tambon => tambon.zip_code === postalCode);
  }

  // ฟังก์ชันค้นหาแบบ fuzzy search
  searchItems(items, searchTerm, searchKeys = ['name_th', 'name_en']) {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      return searchKeys.some(key => {
        return item[key] && item[key].toLowerCase().includes(term);
      });
    });
  }
}

// สร้าง instance เดียวสำหรับใช้ทั้งแอป
export const addressService = new AddressService();