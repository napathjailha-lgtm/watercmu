import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dashboardService from '../services/dashboardService';

function AdminDashboard({ user, currentVillage }) {

  console.log('AdminDashboard rendered with user:', user, 'and currentVillage:', currentVillage);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    waterUsage: 0,
    revenue: 0,
    unpaid: 0,
    unpaidCount: 0,
    activities: [],
    alerts: [],
    paymentStatus: {
      totalMeters: 0,
      paidMeters: 0,
      unpaidMeters: 0
    },
    zoneData: [],
    monthlyUsage: [],
    statisticsData: [],
    billingStats: {}
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (มิถุนายน = 5)

  const startDate = new Date(year, month, 1); // วันที่ 1 ของเดือน
  const endDate = new Date(year, month + 1, 0); // วันสุดท้ายของเดือน

  const formattedStartDate = startDate.toISOString().split('T')[0]; // '2025-06-01'
  const formattedEndDate = endDate.toISOString().split('T')[0];     // '2025-06-30'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: formattedStartDate,
    endDate: formattedEndDate
  });

  // สีสำหรับ PieChart
  const COLORS = ['#EC4899', '#F59E0B', '#06B6D4', '#8B5CF6', '#A855F7'];

  const loadDashboardData = useCallback(async (village, dateRange = null) => {
    console.log('loadDashboardData called with village:', village);

    if (!village || !village.village_id) {
      console.log('No village selected or missing village_id, skipping data load');
      return;
    }

    const params = dateRange || selectedDateRange;
    console.log('date', params)
    setIsLoading(true);
    setError(null);

    try {

      // เรียก API ทั้งหมด
      const allData = await dashboardService.getAllDashboardData(village.village_id, {
        startDate: params.startDate,
        endDate: params.endDate
      });

      console.log('Dashboard data loaded:', allData);

      // รวมข้อมูลทั้งหมด
      const combinedData = {
        // ข้อมูลหลักจาก overview
        totalUsers: allData.overview?.data?.totalMeters || 0,
        waterUsage: allData.waterUsage?.data?.totalUsage || 0,
        revenue: allData.overview?.data?.revenue || 0,
        unpaid: allData.overview?.data?.unpaid || 0,
        unpaidCount: allData.overview?.data?.unpaidCount || 0,

        // ข้อมูลสถานะการจ่ายเงิน
        paymentStatus: {
          totalMeters: allData.overview?.data?.totalMeters || 0,
          paidMeters: allData.overview?.data?.readMeters || 0,
          unpaidMeters: allData.overview?.data?.unreadMeters || 0
        },

        // ข้อมูล Zone
        zoneData: allData.zoneStats?.data?.zoneData || [],

        // ข้อมูลการใช้น้ำรายเดือน
        monthlyUsage: allData.waterUsage?.data?.monthlyUsage || [],

        // ข้อมูลสถิติ
        statisticsData: allData.statistics?.data?.statisticsData || [],

        // กิจกรรมล่าสุด
        activities: allData.activities?.data?.activities || [],

        // การแจ้งเตือน
        alerts: allData.alerts?.data?.alerts || [],

        // สถิติการเรียกเก็บเงิน
        billingStats: allData.billingStats?.data?.billingStatistics || {}
      };
      setDashboardData(combinedData);

      // แสดง error หากมี
      if (allData.errors && allData.errors.length > 0) {
        console.warn('Some APIs failed:', allData.errors);
        setError(`บางส่วนของข้อมูลโหลดไม่สำเร็จ: ${allData.errors.map(e => e.api).join(', ')}`);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateRange]); // เพิ่ม selectedDateRange เป็น dependency

  // ฟังก์ชันสำหรับค้นหาข้อมูลตามช่วงวันที่
  const handleDateRangeSearch = useCallback(async () => {
    console.log('Date range search triggered');
    if (currentVillage) {
      await loadDashboardData(currentVillage, selectedDateRange);
    }
  }, [currentVillage, selectedDateRange, loadDashboardData]);

  // Effect สำหรับการเปลี่ยนแปลง currentVillage
  useEffect(() => {
    console.log('AdminDashboard useEffect - currentVillage changed:', currentVillage);
    if (currentVillage?.village_id) {
      loadDashboardData(currentVillage);
    } else {
      console.log('No village ID, clearing dashboard data');
      setDashboardData({
        totalUsers: 0,
        waterUsage: 0,
        revenue: 0,
        unpaid: 0,
        unpaidCount: 0,
        activities: [],
        alerts: [],
        paymentStatus: {
          totalMeters: 0,
          paidMeters: 0,
          unpaidMeters: 0
        },
        zoneData: [],
        monthlyUsage: [],
        statisticsData: [],
        billingStats: {}
      });
    }
  }, [currentVillage, loadDashboardData]); // เพิ่ม loadDashboardData ใน dependency

  // Effect สำหรับ event listener (village changed events)
  useEffect(() => {
    const handleVillageChanged = (event) => {
      console.log('Village changed event received:', event.detail || event);
      // Force reload ถ้ามี village ใหม่
      if (currentVillage?.village_id) {
        loadDashboardData(currentVillage);
      }
    };

    // Listen for custom village change events
    window.addEventListener('village-changed', handleVillageChanged);
    window.addEventListener('storage', handleVillageChanged);

    return () => {
      window.removeEventListener('village-changed', handleVillageChanged);
      window.removeEventListener('storage', handleVillageChanged);
    };
  }, [currentVillage, loadDashboardData]);

  // Memoized values เพื่อประสิทธิภาพ
  const memoizedPaymentStatus = useMemo(() => {
    return {
      totalPercentage: 100,
      paidPercentage: dashboardData.paymentStatus.totalMeters > 0
        ? Math.round((dashboardData.paymentStatus.paidMeters / dashboardData.paymentStatus.totalMeters) * 100)
        : 0,
      unpaidPercentage: dashboardData.paymentStatus.totalMeters > 0
        ? Math.round((dashboardData.paymentStatus.unpaidMeters / dashboardData.paymentStatus.totalMeters) * 100)
        : 0
    };
  }, [dashboardData.paymentStatus]);

  const memoizedBillingStats = useMemo(() => {
    return {
      paidPercentage: dashboardData.billingStats.totalBills > 0
        ? Math.round((dashboardData.billingStats.paidBills / dashboardData.billingStats.totalBills) * 100)
        : 0,
      unpaidPercentage: dashboardData.billingStats.totalBills > 0
        ? Math.round((dashboardData.billingStats.unpaidBills / dashboardData.billingStats.totalBills) * 100)
        : 0
    };
  }, [dashboardData.billingStats]);

  // แสดง loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">กำลังโหลดข้อมูล...</div>
          {currentVillage && (
            <div className="text-sm text-gray-500 mt-2">หมู่บ้าน: {currentVillage.village_name}</div>
          )}
        </div>
      </div>
    );
  }

  // แสดง error state
  if (error && !error.includes('บางส่วน')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => currentVillage && loadDashboardData(currentVillage)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // แสดงข้อความถ้าไม่มีหมู่บ้าน
  if (!currentVillage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-lg">กรุณาเลือกหมู่บ้านเพื่อดูข้อมูลแดชบอร์ด</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* หัวข้อหลัก */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            ภาพรวมระบบ - {currentVillage.village_name}
          </h1>



          {/* แสดงสถานะการเชื่อมต่อ API */}
          {error && error.includes('บางส่วน') && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {error} - แสดงข้อมูลสำรอง
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-4 items-center">
            <label className="text-sm font-medium text-gray-700">ตั้งแต่วันที่:</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDateRange.startDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <label className="text-sm font-medium text-gray-700">ถึงวันที่:</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDateRange.endDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleDateRangeSearch}
              disabled={isLoading}
            >
              {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
            </button>

            {/* แสดงสถานะ API */}
            <div className="ml-auto text-sm text-gray-500">
              API Status: <span className="text-green-600">เชื่อมต่อ</span>
            </div>
          </div>
        </div>

        {/* สถานะการจ่ายเงินแยกตามมิเตอร์ */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">สถานะการจดมิเตอร์</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">มิเตอร์ทั้งหมด</div>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.paymentStatus.totalMeters} หลังคาเรือน ({memoizedPaymentStatus.totalPercentage}%)
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">จดมิเตอร์แล้ว</div>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.paymentStatus.paidMeters} หลังคาเรือน ({memoizedPaymentStatus.paidPercentage}%)
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">ยังไม่ได้จดมิเตอร์</div>
              <div className="text-2xl font-bold text-red-600">
                {dashboardData.paymentStatus.unpaidMeters} หลังคาเรือน ({memoizedPaymentStatus.unpaidPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* รายละเอียดตาม Zone */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            รายละเอียดตาม Zone <span className="text-red-500"></span>
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="font-semibold text-center">Zone</div>
            <div className="font-semibold text-center">มิเตอร์ทั้งหมด</div>
            <div className="font-semibold text-center">จดมิเตอร์แล้ว</div>
            <div className="font-semibold text-center">ยังไม่ได้จดมิเตอร์</div>
          </div>

          {dashboardData.zoneData.length > 0 ? dashboardData.zoneData.map((zone, index) => (
            <div key={zone.zone} className="grid grid-cols-4 gap-4 py-2 border-b">
              <div style={{ color: zone.color }} className="font-medium text-center">
                {zone.zone}
              </div>
              <div style={{ color: zone.color }} className="font-medium text-center">
                {zone.totalMeters} หลังคาเรือน ({zone.totalMeters > 0 ? Math.round((zone.totalMeters / dashboardData.paymentStatus.totalMeters) * 100) : 0}%)
              </div>
              <div style={{ color: zone.color }} className="font-medium text-center">
                {zone.readMeters} หลังคาเรือน ({zone.totalMeters > 0 ? Math.round((zone.readMeters / dashboardData.paymentStatus.totalMeters) * 100) : 0}%)
              </div>
              <div style={{ color: zone.color }} className="font-medium text-center">
                {zone.unreadMeters} หลังคาเรือน ({zone.totalMeters > 0 ? Math.round((zone.unreadMeters / dashboardData.paymentStatus.totalMeters) * 100) : 0}%)
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">ไม่มีข้อมูล Zone</div>
          )}
        </div>

        {/* สถานการณ์จ่ายจำนวนเงิน & การชำระเงิน */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">สถานการณ์จ่ายจำนวนเงิน & การชำระเงิน</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">ส่งบิลแล้ว</div>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.paymentStatus.paidMeters || 0} รายการ (100%)
              </div>
              <div className="text-sm text-gray-500">
                จำนวนเงิน {(dashboardData.billingStats.totalBilledAmount || 0).toLocaleString()} บาท
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">ชำระเงินแล้ว</div>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.billingStats.paidBills || 0} รายการ ({(dashboardData.billingStats.paidBills/dashboardData.paymentStatus.paidMeters)*100}%)
              </div>
              <div className="text-sm text-gray-500">
                จำนวนเงิน {(dashboardData.billingStats.paidAmount || 0).toLocaleString()} บาท
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">ค้างชำระเงิน</div>
              <div className="text-2xl font-bold text-red-600">
                {((dashboardData.paymentStatus.paidMeters || 0) - (dashboardData.billingStats.paidBills || 0))} รายการ ({(((dashboardData.paymentStatus.paidMeters || 0) - (dashboardData.billingStats.paidBills || 0))/dashboardData.paymentStatus.paidMeters)*100}%)
              </div>
              <div className="text-sm text-gray-500">
                จำนวนเงิน {(dashboardData.billingStats.unpaidAmount || 0).toLocaleString()} บาท
              </div>
            </div>
          </div>
        </div>

        {/* รายละเอียดตาม Zone (ส่วนที่ 2) */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            รายละเอียดตาม Zone <span className="text-red-500"></span>
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-semibold text-center">ส่งบิลแล้ว</div>
            <div className="font-semibold text-center">ชำระเงินแล้ว</div>
            <div className="font-semibold text-center">ค้างชำระเงิน</div>
          </div>

          {dashboardData.zoneData.length > 0 ? dashboardData.zoneData.map((zone, index) => (
            <div key={`${zone.zone}-2`} className="grid grid-cols-3 gap-4 py-3 border-b bg-gray-50">
              <div>

                <div style={{ color: zone.color }} className="font-medium">
                  {zone.zone} {zone.billedMeters || 0 || zone.readMeters || 0} รายการ (
                  {/* เริ่มต้นการแก้ไขตรงนี้ */}
                  {(() => {
                    const read = zone.readMeters || 0;
                    const total = dashboardData.paymentStatus.paidMeters || 0;
                    let percentage = 0;

                    if (total > 0) {
                      percentage = (read / total) * 100;
                    }

                    return `${ percentage.toFixed(2)}%`;
                  })()}
                  {/* สิ้นสุดการแก้ไขตรงนี้ */}
                  )
                </div>
                <div className="text-sm text-gray-500">จำนวนเงิน {(zone.totalBilledAmount || 0).toLocaleString()} บาท</div>
              </div>
              <div>
                <div style={{ color: zone.color }}>
                  {zone.paidMeters || 0} รายการ (
                  {(() => {
                    const paid = zone.paidMeters || 0;
                    const billed = dashboardData.paymentStatus.paidMeters || 0; // ใช้ billed แทน total เพื่อความชัดเจนตามโค้ดของคุณ
                    let percentage = 0;

                    if (billed > 0) {
                      percentage = (paid / billed) * 100;
                    }

                    // ใช้ Math.round() ตามที่คุณต้องการ
                    return `${Math.round(percentage.toFixed(2))}%`;
                  })()}
                  )
                </div>
                <div className="text-sm text-gray-500">จำนวนเงิน {(zone.paidAmount || 0).toLocaleString()} บาท</div>
              </div>
              <div>
                <div style={{ color: zone.color }}>
                  {/* ใช้ IIFE (Immediately Invoked Function Expression) เพื่อจัดการ logic ภายใน JSX */}
                  {(() => {
                    const read = zone.readMeters || 0;
                    const paid = zone.paidMeters || 0;
                    const total = dashboardData.paymentStatus.paidMeters || 0;

                    // คำนวณผลต่าง (รายการที่ยังไม่ได้จ่าย/อ่านแล้วแต่ยังไม่ตัดจากยอดรวม)
                    const remainingItems = read - paid;

                    let percentage = 0;
                    if (total > 0) {
                      // คำนวณเปอร์เซ็นต์จาก remainingItems เทียบกับ totalMeters
                      percentage = (remainingItems / total) * 100;
                    }

                    return (
                      <>
                        {remainingItems} รายการ ({percentage.toFixed(2)}%)
                      </>
                    );
                  })()}
                </div>
                <div className="text-sm text-gray-500">จำนวนเงิน {(zone.unpaidAmount || 0).toLocaleString()} บาท</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">ไม่มีข้อมูล Zone</div>
          )}
        </div>

        {/* กราฟและสถิติ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* กราฟปริมาณการใช้น้ำ */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">สรุปข้อมูลทางสถิติต่าง</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">ปริมาณการใช้น้ำประปาราย เดือน</div>
                <div className="text-2xl font-bold text-blue-600">

                  {dashboardData.waterUsage.toLocaleString() || 0} ลูกบาศก์เมตร
                </div>
                <div className="text-sm text-gray-500">
                  จำนวนการแจ้งปัญหาการใช้งาน {dashboardData.alerts?.length || 0} ครั้ง
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">สรุปประเภทปัญหาการใช้งาน</div>
                <div className="text-sm text-gray-500 mt-2">
                  {dashboardData.alerts?.length > 0 ?
                    `พบปัญหา ${dashboardData.alerts.length} รายการ` :
                    'ไม่มีปัญหาในขณะนี้'
                  }
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.monthlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* กราฟโดนัทสถิติ */}
          <div className="bg-white rounded-lg p-6 shadow">


            <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.statisticsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {dashboardData.statisticsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-1/2 space-y-3">
                {dashboardData.statisticsData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* กิจกรรมล่าสุดและการแจ้งเตือน */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* กิจกรรมล่าสุด */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">กิจกรรมล่าสุด</h3>
            <div className="space-y-3">
              {dashboardData.activities?.length > 0 ? (
                dashboardData.activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.info}</div>
                      <div className="text-xs text-gray-500">{activity.date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">ไม่มีกิจกรรมล่าสุด</div>
              )}
            </div>
          </div>

          {/* แจ้งเตือนสำคัญ */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">แจ้งเตือนมิเตอร์เกินกำหนดชำระเงิน</h3>
            <div className="space-y-3">
              {dashboardData.alerts?.length > 0 ? (
                dashboardData.alerts.map((alert, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded ${alert.type === 'danger' ? 'bg-red-50 border-l-4 border-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                      'bg-blue-50 border-l-4 border-blue-500'
                    }`}>
                    <span className="text-2xl">{alert.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600">{alert.info}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;