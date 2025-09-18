// src/services/dashboardService.js
import axios from 'axios';

const API_BASE_URL = 'https://api.abchomey.com/api';

// สร้าง axios instance พร้อม config พื้นฐาน
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor สำหรับใส่ token ใน header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor สำหรับจัดการ response และ error
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token หมดอายุหรือไม่ถูกต้อง
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const dashboardService = {
  /**
   * ดึงข้อมูลภาพรวมแดชบอร์ดหลัก
   */
  async getDashboardData(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/overview2/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
  },
  async getAllUserDashboardData(villageId, readerId) {
    try {
      const response = await apiClient.get(`/dashboard/overview/${villageId}`, {
        readerId:readerId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
  },
  /**
   * ดึงข้อมูลสถิติแยกตาม Zone
   */
  async getZoneStatistics(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/zones/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching zone statistics:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติ Zone ได้');
    }
  },

  /**
   * ดึงข้อมูลสถานการณ์การเรียกเก็บเงินและการชำระ
   */
  async getBillingStatistics(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/billing/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching billing statistics:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติการเรียกเก็บเงินได้');
    }
  },

  /**
   * ดึงข้อมูลการใช้น้ำตามช่วงเวลา
   */
  async getWaterUsage(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/water-usage2/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching water usage data:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการใช้น้ำได้');
    }
  },

  /**
   * ดึงข้อมูลรายได้และการเงิน
   */
  async getRevenue(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/revenue2/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลรายได้ได้');
    }
  },

  /**
   * ดึงข้อมูลสถิติรวมสำหรับกราฟโดนัท
   */
  async getDashboardStatistics(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/statistics/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติแดชบอร์ดได้');
    }
  },

  /**
   * ดึงข้อมูลกิจกรรมล่าสุด
   */
  async getRecentActivities(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/activities2/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลกิจกรรมล่าสุดได้');
    }
  },

  /**
   * ดึงข้อมูลการแจ้งเตือนสำคัญ
   */
  async getAlerts(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/alerts2/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการแจ้งเตือนได้');
    }
  },

  /**
   * ดึงข้อมูลสถานะเครื่องผลิตน้ำ
   */
  async getMachineStatus(villageId, params = {}) {
    try {
      const response = await apiClient.get(`/dashboard/machines/${villageId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching machine status:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถานะเครื่องผลิตน้ำได้');
    }
  },

  /**
   * ดึงข้อมูลรวมสำหรับแดชบอร์ด (เรียกหลาย API พร้อมกัน)
   */
  async getAllDashboardData(villageId, params = {}) {
    try {
      const [
        overview,
        zoneStats,
        billingStats,
        waterUsage,
       // revenue,
        statistics,
        activities,
        alerts,
        //machines
      ] = await Promise.allSettled([
        this.getDashboardData(villageId, params),
        this.getZoneStatistics(villageId, params),
        this.getBillingStatistics(villageId, params),
        this.getWaterUsage(villageId, { ...params, months: 12 }),
        //this.getRevenue(villageId, { ...params, months: 6 }),
        this.getDashboardStatistics(villageId, params),
        this.getRecentActivities(villageId, { ...params, limit: 10 }),
        this.getAlerts(villageId, params),
        //this.getMachineStatus(villageId, params)
      ]);

      // รวมผลลัพธ์และจัดการกับ error
      const result = {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        zoneStats: zoneStats.status === 'fulfilled' ? zoneStats.value : null,
        billingStats: billingStats.status === 'fulfilled' ? billingStats.value : null,
        waterUsage: waterUsage.status === 'fulfilled' ? waterUsage.value : null,
       // revenue: revenue.status === 'fulfilled' ? revenue.value : null,
       statistics: statistics.status === 'fulfilled' ? statistics.value : null,
        activities: activities.status === 'fulfilled' ? activities.value : null,
        alerts: alerts.status === 'fulfilled' ? alerts.value : null,
       // machines: machines.status === 'fulfilled' ? machines.value : null,
        errors: []
      };

      // เก็บ error ที่เกิดขึ้น
      [overview, zoneStats, //billingStats, waterUsage, revenue, statistics, activities, alerts, machines
        ]
        .forEach((promiseResult, index) => {
          if (promiseResult.status === 'rejected') {
            const apiNames = ['overview', 'zoneStats', 'billingStats', 'waterUsage', 
                            'revenue', 'statistics', 'activities', 'alerts', 'machines'];
            result.errors.push({
              api: apiNames[index],
              error: promiseResult.reason.message
            });
          }
        });

      return result;
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw new Error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
  },

  /**
   * ดึงข้อมูลตามช่วงวันที่
   */
  async getDashboardDataByDateRange(villageId, startDate, endDate) {
    try {
      const params = {
        startDate,
        endDate
      };

      const [overview, statistics, activities] = await Promise.allSettled([
        this.getDashboardData(villageId, params),
        this.getDashboardStatistics(villageId, params),
        this.getRecentActivities(villageId, { ...params, limit: 20 })
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        statistics: statistics.status === 'fulfilled' ? statistics.value : null,
        activities: activities.status === 'fulfilled' ? activities.value : null,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      console.error('Error fetching dashboard data by date range:', error);
      throw new Error('ไม่สามารถโหลดข้อมูลตามช่วงวันที่ได้');
    }
  }
};

export default dashboardService;