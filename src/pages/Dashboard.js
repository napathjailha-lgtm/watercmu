import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // นำเข้า context สำหรับดึงข้อมูล token

// กำหนด URL ฐานของ API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.abchomey.com/api';

const Dashboard = ({ currentVillage }) => {
  // สถานะสำหรับข้อมูลต่างๆ
  const [trendData, setTrendData] = useState([]);
  const [zoneData, setZoneData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    currentMonthUsage: 0,
    previousMonthUsage: 0,
    totalIncome: 0,
    previousMonthIncome: 0,
    pendingPayments: 0,
    lastUpdated: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' })
  });
  const [alerts, setAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [infoCards, setInfoCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [villageSettings, setVillageSettings] = useState(null);

  // นำเข้าข้อมูลการเข้าสู่ระบบ
  const { user } = useAuth ? useAuth() : { user: null };

  // สร้าง instance ของ axios พร้อม config
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });

  // สีสำหรับกราฟที่ใช้บ่อย
  const zoneColors = ['#38bdf8', '#4ade80', '#f87171', '#a78bfa'];
  const paymentColors = ['#10b981', '#f97316'];

  // ฟังก์ชันสำหรับดึงข้อมูลจาก API
  const fetchDashboardData = async () => {
    if (!currentVillage || !currentVillage.id) {
      useDefaultData();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ตามโครงสร้าง villageRoutes.js ของคุณ เราจะเรียกใช้ endpoint ต่างๆ ดังนี้:
      
      // 1. ดึงข้อมูลหมู่บ้านและการตั้งค่า
      const villagePromise = api.get(`/villages/${currentVillage.id}`);
      const villageSettingsPromise = api.get(`/villages/${currentVillage.id}/settings`);
      const villageWaterRatesPromise = api.get(`/villages/${currentVillage.id}/water-rates`);
      
      // 2. ดึงข้อมูลมิเตอร์น้ำ
      const metersPromise = api.get(`/meters`, {
        params: { villageId: currentVillage.id }
      });
      
      // 3. ดึงข้อมูลการอ่านมิเตอร์ (ย้อนหลัง 6 เดือน)
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      
      const startDate = sixMonthsAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const readingsPromise = api.get(`/readings`, {
        params: { 
          villageId: currentVillage.id,
          startDate,
          endDate
        }
      });
      
      // 4. ดึงข้อมูลผู้ใช้ในหมู่บ้าน
      const usersPromise = api.get(`/users`, {
        params: { villageId: currentVillage.id }
      });
      
      // รอการตอบกลับจากทุก API พร้อมกัน
      const [
        villageResponse,
        villageSettingsResponse,
        villageWaterRatesResponse,
        metersResponse,
        readingsResponse,
        usersResponse
      ] = await Promise.all([
        villagePromise,
        villageSettingsPromise.catch(err => ({ data: { success: false, message: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' } })),
        villageWaterRatesPromise.catch(err => ({ data: { success: false, message: 'ไม่สามารถดึงข้อมูลอัตราค่าน้ำได้' } })),
        metersPromise.catch(err => ({ data: { success: false, message: 'ไม่สามารถดึงข้อมูลมิเตอร์ได้' } })),
        readingsPromise.catch(err => ({ data: { success: false, message: 'ไม่สามารถดึงข้อมูลการอ่านมิเตอร์ได้' } })),
        usersPromise.catch(err => ({ data: { success: false, message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' } }))
      ]);
      
      // เก็บข้อมูลการตั้งค่าหมู่บ้าน
      if (villageSettingsResponse.data && villageSettingsResponse.data.success) {
        setVillageSettings(villageSettingsResponse.data.data);
      }
      
      // เตรียมข้อมูลสำหรับการสรุป
      let totalMeters = 0;
      let totalUsers = 0;
      let totalWaterUsage = 0;
      let previousMonthUsage = 0;
      let currentMonthUsage = 0;
      let totalIncome = 0;
      let previousMonthIncome = 0;
      let pendingPayments = 0;
      let activeUsers = 0;
      
      // ประมวลผลข้อมูลมิเตอร์
      if (metersResponse.data && metersResponse.data.success) {
        const meters = metersResponse.data.data || [];
        totalMeters = meters.length;
        
        // จัดกลุ่มมิเตอร์ตามโซน
        const zoneStats = {};
        
        meters.forEach(meter => {
          const zoneName = meter.zone || 'ไม่ระบุโซน';
          
          if (!zoneStats[zoneName]) {
            zoneStats[zoneName] = {
              name: zoneName,
              value: 0,
              count: 0
            };
          }
          
          zoneStats[zoneName].count += 1;
        });
        
        // แปลงเป็นอาร์เรย์และเพิ่มสี
        const formattedZoneData = Object.values(zoneStats).map((zone, index) => ({
          ...zone,
          color: zoneColors[index % zoneColors.length]
        }));
        
        setZoneData(formattedZoneData);
      }
      
      // ประมวลผลข้อมูลผู้ใช้
      if (usersResponse.data && usersResponse.data.success) {
        const users = usersResponse.data.data || [];
        totalUsers = users.length;
        activeUsers = users.filter(user => user.status === 'active').length;
      }
      
      // ประมวลผลข้อมูลการอ่านมิเตอร์
      if (readingsResponse.data && readingsResponse.data.success) {
        const readings = readingsResponse.data.data || [];
        
        // จัดกลุ่มข้อมูลตามเดือน
        const monthlyData = {};
        const today = new Date();
        const currentMonth = today.getMonth();
        const previousMonth = (currentMonth - 1 + 12) % 12;
        
        readings.forEach(reading => {
          const readingDate = new Date(reading.reading_date);
          const month = readingDate.getMonth();
          const year = readingDate.getFullYear();
          const monthYear = `${year}-${month + 1}`;
          const usage = reading.usage || (reading.current_reading - reading.previous_reading) || 0;
          
          // คำนวณค่าน้ำตามอัตราที่กำหนด
          let waterRate = 15; // อัตราค่าน้ำเริ่มต้น
          if (villageWaterRatesResponse.data && villageWaterRatesResponse.data.success) {
            const rates = villageWaterRatesResponse.data.data;
            // สมมติว่ามีโครงสร้างอัตราค่าน้ำ
            if (rates && rates.length > 0) {
              // หาอัตราค่าน้ำที่เหมาะสม
              for (const rate of rates) {
                if (usage >= rate.minUsage && (!rate.maxUsage || usage <= rate.maxUsage)) {
                  waterRate = rate.ratePerUnit;
                  break;
                }
              }
            }
          }
          
          const income = usage * waterRate;
          
          // สะสมข้อมูลตามเดือน
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: readingDate.toLocaleString('th-TH', { month: 'short' }),
              year: year,
              monthNum: month,
              monthYear: monthYear,
              usage: 0,
              income: 0
            };
          }
          
          monthlyData[monthYear].usage += usage;
          monthlyData[monthYear].income += income;
          
          // คำนวณข้อมูลเดือนปัจจุบันและเดือนก่อน
          if (month === currentMonth && year === today.getFullYear()) {
            currentMonthUsage += usage;
            totalIncome += income;
          } else if (month === previousMonth && 
                    ((month < currentMonth && year === today.getFullYear()) || 
                     (month > currentMonth && year === today.getFullYear() - 1))) {
            previousMonthUsage += usage;
            previousMonthIncome += income;
          }
          
          // สะสมการใช้น้ำทั้งหมด
          totalWaterUsage += usage;
        });
        
        // แปลงเป็นอาร์เรย์และเรียงตามเดือน
        const formattedTrendData = Object.values(monthlyData)
          .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthNum - b.monthNum;
          })
          .slice(-6); // เอาเฉพาะ 6 เดือนล่าสุด
        
        setTrendData(formattedTrendData);
      }
      
      // สร้างข้อมูลสรุป
      setSummary({
        totalUsers,
        activeUsers,
        currentMonthUsage,
        previousMonthUsage,
        totalIncome,
        previousMonthIncome,
        pendingPayments,
        lastUpdated: new Date().toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })
      });
      
      // สร้างข้อมูลการ์ด
      const newInfoCards = [
        { id: 1, value: totalUsers.toString(), title: 'ครัวเรือน', color: 'bg-cyan-500', textColor: 'text-white' },
        { id: 2, value: totalMeters.toString(), title: 'มาตรวัดน้ำ', color: 'bg-green-500', textColor: 'text-white' },
        { id: 3, value: totalWaterUsage.toLocaleString(), title: 'ลูกบาศก์เมตร', color: 'bg-amber-400', textColor: 'text-white' },
        { id: 6, value: totalIncome.toLocaleString(), title: 'ค่าน้ำทั้งหมด', color: 'bg-blue-500', textColor: 'text-white', unit: 'บาท' }
      ];
      
      if (villageWaterRatesResponse.data && villageWaterRatesResponse.data.success) {
        const rates = villageWaterRatesResponse.data.data;
        if (rates && rates.length > 0) {
          const baseRate = rates[0].ratePerUnit;
          newInfoCards.push({ 
            id: 7, 
            value: baseRate.toString(), 
            title: 'อัตราค่าน้ำเริ่มต้น', 
            color: 'bg-red-500', 
            textColor: 'text-white', 
            unit: 'บาท/ลบ.ม.' 
          });
        }
      }
      
      setInfoCards(newInfoCards);
      
      // พยายามดึงข้อมูลกิจกรรมล่าสุด (อาจต้องสร้าง API เพิ่มเติม)
      try {
        const logsResponse = await api.get('/logs', {
          params: { 
            villageId: currentVillage.id,
            limit: 5
          }
        });
        
        if (logsResponse.data && logsResponse.data.success) {
          const activities = logsResponse.data.data.map(log => {
            let action = '';
            let details = {};
            
            switch (log.action) {
              case 'meter_reading_added':
                action = 'บันทึกค่ามิเตอร์';
                details = {
                  user: log.user?.name || 'ไม่ระบุผู้ใช้',
                  meterNo: log.details?.meter_id || 'ไม่ระบุมิเตอร์'
                };
                break;
              case 'payment_received':
                action = 'ชำระค่าน้ำ';
                details = {
                  user: log.user?.name || 'ไม่ระบุผู้ใช้',
                  amount: `${log.details?.amount || 0} บาท`
                };
                break;
              default:
                action = log.action;
                details = log.details || {};
            }
            
            return {
              id: log.id,
              action,
              ...details,
              date: new Date(log.created_at).toLocaleString('th-TH')
            };
          });
          
          setRecentActivities(activities);
        } else {
          throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมได้');
        }
      } catch (err) {
        console.warn('Failed to fetch activities:', err);
        // ใช้ข้อมูลตัวอย่างสำหรับกิจกรรม
        setRecentActivities([
          { id: 1, action: 'บันทึกค่ามิเตอร์', user: 'นายสมชาย ใจดี', meterNo: 'M001', date: '7 เม.ย. 2568 09:30' },
          { id: 2, action: 'ชำระค่าน้ำ', user: 'นางนภา จันทร์เพ็ญ', amount: '230 บาท', date: '7 เม.ย. 2568 08:45' },
          { id: 3, action: 'ลงทะเบียนผู้ใช้ใหม่', user: 'นายอภิชาติ สุขสวัสดิ์', meterNo: 'M045', date: '6 เม.ย. 2568 15:20' },
          { id: 4, action: 'แจ้งท่อแตก', location: 'หน้าบ้านเลขที่ 52 โซน C', status: 'กำลังดำเนินการ', date: '6 เม.ย. 2568 11:15' }
        ]);
      }
      
      // พยายามดึงข้อมูลการแจ้งเตือน (อาจต้องสร้าง API เพิ่มเติม)
      try {
        const notificationsResponse = await api.get('/notifications', {
          params: { 
            villageId: currentVillage.id,
            limit: 3
          }
        });
        
        if (notificationsResponse.data && notificationsResponse.data.success) {
          const notifications = notificationsResponse.data.data.map(notification => {
            let type = 'info';
            
            switch (notification.priority) {
              case 'high':
                type = 'warning';
                break;
              case 'medium':
                type = 'info';
                break;
              case 'low':
                type = 'success';
                break;
            }
            
            return {
              id: notification.id,
              type,
              message: notification.message,
              date: new Date(notification.created_at).toLocaleDateString('th-TH')
            };
          });
          
          setAlerts(notifications);
        } else {
          throw new Error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
        }
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
        // ใช้ข้อมูลตัวอย่างสำหรับการแจ้งเตือน
        setAlerts([
          { id: 1, type: 'warning', message: 'มีผู้ใช้ค้างชำระเกิน 30 วัน จำนวน 12 ราย', date: '7 เม.ย. 2568' },
          { id: 2, type: 'info', message: 'กำหนดการซ่อมบำรุงท่อประปาโซน B วันที่ 15 เม.ย. 2568', date: '5 เม.ย. 2568' },
          { id: 3, type: 'success', message: 'อัพเดทอัตราค่าน้ำใหม่มีผลวันที่ 1 พ.ค. 2568', date: '2 เม.ย. 2568' }
        ]);
      }
      
      // สร้างข้อมูลสำหรับกราฟการชำระเงิน (สมมติว่ามีข้อมูล)
      setPaymentData([
        { status: 'ชำระแล้ว', count: totalUsers - 60, color: paymentColors[0] },
        { status: 'ค้างชำระ', count: 60, color: paymentColors[1] }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      
      // กรณีที่ API ยังไม่พร้อม ให้ใช้ข้อมูลตัวอย่างแทน
      useDefaultData();
    } finally {
      setIsLoading(false);
    }
  };

  // ใช้ข้อมูลตัวอย่างในกรณีที่ API ไม่ทำงาน
  const useDefaultData = () => {
    // ข้อมูลตัวอย่าง (เหมือนเดิม)...
    setTrendData([
      { month: 'ม.ค.', usage: 3200, income: 48000 },
      { month: 'ก.พ.', usage: 3450, income: 51750 },
      { month: 'มี.ค.', usage: 3100, income: 46500 },
      { month: 'เม.ย.', usage: 3600, income: 54000 },
      { month: 'พ.ค.', usage: 3800, income: 57000 },
      { month: 'มิ.ย.', usage: 3500, income: 52500 }
    ]);

    setZoneData([
      { name: 'โซน A', value: 1500, color: '#38bdf8' },
      { name: 'โซน B', value: 1200, color: '#4ade80' },
      { name: 'โซน C', value: 800, color: '#f87171' },
      { name: 'โซน D', value: 500, color: '#a78bfa' }
    ]);

    setPaymentData([
      { status: 'ชำระแล้ว', count: 265, color: '#10b981' },
      { status: 'ค้างชำระ', count: 60, color: '#f97316' }
    ]);

    setSummary({
      totalUsers: 325,
      activeUsers: 310,
      currentMonthUsage: 3500,
      previousMonthUsage: 3200,
      totalIncome: 52500,
      previousMonthIncome: 48000,
      pendingPayments: 8750,
      lastUpdated: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })
    });

    setAlerts([
      { id: 1, type: 'warning', message: 'มีผู้ใช้ค้างชำระเกิน 30 วัน จำนวน 12 ราย', date: '7 เม.ย. 2568' },
      { id: 2, type: 'info', message: 'กำหนดการซ่อมบำรุงท่อประปาโซน B วันที่ 15 เม.ย. 2568', date: '5 เม.ย. 2568' },
      { id: 3, type: 'success', message: 'อัพเดทอัตราค่าน้ำใหม่มีผลวันที่ 1 พ.ค. 2568', date: '2 เม.ย. 2568' }
    ]);

    setRecentActivities([
      { id: 1, action: 'บันทึกค่ามิเตอร์', user: 'นายสมชาย ใจดี', meterNo: 'M001', date: '7 เม.ย. 2568 09:30' },
      { id: 2, action: 'ชำระค่าน้ำ', user: 'นางนภา จันทร์เพ็ญ', amount: '230 บาท', date: '7 เม.ย. 2568 08:45' },
      { id: 3, action: 'ลงทะเบียนผู้ใช้ใหม่', user: 'นายอภิชาติ สุขสวัสดิ์', meterNo: 'M045', date: '6 เม.ย. 2568 15:20' },
      { id: 4, action: 'แจ้งท่อแตก', location: 'หน้าบ้านเลขที่ 52 โซน C', status: 'กำลังดำเนินการ', date: '6 เม.ย. 2568 11:15' }
    ]);

    setInfoCards([
      { id: 1, value: '150', title: 'ครัวเรือน', color: 'bg-cyan-500', textColor: 'text-white' },
      { id: 2, value: '500', title: 'มาตรวัดน้ำ', color: 'bg-green-500', textColor: 'text-white' },
      { id: 3, value: '15,000', title: 'ลูกบาศก์เมตร', color: 'bg-amber-400', textColor: 'text-white' },
      { id: 4, value: '700', title: 'จำนวนผู้ติดตาม', color: 'bg-yellow-400', textColor: 'text-white' },
      { id: 5, value: '150', title: 'ครัวเรือนที่ค้างชำระ', color: 'bg-cyan-400', textColor: 'text-white' },
      { id: 6, value: '50,000,000', title: 'ค่าน้ำทั้งปี', color: 'bg-blue-500', textColor: 'text-white', unit: 'บาท.' },
      { id: 7, value: '5', title: 'อัตราค่าน้ำต่อลูกบาศก์เมตร', color: 'bg-red-500', textColor: 'text-white' },
      { id: 8, value: '120', title: 'จำนวนมิเตอร์ที่ชำรุด', color: 'bg-teal-400', textColor: 'text-white' },
      { id: 9, value: '660', title: 'จำนวนผู้ติดตามที่เป็นผู้ใช้งาน', color: 'bg-gray-400', textColor: 'text-white' },
      { id: 10, value: '112', title: 'จำนวนใบวางบิลรายเดือน', color: 'bg-fuchsia-500', textColor: 'text-white' },
    ]);
  };

  // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
  const calculateChange = (current, previous) => {
    if (!previous) return { value: 0, increase: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      increase: change >= 0
    };
  };

  // ข้อมูลการเปลี่ยนแปลง
  const usageChange = calculateChange(summary.currentMonthUsage, summary.previousMonthUsage);
  const incomeChange = calculateChange(summary.totalIncome, summary.previousMonthIncome);

  // ดึงข้อมูลเมื่อคอมโพเนนต์โหลดหรือเมื่อหมู่บ้านเปลี่ยน
  useEffect(() => {
    if (currentVillage && currentVillage.id) {
      console.log('Fetching dashboard data for village:', currentVillage.name);
      fetchDashboardData();
    } else {
      console.log('No village selected, using default data');
      useDefaultData();
    }
  }, [currentVillage?.id]);

  // แสดงการโหลด
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
         <button 
           onClick={fetchDashboardData} 
           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none"
         >
           ลองใหม่อีกครั้ง
         </button>
       </div>
     </div>
   );
 }

 // ตัวแปรสำหรับชื่อเดือนปัจจุบัน
 const currentMonth = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

 return (
   <div className="min-h-screen bg-gray-50">
     {/* Header */}
     <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-md">
       <div className="max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between">
           <div>
             <h1 className="text-2xl md:text-3xl font-bold">ภาพรวมระบบน้ำประปาหมู่บ้าน {currentVillage ? currentVillage.name : ""}</h1>
             <p className="mt-1 text-blue-100">{currentMonth}</p>
           </div>
           <div className="mt-2 md:mt-0 text-sm text-blue-100">
             <p>อัพเดทล่าสุด: {summary.lastUpdated}</p>
           </div>
         </div>
       </div>
     </div>
     
     <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
       {/* การ์ดข้อมูลใหม่ตามรูปภาพ */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
         {infoCards.map((card) => (
           <div key={card.id} className={`${card.color} ${card.textColor} rounded-md shadow-sm p-4`}>
             <div className="text-2xl font-bold">{card.value} {card.unit}</div>
             <div className="text-sm mt-1">{card.title}</div>
             <div className="flex justify-end mt-2">
               <button className="text-xs flex items-center rounded-full px-2 py-1 bg-white bg-opacity-30 hover:bg-opacity-40 transition">
                 <span>ข้อมูลเพิ่มเติม</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                 </svg>
               </button>
             </div>
           </div>
         ))}
       </div>
       
       {/* การ์ดแสดงข้อมูลสรุป */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
         {/* การ์ดจำนวนผู้ใช้ */}
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
           <div className="p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0 rounded-md p-3 bg-blue-50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-sm font-medium text-gray-500 truncate">ผู้ใช้น้ำทั้งหมด</dt>
                   <dd>
                     <div className="text-xl font-semibold text-gray-900">{summary.totalUsers} ราย</div>
                     <div className="flex items-center text-xs mt-1">
                       <span className="text-gray-500">ใช้งานอยู่ {summary.activeUsers} ราย</span>
                     </div>
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>

         {/* การ์ดปริมาณการใช้น้ำ */}
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
           <div className="p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0 rounded-md p-3 bg-blue-50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-sm font-medium text-gray-500 truncate">ปริมาณการใช้น้ำเดือนนี้</dt>
                   <dd>
                     <div className="text-xl font-semibold text-blue-600">{summary.currentMonthUsage.toLocaleString()} ลบ.ม.</div>
                     <div className="flex items-center text-xs mt-1">
                       <span className={`${usageChange.increase ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                         {usageChange.increase ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
                         ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         )}
                         {usageChange.value}%
                       </span>
                       <span className="text-gray-500 ml-1.5">จากเดือนที่แล้ว</span>
                     </div>
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>

         {/* การ์ดรายได้รวม */}
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
           <div className="p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0 rounded-md p-3 bg-green-50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-sm font-medium text-gray-500 truncate">รายได้รวมเดือนนี้</dt>
                   <dd>
                     <div className="text-xl font-semibold text-green-600">{summary.totalIncome.toLocaleString()} บาท</div>
                     <div className="flex items-center text-xs mt-1">
                       <span className={`${incomeChange.increase ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                         {incomeChange.increase ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
                         ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         )}
                         {incomeChange.value}%
                       </span>
                       <span className="text-gray-500 ml-1.5">จากเดือนที่แล้ว</span>
                     </div>
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>

         {/* การ์ดค้างชำระ */}
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
           <div className="p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0 rounded-md p-3 bg-red-50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <div className="ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-sm font-medium text-gray-500 truncate">ค้างชำระรวม</dt>
                   <dd>
                     <div className="text-xl font-semibold text-red-600">{summary.pendingPayments.toLocaleString()} บาท</div>
                     <div className="flex items-center text-xs mt-1">
                       <span className="text-red-500 flex items-center">
                         {paymentData.find(p => p.status === 'ค้างชำระ')?.count || 0} ราย
                       </span>
                       <span className="text-gray-500 ml-1.5">ที่ยังไม่ได้ชำระ</span>
                     </div>
                   </dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>
       </div>

       {/* แถวที่ 2 - กราฟและแผนภูมิ */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         {/* กราฟแนวโน้มการใช้น้ำและรายได้ */}
         <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
           <h2 className="text-lg font-medium text-gray-800 mb-4">แนวโน้มการใช้น้ำและรายได้ 6 เดือนล่าสุด</h2>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart
                 data={trendData}
                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                 <XAxis dataKey="month" stroke="#6b7280" />
                 <YAxis yAxisId="left" stroke="#3b82f6" />
                 <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                   }}
                 />
                 <Legend />
                 <Line
                   yAxisId="left"
                   type="monotone"
                   dataKey="usage"
                   name="ปริมาณการใช้น้ำ (ลบ.ม.)"
                   stroke="#3b82f6"
                   activeDot={{ r: 8 }}
                   strokeWidth={2}
                 />
                 <Line
                   yAxisId="right"
                   type="monotone"
                   dataKey="income"
                   name="รายได้ (บาท)"
                   stroke="#10b981"
                   strokeWidth={2}
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
         </div>

         {/* แผนภูมิวงกลมสำหรับการชำระเงิน */}
         <div className="bg-white p-6 rounded-xl shadow-sm">
           <h2 className="text-lg font-medium text-gray-800 mb-4">อัตราการชำระเงิน</h2>
           <div className="h-72 flex flex-col items-center justify-center">
             <div className="w-48 h-48 mb-4">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={paymentData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="count"
                   >
                     {paymentData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip
                     formatter={(value, name, props) => [`${value} ราย`, props.payload.status]}
                     contentStyle={{
                       backgroundColor: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                     }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full">
               {paymentData.map((entry, index) => (
                 <div key={index} className="flex items-center">
                   <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                   <span className="text-sm">{entry.status}: {entry.count} ราย</span>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>

       {/* แถวที่ 3 - สถิติรายโซนและการแจ้งเตือน */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         {/* สถิติการใช้น้ำรายโซน */}
         <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
           <h2 className="text-lg font-medium text-gray-800 mb-4">ปริมาณการใช้น้ำแยกตามโซน</h2>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart
                 data={zoneData}
                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                 <XAxis dataKey="name" stroke="#6b7280" />
                 <YAxis stroke="#6b7280" />
                 <Tooltip
                   formatter={(value) => [`${value} ลบ.ม.`, 'ปริมาณการใช้น้ำ']}
                   contentStyle={{
                     backgroundColor: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                   }}
                 />
                 <Bar dataKey="value" name="ปริมาณการใช้น้ำ">
                   {zoneData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>

         {/* การแจ้งเตือน */}
         <div className="bg-white p-6 rounded-xl shadow-sm">
           <h2 className="text-lg font-medium text-gray-800 mb-4">การแจ้งเตือน</h2>
           <div className="space-y-4">
             {alerts.map(alert => (
               <div
                 key={alert.id}
                 className={`p-4 rounded-lg ${
                   alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                   alert.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-400' :
                   'bg-green-50 border-l-4 border-green-400'
                 }`}
               >
                 <div className="flex justify-between">
                   <div className={`text-sm font-medium ${
                     alert.type === 'warning' ? 'text-yellow-700' :
                     alert.type === 'info' ? 'text-blue-700' :
                     'text-green-700'
                   }`}>
                     {alert.message}
                   </div>
                 </div>
                 <div className="mt-2 text-xs text-gray-500">
                   {alert.date}
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* แถวที่ 4 - กิจกรรมล่าสุด */}
       <div className="bg-white p-6 rounded-xl shadow-sm">
         <h2 className="text-lg font-medium text-gray-800 mb-4">กิจกรรมล่าสุด</h2>
         <div className="overflow-hidden">
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">กิจกรรม</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่/เวลา</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {recentActivities.map(activity => (
                   <tr key={activity.id}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.action}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {activity.user && `${activity.user}`}
                       {activity.meterNo && ` (${activity.meterNo})`}
                       {activity.amount && ` - ${activity.amount}`}
                       {activity.location && ` - ${activity.location}`}
                       {activity.status && ` - ${activity.status}`}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default Dashboard;