// src/services/api.js
import axios from 'axios';

// กำหนดค่าเริ่มต้นสำหรับ axios
const API_BASE_URL = 'https://api.abchomey.com/api';

// สร้าง instance ของ axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// เพิ่ม interceptor สำหรับการส่ง token ในทุก request
api.interceptors.request.use(
  config => {
    const userJson = localStorage.getItem('waterSystemUser');

    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data for token:', error);
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// เพิ่ม interceptor สำหรับการจัดการ response
api.interceptors.response.use(
  response => response,
  error => {
    // จัดการกับข้อผิดพลาดที่พบบ่อย
    if (error.response) {
      // Server ตอบกลับด้วย status code ที่ไม่ใช่ 2xx
      const status = error.response.status;

      if (status === 401) {
        // Token หมดอายุหรือไม่ถูกต้อง
        //localStorage.removeItem('waterSystemUser');
        /// localStorage.removeItem('currentVillage');
        // window.location.href = '/login';
      }

      // แสดงข้อความข้อผิดพลาดที่เข้าใจง่าย
      return Promise.reject({
        status,
        message: error.response.data?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        data: error.response.data
      });
    } else if (error.request) {
      // ไม่ได้รับการตอบกลับจาก server
      return Promise.reject({
        status: 0,
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      });
    } else {
      // เกิดข้อผิดพลาดในการตั้งค่า request
      return Promise.reject({
        message: 'เกิดข้อผิดพลาดในการส่งคำขอ'
      });
    }
  }
);


// ====== Service APIs ======


export const getAccessToken = async (userId, productKey) => {
  try {
    const response = await fetch('/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        product_key: productKey
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'ไม่สามารถรับ Access Token ได้');
    }

    return data.access_token; // ปรับตามโครงสร้างการตอบกลับของ API
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};



export const recognizeMeterFromImage = async (imageUri, accessToken) => {
  try {
    // กรณีที่ต้องอัปโหลดรูปภาพไปยังเซิร์ฟเวอร์ก่อน
    // ปรับแก้ตามความเหมาะสม
    let imageUrl = imageUri;

    // หากต้องการอัปโหลดรูปภาพไปยังเซิร์ฟเวอร์ก่อน
    // imageUrl = await uploadImage(imageUri);

    const response = await fetch('/meter/digital', {
      method: 'GET', // แปลกที่ใช้ GET แต่มี body เพราะในโค้ด Python ใช้ GET
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        image_url: imageUrl,
        overlay: null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'ไม่สามารถอ่านค่ามิเตอร์ได้');
    }

    return data; // ปรับตามโครงสร้างการตอบกลับของ API
  } catch (error) {
    console.error('Error recognizing meter:', error);
    throw error;
  }
};


export const uploadImage = async (imageUri) => {
  try {
    // สร้างฟอร์มข้อมูลสำหรับอัปโหลดไฟล์
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type
    });

    // ส่งไปยัง API ของคุณสำหรับอัปโหลดรูปภาพ
    const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    }

    return data.url; // ปรับตามโครงสร้างการตอบกลับของ API
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Auth Service
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/user')
};

// Village Service
export const villageService = {
  getVillages: () =>
    api.get('/villages'),

  getVillageById: (id) =>
    api.get(`/villages/${id}`),

  createVillage: (data) =>
    api.post('/villages', data),

  updateVillage: (id, data) =>
    api.put(`/villages/${id}`, data),

  deleteVillage: (id) =>
    api.delete(`/villages/${id}`),

  getVillageSettings: (id) =>
    api.get(`/villages/${id}/settings`),

  updateVillageSettings: (id, data) =>
    api.put(`/villages/${id}/settings`, data)
};

// Dashboard Service
export const dashboardService = {
  getDashboardData: (villageId) =>
    api.get(`/dashboard/overview/${villageId}`),

  getStatistics: (villageId, period) =>
    api.get(`/villages/${villageId}/statistics`, { params: { period } }),

  getActivities: (villageId, limit) =>
    api.get(`/villages/${villageId}/activities`, { params: { limit } }),

  getAlerts: (villageId) =>
    api.get(`/villages/${villageId}/alerts`)
};

// Water Meter Service
export const meterService = {
  getMeters: (villageId) =>
    api.get(`/meters/village/${villageId}`),

  getMeterById: (id) =>
    api.get(`/meters/${id}`),

  createMeter: (data) =>
    api.post('/meters', data),

  updateMeter: (id, data) =>
    api.put(`/meters/${id}`, data),

  deleteMeter: (id) =>
    api.delete(`/meters/${id}`),

  getAllZones: (villageId) =>
    api.get(`/meters/zone/${villageId}`),

  getZones: (id) =>
    api.get(`/meters/zone/${id}`),


  createZone: (data) =>
    api.post('/meters/zone', data),

  updateZone: (id, data) =>
    api.put(`/meters/zone/${id}`, data),

  deleteZone: (id) =>
    api.delete(`/meters/zone/${id}`),
};

// Meter Reading Service
export const readingService = {
  getReadings: (meterId) =>
    api.get(`/water-meters/${meterId}/readings`),

  createReading: (meterId, data) =>
    api.post(`/water-meters/${meterId}/readings`, data),

  getReadingsByVillage: (villageId, period) =>
    api.get(`/villages/${villageId}/readings`, { params: { period } }),

  getBulkReadingTemplate: (villageId) =>
    api.get(`/villages/${villageId}/readings/template`, { responseType: 'blob' }),

  uploadBulkReadings: (villageId, formData) =>
    api.post(`/villages/${villageId}/readings/bulk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
};

// Billing Service
export const billingService = {
  getBills: (villageId, period) =>
    api.get(`/bills/village/${villageId}/month/${period}`),

  getBillsbyreading: (villageId,reading_id,read_date) =>
    api.get(`/bills/village/${villageId}/readingId/${reading_id}/read_date/${read_date}`),

  getBillById: (id) =>
    api.get(`/bills/${id}`),

  createBill: (data) =>
    api.post('/bills', data),

  updateBill: (id, data) =>
    api.post(`/bills/${id}/payment`, data),

  updateBillpay: (id, data) =>
    api.post(`/bills/${id}/payment2`, data),

  generateBills: (villageId, period) =>
    api.post(`/villages/${villageId}/generate-bills`, { period }),

  getBillPdf: (billId) =>
    api.get(`/bills/${billId}/pdf`, { responseType: 'blob' }),

  sendBillNotifications: (villageId, period) =>
    api.post(`/villages/${villageId}/bills/send-notifications`, { period })
};

// Payment Service
export const paymentService = {
  getPayments: (villageId, period) =>
    api.get(`/villages/${villageId}/payments`, { params: { period } }),

  recordPayment: (billId, data) =>
    api.post(`/bills/${billId}/payments`, data),

  getPaymentById: (id) =>
    api.get(`/payments/${id}`),

  getPaymentReceipt: (paymentId) =>
    api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' }),

  verifyPayment: (paymentId) =>
    api.post(`/payments/${paymentId}/verify`)
};

// Equipment Service
export const equipmentService = {
  getEquipment: (villageId) =>
    api.get(`/villages/${villageId}/equipment`),

  getEquipmentById: (id) =>
    api.get(`/equipment/${id}`),

  createEquipment: (data) =>
    api.post('/equipment', data),

  updateEquipment: (id, data) =>
    api.put(`/equipment/${id}`, data),

  deleteEquipment: (id) =>
    api.delete(`/equipment/${id}`),

  logMaintenance: (equipmentId, data) =>
    api.post(`/equipment/${equipmentId}/maintenance`, data),

  getMaintenanceHistory: (equipmentId) =>
    api.get(`/equipment/${equipmentId}/maintenance`)
};

// Report Service
export const reportService = {
  getWaterUsageReport: (villageId, period) =>
    api.get(`/villages/${villageId}/reports/water-usage`, { params: { period } }),

  getRevenueReport: (villageId, period) =>
    api.get(`/villages/${villageId}/reports/revenue`, { params: { period } }),

  getPaymentStatusReport: (villageId, period) =>
    api.get(`/villages/${villageId}/reports/payment-status`, { params: { period } }),

  getWaterLossReport: (villageId, period) =>
    api.get(`/villages/${villageId}/reports/water-loss`, { params: { period } }),

  exportReport: (villageId, reportType, period, format) =>
    api.get(`/villages/${villageId}/reports/${reportType}/export`, {
      params: { period, format },
      responseType: 'blob'
    })
};

// User Service
export const userService = {
  getUsers: (villageId) =>
    api.get(`/users/village/${villageId}`),

  getAllUsers: () =>
    api.get(`/users`),

  getUserById: (id) =>
    api.get(`/auth/me`),

  createUser: (data) =>
    api.post('/users', data),

  updateUser: (id, data) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id) =>
    api.delete(`/users/${id}`),

  resetPassword: (userId) =>
    api.post(`/users/${userId}/reset-password`),

  updateProfile: (userId, data) =>
    api.put(`/users/${userId}/profile`, data)
};

export default api;