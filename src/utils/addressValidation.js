export const validatePostalCode = (code) => {
  return /^[0-9]{5}$/.test(code);
};

export const formatAddress = (address) => {
  const parts = [];
  
  if (address.sub_district) parts.push(`ตำบล${address.sub_district}`);
  if (address.district) parts.push(`อำเภอ${address.district}`);
  if (address.province) parts.push(`จังหวัด${address.province}`);
  if (address.postal_code) parts.push(address.postal_code);
  
  return parts.join(' ');
};

export const validateAddressForm = (addressData) => {
  const errors = {};
  
  if (!addressData.province) {
    errors.province = 'กรุณาเลือกจังหวัด';
  }
  
  if (!addressData.district) {
    errors.district = 'กรุณาเลือกอำเภอ';
  }
  
  if (!addressData.sub_district) {
    errors.sub_district = 'กรุณาเลือกตำบล';
  }
  
  if (!addressData.postal_code) {
    errors.postal_code = 'กรุณาระบุรหัสไปรษณีย์';
  } else if (!validatePostalCode(addressData.postal_code)) {
    errors.postal_code = 'รหัสไปรษณีย์ไม่ถูกต้อง (ต้องเป็นตัวเลข 5 หลัก)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};