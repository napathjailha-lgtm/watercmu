// src/components/VillageSettings.jsx
import React, { useState, useEffect } from 'react';
import { villageService } from '../services/api';
import { AddressSelector, AddressSelectorStyles } from './AddressSelector.js';
import { validateAddressForm, formatAddress } from '../utils/addressValidation.js';

function VillageSettings({ user, currentVillage }) {
  const [villages, setVillages] = useState([]);
  const [village, setVillage] = useState({
    village_id: 0,
    village_name: '',
    office_address: '',
    village_number: '',
    sub_district: '',
    default_rate_per_unit:30,
    meter_rental_fee:20,
    district: '',
    province: '',
    postal_code: '',
    village_head: '',
    village_head_email: '',
    village_head_phone: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    waterSource: 'groundwater',
    connectionDate: '',
    ratePerUnit: 30,
    minimumCharge: 100,
    meterRentalFee: 20,
    logo: null,
    payment_due_date: '',
    bank_name: '',
    account_number: '',
    qr_code: null,
    collector_name: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [addressData, setAddressData] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});

  // Equipment และ Expenses state (เหมือนเดิม)
  const [waterEquipment, setWaterEquipment] = useState([
    { id: 1, type: 'pump', name: 'ปั๊มน้ำตัวที่ 1', capacity: '', unit: 'kW' },
    { id: 2, type: 'pump', name: 'ปั๊มน้ำตัวที่ 2', capacity: '', unit: 'kW' },
    { id: 3, type: 'filter', name: 'เครื่องกรองน้ำ', capacity: '', unit: '' },
    { id: 4, type: 'tank', name: 'ถังเก็บน้ำ', capacity: '', unit: 'M3' }
  ]);
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'ค่าเช่ามิเตอร์น้ำประปา', amount: village.meter_rental_fee, unit: 'บาท' },
    { id: 2, name: 'ค่าน้ำประปาต่อหน่วย', amount: village.default_rate_per_unit, unit: 'บาท' }
  ]);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await villageService.getVillageById(currentVillage.village_id);
        console.log('data',response.data.data)
        if (response.data && response.data.data) {
          setVillages(response.data.data);

          // ตั้งค่าข้อมูลที่อยู่เริ่มต้น
          const villageData = response.data.data;
          console.log('Village data fetched:', villageData);
          setExpenses([
            { id: 1, name: 'ค่าเช่ามิเตอร์น้ำประปา', amount: villageData.meter_rental_fee, unit: 'บาท' },
            { id: 2, name: 'ค่าน้ำประปาต่อหน่วย', amount: villageData.default_rate_per_unit, unit: 'บาท' } 
          ]);
          setVillage(villageData);
        } else {
          setVillages([]);
        }
      } catch (error) {
        console.error('Error fetching villages:', error);
      }
    };

    fetchVillages();
  }, []);
  useEffect(() => {
    // Sync addressData กับ village state เมื่อ village เปลี่ยน
    if (village && village.province && village.district && village.sub_district && village.postal_code) {
      setAddressData({
        province: village.province,
        district: village.district,
        sub_district: village.sub_district,
        postal_code: village.postal_code
      });
    }
  }, [village]);
  // จัดการการเปลี่ยนแปลงข้อมูลที่อยู่
  const handleAddressChange = (addressInfo) => {
    setAddressData(addressInfo.data);

    // อัปเดต village state
    setVillage(prev => ({
      ...prev,
      province: addressInfo.data.province,
      district: addressInfo.data.district,
      sub_district: addressInfo.data.sub_district,
      postal_code: addressInfo.data.postal_code
    }));

    // จัดการ errors
    if (addressInfo.hasErrors) {
      setAddressErrors(addressInfo.errors || {});
    } else {
      setAddressErrors({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVillage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบขนาด
    if (file.size > 2 * 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกินไป');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file); // ✅ ชื่อ field ต้องเป็น 'file' เท่านั้น
      formData.append('type', fieldName); // ส่งข้อมูลเพิ่มเติม (ไม่กระทบ multer)
      formData.append('village_id', currentVillage.village_id);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://api.abchomey.com/api/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // ไม่ใส่ Content-Type เพราะ browser จะใส่ให้อัตโนมัติ
        },
        body: formData
      });

      const result = await response.json();
      console.log(result);

      if (result.success) {
        // ใช้ result.image.url หรือ result.filePath ตามที่ backend คืนมา
        setVillage(prev => ({
          ...prev,
          [fieldName]: result.filePath || result.image?.url
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดไฟล์');
    }
  };


  // Equipment management functions (เหมือนเดิม)
  const addEquipment = () => {
    const newId = Math.max(...waterEquipment.map(e => e.id), 0) + 1;
    setWaterEquipment(prev => [...prev, {
      id: newId,
      type: 'other',
      name: '',
      capacity: '',
      unit: ''
    }]);
  };

  const updateEquipment = (id, field, value) => {
    setWaterEquipment(prev => prev.map(equipment =>
      equipment.id === id ? { ...equipment, [field]: value } : equipment
    ));
  };

  const removeEquipment = (id) => {
    setWaterEquipment(prev => prev.filter(equipment => equipment.id !== id));
  };

  // Expense management functions (เหมือนเดิม)
  const addExpense = () => {
    const newId = Math.max(...expenses.map(e => e.id), 0) + 1;
    setExpenses(prev => [...prev, {
      id: newId,
      name: '',
      amount: '',
      unit: 'บาท'
    }]);
  };

  const updateExpense = (id, field, value) => {
    setExpenses(prev => prev.map(expense =>
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const removeExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const addressValidation = validateAddressForm(addressData || {});
      if (!addressValidation.isValid) {
        setAddressErrors(addressValidation.errors);
        alert('กรุณาตรวจสอบข้อมูลที่อยู่ให้ครบถ้วน');
        return;
      }

      const token = localStorage.getItem('auth_token');

      // ดึง village_id จากข้อมูลหมู่บ้านปัจจุบัน
      const villageId = village?.village_id;
      if (!villageId) {
        alert('ไม่พบรหัสหมู่บ้าน');
        return;
      }

      const formData = {
        ...village,
        waterEquipment,
        expenses
      };
      // เรียก API
      console.log('4890', formData)
      const response = await fetch(`https://api.abchomey.com/api/villages/${villageId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('บันทึกการตั้งค่าหมู่บ้านเรียบร้อยแล้ว');
        //setIsEditing(false);
      } else {
        console.error(result);
        alert(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving village settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };


  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      type="button"
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );

  const BillPreview = () => (
    <div className="bill-preview">
      <div className="bill-header">
        {village.logo || village.logo_url && (
          <img src={village.logo || village.logo_url} alt="Logo" className="bill-logo" />
        )}
        <h3>ใบแจ้งหนี้ค่าน้ำประปา</h3>
        <div className="office-address">
          {village.office_address && (
            <p>{village.office_address}</p>
          )}
          {addressData && (
            <p>{formatAddress(addressData)}</p>
          )}
        </div>
      </div>

      <div className="bill-body">
        <div className="customer-info">
          <p><strong>ชื่อผู้พักอาศัย:</strong> [ดึงข้อมูลจากระบบ]</p>
          <p><strong>ที่อยู่:</strong> [ดึงข้อมูลจากระบบ]</p>
          <p><strong>เลขมิเตอร์:</strong> [ดึงข้อมูลจากระบบ]</p>
        </div>

        <div className="usage-details">
          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ค่าน้ำประปา</td>
                <td>[หน่วยที่ใช้]</td>
                <td>฿{village.default_rate_per_unit}</td>
                <td>[คำนวณ]</td>
              </tr>
              <tr>
                <td>ค่าเช่ามิเตอร์</td>
                <td>1</td>
                <td>฿{village.meter_rental_fee}</td>
                <td>฿{village.meter_rental_fee}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="payment-info">
          <p><strong>กำหนดชำระ:</strong> วันที่ {village.payment_due_date} ของทุกเดือน</p>
          {village.bank_name && village.account_number && (
            <p><strong>บัญชีสำหรับชำระเงิน:</strong> {village.bank_name} {village.account_number}</p>
          )}
          {village.qr_code ||  village.qr_code_url && (
            <div className="qr-code">
              <img src={village.qr_code ||  village.qr_code_url} alt="QR Code" />
            </div>
          )}
          {village.collector_name && (
            <p><strong>ผู้เก็บเงิน:</strong> {village.collector_name}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <style>{AddressSelectorStyles}</style>

      <div className="settings-content">
        <div className="settings-card">
          <div className="card-header">
            <h2>ข้อมูลหมู่บ้าน {village.village_name}</h2>
            {!isEditing ? (
              <button
                className="edit-btn"
                onClick={() => {
                  setIsEditing(true);
                  setVillage(village);
                }}
              >
                แก้ไข
              </button>
            ) : (
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setVillage(currentVillage);
                }}
              >
                ยกเลิก
              </button>
            )}
          </div>

          <div className="tabs">
            <TabButton id="general" label="ข้อมูลทั่วไป" isActive={activeTab === 'general'} onClick={setActiveTab} />
            <TabButton id="equipment" label="ระบบประปา" isActive={activeTab === 'equipment'} onClick={setActiveTab} />
            <TabButton id="expenses" label="ค่าใช้จ่าย" isActive={activeTab === 'expenses'} onClick={setActiveTab} />
            <TabButton id="billing" label="ใบแจ้งหนี้" isActive={activeTab === 'billing'} onClick={setActiveTab} />
          </div>

          <div>
            {/* ข้อมูลทั่วไป */}
            {activeTab === 'general' && (
              <div className="form-section">
                <h3>ข้อมูลทั่วไป</h3>

                <div className="form-group">
                  <label>ชื่อหมู่บ้าน:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="village_name"
                      value={village.village_name}
                      onChange={handleChange}
                      required
                    />
                  ) : (
                    <div className="field-value">{village.village_name || '-'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>ที่ทำการเลขที่:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="office_address"
                      value={village.office_address}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="field-value">{village.office_address || '-'}</div>
                  )}
                </div>

                {/* Address Selector */}
                {isEditing ? (
                  <AddressSelector
                    initialValues={{
                      province: village.province,
                      district: village.district,
                      sub_district: village.sub_district,
                      postal_code: village.postal_code
                    }}
                    onChange={handleAddressChange}
                    layout="grid"
                    className="village-address"
                  />
                ) : (
                  <div className="address-display">
                    <h4>ที่อยู่</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>จังหวัด:</label>
                        <div className="field-value">{village.province || '-'}</div>
                      </div>
                      <div className="form-group">
                        <label>อำเภอ:</label>
                        <div className="field-value">{village.district || '-'}</div>
                      </div>
                      <div className="form-group">
                        <label>ตำบล:</label>
                        <div className="field-value">{village.sub_district || '-'}</div>
                      </div>
                      <div className="form-group">
                        <label>รหัสไปรษณีย์:</label>
                        <div className="field-value">{village.postal_code || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="contact-section">
                  <h4>ข้อมูลประธานหมู่บ้าน</h4>
                  <div className="form-group">
                    <label>ชื่อประธานหมู่บ้าน:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="village_head"
                        value={village.village_head}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="field-value">{village.village_head || '-'}</div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email:</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="village_head_email"
                          value={village.village_head_email}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{village.village_head_email || '-'}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>โทรศัพท์:</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="village_head_phone"
                          value={village.village_head_phone}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{village.village_head_phone || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="contact-section">
                  <h4>ผู้ติดต่อประสานงาน</h4>
                  <div className="form-group">
                    <label>ชื่อผู้ติดต่อ:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contact_person"
                        value={village.contact_person}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="field-value">{village.contact_person || '-'}</div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email:</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="contact_email"
                          value={village.contact_email}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{village.contact_email || '-'}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>โทรศัพท์:</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="contact_phone"
                          value={village.contact_phone}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{village.contact_phone || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ข้อมูลระบบประปา */}
            {activeTab === 'equipment' && (
              <div className="form-section">
                <h3>ข้อมูลระบบประปา</h3>

                {waterEquipment.map((equipment) => (
                  <div key={equipment.id} className="equipment-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>{equipment.name}:</label>
                        {isEditing ? (
                          <div className="input-with-unit">
                            <input
                              type="text"
                              value={equipment.capacity}
                              onChange={(e) => updateEquipment(equipment.id, 'capacity', e.target.value)}
                            />
                            <span className="unit">{equipment.unit}</span>
                            {equipment.type === 'other' && (
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeEquipment(equipment.id)}
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="field-value">
                            {equipment.capacity ? `${equipment.capacity} ${equipment.unit}` : '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isEditing && (
                  <button
                    type="button"
                    className="add-btn"
                    onClick={addEquipment}
                  >
                    + เพิ่มอุปกรณ์
                  </button>
                )}
              </div>
            )}

            {/* ข้อมูลค่าใช้จ่าย */}
            {activeTab === 'expenses' && (
              <div className="form-section">
                <h3>ข้อมูลค่าใช้จ่าย</h3>

                {expenses.map((expense) => (
                  <div key={expense.id} className="expense-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>{expense.name}:</label>
                        {isEditing ? (
                          <div className="input-with-unit">
                            <input
                              type="number"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                              step="0.01"
                            />
                            <span className="unit">{expense.unit}</span>
                            {expense.id > 2 && (
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeExpense(expense.id)}
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="field-value">
                            {expense.amount ? `฿${expense.amount}` : '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ข้อมูลใบแจ้งหนี้ */}
            {activeTab === 'billing' && (
              <div className="form-section">
                <h3>ข้อมูลรายละเอียดในใบแจ้งหนี้ / ใบเสร็จรับเงิน</h3>

                <div className="form-group">
                  <label>Logo:</label>
                  {isEditing ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  ) : (
                    <div className="field-value">
                      {village.logo_url ? (
                        <img src={village.logo_url} alt="Logo" className="logo-preview" />
                      ) : '-'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>วันที่กำหนดชำระ:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="payment_due_date"
                      value={village.payment_due_date}
                      onChange={handleChange}
                      placeholder="เช่น 15"
                    />
                  ) : (
                    <div className="field-value">
                      {village.payment_due_date ? `วันที่ ${village.payment_due_date} ของทุกเดือน` : '-'}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ธนาคาร:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="bank_name"
                        value={village.bank_name}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="field-value">{village.bank_name || '-'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>เลขที่บัญชี:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="account_number"
                        value={village.account_number}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="field-value">{village.account_number || '-'}</div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>QR Code สำหรับชำระเงิน:</label>
                  {isEditing ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'qr_code')}
                    />
                  ) : (
                    <div className="field-value">
                      {village.qr_code_url ? (
                        <img src={village.qr_code_url} alt="QR Code" className="qr-preview" />
                      ) : '-'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>ชื่อผู้เก็บเงิน:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="collector_name"
                      value={village.collector_name}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="field-value">{village.collector_name || '-'}</div>
                  )}
                </div>

                <div className="preview-section">
                  <h4>Preview รูปแบบใบแจ้งหนี้ / ใบเสร็จรับเงิน</h4>
                  <BillPreview />
                </div>
              </div>
            )}

            {isEditing && (
              <div className="form-actions">
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Original Styles */}
      <style>
        {`
        .settings-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .settings-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        .tab-button {
          padding: 15px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          white-space: nowrap;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .form-section {
          padding: 30px;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .form-section h4 {
          margin: 30px 0 15px 0;
          color: #374151;
          font-size: 1.1rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .address-display {
          margin-top: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .village-address {
          margin-top: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .field-value {
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
          color: #374151;
          min-height: 20px;
        }

        .input-with-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .input-with-actions input {
          flex: 1;
        }

        .input-with-unit {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-with-unit input {
          flex: 1;
        }

        .unit {
          color: #6b7280;
          font-weight: 500;
          min-width: 50px;
        }

        .equipment-item,
        .expense-item {
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 15px;
          background: #fafafa;
        }

        .contact-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .edit-btn,
        .cancel-btn,
        .save-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn {
          background: #667eea;
          color: white;
        }

        .edit-btn:hover {
          background: #5a67d8;
        }

        .cancel-btn {
          background: #6b7280;
          color: white;
        }

        .cancel-btn:hover {
          background: #374151;
        }

        .save-btn {
          background: #10b981;
          color: white;
          width: 100%;
          padding: 15px;
          font-size: 16px;
        }

        .save-btn:hover:not(:disabled) {
          background: #059669;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .add-btn,
        .remove-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn {
          background: #10b981;
          color: white;
          margin-top: 15px;
        }

        .add-btn:hover {
          background: #059669;
        }

        .remove-btn {
          background: #ef4444;
          color: white;
        }

        .remove-btn:hover {
          background: #dc2626;
        }

        .form-actions {
          padding: 20px 30px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .logo-preview,
        .qr-preview {
          max-width: 100px;
          max-height: 100px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .preview-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .bill-preview {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 20px;
          background: white;
          max-width: 600px;
          margin: 20px 0;
        }

        .bill-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }

        .bill-logo {
          max-width: 80px;
          max-height: 80px;
          margin-bottom: 10px;
        }

        .bill-header h3 {
          margin: 10px 0;
          color: #1f2937;
        }

        .office-address {
          font-size: 14px;
          color: #6b7280;
        }

        .bill-body {
          font-size: 14px;
        }

        .customer-info {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .customer-info p {
          margin: 5px 0;
        }

        .usage-details table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .usage-details th,
        .usage-details td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .usage-details th {
          background: #f3f4f6;
          font-weight: 600;
        }

        .payment-info {
          margin-top: 20px;
          padding: 15px;
          background: #f0f9ff;
          border-radius: 6px;
          border-left: 4px solid #0ea5e9;
        }

        .payment-info p {
          margin: 8px 0;
        }

        .qr-code {
          text-align: center;
          margin: 15px 0;
        }

        .qr-code img {
          max-width: 120px;
          max-height: 120px;
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 10px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1;
            min-width: 120px;
          }

          .bill-preview {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default VillageSettings;