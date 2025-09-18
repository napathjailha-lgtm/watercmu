// src/components/ReportsAnalytics.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ReportsAnalytics({ user, currentVillage }) {
  const [activeReport, setActiveReport] = useState('waterUsage');
  const [periodType, setPeriodType] = useState('monthly');
  const [dataPeriod, setDataPeriod] = useState({
    month: 5, // พฤษภาคม
    year: 2025,
    quarter: 2, // ไตรมาสที่ 2
    startDate: '2025-04-01',
    endDate: '2025-05-06'
  });
  
  const [waterUsageData] = useState([
    { month: 'ม.ค.', usage: 2850, income: 85500 },
    { month: 'ก.พ.', usage: 2720, income: 81600 },
    { month: 'มี.ค.', usage: 2950, income: 88500 },
    { month: 'เม.ย.', usage: 3100, income: 93000 },
    { month: 'พ.ค.', usage: 0, income: 0 } // ยังไม่มีข้อมูล
  ]);
  
  const [userUsageData] = useState([
    { id: 1, meterNumber: 'MT-1042', resident: 'นายสมชาย ใจดี', usage: 15, amount: 450 },
    { id: 2, meterNumber: 'MT-1043', resident: 'นางสาวนภา รักดี', usage: 17, amount: 510 },
    { id: 3, meterNumber: 'MT-1044', resident: 'นายวิชัย มั่นคง', usage: 0, amount: 100 },
    { id: 4, meterNumber: 'MT-1045', resident: 'นางวิมล สุขใจ', usage: 12, amount: 360 },
    { id: 5, meterNumber: 'MT-1046', resident: 'นายพิชัย นำชัย', usage: 18, amount: 540 }
  ]);
  
  const [billingData] = useState([
    { month: 'ม.ค.', billed: 85500, collected: 82000, pending: 3500 },
    { month: 'ก.พ.', billed: 81600, collected: 80100, pending: 1500 },
    { month: 'มี.ค.', billed: 88500, collected: 85200, pending: 3300 },
    { month: 'เม.ย.', billed: 93000, collected: 89000, pending: 4000 },
    { month: 'พ.ค.', billed: 0, collected: 0, pending: 0 } // ยังไม่มีข้อมูล
  ]);
  
  const [maintenanceData] = useState([
    { month: 'ม.ค.', pumps: 1500, chlorinator: 800, pipes: 0, other: 0, total: 2300 },
    { month: 'ก.พ.', pumps: 0, chlorinator: 500, pipes: 1200, other: 0, total: 1700 },
    { month: 'มี.ค.', pumps: 0, chlorinator: 500, pipes: 0, other: 600, total: 1100 },
    { month: 'เม.ย.', pumps: 1500, chlorinator: 500, pipes: 2500, other: 0, total: 4500 },
    { month: 'พ.ค.', pumps: 0, chlorinator: 800, pipes: 0, other: 0, total: 800 }
  ]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // จำลองการโหลดข้อมูล
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeReport, periodType, dataPeriod]);
  
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const quarters = [
    'ไตรมาสที่ 1 (ม.ค. - มี.ค.)',
    'ไตรมาสที่ 2 (เม.ย. - มิ.ย.)',
    'ไตรมาสที่ 3 (ก.ค. - ก.ย.)',
    'ไตรมาสที่ 4 (ต.ค. - ธ.ค.)'
  ];
  
  const handleMonthChange = (e) => {
    setIsLoading(true);
    setDataPeriod(prev => ({
      ...prev,
      month: parseInt(e.target.value)
    }));
  };
  
  const handleYearChange = (e) => {
    setIsLoading(true);
    setDataPeriod(prev => ({
      ...prev,
      year: parseInt(e.target.value)
    }));
  };
  
  const handleQuarterChange = (e) => {
    setIsLoading(true);
    setDataPeriod(prev => ({
      ...prev,
      quarter: parseInt(e.target.value)
    }));
  };
  
  const handleStartDateChange = (e) => {
    setIsLoading(true);
    setDataPeriod(prev => ({
      ...prev,
      startDate: e.target.value
    }));
  };
  
  const handleEndDateChange = (e) => {
    setIsLoading(true);
    setDataPeriod(prev => ({
      ...prev,
      endDate: e.target.value
    }));
  };
  
  const handlePeriodTypeChange = (type) => {
    setIsLoading(true);
    setPeriodType(type);
  };
  
  const handleReportChange = (reportType) => {
    setIsLoading(true);
    setActiveReport(reportType);
  };
  
  const getTotalWaterUsage = () => {
    return waterUsageData.reduce((total, month) => total + month.usage, 0);
  };
  
  const getTotalIncome = () => {
    return waterUsageData.reduce((total, month) => total + month.income, 0);
  };
  
  const getAverageWaterUsage = () => {
    const months = waterUsageData.filter(month => month.usage > 0).length;
    if (months === 0) return 0;
    return getTotalWaterUsage() / months;
  };
  
  const getTotalCollected = () => {
    return billingData.reduce((total, month) => total + month.collected, 0);
  };
  
  const getTotalPending = () => {
    return billingData.reduce((total, month) => total + month.pending, 0);
  };
  
  const getCollectionRate = () => {
    const totalBilled = billingData.reduce((total, month) => total + month.billed, 0);
    if (totalBilled === 0) return 0;
    return (getTotalCollected() / totalBilled) * 100;
  };
  
  const getTotalMaintenanceCost = () => {
    return maintenanceData.reduce((total, month) => total + month.total, 0);
  };
  
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  const renderWaterUsageReport = () => {
    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-icon">💧</div>
            <div className="summary-info">
              <div className="summary-title">ปริมาณน้ำที่ใช้ทั้งหมด</div>
              <div className="summary-value">{formatNumber(getTotalWaterUsage())} ลบ.ม.</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <div className="summary-title">ค่าเฉลี่ยต่อเดือน</div>
              <div className="summary-value">{getAverageWaterUsage().toFixed(2)} ลบ.ม.</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <div className="summary-title">รายได้ทั้งหมด</div>
              <div className="summary-value">฿{formatNumber(getTotalIncome())}</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>ปริมาณการใช้น้ำรายเดือน</h3>
          <div className="bar-chart">
            {waterUsageData.map((month, index) => (
              <div key={index} className="chart-column">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar usage-bar" 
                    style={{ height: `${(month.usage / 3200) * 200}px` }}
                  >
                    <span className="bar-value">{formatNumber(month.usage)}</span>
                  </div>
                </div>
                <div className="chart-label">{month.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color usage-color"></div>
              <div className="legend-label">ปริมาณการใช้น้ำ (ลบ.ม.)</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>รายได้จากค่าน้ำรายเดือน</h3>
          <div className="bar-chart">
            {waterUsageData.map((month, index) => (
              <div key={index} className="chart-column">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar income-bar" 
                    style={{ height: `${(month.income / 95000) * 200}px` }}
                  >
                    <span className="bar-value">฿{formatNumber(month.income)}</span>
                  </div>
                </div>
                <div className="chart-label">{month.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color income-color"></div>
              <div className="legend-label">รายได้ (บาท)</div>
            </div>
          </div>
        </div>
        
        <div className="data-table-container">
          <div className="table-header">
            <h3>ข้อมูลการใช้น้ำรายเดือน</h3>
            <div className="table-actions">
              <button className="btn-export">
                <span className="icon">📥</span> ดาวน์โหลด
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>ปริมาณการใช้น้ำ (ลบ.ม.)</th>
                  <th>รายได้ (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {waterUsageData.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>{formatNumber(month.usage)}</td>
                    <td>฿{formatNumber(month.income)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>รวม</th>
                  <th>{formatNumber(getTotalWaterUsage())} ลบ.ม.</th>
                  <th>฿{formatNumber(getTotalIncome())}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderUserUsageReport = () => {
    const totalUsage = userUsageData.reduce((total, user) => total + user.usage, 0);
    const totalAmount = userUsageData.reduce((total, user) => total + user.amount, 0);
    
    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-info">
              <div className="summary-title">จำนวนผู้ใช้น้ำทั้งหมด</div>
              <div className="summary-value">{userUsageData.length} ราย</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💧</div>
            <div className="summary-info">
              <div className="summary-title">ปริมาณน้ำที่ใช้ทั้งหมด</div>
              <div className="summary-value">{formatNumber(totalUsage)} ลบ.ม.</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <div className="summary-title">รายได้ทั้งหมด</div>
              <div className="summary-value">฿{formatNumber(totalAmount)}</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>การใช้น้ำรายบุคคล</h3>
          <div className="bar-chart user-chart">
            {userUsageData.map((user, index) => (
              <div key={index} className="chart-column">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar usage-bar" 
                    style={{ height: `${(user.usage / 20) * 200}px` }}
                  >
                    <span className="bar-value">{user.usage}</span>
                  </div>
                </div>
                <div className="chart-label" title={user.resident}>
                  {user.resident.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="data-table-container">
          <div className="table-header">
            <h3>ข้อมูลการใช้น้ำรายบุคคล</h3>
            <div className="table-actions">
              <input 
                type="text" 
                placeholder="ค้นหาตามชื่อ..." 
                className="search-input"
              />
              <button className="btn-export">
                <span className="icon">📥</span> ดาวน์โหลด
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เลขมิเตอร์</th>
                  <th>ชื่อผู้ใช้น้ำ</th>
                  <th>ปริมาณการใช้น้ำ (ลบ.ม.)</th>
                  <th>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {userUsageData.map(user => (
                  <tr key={user.id}>
                    <td>{user.meterNumber}</td>
                    <td>{user.resident}</td>
                    <td>{user.usage}</td>
                    <td>฿{formatNumber(user.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="2">รวม</th>
                  <th>{formatNumber(totalUsage)} ลบ.ม.</th>
                  <th>฿{formatNumber(totalAmount)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderBillingReport = () => {
    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-icon">📋</div>
            <div className="summary-info">
              <div className="summary-title">ยอดเรียกเก็บทั้งหมด</div>
              <div className="summary-value">฿{formatNumber(billingData.reduce((total, month) => total + month.billed, 0))}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-info">
              <div className="summary-title">ยอดชำระแล้ว</div>
              <div className="summary-value">฿{formatNumber(getTotalCollected())}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚠️</div>
            <div className="summary-info">
              <div className="summary-title">ยอดค้างชำระ</div>
              <div className="summary-value">฿{formatNumber(getTotalPending())}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <div className="summary-title">อัตราการเก็บเงิน</div>
              <div className="summary-value">{getCollectionRate().toFixed(2)}%</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>สถานะการชำระเงินรายเดือน</h3>
          <div className="stacked-bar-chart">
            {billingData.map((month, index) => (
              <div key={index} className="chart-column">
                <div className="chart-bar-container">
                  <div className="stacked-bar">
                    <div 
                      className="chart-bar collected-bar" 
                      style={{ height: `${(month.collected / 100000) * 200}px` }}
                      title={`ชำระแล้ว: ฿${formatNumber(month.collected)}`}
                    >
                    </div>
                    <div 
                      className="chart-bar pending-bar" 
                      style={{ height: `${(month.pending / 100000) * 200}px` }}
                      title={`ค้างชำระ: ฿${formatNumber(month.pending)}`}
                    >
                    </div>
                  </div>
                  <div className="stacked-bar-labels">
                    <div className="collected-label">฿{formatNumber(month.collected)}</div>
                    <div className="pending-label">฿{formatNumber(month.pending)}</div>
                  </div>
                </div>
                <div className="chart-label">{month.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color collected-color"></div>
              <div className="legend-label">ชำระแล้ว</div>
            </div>
            <div className="legend-item">
              <div className="legend-color pending-color"></div>
              <div className="legend-label">ค้างชำระ</div>
            </div>
          </div>
        </div>
        
        <div className="data-table-container">
          <div className="table-header">
            <h3>ข้อมูลการชำระเงินรายเดือน</h3>
            <div className="table-actions">
              <button className="btn-export">
                <span className="icon">📥</span> ดาวน์โหลด
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>ยอดเรียกเก็บ (บาท)</th>
                  <th>ยอดชำระแล้ว (บาท)</th>
                  <th>ยอดค้างชำระ (บาท)</th>
                  <th>เปอร์เซ็นต์การเก็บเงิน</th>
                </tr>
              </thead>
              <tbody>
                {billingData.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>฿{formatNumber(month.billed)}</td>
                    <td>฿{formatNumber(month.collected)}</td>
                    <td>฿{formatNumber(month.pending)}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress-value" 
                          style={{ width: `${month.billed > 0 ? (month.collected / month.billed) * 100 : 0}%` }}
                        ></div>
                        <span>
                          {month.billed > 0 ? ((month.collected / month.billed) * 100).toFixed(2) : '0'}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>รวม</th>
                  <th>฿{formatNumber(billingData.reduce((total, month) => total + month.billed, 0))}</th>
                  <th>฿{formatNumber(getTotalCollected())}</th>
                  <th>฿{formatNumber(getTotalPending())}</th>
                  <th>{getCollectionRate().toFixed(2)}%</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderMaintenanceReport = () => {
    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <div className="summary-icon">🔧</div>
            <div className="summary-info">
              <div className="summary-title">ค่าใช้จ่ายบำรุงรักษาทั้งหมด</div>
              <div className="summary-value">฿{formatNumber(getTotalMaintenanceCost())}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚙️</div>
            <div className="summary-info">
              <div className="summary-title">เครื่องสูบน้ำ</div>
              <div className="summary-value">฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pumps, 0))}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🧪</div>
            <div className="summary-info">
              <div className="summary-title">เครื่องจ่ายคลอรีน</div>
              <div className="summary-value">฿{formatNumber(maintenanceData.reduce((total, month) => total + month.chlorinator, 0))}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🚰</div>
            <div className="summary-info">
              <div className="summary-title">ท่อและวาล์ว</div>
              <div className="summary-value">฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pipes, 0))}</div>
            </div>
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container half-width">
            <h3>ค่าใช้จ่ายในการบำรุงรักษารายเดือน</h3>
            <div className="bar-chart">
              {maintenanceData.map((month, index) => (
                <div key={index} className="chart-column">
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar maintenance-bar" 
                      style={{ height: `${(month.total / 5000) * 200}px` }}
                    >
                      <span className="bar-value">฿{formatNumber(month.total)}</span>
                    </div>
                  </div>
                  <div className="chart-label">{month.month}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>ค่าใช้จ่ายตามประเภทอุปกรณ์</h3>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <div className="pie-segment pumps" style={{ transform: 'rotate(0deg)', clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                <div className="pie-segment chlorinator" style={{ transform: 'rotate(120deg)', clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }}></div>
                <div className="pie-segment pipes" style={{ transform: 'rotate(180deg)', clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }}></div>
                <div className="pie-segment other" style={{ transform: 'rotate(270deg)', clipPath: 'polygon(50% 50%, 50% 0%, 75% 0%)' }}></div>
              </div>
              <div className="chart-legend pie-legend">
                <div className="legend-item">
                  <div className="legend-color pumps-color"></div>
                  <div className="legend-label">เครื่องสูบน้ำ: ฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pumps, 0))}</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color chlorinator-color"></div>
                  <div className="legend-label">เครื่องจ่ายคลอรีน: ฿{formatNumber(maintenanceData.reduce((total, month) => total + month.chlorinator, 0))}</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color pipes-color"></div>
                  <div className="legend-label">ท่อและวาล์ว: ฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pipes, 0))}</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color other-color"></div>
                  <div className="legend-label">อื่นๆ: ฿{formatNumber(maintenanceData.reduce((total, month) => total + month.other, 0))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="data-table-container">
          <div className="table-header">
            <h3>ข้อมูลค่าใช้จ่ายในการบำรุงรักษารายเดือน</h3>
            <div className="table-actions">
              <button className="btn-export">
                <span className="icon">📥</span> ดาวน์โหลด
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>เครื่องสูบน้ำ (บาท)</th>
                  <th>เครื่องจ่ายคลอรีน (บาท)</th>
                  <th>ท่อและวาล์ว (บาท)</th>
                  <th>อื่นๆ (บาท)</th>
                  <th>รวม (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceData.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>฿{formatNumber(month.pumps)}</td>
                    <td>฿{formatNumber(month.chlorinator)}</td>
                    <td>฿{formatNumber(month.pipes)}</td>
                    <td>฿{formatNumber(month.other)}</td>
                    <td>฿{formatNumber(month.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>รวม</th>
                  <th>฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pumps, 0))}</th>
                  <th>฿{formatNumber(maintenanceData.reduce((total, month) => total + month.chlorinator, 0))}</th>
                  <th>฿{formatNumber(maintenanceData.reduce((total, month) => total + month.pipes, 0))}</th>
                  <th>฿{formatNumber(maintenanceData.reduce((total, month) => total + month.other, 0))}</th>
                  <th>฿{formatNumber(getTotalMaintenanceCost())}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลดข้อมูล...</div>
        </div>
      );
    }
    
    switch(activeReport) {
      case 'waterUsage':
        return renderWaterUsageReport();
      case 'userUsage':
        return renderUserUsageReport();
      case 'billing':
        return renderBillingReport();
      case 'maintenance':
        return renderMaintenanceReport();
      default:
        return renderWaterUsageReport();
    }
  };
  
  return (
    <div className="reports-container">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">← กลับไปหน้าหลัก</Link>
          <h1>รายงานและการวิเคราะห์</h1>
        </div>
        <div className="header-actions">
          {currentVillage && (
            <div className="current-village">
              <span>หมู่บ้าน:</span> 
              <span className="village-name">{currentVillage.name}</span>
            </div>
          )}
          <button className="print-btn">
            <span className="icon">🖨️</span> พิมพ์รายงาน
          </button>
        </div>
      </header>
      
      <div className="reports-content">
        <aside className="reports-sidebar">
          <div className="reports-nav">
            <h3>ประเภทรายงาน</h3>
            <ul>
              <li>
                <button 
                  className={`report-nav-btn ${activeReport === 'waterUsage' ? 'active' : ''}`}
                  onClick={() => handleReportChange('waterUsage')}
                >
                  <span className="nav-icon">💧</span> การใช้น้ำรวม
                </button>
              </li>
              <li>
                <button 
                  className={`report-nav-btn ${activeReport === 'userUsage' ? 'active' : ''}`}
                  onClick={() => handleReportChange('userUsage')}
                >
                  <span className="nav-icon">👥</span> การใช้น้ำรายบุคคล
                </button>
              </li>
              <li>
                <button 
                  className={`report-nav-btn ${activeReport === 'billing' ? 'active' : ''}`}
                  onClick={() => handleReportChange('billing')}
                >
                  <span className="nav-icon">💰</span> รายงานการเงิน
                </button>
              </li>
              <li>
                <button 
                  className={`report-nav-btn ${activeReport === 'maintenance' ? 'active' : ''}`}
                  onClick={() => handleReportChange('maintenance')}
                >
                  <span className="nav-icon">🔧</span> ค่าใช้จ่ายบำรุงรักษา
                </button>
              </li>
            </ul>
            
            <h3>ช่วงเวลา</h3>
            <div className="period-selector">
              <div className="period-type-tabs">
                <button 
                  className={`period-tab ${periodType === 'monthly' ? 'active' : ''}`}
                  onClick={() => handlePeriodTypeChange('monthly')}
                >
                  รายเดือน
                </button>
                <button 
                  className={`period-tab ${periodType === 'quarterly' ? 'active' : ''}`}
                  onClick={() => handlePeriodTypeChange('quarterly')}
                >
                  รายไตรมาส
                </button>
                <button 
                  className={`period-tab ${periodType === 'custom' ? 'active' : ''}`}
                  onClick={() => handlePeriodTypeChange('custom')}
                >
                  กำหนดเอง
                </button>
              </div>
              
              {periodType === 'monthly' && (
                <div className="period-inputs">
                  <select value={dataPeriod.month} onChange={handleMonthChange} className="select-styled">
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select value={dataPeriod.year} onChange={handleYearChange} className="select-styled">
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              )}
              
              {periodType === 'quarterly' && (
                <div className="period-inputs">
                  <select value={dataPeriod.quarter} onChange={handleQuarterChange} className="select-styled">
                    {quarters.map((quarter, index) => (
                      <option key={index} value={index + 1}>{quarter}</option>
                    ))}
                  </select>
                  <select value={dataPeriod.year} onChange={handleYearChange} className="select-styled">
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              )}
              
              {periodType === 'custom' && (
                <div className="period-inputs custom-period">
                  <div className="date-input">
                    <label>เริ่มต้น:</label>
                    <input 
                      type="date" 
                      value={dataPeriod.startDate} 
                      onChange={handleStartDateChange}
                      className="date-picker"
                    />
                  </div>
                  <div className="date-input">
                    <label>สิ้นสุด:</label>
                    <input 
                      type="date" 
                      value={dataPeriod.endDate} 
                      onChange={handleEndDateChange}
                      className="date-picker"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="export-options">
              <h3>ส่งออกข้อมูล</h3>
              <button className="export-btn">
                <span className="icon">📊</span> ส่งออกเป็น Excel
              </button>
              <button className="export-btn">
                <span className="icon">📄</span> ส่งออกเป็น PDF
              </button>
            </div>
          </div>
        </aside>
        
        <main className="report-main">
          <div className="report-header">
            <h2>
              {activeReport === 'waterUsage' && 'รายงานการใช้น้ำรวม'}
              {activeReport === 'userUsage' && 'รายงานการใช้น้ำรายบุคคล'}
              {activeReport === 'billing' && 'รายงานการเงิน'}
              {activeReport === 'maintenance' && 'รายงานค่าใช้จ่ายบำรุงรักษา'}
            </h2>
            <div className="report-period">
              {periodType === 'monthly' && `ประจำเดือน ${months[dataPeriod.month - 1]} ${dataPeriod.year}`}
              {periodType === 'quarterly' && `${quarters[dataPeriod.quarter - 1]} ปี ${dataPeriod.year}`}
              {periodType === 'custom' && `ระหว่างวันที่ ${dataPeriod.startDate} ถึง ${dataPeriod.endDate}`}
            </div>
          </div>
          
          {renderReportContent()}
        </main>
      </div>
    </div>
  );
}

export default ReportsAnalytics;