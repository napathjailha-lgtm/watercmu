// src/components/PaymentManagement.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function PaymentManagement({ user, currentVillage }) {
  const [paymentPeriod, setPaymentPeriod] = useState({
    month: 5, // พฤษภาคม
    year: 2025
  });
  
  const [payments, setPayments] = useState([
    {
      id: 1,
      billId: 1,
      meterNumber: 'MT-1042',
      resident: 'นายสมชาย ใจดี',
      address: 'บ้านเลขที่ 42/7',
      amount: 470,
      paymentDate: '5 พ.ค. 2025',
      paymentMethod: 'cash',
      receiptNumber: 'REC-25050001',
      collectedBy: 'นางสาวนภา สมใจ'
    },
    {
      id: 2,
      billId: 4,
      meterNumber: 'MT-1045',
      resident: 'นางวิมล สุขใจ',
      address: 'บ้านเลขที่ 44/2',
      amount: 350,
      paymentDate: '6 พ.ค. 2025',
      paymentMethod: 'transfer',
      receiptNumber: 'REC-25050002',
      collectedBy: 'ระบบออนไลน์'
    }
  ]);
  
  const [showReceivePaymentModal, setShowReceivePaymentModal] = useState(false);
  const [unpaidBills, setUnpaidBills] = useState([
    {
      id: 2,
      meterNumber: 'MT-1043',
      resident: 'นางสาวนภา รักดี',
      address: 'บ้านเลขที่ 42/8',
      month: 'พฤษภาคม 2025',
      amount: 530,
      dueDate: '10 พ.ค. 2025'
    },
    {
      id: 3,
      meterNumber: 'MT-1044',
      resident: 'นายวิชัย มั่นคง',
      address: 'บ้านเลขที่ 43/1',
      month: 'พฤษภาคม 2025',
      amount: 120,
      dueDate: '10 พ.ค. 2025'
    }
  ]);
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({
    amount: 0,
    method: 'cash',
    transferRef: '',
    note: ''
  });
  
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const handleMonthChange = (e) => {
    setPaymentPeriod(prev => ({
      ...prev,
      month: parseInt(e.target.value)
    }));
  };
  
  const handleYearChange = (e) => {
    setPaymentPeriod(prev => ({
      ...prev,
      year: parseInt(e.target.value)
    }));
  };
  
  const handleOpenPaymentModal = () => {
    setShowReceivePaymentModal(true);
  };
  
  const handleSelectBill = (bill) => {
    setSelectedBill(bill);
    setPaymentInfo({
      amount: bill.amount,
      method: 'cash',
      transferRef: '',
      note: ''
    });
  };
  
  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReceivePayment = (e) => {
    e.preventDefault();
    
    if (!selectedBill) return;
    
    // Generate receipt number
    const receiptNumber = `REC-${paymentPeriod.year.toString().slice(-2)}${paymentPeriod.month.toString().padStart(2, '0')}${(payments.length + 1).toString().padStart(4, '0')}`;
    
    // Create new payment record
    const newPayment = {
      id: payments.length + 1,
      billId: selectedBill.id,
      meterNumber: selectedBill.meterNumber,
      resident: selectedBill.resident,
      address: selectedBill.address,
      amount: parseFloat(paymentInfo.amount),
      paymentDate: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      paymentMethod: paymentInfo.method,
      receiptNumber: receiptNumber,
      collectedBy: user.name
    };
    
    // Add new payment to the list
    setPayments(prev => [...prev, newPayment]);
    
    // Remove paid bill from unpaid bills list
    setUnpaidBills(prev => prev.filter(bill => bill.id !== selectedBill.id));
    
    // Reset form and close modal
    setSelectedBill(null);
    setPaymentInfo({
      amount: 0,
      method: 'cash',
      transferRef: '',
      note: ''
    });
    setShowReceivePaymentModal(false);
    
    // Show success message
    alert(`บันทึกการชำระเงินเรียบร้อยแล้ว\nเลขที่ใบเสร็จ: ${receiptNumber}`);
  };
  
  const getTotalCollection = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };
  
  const getCashCollection = () => {
    return payments
      .filter(payment => payment.paymentMethod === 'cash')
      .reduce((total, payment) => total + payment.amount, 0);
  };
  
  const getTransferCollection = () => {
    return payments
      .filter(payment => payment.paymentMethod === 'transfer')
      .reduce((total, payment) => total + payment.amount, 0);
  };
  
  return (
    <div className="payment-container">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">← กลับไปหน้าหลัก</Link>
          <h1>จัดการการชำระเงิน</h1>
        </div>
        <button 
          className="receive-payment-btn"
          onClick={handleOpenPaymentModal}
        >
          + รับชำระเงิน
        </button>
      </header>
      
      <div className="payment-period-selector">
        <div className="period-label">รายการชำระเงินประจำเดือน:</div>
        <div className="period-controls">
          <select value={paymentPeriod.month} onChange={handleMonthChange}>
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select value={paymentPeriod.year} onChange={handleYearChange}>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
        
        <div className="payment-stats">
          <div className="stat-box">
            <div className="stat-label">จำนวนรายการ</div>
            <div className="stat-value">{payments.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">ยอดรวม</div>
            <div className="stat-value">฿{getTotalCollection()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">เงินสด</div>
            <div className="stat-value">฿{getCashCollection()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">โอนเงิน</div>
            <div className="stat-value">฿{getTransferCollection()}</div>
          </div>
        </div>
      </div>
      
      <div className="payment-filters">
        <div className="search-bar">
          <input type="text" placeholder="ค้นหาตามเลขมิเตอร์ ชื่อผู้ใช้น้ำ หรือเลขที่ใบเสร็จ" />
          <button className="search-btn">ค้นหา</button>
        </div>
        
        <div className="filter-group">
          <label>วิธีชำระเงิน:</label>
          <select>
            <option value="all">ทั้งหมด</option>
            <option value="cash">เงินสด</option>
            <option value="transfer">โอนเงิน</option>
          </select>
        </div>
        
        <button className="print-btn">พิมพ์รายงาน</button>
      </div>
      
      <div className="payments-list">
        <table className="payments-table">
          <thead>
            <tr>
              <th>เลขที่ใบเสร็จ</th>
              <th>วันที่ชำระ</th>
              <th>เลขมิเตอร์</th>
              <th>ชื่อผู้ใช้น้ำ</th>
              <th>ที่อยู่</th>
              <th>จำนวนเงิน</th>
              <th>วิธีชำระเงิน</th>
              <th>ผู้รับชำระ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.receiptNumber}</td>
                <td>{payment.paymentDate}</td>
                <td>{payment.meterNumber}</td>
                <td>{payment.resident}</td>
                <td>{payment.address}</td>
                <td>฿{payment.amount}</td>
                <td>
                  <span className={`payment-method ${payment.paymentMethod}`}>
                    {payment.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}
                  </span>
                </td>
                <td>{payment.collectedBy}</td>
                <td className="actions-cell">
                  <button className="action-btn view-btn">ดูใบเสร็จ</button>
                  <button className="action-btn print-btn">พิมพ์</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showReceivePaymentModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>รับชำระค่าน้ำ</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowReceivePaymentModal(false);
                  setSelectedBill(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="unpaid-bills-section">
                <h3>รายการที่ยังไม่ชำระ</h3>
                {unpaidBills.length > 0 ? (
                  <div className="unpaid-bills-list">
                    {unpaidBills.map(bill => (
                      <div 
                        key={bill.id} 
                        className={`unpaid-bill-item ${selectedBill?.id === bill.id ? 'selected' : ''}`}
                        onClick={() => handleSelectBill(bill)}
                      >
                        <div className="bill-info">
                          <div className="bill-header">
                            <span className="meter-number">{bill.meterNumber}</span>
                            <span className="bill-amount">฿{bill.amount}</span>
                          </div>
                          <div className="resident-name">{bill.resident}</div>
                          <div className="bill-address">{bill.address}</div>
                          <div className="bill-period">งวด: {bill.month}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-unpaid-bills">
                    ไม่มีรายการค้างชำระ
                  </div>
                )}
              </div>
              
              {selectedBill && (
                <div className="payment-form-section">
                  <h3>ข้อมูลการชำระเงิน</h3>
                  <form onSubmit={handleReceivePayment}>
                    <div className="form-group">
                      <label>จำนวนเงิน:</label>
                      <input 
                        type="number" 
                        name="amount" 
                        value={paymentInfo.amount} 
                        onChange={handlePaymentInfoChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>วิธีชำระเงิน:</label>
                      <select 
                        name="method" 
                        value={paymentInfo.method} 
                        onChange={handlePaymentInfoChange}
                      >
                        <option value="cash">เงินสด</option>
                        <option value="transfer">โอนเงิน</option>
                      </select>
                    </div>
                    
                    {paymentInfo.method === 'transfer' && (
                      <div className="form-group">
                        <label>อ้างอิงการโอนเงิน:</label>
                        <input 
                          type="text" 
                          name="transferRef" 
                          value={paymentInfo.transferRef} 
                          onChange={handlePaymentInfoChange}
                          required
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>หมายเหตุ:</label>
                      <textarea 
                        name="note" 
                        value={paymentInfo.note} 
                        onChange={handlePaymentInfoChange}
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => {
                          setShowReceivePaymentModal(false);
                          setSelectedBill(null);
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button type="submit" className="submit-btn">บันทึกการชำระเงิน</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;