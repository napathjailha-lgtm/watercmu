import React, { useState } from 'react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ฟังก์ชันสำหรับออกจากระบบ
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    };

    // จำลองการตรวจสอบเส้นทางปัจจุบัน (ในการใช้งานจริงจะใช้ react-router)
    const currentPath = window.location.pathname;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} duration-300 bg-blue-800 text-white h-screen fixed`}>
                {/* Logo และชื่อระบบ */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-blue-700">
                    {sidebarOpen ? (
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span className="text-xl font-bold">ระบบน้ำประปา</span>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-white p-1.5 rounded-lg"
                    >
                        {sidebarOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* เมนู */}
                <nav className="mt-6">
                    <div className="px-4 space-y-3">
                        {/* เมนูแดชบอร์ด */}
                        <a 
                            href="/dashboard"
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${currentPath === '/dashboard' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {sidebarOpen && <span className="ml-3">แดชบอร์ด</span>}
                        </a>

                        {/* เมนูจัดการผู้ใช้น้ำ */}
                        <a 
                            href="/users"
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${currentPath === '/users' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {sidebarOpen && <span className="ml-3">จัดการผู้พักอาศัย</span>}
                        </a>

                        {/* เมนูบันทึกค่าน้ำและออกบิล */}
                        <a 
                            href="/billing"
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${currentPath === '/billing' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {sidebarOpen && <span className="ml-3">บันทึกค่าน้ำและออกบิล</span>}
                        </a>

                        {/* เมนูรายงานและสถิติ */}
                        <a 
                            href="/reports"
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${currentPath === '/reports' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {sidebarOpen && <span className="ml-3">รายงานและสถิติ</span>}
                        </a>
                    </div>
                </nav>

                {/* ปุ่มออกจากระบบ */}
                <div className="absolute bottom-0 w-full border-t border-blue-700 p-4">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-700 transition-colors ${sidebarOpen ? '' : 'justify-center'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && <span className="ml-3">ออกจากระบบ</span>}
                    </button>
                </div>
            </div>

            {/* เนื้อหาหลัก */}
            <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} duration-300 flex-1 h-screen overflow-y-auto`}>
                {/* ส่วนหัว */}
                <header className="bg-white shadow-sm">
                    <div className="flex justify-between items-center px-6 py-4">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {currentPath === '/' && 'แดชบอร์ด'}
                            {currentPath === '/users' && 'จัดการผู้พักอาศัย'}
                            {currentPath === '/billing' && 'บันทึกค่าน้ำและออกบิล'}
                            {currentPath === '/reports' && 'รายงานและสถิติ'}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600">
                                {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <div className="relative">
                                <button className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* เนื้อหา */}
                <main className="px-6 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;