// src/hooks/useAddressData.js
import { useState, useEffect, useCallback } from 'react';
import { addressService } from '../services/addressService';

export const useAddressData = () => {
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลจังหวัดเมื่อเริ่มต้น
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await addressService.getProvinces();
        setProvinces(data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลจังหวัดได้');
        console.error('Error loading provinces:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProvinces();
  }, []);

  // ฟังก์ชันโหลดอำเภอ
  const loadAmphures = useCallback(async (provinceId) => {
    if (!provinceId) {
      setAmphures([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAmphuresByProvince(provinceId);
      setAmphures(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลอำเภอได้');
      console.error('Error loading amphures:', err);
      setAmphures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันโหลดตำบล
  const loadTambons = useCallback(async (amphureId) => {
    if (!amphureId) {
      setTambons([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getTambonsByAmphure(amphureId);
      setTambons(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลตำบลได้');
      console.error('Error loading tambons:', err);
      setTambons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันค้นหาที่อยู่จากรหัสไปรษณีย์
  const getAddressByPostalCode = useCallback(async (postalCode) => {
    if (!postalCode || postalCode.length !== 5) return null;

    try {
      setLoading(true);
      const addressData = await addressService.getAddressByPostalCode(postalCode);
      return addressData;
    } catch (err) {
      console.error('Error getting address by postal code:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    provinces,
    amphures,
    tambons,
    loading,
    error,
    loadAmphures,
    loadTambons,
    getAddressByPostalCode,
    clearError: () => setError(null)
  };
};

// Hook สำหรับจัดการ state ของ Address Form
export const useAddressForm = (initialValues = {}) => {
  const [selectedProvince, setSelectedProvince] = useState(initialValues.province || null);
  const [selectedAmphure, setSelectedAmphure] = useState(initialValues.amphure || null);
  const [selectedTambon, setSelectedTambon] = useState(initialValues.tambon || null);
  const [postalCode, setPostalCode] = useState(initialValues.postalCode || '');
  const [errors, setErrors] = useState({});

  const {
    provinces,
    amphures,
    tambons,
    loading,
    error,
    loadAmphures,
    loadTambons,
    getAddressByPostalCode
  } = useAddressData();

  // จัดการการเลือกจังหวัด
  const handleProvinceChange = useCallback(async (province) => {
    setSelectedProvince(province);
    setSelectedAmphure(null);
    setSelectedTambon(null);
    setPostalCode('');
    setErrors(prev => ({ ...prev, province: null }));

    if (province) {
      await loadAmphures(province.id);
    }
  }, [loadAmphures]);

  // จัดการการเลือกอำเภอ
  const handleAmphureChange = useCallback(async (amphure) => {
    setSelectedAmphure(amphure);
    setSelectedTambon(null);
    setPostalCode('');
    setErrors(prev => ({ ...prev, amphure: null }));

    if (amphure) {
      await loadTambons(amphure.id);
    }
  }, [loadTambons]);

  // จัดการการเลือกตำบล
  const handleTambonChange = useCallback((tambon) => {
    setSelectedTambon(tambon);
    setErrors(prev => ({ ...prev, tambon: null }));
    
    if (tambon && tambon.zip_code) {
      setPostalCode(tambon.zip_code);
      setErrors(prev => ({ ...prev, postalCode: null }));
    }
  }, []);

  // จัดการการพิมพ์รหัสไปรษณีย์
  const handlePostalCodeChange = useCallback(async (code) => {
    setPostalCode(code);
    setErrors(prev => ({ ...prev, postalCode: null }));

    if (code.length === 5) {
      const addressData = await getAddressByPostalCode(code);
      if (addressData) {
        setSelectedProvince(addressData.province);
        setSelectedAmphure(addressData.amphure);
        setSelectedTambon(addressData.tambon);
        
        // โหลดข้อมูลที่เกี่ยวข้อง
        await loadAmphures(addressData.province.id);
        await loadTambons(addressData.amphure.id);
      }
    }
  }, [getAddressByPostalCode, loadAmphures, loadTambons]);

  // ฟังก์ชันรีเซ็ต
  const resetForm = useCallback(() => {
    setSelectedProvince(null);
    setSelectedAmphure(null);
    setSelectedTambon(null);
    setPostalCode('');
    setErrors({});
  }, []);

  // ฟังก์ชันตรวจสอบความถูกต้อง
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedProvince) newErrors.province = 'กรุณาเลือกจังหวัด';
    if (!selectedAmphure) newErrors.amphure = 'กรุณาเลือกอำเภอ';
    if (!selectedTambon) newErrors.tambon = 'กรุณาเลือกตำบล';
    if (!postalCode) {
      newErrors.postalCode = 'กรุณาระบุรหัสไปรษณีย์';
    } else if (!/^[0-9]{5}$/.test(postalCode)) {
      newErrors.postalCode = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedProvince, selectedAmphure, selectedTambon, postalCode]);

  // ฟังก์ชันได้ข้อมูลที่อยู่ในรูปแบบ object
  const getAddressData = useCallback(() => {
    return {
      province: selectedProvince?.name_th || '',
      district: selectedAmphure?.name_th || '',
      sub_district: selectedTambon?.name_th || '',
      postal_code: postalCode,
      province_id: selectedProvince?.id || null,
      amphure_id: selectedAmphure?.id || null,
      tambon_id: selectedTambon?.id || null
    };
  }, [selectedProvince, selectedAmphure, selectedTambon, postalCode]);

  return {
    // State
    selectedProvince,
    selectedAmphure,
    selectedTambon,
    postalCode,
    errors,
    
    // Data
    provinces,
    amphures,
    tambons,
    loading,
    error,
    
    // Actions
    handleProvinceChange,
    handleAmphureChange,
    handleTambonChange,
    handlePostalCodeChange,
    resetForm,
    validateForm,
    getAddressData,
    
    // Computed
    isValid: Object.keys(errors).length === 0,
    isComplete: selectedProvince && selectedAmphure && selectedTambon && postalCode
  };
};