// src/components/MainLayout.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { userService, villageService } from '../services/api';
import eventBus from '../utils/eventBus';

function MainLayout({ user, onLogout, currentVillage, onVillageChange, children }) {
  const location = useLocation();
  const [villages, setVillages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [shouldRedirect, setShouldRedirect] = useState(!user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ดึงข้อมูลหมู่บ้าน - ใช้ useCallback เพื่อป้องกัน infinite loop
  const fetchVillages = useCallback(async () => {
    if (!user || !user.role_name) {
      console.log('No user or role_name, skipping village fetch');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let response;

      if (user.role_name === 'village_admin') {
        console.log('Fetching villages for village_admin:', user.user_id);
        response = await userService.getUserById(user.user_id);

        if (response?.data?.data?.villages) {
          const villagesData = response.data.data.villages;
          console.log('Village admin villages:', villagesData);

          if (Array.isArray(villagesData) && villagesData.length > 0) {
            setVillages(villagesData);

            // ถ้ายังไม่มี currentVillage ให้เซ็ตเป็นหมู่บ้านแรก
            if (!currentVillage && onVillageChange) {
              const firstVillage = villagesData[0];
              localStorage.setItem('currentVillage', JSON.stringify(firstVillage));
              onVillageChange(firstVillage);
              console.log('Set first village as current:', firstVillage);
            }
          } else {
            setVillages([]);
            console.warn('No villages found for village admin');
          }
        } else {
          setVillages([]);
          console.error('Invalid villages response format:', response);
        }

      } else if (user.role_name === 'admin') {
        response = await villageService.getVillages();

        if (response?.data?.data) {
          const villagesData = response.data.data;
          // console.log('Admin villages:', villagesData);

          if (Array.isArray(villagesData) && villagesData.length > 0) {
            setVillages(villagesData);

            // ถ้ายังไม่มี currentVillage ให้เซ็ตเป็นหมู่บ้านแรก
            if (!currentVillage && onVillageChange) {
              const firstVillage = villagesData[0];
              localStorage.setItem('currentVillage', JSON.stringify(firstVillage));
              onVillageChange(firstVillage);
              console.log('Set first village as current for admin:', firstVillage);
            }
          } else {
            setVillages([]);
            console.warn('No villages found for admin');
          }
        } else {
          setVillages([]);
          console.error('Invalid villages response format:', response);
        }
      } else {
       console.log('Fetching villages for village_admin:', user.user_id);
        response = await userService.getUserById(user.user_id);

        if (response?.data?.data?.villages) {
          const villagesData = response.data.data.villages;
          console.log('Village admin villages:', villagesData);

          if (Array.isArray(villagesData) && villagesData.length > 0) {
            setVillages(villagesData);

            // ถ้ายังไม่มี currentVillage ให้เซ็ตเป็นหมู่บ้านแรก
            if (!currentVillage && onVillageChange) {
              const firstVillage = villagesData[0];
              localStorage.setItem('currentVillage', JSON.stringify(firstVillage));
              onVillageChange(firstVillage);
              console.log('Set first village as current:', firstVillage);
            }
          } else {
            setVillages([]);
            console.warn('No villages found for village admin');
          }
        } else {
          setVillages([]);
          console.error('Invalid villages response format:', response);
        }
      }

    } catch (error) {
      console.error('Error fetching villages:', error);
      setError('ไม่สามารถดึงข้อมูลหมู่บ้านได้');
      setVillages([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentVillage, onVillageChange]);

  // เรียกใช้ fetchVillages เมื่อ user เปลี่ยน
  useEffect(() => {
    if (user) {

      fetchVillages();
    } else {
      // ถ้าไม่มี user ให้ clear ข้อมูล
      setVillages([]);
      setShouldRedirect(true);
    }
  }, [user, fetchVillages]);

  // จัดการ event bus สำหรับการอัพเดทหมู่บ้าน
  useEffect(() => {
    const handleVillagesUpdated = () => {
      console.log('Villages updated event received, refreshing data...');
      fetchVillages();
    };

    eventBus.on('villages-updated', handleVillagesUpdated);

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกทำลาย
    return () => {
      eventBus.remove('villages-updated', handleVillagesUpdated);
    };
  }, [fetchVillages]);

  // กำหนดเมนูตามบทบาทของผู้ใช้
  useEffect(() => {
    if (!user) {
      setShouldRedirect(true);
      return;
    }

    setShouldRedirect(false);
    let items = [];

    if (user.role_name === 'admin') {
      // เมนูสำหรับผู้ดูแลระบบ
      items = [
        { path: '/', icon: '📊', text: 'แดชบอร์ด' },
        { path: '/village-manage', icon: '🏠', text: 'จัดการหมู่บ้าน' },
        { path: '/village-settings', icon: '🏠', text: 'ตั้งค่าหมู่บ้าน' },
        { path: '/zone', icon: '💳', text: 'จัดการโซน' },
        { path: '/water-meters', icon: '🔌', text: 'จัดการผู้พักอาศัย' },
        { path: '/meter-readings', icon: '📝', text: 'จดมิเตอร์ / ใบแจ้งหนี้ / ใบเสร็จรับเงิน' },
        { path: '/billing', icon: '💰', text: 'จัดการบิล' },
        { path: '/users', icon: '👥', text: 'จัดการผู้ใช้งาน' }
      ];
    } else if (user.role_name === 'village_admin') {
      items = [
        { path: '/', icon: '📊', text: 'แดชบอร์ด' },
        { path: '/village-settings', icon: '🏠', text: 'ตั้งค่าหมู่บ้าน' },
        { path: '/zone', icon: '💳', text: 'จัดการโซน' },
        { path: '/water-meters', icon: '🔌', text: 'จัดการผู้พักอาศัย' },
        { path: '/meter-readings', icon: '📝', text: 'จดมิเตอร์ / ใบแจ้งหนี้ / ใบเสร็จรับเงิน' },
        { path: '/billing', icon: '💰', text: 'จัดการบิล' },
        { path: '/users', icon: '👥', text: 'จัดการผู้ใช้งาน' }
      ];
    } else if (user.role_name === 'meter') {
      // เมนูสำหรับเจ้าหน้าที่จดมิเตอร์
      items = [
        { path: '/', icon: '📊', text: 'แดชบอร์ด' },
        { path: '/meter-readings', icon: '📝', text: 'บันทึกค่ามิเตอร์' },
        { path: '/reports', icon: '📈', text: 'รายงาน' }
      ];
    } else {
      // เมนูสำหรับผู้ใช้น้ำ
      items = [
        { path: '/', icon: '📊', text: 'หน้าหลัก' },
        { path: '/billing', icon: '💰', text: 'บิลค่าน้ำ' },
        { path: '/payments', icon: '💳', text: 'ประวัติการชำระเงิน' },
        { path: '/reports', icon: '📈', text: 'รายงานการใช้น้ำ' }
      ];
    }

    setMenuItems(items);
  }, [user]);

  const handleVillageChange = (e) => {
    if (!onVillageChange) return;

    const villageId = parseInt(e.target.value);
    console.log("Village selected, ID:", villageId);
    const selectedVillage = villages.find(v => v.village_id === villageId);
    console.log("Selected village:", selectedVillage);

    if (selectedVillage) {
      localStorage.setItem('currentVillage', JSON.stringify(selectedVillage));
      onVillageChange(selectedVillage);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // การ redirect ต้องอยู่หลังจากเรียกใช้ Hook ทั้งหมดแล้ว
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1>ระบบจัดการน้ำประปา</h1>
        </div>
        <div className="user-controls">
          {/* สำหรับ Admin - แสดง dropdown เลือกหมู่บ้าน */}
          {user && user.role_name === 'admin' && (
            <div className="village-selector">
              <label className="user-controls">เลือกหมู่บ้าน:</label>
              <select
                value={currentVillage?.village_id || ''}
                onChange={handleVillageChange}
                disabled={isLoading}
              >
                <option value="">-- เลือกหมู่บ้าน --</option>
                {Array.isArray(villages) && villages.length > 0 ? (
                  villages.map(village => (
                    <option key={village.village_id} value={village.village_id}>
                      {village.village_name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {isLoading ? 'กำลังโหลด...' : error ? error : '-- ไม่พบข้อมูลหมู่บ้าน --'}
                  </option>
                )}
              </select>
            </div>
          )}

          {/* สำหรับ Village Admin - แสดงชื่อหมู่บ้านที่รับผิดชอบ */}
          {user && user.role_name === 'village_admin' && currentVillage && (
            <div className="village-selector" >
              <label className="user-controls">หมู่บ้าน:</label>
              <span className="user-controls">{currentVillage.village_name}</span>
            </div>
          )}
          {user && (
            <div className="user-info">
              <span>{user.name}</span>
              <span className="role-badge">
                {user.role_name === 'admin' ? 'ผู้ดูแลระบบ' :
                  user.role_name === 'village_admin' ? 'ผู้ดูแลหมู่บ้าน' :
                    user.role_name === 'meter' ? 'เจ้าหน้าที่จดมิเตอร์' :
                      'ผู้ใช้น้ำ'}
              </span>
            </div>
          )}
          <button className="logout-btn" onClick={onLogout}>ออกจากระบบ</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <nav className="nav-menu">
            <ul>
              {Array.isArray(menuItems) && menuItems.length > 0 ? (
                menuItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <span className="icon">{item.icon}</span>
                      {item.text}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="nav-message">ไม่มีเมนูที่แสดง</li>
              )}
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;