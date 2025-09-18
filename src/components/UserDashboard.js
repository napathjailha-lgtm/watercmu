// src/components/UserDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService'; // Import the new service

function UserDashboard({ user, onLogout, currentVillage }) {
  // Initialize states as empty or default values
  const [userBills, setUserBills] = useState([]);
  const [userMeter, setUserMeter] = useState(null); // Will be an object or null
  const [waterUsage, setWaterUsage] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const [error, setError] = useState(null);
  console.log('UserDashboard component initialized with user:', user.villages[0].village_id, 'and currentVillage:', currentVillage);
  // Use useCallback to memoize the data loading function
  const loadUserData = useCallback(async (userId) => {
    if (!userId) {
      console.log('Missing user ID or village ID, skipping data load.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const allUserData = await dashboardService.getAllUserDashboardData(user.villages[0].village_id,userId);
      console.log('User Dashboard data loaded:', allUserData);

      // Update states with fetched data, providing fallbacks for partial failures
      setUserBills(allUserData.userBills || []);
      setUserMeter(allUserData.userMeter || {
        id: userId,
        number: 'N/A',
        location: 'ไม่ระบุ',
        installDate: 'N/A',
        lastReading: { value: 0, date: 'N/A', reader: 'N/A' }
      });
      setWaterUsage(allUserData.waterUsage || []);
      setAnnouncements(allUserData.announcements || []);

      // Check for partial errors
      if (allUserData.errors && allUserData.errors.length > 0) {
        const errorMessages = allUserData.errors.map(err => err.api).join(', ');
        setError(`ไม่สามารถโหลดข้อมูลบางส่วนได้: ${errorMessages}`);
      }

    } catch (err) {
      // This catch would be for unexpected errors in getAllUserDashboardData itself,
      // not individual API call failures which are caught by Promise.allSettled
      console.error('Failed to load user dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดผู้ใช้งานได้ทั้งหมด');
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies for loadUserData itself, as it takes params

  // useEffect to trigger data loading when user or currentVillage changes
  useEffect(() => {
    console.log('useEffect triggered with user:', user);
    if (user?.user_id && user.villages[0].village_id) {
      loadUserData(user.user_id);
    } else {
      // Clear data if no user or village is selected
      setUserBills([]);
      setUserMeter(null);
      setWaterUsage([]);
      setAnnouncements([]);
      setIsLoading(false);
      setError('กรุณาเข้าสู่ระบบหรือเลือกหมู่บ้านเพื่อดูข้อมูล');
    }
  }, [user, currentVillage, loadUserData]); // Depend on user, currentVillage, and loadUserData

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
          {currentVillage && (
            <div className="text-sm text-gray-500 mt-2">หมู่บ้าน: {currentVillage.name || 'ไม่ระบุ'}</div>
          )}
        </div>
      </div>
    );
  }

  if (error && !error.includes('บางส่วน')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => user?.id && currentVillage?.village_id && loadUserData(user.id, currentVillage.village_id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Handle case where user or currentVillage is null/undefined after loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-lg">กรุณาเข้าสู่ระบบหรือเลือกหมู่บ้านเพื่อดูข้อมูล</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            ภาพรวมผู้ใช้งาน
          </h1>
          {error && error.includes('บางส่วน') && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {error} - อาจแสดงข้อมูลไม่ครบถ้วน
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        <main>
          <div className="bg-white rounded-lg p-6 mb-6 shadow">
            <h2 className="text-xl font-semibold mb-2">สวัสดี คุณ{user.full_name}</h2>
            <p className="text-gray-700">
              หมู่บ้าน: {user.villages[0].village_name}
            </p>
          </div>

          {/* Latest Bills Section */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow">
            <h3 className="text-lg font-semibold mb-4">บิลค่าน้ำล่าสุด</h3>
            {userBills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">เดือน</th>
                      <th className="py-3 px-6 text-center">จำนวนหน่วย</th>
                      <th className="py-3 px-6 text-center">จำนวนเงิน (บาท)</th>
                      <th className="py-3 px-6 text-center">วันครบกำหนดชำระ</th>
                      <th className="py-3 px-6 text-center">สถานะ</th>
                      <th className="py-3 px-6 text-center">วันที่ชำระ</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm font-light">
                    {userBills.map(bill => (
                      <tr key={bill.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left whitespace-nowrap">{bill.month}</td>
                        <td className="py-3 px-6 text-center">{bill.reading} หน่วย</td>
                        <td className="py-3 px-6 text-center">฿{bill.amount.toLocaleString()}</td>
                        <td className="py-3 px-6 text-center">{bill.dueDate}</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                            bill.status === 'ชำระแล้ว' ? 'bg-green-200 text-green-800' :
                            bill.status === 'ยังไม่ชำระ' ? 'bg-red-200 text-red-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">{bill.paidDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">ไม่พบบิลค่าน้ำล่าสุด</div>
            )}
            <div className="text-right mt-4">
              <Link to="/bills" className="text-blue-600 hover:underline">ดูบิลทั้งหมด &rarr;</Link>
            </div>
          </div>

          {/* Water Usage Chart Section (Simplified for this example, Recharts recommended for real charts) */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow">
            <h3 className="text-lg font-semibold mb-4">การใช้น้ำของคุณ (หน่วย/เดือน)</h3>
            {waterUsage.length > 0 ? (
              <div className="h-64 relative">
                {/* Simple bar chart visualization */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end h-full p-4">
                  {waterUsage.map((monthData, index) => (
                    <div key={index} className="flex flex-col items-center mx-2">
                      <div
                        className="w-8 bg-blue-500 rounded-t-lg transition-all duration-300 ease-in-out"
                        style={{ height: `${(monthData.usage / Math.max(...waterUsage.map(u => u.usage))) * 100 * 0.8}px`, minHeight: '10px' }} // Scale to max usage for better visualization
                      ></div>
                      <span className="text-xs text-gray-700 mt-1">{monthData.usage}</span>
                      <span className="text-xs text-gray-500 mt-1">{monthData.month}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"></div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">ไม่พบข้อมูลการใช้น้ำ</div>
            )}
            <p className="text-sm text-gray-600 mt-4">
              *แสดงปริมาณการใช้น้ำ (ลูกบาศก์เมตร) ในแต่ละเดือน
            </p>
          </div>

          {/* Announcements Section */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">ประกาศล่าสุด</h3>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map(announcement => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-semibold text-gray-800">{announcement.title}</h4>
                      <div className="text-sm text-gray-500">{announcement.date}</div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">ไม่มีประกาศในขณะนี้</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;