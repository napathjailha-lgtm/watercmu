// src/components/WaterSourceSelection.js
import React, { useState } from 'react';

function WaterSourceSelection({ onConfigured, user, currentVillage }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [villageInfo, setVillageInfo] = useState({
    name: '',
    address: '',
    adminName: '',
    adminPhone: '',
    isNew: true
  });
  
  const [waterSystemInfo, setWaterSystemInfo] = useState({
    waterSource: 'groundwater',
    hasPurification: false,
    hasMeter: true,
    tankCapacity: '',
    pumpCapacity: '',
    pipeMaterial: 'pvc',
    distributionType: 'gravity',
    existingUsers: ''
  });
  
  const [billingInfo, setBillingInfo] = useState({
    ratePerUnit: 30,
    minimumCharge: 100,
    meterRentalFee: 20,
    maintenanceFee: 0,
    billDueDay: 10,
    billCycle: 'monthly',
    paymentMethods: ['cash', 'transfer']
  });
  
  const handleVillageInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVillageInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleWaterSystemInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWaterSystemInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleBillingInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'paymentMethods') {
      // Handle checkbox group for payment methods
      const updatedMethods = [...billingInfo.paymentMethods];
      if (checked) {
        updatedMethods.push(value);
      } else {
        const index = updatedMethods.indexOf(value);
        if (index > -1) {
          updatedMethods.splice(index, 1);
        }
      }
      
      setBillingInfo(prev => ({
        ...prev,
        paymentMethods: updatedMethods
      }));
    } else {
      setBillingInfo(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleFinish = () => {
    // Combine all data and pass it to parent component
    const configData = {
      village: villageInfo,
      waterSystem: waterSystemInfo,
      billing: billingInfo
    };
    
    console.log('Configuration complete:', configData);
    onConfigured();
  };
  
  const renderVillageInfoStep = () => {
    return (
      <div className="setup-step">
        <h2>ตั้งค่าข้อมูลหมู่บ้าน</h2>
        <p className="step-description">กรุณากรอกข้อมูลเกี่ยวกับหมู่บ้านของคุณ</p>
        
        <div className="form-group">
          <label>ชื่อหมู่บ้าน:</label>
          <input 
            type="text" 
            name="name" 
            value={villageInfo.name} 
            onChange={handleVillageInfoChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>ที่อยู่:</label>
          <textarea 
            name="address" 
            value={villageInfo.address} 
            onChange={handleVillageInfoChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>ชื่อผู้ดูแล:</label>
            <input 
              type="text" 
              name="adminName" 
              value={villageInfo.adminName} 
              onChange={handleVillageInfoChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>เบอร์โทรผู้ดูแล:</label>
            <input 
              type="tel" 
              name="adminPhone" 
              value={villageInfo.adminPhone} 
              onChange={handleVillageInfoChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              name="isNew" 
              checked={villageInfo.isNew} 
              onChange={handleVillageInfoChange}
            />
            เป็นระบบน้ำประปาหมู่บ้านใหม่ (ยังไม่เคยมีระบบมาก่อน)
          </label>
        </div>
        
        <div className="step-actions">
          <button 
            type="button" 
            className="next-btn"
            onClick={handleNextStep}
          >
            ถัดไป
          </button>
        </div>
      </div>
    );
  };
  
  const renderWaterSystemStep = () => {
    return (
      <div className="setup-step">
        <h2>ตั้งค่าระบบน้ำประปา</h2>
        <p className="step-description">กรุณากรอกข้อมูลเกี่ยวกับระบบน้ำประปาของหมู่บ้าน</p>
        
        <div className="form-group">
          <label>แหล่งน้ำหลัก:</label>
          <select 
            name="waterSource" 
            value={waterSystemInfo.waterSource} 
            onChange={handleWaterSystemInfoChange}
          >
            <option value="groundwater">น้ำบาดาล</option>
            <option value="surface">น้ำผิวดิน (แม่น้ำ, ลำธาร, สระ)</option>
            <option value="tap">น้ำประปาส่วนภูมิภาค</option>
            <option value="mixed">ระบบผสม</option>
          </select>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              name="hasPurification" 
              checked={waterSystemInfo.hasPurification} 
              onChange={handleWaterSystemInfoChange}
            />
            มีระบบกรองน้ำหรือระบบบำบัดน้ำ
          </label>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              name="hasMeter" 
              checked={waterSystemInfo.hasMeter} 
              onChange={handleWaterSystemInfoChange}
            />
            มีมิเตอร์วัดน้ำสำหรับผู้ใช้น้ำแต่ละราย
          </label>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>ความจุถังเก็บน้ำ (ลบ.ม.):</label>
            <input 
              type="number" 
              name="tankCapacity" 
              value={waterSystemInfo.tankCapacity} 
              onChange={handleWaterSystemInfoChange}
            />
          </div>
          
          <div className="form-group">
            <label>กำลังปั๊มน้ำ (ลิตร/นาที):</label>
            <input 
              type="number" 
              name="pumpCapacity" 
              value={waterSystemInfo.pumpCapacity} 
              onChange={handleWaterSystemInfoChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>วัสดุท่อหลัก:</label>
          <select 
            name="pipeMaterial" 
            value={waterSystemInfo.pipeMaterial} 
            onChange={handleWaterSystemInfoChange}
          >
            <option value="pvc">PVC</option>
            <option value="hdpe">HDPE</option>
            <option value="metal">โลหะ</option>
            <option value="mixed">วัสดุผสม</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>ระบบการจ่ายน้ำ:</label>
          <select 
            name="distributionType" 
            value={waterSystemInfo.distributionType} 
            onChange={handleWaterSystemInfoChange}
          >
            <option value="gravity">แรงโน้มถ่วง (จากที่สูงลงที่ต่ำ)</option>
            <option value="pump">แรงดันจากปั๊ม</option>
            <option value="mixed">ระบบผสม</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>จำนวนผู้ใช้น้ำในปัจจุบัน (ถ้ามี):</label>
          <input 
            type="number" 
            name="existingUsers" 
            value={waterSystemInfo.existingUsers} 
            onChange={handleWaterSystemInfoChange}
          />
        </div>
        
        <div className="step-actions">
          <button 
            type="button" 
            className="back-btn"
            onClick={handlePrevStep}
          >
            ย้อนกลับ
          </button>
          <button 
            type="button" 
            className="next-btn"
            onClick={handleNextStep}
          >
            ถัดไป
          </button>
        </div>
      </div>
    );
  };
  
  const renderBillingStep = () => {
    return (
      <div className="setup-step">
        <h2>ตั้งค่าระบบการเก็บค่าน้ำ</h2>
        <p className="step-description">กรุณากำหนดอัตราค่าน้ำและค่าบริการต่างๆ</p>
        
        <div className="form-row">
          <div className="form-group">
            <label>อัตราค่าน้ำต่อหน่วย (บาท):</label>
            <input 
              type="number" 
              name="ratePerUnit" 
              value={billingInfo.ratePerUnit} 
              onChange={handleBillingInfoChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label>ค่าบริการขั้นต่ำ (บาท):</label>
            <input 
              type="number" 
              name="minimumCharge" 
              value={billingInfo.minimumCharge} 
              onChange={handleBillingInfoChange}
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>ค่าเช่ามิเตอร์ (บาท/เดือน):</label>
            <input 
              type="number" 
              name="meterRentalFee" 
              value={billingInfo.meterRentalFee} 
              onChange={handleBillingInfoChange}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>ค่าบำรุงรักษาระบบ (บาท/เดือน):</label>
            <input 
              type="number" 
              name="maintenanceFee" 
              value={billingInfo.maintenanceFee} 
              onChange={handleBillingInfoChange}
              min="0"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>วันครบกำหนดชำระค่าน้ำของแต่ละเดือน:</label>
            <input 
              type="number" 
              name="billDueDay" 
              value={billingInfo.billDueDay} 
              onChange={handleBillingInfoChange}
              min="1"
              max="31"
              required
            />
          </div>
          
          <div className="form-group">
            <label>รอบการออกบิล:</label>
            <select 
              name="billCycle" 
              value={billingInfo.billCycle} 
              onChange={handleBillingInfoChange}
            >
              <option value="monthly">รายเดือน</option>
              <option value="bimonthly">ทุก 2 เดือน</option>
              <option value="quarterly">ทุก 3 เดือน</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>วิธีการชำระเงินที่รับ:</label>
          <div className="checkbox-list">
            <label>
              <input 
                type="checkbox" 
                name="paymentMethods" 
                value="cash" 
                checked={billingInfo.paymentMethods.includes('cash')} 
                onChange={handleBillingInfoChange}
              />
              เงินสด
            </label>
            <label>
              <input 
                type="checkbox" 
                name="paymentMethods" 
                value="transfer" 
                checked={billingInfo.paymentMethods.includes('transfer')} 
                onChange={handleBillingInfoChange}
              />
              โอนเงิน
            </label>
            <label>
              <input 
                type="checkbox" 
                name="paymentMethods" 
                value="promptpay" 
                checked={billingInfo.paymentMethods.includes('promptpay')} 
                onChange={handleBillingInfoChange}
              />
              พร้อมเพย์
            </label>
          </div>
        </div>
        
        <div className="step-actions">
          <button 
            type="button" 
            className="back-btn"
            onClick={handlePrevStep}
          >
            ย้อนกลับ
          </button>
          <button 
            type="button" 
            className="finish-btn"
            onClick={handleFinish}
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>ตั้งค่าระบบน้ำประปาหมู่บ้าน</h1>
        <div className="progress-indicator">
          <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">ข้อมูลหมู่บ้าน</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">ระบบน้ำประปา</div>
          </div>
          <div className="step-connector"></div>
          <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">การเก็บค่าน้ำ</div>
          </div>
        </div>
      </div>
      
      <div className="setup-content">
        {currentStep === 1 && renderVillageInfoStep()}
        {currentStep === 2 && renderWaterSystemStep()}
        {currentStep === 3 && renderBillingStep()}
      </div>
    </div>
  );
}

export default WaterSourceSelection;