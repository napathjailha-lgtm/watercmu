// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import WaterSourceSelection from './components/WaterSourceSelection';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import VillageSettings from './components/VillageSettings';
import WaterMeterManagement from './components/WaterMeterManagement';
import MeterReadings from './components/MeterReadings';
import ZoneManagement from './components/ZoneManagement'; // เพิ่ม import

import BillingManagement from './components/BillingManagement';
import PaymentManagement from './components/PaymentManagement';
import EquipmentManagement from './components/EquipmentManagement';
import ReportsAnalytics from './components/ReportsAnalytics';
import UserManagement from './components/UserManagement';
import MainLayout from './components/MainLayout';
import VillageManage from './components/VillageManage';
import LoadingSpinner from './components/common/LoadingSpinner';
import eventBus from './utils/eventBus';

import './App.css';

// Component สำหรับแสดงการแจ้งเตือนแพ็คเกจ
const PackageAlert = ({ packageInfo, onClose, onMarkAsRead, user }) => {
  if (!packageInfo) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXPIRED': return 'bg-red-100 border-red-500 text-red-700';
      case 'CRITICAL': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'WARNING': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default: return 'bg-green-100 border-green-500 text-green-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'EXPIRED': return '🔴';
      case 'CRITICAL': return '🟠';
      case 'WARNING': return '🟡';
      default: return '🟢';
    }
  };

  const getStatusMessage = (status, daysUntilExpiry) => {
    switch (status) {
      case 'EXPIRED': return 'แพ็คเกจหมดอายุแล้ว กรุณาติดต่อเพื่อต่ออายุ';
      case 'CRITICAL': return `แพ็คเกจจะหมดอายุใน ${Math.abs(daysUntilExpiry)} วัน`;
      case 'WARNING': return `แพ็คเกจจะหมดอายุใน ${daysUntilExpiry} วัน`;
      default: return 'แพ็คเกจทำงานปกติ';
    }
  };

  const handleClose = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ข้อมูลแพ็คเกจหมู่บ้าน
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* ข้อมูลหมู่บ้าน */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">หมู่บ้าน</h4>
              <p className="text-blue-700">
                {user?.villages?.[0]?.village_name || packageInfo.village_name || 'ไม่พบข้อมูลหมู่บ้าน'}
              </p>
            </div>

            {/* ข้อมูลแพ็คเกจ */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">แพ็คเกจปัจจุบัน</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{packageInfo.package_name}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${packageInfo.package_size === 'S' ? 'bg-blue-100 text-blue-800' :
                  packageInfo.package_size === 'M' ? 'bg-green-100 text-green-800' :
                    packageInfo.package_size === 'L' ? 'bg-purple-100 text-purple-800' :
                      packageInfo.package_size === 'XL' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                  }`}>
                  {packageInfo.package_size}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                ฿{packageInfo.amount?.toLocaleString()} / {packageInfo.billing_cycle === 'monthly' ? 'เดือน' : 'ปี'}
              </p>
            </div>

            {/* สถานะการหมดอายุ */}
            <div className={`p-4 rounded-lg border-l-4 ${getStatusColor(packageInfo.expiry_status)}`}>
              <div className="flex items-center">
                <span className="text-lg mr-2">{getStatusIcon(packageInfo.expiry_status)}</span>
                <div>
                  <p className="font-medium">
                    {getStatusMessage(packageInfo.expiry_status, packageInfo.days_until_expiry)}
                  </p>
                  <p className="text-sm mt-1">
                    วันหมดอายุ: {new Date(packageInfo.end_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อมูลการใช้งาน */}
            {packageInfo.usage_info && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">การใช้งาน</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">มิเตอร์</p>
                    <p className="font-medium">
                      {packageInfo.usage_info.current_meters}/{packageInfo.max_meters}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${packageInfo.usage_info.meter_usage_percent > 90 ? 'bg-red-500' :
                          packageInfo.usage_info.meter_usage_percent > 80 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(packageInfo.usage_info.meter_usage_percent, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {packageInfo.usage_info.meter_usage_percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">ผู้ใช้งาน</p>
                    <p className="font-medium">
                      {packageInfo.usage_info.current_users}/{packageInfo.max_users}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${packageInfo.usage_info.user_usage_percent > 90 ? 'bg-red-500' :
                          packageInfo.usage_info.user_usage_percent > 80 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(packageInfo.usage_info.user_usage_percent, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {packageInfo.usage_info.user_usage_percent}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* การแจ้งเตือนเพิ่มเติม */}
            {packageInfo.alerts && packageInfo.alerts.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-medium text-red-800 mb-2">การแจ้งเตือน</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {packageInfo.alerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* สถิติการใช้งานเดือนนี้ */}
            {packageInfo.monthly_stats && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">สถิติเดือนนี้</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-blue-600">จดมิเตอร์</p>
                    <p className="font-medium">{packageInfo.monthly_stats.total_readings} ครั้ง</p>
                  </div>
                  <div>
                    <p className="text-blue-600">บิลสร้าง</p>
                    <p className="font-medium">{packageInfo.monthly_stats.total_bills} ใบ</p>
                  </div>
                  <div>
                    <p className="text-blue-600">รายได้</p>
                    <p className="font-medium">฿{packageInfo.monthly_stats.total_revenue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">มิเตอร์ใช้งาน</p>
                    <p className="font-medium">{packageInfo.monthly_stats.active_meters}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="mt-6 flex gap-3">
            {packageInfo.expiry_status === 'EXPIRED' || packageInfo.expiry_status === 'CRITICAL' ? (
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                onClick={() => {
                  // TODO: เปิดหน้าติดต่อต่ออายุ
                }}
              >
                ติดต่อต่ออายุ
              </button>
            ) : packageInfo.usage_info?.meter_usage_percent > 80 || packageInfo.usage_info?.user_usage_percent > 80 ? (
              <button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
                onClick={() => {
                  // TODO: เปิดหน้าอัพเกรดแพ็คเกจ
                }}
              >
                อัพเกรดแพ็คเกจ
              </button>
            ) : null}

            <button
              onClick={handleClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              รับทราบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ฟังก์ชันสำหรับตรวจสอบระดับสิทธิ์ของผู้ใช้ (admin หรือ village_admin)
const isAdminRole = (user) => {
  return user && (user.role_name === 'admin' || user.role_name === 'village_admin' || user.role_name === 'meter' );
};

// ฟังก์ชันตรวจสอบว่าเป็น admin หมู่บ้านหรือไม่
const isVillageAdmin = (user) => {
  return user && (
    user.role_name === 'village_admin' ||
    user.role_name === 'ผู้ดูแลหมู่บ้าน' ||
    user.permissions?.includes('village_management')
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [currentVillage, setCurrentVillage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Package Alert States
  const [showPackageAlert, setShowPackageAlert] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const [packageAlertLoading, setPackageAlertLoading] = useState(false);

  // ฟังก์ชันสำหรับตรวจสอบว่าควรแจ้งเตือนหรือไม่ (Smart Alert System)
  const shouldShowAlert = (packageData, villageId) => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // ดึงข้อมูลการแจ้งเตือนที่เก็บไว้
    const alertHistoryKey = `package_alerts_${villageId}`;
    const alertHistory = JSON.parse(localStorage.getItem(alertHistoryKey) || '{}');

    const daysUntilExpiry = packageData.days_until_expiry;

    // เงื่อนไขการแจ้งเตือน
    const shouldAlert = {
      expired: packageData.expiry_status === 'EXPIRED', // แจ้งทุกครั้งถ้าหมดอายุ
      critical: daysUntilExpiry <= 7 && daysUntilExpiry > 0, // 7 วันก่อนหมดอายุ
      twoMonths: daysUntilExpiry <= 60 && daysUntilExpiry > 30, // 2 เดือนก่อนหมดอายุ
      oneMonth: daysUntilExpiry <= 30 && daysUntilExpiry > 7, // 1 เดือนก่อนหมดอายุ
      usageHigh: packageData.usage_info?.meter_usage_percent > 90 ||
        packageData.usage_info?.user_usage_percent > 90
    };

    // ตรวจสอบการแจ้งเตือนแต่ละประเภท
    let showAlert = false;
    let alertType = '';

    if (shouldAlert.expired) {
      // แจ้งเตือนทุกครั้งถ้าหมดอายุแล้ว
      showAlert = true;
      alertType = 'expired';
    } else if (shouldAlert.critical && !alertHistory[`critical_${currentDate}`]) {
      // แจ้งเตือน 7 วันก่อนหมดอายุ (แจ้งครั้งเดียวต่อวัน)
      showAlert = true;
      alertType = 'critical';
    } else if (shouldAlert.oneMonth && !alertHistory['oneMonth']) {
      // แจ้งเตือน 1 เดือนก่อนหมดอายุ (แจ้งครั้งเดียว)
      showAlert = true;
      alertType = 'oneMonth';
    } else if (shouldAlert.twoMonths && !alertHistory['twoMonths']) {
      // แจ้งเตือน 2 เดือนก่อนหมดอายุ (แจ้งครั้งเดียว)
      showAlert = true;
      alertType = 'twoMonths';
    } else if (shouldAlert.usageHigh && !alertHistory[`usage_${currentDate}`]) {
      // แจ้งเตือนการใช้งานสูง (แจ้งครั้งเดียวต่อวัน)
      showAlert = true;
      alertType = 'usage';
    }

    // บันทึกประวัติการแจ้งเตือน
    if (showAlert && alertType) {
      const updatedHistory = { ...alertHistory };

      if (alertType === 'critical' || alertType === 'usage') {
        updatedHistory[`${alertType}_${currentDate}`] = true;
      } else {
        updatedHistory[alertType] = true;
      }

      localStorage.setItem(alertHistoryKey, JSON.stringify(updatedHistory));

      // ลบประวัติเก่าที่เก่ากว่า 90 วัน
      const cleanupHistory = {};
      const cutoffDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

      Object.keys(updatedHistory).forEach(key => {
        if (key.includes('_')) {
          const keyDate = key.split('_')[1];
          if (new Date(keyDate) >= cutoffDate) {
            cleanupHistory[key] = updatedHistory[key];
          }
        } else {
          cleanupHistory[key] = updatedHistory[key];
        }
      });

      localStorage.setItem(alertHistoryKey, JSON.stringify(cleanupHistory));
    }

    return showAlert;
  };

  // ฟังก์ชันสำหรับดึงข้อมูลแพ็คเกจของหมู่บ้าน
  const fetchVillagePackageInfo = async (userData) => {
    try {
      // เช็คว่าผู้ใช้เป็น admin หมู่บ้านหรือไม่
      if (!isVillageAdmin(userData)) {
        return; // ไม่แสดงแจ้งเตือนสำหรับผู้ใช้ที่ไม่ใช่ admin หมู่บ้าน
      }

      setPackageAlertLoading(true);

      // หา village_id จากข้อมูลผู้ใช้
      const villageId = userData.village_id ||
        userData.assigned_village_id ||
        userData.villages?.[0]?.village_id ||
        currentVillage?.village_id;

      if (!villageId) {
        return;
      }

      // ดึง token จาก localStorage
      const token = localStorage.getItem('auth_token');

      // ถ้าไม่มี token ให้ข้ามการเรียก API
      if (!token) {
        return;
      }

      // ดึงข้อมูลแพ็คเกจของหมู่บ้าน พร้อมส่ง token
      const response = await axios.get(
        `https://api.abchomey.com/api/villages/${villageId}/package-info`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        const packageData = response.data.data;

        // ตรวจสอบว่าควรแจ้งเตือนหรือไม่
        const shouldAlert = shouldShowAlert(packageData, villageId);

        if (!shouldAlert) {
          return; // ไม่แสดงแจ้งเตือน
        }

        // เพิ่มการแจ้งเตือนตามสถานะ
        const alerts = [];

        if (packageData.expiry_status === 'EXPIRED') {
          alerts.push('แพ็คเกจหมดอายุแล้ว ระบบอาจหยุดทำงาน');
        } else if (packageData.days_until_expiry <= 7 && packageData.days_until_expiry > 0) {
          alerts.push('แพ็คเกจจะหมดอายุในอีกไม่กี่วัน');
        } else if (packageData.days_until_expiry <= 30 && packageData.days_until_expiry > 7) {
          alerts.push('แพ็คเกจจะหมดอายุในอีก 1 เดือน กรุณาเตรียมต่ออายุ');
        } else if (packageData.days_until_expiry <= 60 && packageData.days_until_expiry > 30) {
          alerts.push('แพ็คเกจจะหมดอายุในอีก 2 เดือน กรุณาวางแผนต่ออายุ');
        }

        if (packageData.usage_info?.meter_usage_percent > 90) {
          alerts.push('จำนวนมิเตอร์ใกล้เต็มแล้ว (เกิน 90%)');
        } else if (packageData.usage_info?.meter_usage_percent > 80) {
          alerts.push('จำนวนมิเตอร์ใช้งานสูง (เกิน 80%)');
        }

        if (packageData.usage_info?.user_usage_percent > 90) {
          alerts.push('จำนวนผู้ใช้งานใกล้เต็มแล้ว (เกิน 90%)');
        } else if (packageData.usage_info?.user_usage_percent > 80) {
          alerts.push('จำนวนผู้ใช้งานสูง (เกิน 80%)');
        }

        const enhancedPackageData = {
          ...packageData,
          alerts: alerts
        };

        setPackageInfo(enhancedPackageData);

        // แสดงแจ้งเตือน
        setTimeout(() => {
          setShowPackageAlert(true);
        }, 1000);
      }
    } catch (err) {
      console.error('Error fetching package info:', err);

      // ถ้า error เป็น 401 (Unauthorized) ให้ logout
      if (err.response?.status === 401) {
        handleLogout();
      }

      // ไม่แสดงข้อผิดพลาดในการดึงข้อมูลแพ็คเกจ เพื่อไม่ให้รบกวนการล็อกอิน
    } finally {
      setPackageAlertLoading(false);
    }
  };
  // ฟังก์ชันสำหรับทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
  const markPackageAlertsAsRead = async () => {
    try {
      if (!packageInfo || !packageInfo.village_id) return;

      // await axios.post(`/api/villages/${packageInfo.village_id}/package-alerts/mark-read`);
    } catch (error) {
      console.error('Error marking alerts as read:', error);
    }
  };

  // ฟังก์ชันสำหรับตรวจสอบข้อมูลการเข้าสู่ระบบจาก localStorage
  const checkAuth = () => {
    setIsLoading(true);

    try {
      // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
      const storedUser = localStorage.getItem('waterSystemUser');
      const storedVillage = localStorage.getItem('currentVillage');


      if (storedUser && storedUser !== 'undefined') {
        try {
          const parsedData = JSON.parse(storedUser);

          let userData = null;
          // ตรวจสอบโครงสร้างข้อมูลและกำหนดค่าให้กับ user state
          if (parsedData.data && parsedData.data.user) {
            userData = parsedData.data.user;
          } else if (parsedData.user) {
            userData = parsedData.user;
          } else {
            userData = parsedData; // กรณีที่เก็บข้อมูลผู้ใช้โดยตรง
          }

          setUser(userData);

          // ตรวจสอบว่าเป็นการเข้าสู่ระบบครั้งแรกของผู้ดูแลหรือไม่
          const hasConfigured = localStorage.getItem('hasConfiguredWaterSource');
          if (isVillageAdmin(userData) && !hasConfigured) {
            // setIsFirstLogin(true);
          }

          // ดึงข้อมูลแพ็คเกจสำหรับ admin หมู่บ้าน (หลังจาก auth check เสร็จสิ้น)
          if (isVillageAdmin(userData)) {
            setTimeout(() => {
              fetchVillagePackageInfo(userData);
            }, 2000); // รอให้ระบบโหลดเสร็จก่อน
          }

        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          localStorage.removeItem('waterSystemUser'); // ลบข้อมูลที่ไม่ถูกต้อง
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // ตรวจสอบข้อมูลหมู่บ้าน
      if (storedVillage && storedVillage !== 'undefined') {
        try {
          setCurrentVillage(JSON.parse(storedVillage));
        } catch (error) {
          console.error('Error parsing village data from localStorage:', error);
          localStorage.removeItem('currentVillage'); // ลบข้อมูลที่ไม่ถูกต้อง
          setCurrentVillage(null);
        }
      } else {
        setCurrentVillage(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setUser(null);
      setCurrentVillage(null);
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
    }
  };

  // ตรวจสอบการเข้าสู่ระบบครั้งแรกเมื่อโหลดแอพ
  useEffect(() => {
    checkAuth();

    // รับฟังเหตุการณ์การเปลี่ยนแปลงใน localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกทำลาย
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const handleLogin = async (userData) => {

    let user = null;
    // บันทึกข้อมูลผู้ใช้ในสถานะแอพ
    if (userData.data && userData.data.user) {
      user = userData.data.user;
    } else if (userData.user) {
      user = userData.user;
    } else {
      user = userData;
    }

    setUser(user);

    // ตรวจสอบว่าเป็นผู้ดูแลหมู่บ้านหรือไม่
    if (isVillageAdmin(user)) {
      const hasConfigured = localStorage.getItem('hasConfiguredWaterSource');
      if (!hasConfigured) {
        setIsFirstLogin(true);
      }

      // ดึงข้อมูลแพ็คเกจของหมู่บ้าน (หลังจากล็อกอินสำเร็จ)
      await fetchVillagePackageInfo(user);
    }

    // ทริกเกอร์อีเวนต์ storage เพื่อให้แอพอื่นๆ รู้ว่ามีการเข้าสู่ระบบ
    window.dispatchEvent(new Event('storage'));
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const handleLogout = () => {
    // ลบข้อมูลผู้ใช้จาก localStorage
    localStorage.removeItem('waterSystemUser');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('currentVillage');

    // รีเซ็ตสถานะ
    setUser(null);
    setCurrentVillage(null);
    setIsFirstLogin(false);
    setShowPackageAlert(false);
    setPackageInfo(null);

    // ทริกเกอร์อีเวนต์ storage
    window.dispatchEvent(new Event('storage'));
  };

  // ฟังก์ชันสำหรับเมื่อตั้งค่าระบบครั้งแรกเสร็จสิ้น
  const handleSourceConfigured = () => {
    setIsFirstLogin(false);
    localStorage.setItem('hasConfiguredWaterSource', 'true');
  };

  // ฟังก์ชันสำหรับการเปลี่ยนหมู่บ้าน
  const handleVillageChange = async (village) => {
    //console.log('Village changed to:', village);
    setCurrentVillage(village);
    localStorage.setItem('currentVillage', JSON.stringify(village));

    // ดึงข้อมูลแพ็คเกจใหม่สำหรับหมู่บ้านที่เปลี่ยน
    if (isVillageAdmin(user) && village?.village_id) {
      await fetchVillagePackageInfo({ ...user, village_id: village.village_id });
    }

    // เพิ่มการส่ง event
    eventBus.emit('village-changed', village);
    // ทริกเกอร์ storage event
    window.dispatchEvent(new Event('storage'));
  };

  // ฟังก์ชันสำหรับปิดแจ้งเตือนแพ็คเกจ
  const handleClosePackageAlert = () => {
    setShowPackageAlert(false);
  };

  // ฟังก์ชันสำหรับปิดแจ้งเตือนและทำเครื่องหมายว่าอ่านแล้ว
  const handleMarkAsReadAndClose = async () => {
    await markPackageAlertsAsRead();
    setShowPackageAlert(false);
  };

  // แสดงสถานะการโหลดถ้ายังตรวจสอบการเข้าสู่ระบบไม่เสร็จ
  if (isLoading && !authChecked) {
    return (
      <div className="loading-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // คอมโพเนนต์สำหรับเลย์เอาต์หลักของแอพ
  const AppLayout = () => {
    return (
      <MainLayout
        user={user}
        onLogout={handleLogout}
        currentVillage={currentVillage}
        onVillageChange={handleVillageChange}
      >
        <Outlet />
      </MainLayout>
    );
  };

  // ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
  const isAdminUser = isAdminRole(user);
  //console.log('Current user:', user);
  console.log('Is admin user:', isAdminUser);
  //console.log('Is village admin:', isVillageAdmin(user));

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* เส้นทางสำหรับการเข้าสู่ระบบ */}
          <Route path="/login" element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />

          {/* เส้นทางสำหรับการตั้งค่าระบบครั้งแรก (ไม่มี sidebar เนื่องจากเป็น wizard แบบเต็มหน้าจอ) */}
          <Route path="/setup" element={
            !user ? (
              <Navigate to="/login" replace />
            ) : isAdminUser && isFirstLogin ? (
              <WaterSourceSelection
                onConfigured={handleSourceConfigured}
                user={user}
                currentVillage={currentVillage}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* เส้นทางหลักที่มี MainLayout (มี sidebar) */}
          <Route element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <AppLayout />
            )
          }>
            {/* หน้าแรก - แดชบอร์ด */}
            <Route path="/" element={
              isAdminUser ? (
                <AdminDashboard user={user} currentVillage={currentVillage} />
              ) : (
                <UserDashboard user={user} currentVillage={currentVillage} />
              )
            } />

            {/* เส้นทางสำหรับหน้าต่างๆ ของระบบ */}
            <Route path="/village-manage" element={
              !isAdminUser ? <Navigate to="/" /> :
                <VillageManage user={user} currentVillage={currentVillage} />
            } />

            <Route path="/village-settings" element={
              !isAdminUser ? <Navigate to="/" /> :
                <VillageSettings user={user} currentVillage={currentVillage} />
            } />

            <Route path="/water-meters" element={
              !user ? <Navigate to="/login" /> :
                <WaterMeterManagement user={user} currentVillage={currentVillage} />
            } />

            <Route path="/meter-readings" element={
              !user ? <Navigate to="/login" /> :
                <MeterReadings user={user} currentVillage={currentVillage} />
            } />

            <Route path="/zone" element={
              !user ? <Navigate to="/login" /> :
                <ZoneManagement user={user} currentVillage={currentVillage} />
            } />



            <Route path="/billing" element={
              !user ? <Navigate to="/login" /> :
                <BillingManagement user={user} currentVillage={currentVillage} />
            } />

            <Route path="/payments" element={
              !user ? <Navigate to="/login" /> :
                <PaymentManagement user={user} currentVillage={currentVillage} />
            } />

            <Route path="/equipment" element={
              !isAdminUser ? <Navigate to="/" /> :
                <EquipmentManagement user={user} currentVillage={currentVillage} />
            } />

            <Route path="/reports" element={
              !user ? <Navigate to="/login" /> :
                <ReportsAnalytics user={user} currentVillage={currentVillage} />
            } />

            <Route path="/users" element={
              !isAdminUser ? <Navigate to="/" /> :
                <UserManagement user={user} currentVillage={currentVillage} />
            } />
          </Route>

          {/* เส้นทางเริ่มต้น - ให้ไปที่หน้าแรก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Package Alert Modal */}
        {showPackageAlert && packageInfo && (
          <PackageAlert
            packageInfo={packageInfo}
            onClose={handleClosePackageAlert}
            onMarkAsRead={handleMarkAsReadAndClose}
            user={user}
          />
        )}

        {/* Package Loading Indicator */}
        {packageAlertLoading && (
          <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 text-sm">กำลังตรวจสอบแพ็คเกจ...</span>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;