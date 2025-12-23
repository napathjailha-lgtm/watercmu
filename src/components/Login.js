import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

// เพิ่ม custom event สำหรับแจ้งการเข้าสู่ระบบ
const LOGIN_SUCCESS_EVENT = 'loginSuccess';

// Component สำหรับแสดงการแจ้งเตือนแพ็คเกจ
const PackageAlert = ({ packageInfo, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
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
              <p className="text-blue-700">{packageInfo.village_name}</p>
            </div>

            {/* ข้อมูลแพ็คเกจ */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">แพ็คเกจปัจจุบัน</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{packageInfo.package_name}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  packageInfo.package_size === 'S' ? 'bg-blue-100 text-blue-800' :
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
                      <span className={`ml-1 ${
                        packageInfo.usage_info.meter_usage_percent > 90 ? 'text-red-600' :
                        packageInfo.usage_info.meter_usage_percent > 80 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        ({packageInfo.usage_info.meter_usage_percent}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">ผู้ใช้งาน</p>
                    <p className="font-medium">
                      {packageInfo.usage_info.current_users}/{packageInfo.max_users}
                      <span className={`ml-1 ${
                        packageInfo.usage_info.user_usage_percent > 90 ? 'text-red-600' :
                        packageInfo.usage_info.user_usage_percent > 80 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        ({packageInfo.usage_info.user_usage_percent}%)
                      </span>
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
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="mt-6 flex gap-3">
            {packageInfo.expiry_status === 'EXPIRED' || packageInfo.expiry_status === 'CRITICAL' ? (
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded">
                ติดต่อต่ออายุ
              </button>
            ) : packageInfo.usage_info?.meter_usage_percent > 80 || packageInfo.usage_info?.user_usage_percent > 80 ? (
              <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded">
                อัพเกรดแพ็คเกจ
              </button>
            ) : null}
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPackageAlert, setShowPackageAlert] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const navigate = useNavigate();

  // ฟังก์ชันสำหรับตรวจสอบว่าควรแจ้งเตือนหรือไม่
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
      const isVillageAdmin = userData.role === 'ผู้ดูแลหมู่บ้าน' || 
                            userData.role === 'village_admin' ||
                            userData.permissions?.includes('village_management');

      if (!isVillageAdmin) {
        return; // ไม่แสดงแจ้งเตือนสำหรับผู้ใช้ที่ไม่ใช่ admin หมู่บ้าน
      }

      const villageId = userData.village_id || userData.assigned_village_id;
      if (!villageId) {
        console.warn('Village ID not found for user');
        return;
      }

      // ดึงข้อมูลแพ็คเกจของหมู่บ้าน
      const response = await axios.get(`${API_BASE_URL}/villages/${villageId}/package-info`);
      console.log('Package info response:', response);
      
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
          alerts.push('จำนวนมิเตอร์ใกล้เต็มแล้ว');
        }
        
        if (packageData.usage_info?.user_usage_percent > 90) {
          alerts.push('จำนวนผู้ใช้งานใกล้เต็มแล้ว');
        }

        setPackageInfo({
          ...packageData,
          alerts: alerts
        });
        
        // แสดงแจ้งเตือน
        setShowPackageAlert(true);
      }
    } catch (err) {
      console.error('Error fetching package info:', err);
      // ไม่แสดงข้อผิดพลาดในการดึงข้อมูลแพ็คเกจ เพื่อไม่ให้รบกวนการล็อกอิน
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // เรียกใช้ API login
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      console.log('Login response:', response);
      
      if (response.data.data && response.data.data.token) {
        // บันทึกข้อมูลใน localStorage
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('waterSystemUser', JSON.stringify(response.data.data));
        
        // ตั้งค่า Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        // บันทึกเวลาหมดอายุของ token (ถ้ามี)
        if (response.data.data.expiresIn) {
          const expirationTime = new Date().getTime() + response.data.data.expiresIn * 1000;
          localStorage.setItem('tokenExpiration', expirationTime);
        }
        
        // ส่งข้อมูลผู้ใช้ไปยังคอมโพเนนต์ parent ถ้ามี
        if (onLogin) {
          onLogin(response.data);
        }
        
        // ประกาศ custom event เพื่อแจ้งระบบว่าเข้าสู่ระบบสำเร็จ
        const loginEvent = new CustomEvent(LOGIN_SUCCESS_EVENT, { 
          detail: response.data 
        });
        window.dispatchEvent(loginEvent);
        
        // ดึงข้อมูลแพ็คเกจของหมู่บ้าน (สำหรับ admin หมู่บ้าน)
        await fetchVillagePackageInfo(response.data.data);
        
        // รอเล็กน้อยก่อนนำทาง เพื่อให้แน่ใจว่า state ได้รับการอัพเดทแล้ว
        setTimeout(() => {
          // ถ้าไม่มีการแจ้งเตือนแพ็คเกจ ให้นำทางทันที
          if (!showPackageAlert) {
            navigate('/', { replace: true });
          }
        }, 100);
      } else {
        setError('รูปแบบการตอบกลับไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
      }
    } catch (err) {
      if (err.response) {
        // มีการตอบกลับจากเซิร์ฟเวอร์พร้อมรหัสสถานะข้อผิดพลาด
        if (err.response.status === 401) {
          setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError(`เกิดข้อผิดพลาด: ${err.response.status}`);
        }
      } else if (err.request) {
        // มีการส่งคำขอแต่ไม่ได้รับการตอบกลับจากเซิร์ฟเวอร์
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        // เกิดข้อผิดพลาดในการตั้งค่าคำขอ
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับปิดแจ้งเตือนและนำทาง
  const handleClosePackageAlert = () => {
    setShowPackageAlert(false);
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
           <div className="flex flex-col items-center">
                  <img 
                    src="/logo/icons.png" 
                  width={100}
                  />
                </div>
          <div className="text-center mb-8" style={{ marginTop: '20px' }}>
            <h1 className="text-2xl font-bold text-blue-800">ระบบบริหารจัดการน้ำประปาหมู่บ้าน</h1>
            <p className="text-gray-600 mt-2">กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                type="text"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  จดจำฉัน
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div className="mt-6 text-center">
          
            <div className="mb-4">
       
              <div className="flex justify-center items-center space-x-6">
                <div className="flex flex-col items-center">
                  <img 
                    src="/logo/8thfloor.png" 
                    alt="Engineering" 
                    className="w-30 h-30 object-contain mb-1"
                   
                  />
                 
               
                </div>
                <div className="flex flex-col items-center">
                  <img 
                    src="/logo/Engineering.png" 
                    alt="NIA" 
                    className="w-30 h-30 object-contain mb-1"
                
                  />
                 
                 
                </div>
                <div className="flex flex-col items-center">
                  <img 
                    src="/logo/logocmu.png" 
                    alt="8thfloor" 
                    className="w-30 h-30 object-contain mb-1"
                  
                  />
                  
                 
                </div>
              </div>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600">
                พัฒนาโดย: มหาวิทยาลัยเชียงใหม่ ระบบบริหารจัดการน้ำประปาหมู่บ้าน © 2025
              </p>
            </div>
          </div>
         
        </div>
      </div>

      {/* Package Alert Modal */}
      {showPackageAlert && (
        <PackageAlert 
          packageInfo={packageInfo} 
          onClose={handleClosePackageAlert}
        />
      )}
    </>
  );
};

export default LoginPage;