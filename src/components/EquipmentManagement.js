// src/components/EquipmentManagement.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function EquipmentManagement({ user, currentVillage }) {
  const [equipmentItems, setEquipmentItems] = useState([
    {
      id: 1,
      name: 'เครื่องสูบน้ำหลัก',
      type: 'pump',
      brand: 'Mitsubishi',
      model: 'WP-450',
      installDate: '15 ม.ค. 2024',
      lastMaintenance: '10 เม.ย. 2025',
      nextMaintenance: '10 ก.ค. 2025',
      status: 'operational',
      location: 'โรงสูบน้ำหลัก',
      notes: 'กำลังปั๊ม 450 ลิตร/นาที'
    },
    {
      id: 2,
      name: 'เครื่องสูบน้ำสำรอง',
      type: 'pump',
      brand: 'Mitsubishi',
      model: 'WP-300',
      installDate: '15 ม.ค. 2024',
      lastMaintenance: '10 เม.ย. 2025',
      nextMaintenance: '10 ก.ค. 2025',
      status: 'operational',
      location: 'โรงสูบน้ำหลัก',
      notes: 'กำลังปั๊ม 300 ลิตร/นาที'
    },
    {
      id: 3,
      name: 'ถังเก็บน้ำหลัก',
      type: 'tank',
      brand: 'Premier',
      model: 'WT-5000',
      installDate: '20 ม.ค. 2024',
      lastMaintenance: '15 เม.ย. 2025',
      nextMaintenance: '15 ต.ค. 2025',
      status: 'operational',
      location: 'หอถังน้ำกลางหมู่บ้าน',
      notes: 'ความจุ 5,000 ลิตร'
    },
    {
      id: 4,
      name: 'เครื่องจ่ายคลอรีน',
      type: 'chlorinator',
      brand: 'ChemTech',
      model: 'CL-100',
      installDate: '22 ม.ค. 2024',
      lastMaintenance: '1 พ.ค. 2025',
      nextMaintenance: '1 มิ.ย. 2025',
      status: 'maintenance_required',
      location: 'โรงสูบน้ำหลัก',
      notes: 'ต้องเติมคลอรีนเร็วๆ นี้'
    },
    {
      id: 5,
      name: 'มาตรวัดน้ำหลัก',
      type: 'meter',
      brand: 'FlowTech',
      model: 'FM-500',
      installDate: '15 ม.ค. 2024',
      lastMaintenance: '10 เม.ย. 2025',
      nextMaintenance: '10 เม.ย. 2026',
      status: 'operational',
      location: 'ทางออกโรงสูบน้ำ',
      notes: 'วัดปริมาณน้ำที่จ่ายเข้าระบบ'
    }
  ]);
  
  const [maintenanceLogs, setMaintenanceLogs] = useState([
    {
      id: 1,
      equipmentId: 1,
      date: '10 เม.ย. 2025',
      type: 'regular',
      description: 'บำรุงรักษาตามระยะเวลา เปลี่ยนน้ำมันเครื่อง ตรวจสอบระบบทั่วไป',
      cost: 1500,
      technician: 'นายวิชัย ช่างคล่อง',
      status: 'completed'
    },
    {
      id: 2,
      equipmentId: 4,
      date: '1 พ.ค. 2025',
      type: 'repair',
      description: 'ซ่อมวาล์วจ่ายคลอรีนที่รั่ว เปลี่ยนอะไหล่',
      cost: 800,
      technician: 'นายวิชัย ช่างคล่อง',
      status: 'completed'
    },
    {
      id: 3,
      equipmentId: 4,
      date: '15 พ.ค. 2025',
      type: 'scheduled',
      description: 'เติมคลอรีนและบำรุงรักษาประจำเดือน',
      cost: 500,
      technician: '',
      status: 'scheduled'
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('equipment');
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: 'pump',
    brand: '',
    model: '',
    installDate: '',
    status: 'operational',
    location: '',
    notes: ''
  });
  
  const [newMaintenance, setNewMaintenance] = useState({
    equipmentId: '',
    date: '',
    type: 'regular',
    description: '',
    cost: '',
    technician: '',
    status: 'scheduled'
  });
  
  const handleEquipmentChange = (e) => {
    const { name, value } = e.target;
    setNewEquipment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleMaintenanceChange = (e) => {
    const { name, value } = e.target;
    setNewMaintenance(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddEquipment = (e) => {
    e.preventDefault();
    
    const newItem = {
      id: equipmentItems.length + 1,
      ...newEquipment,
      lastMaintenance: null,
      nextMaintenance: null
    };
    
    setEquipmentItems(prev => [...prev, newItem]);
    
    setNewEquipment({
      name: '',
      type: 'pump',
      brand: '',
      model: '',
      installDate: '',
      status: 'operational',
      location: '',
      notes: ''
    });
    
    setShowAddEquipmentModal(false);
  };
  
  const handleAddMaintenance = (e) => {
    e.preventDefault();
    
    const newLog = {
      id: maintenanceLogs.length + 1,
      ...newMaintenance,
      cost: parseFloat(newMaintenance.cost)
    };
    
    setMaintenanceLogs(prev => [...prev, newLog]);
    
    // If maintenance is completed, update equipment's last and next maintenance dates
    if (newMaintenance.status === 'completed') {
      setEquipmentItems(prev => prev.map(item => {
        if (item.id === parseInt(newMaintenance.equipmentId)) {
          // Calculate next maintenance date (3 months later for this example)
          const maintDate = new Date();
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + 3);
          
          return {
            ...item,
            lastMaintenance: new Date().toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            nextMaintenance: nextDate.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            status: 'operational'
          };
        }
        return item;
      }));
    }
    
    setNewMaintenance({
      equipmentId: '',
      date: '',
      type: 'regular',
      description: '',
      cost: '',
      technician: '',
      status: 'scheduled'
    });
    
    setShowAddMaintenanceModal(false);
  };
  
  const openMaintenanceModal = (equipment) => {
    setSelectedEquipment(equipment);
    setNewMaintenance(prev => ({
      ...prev,
      equipmentId: equipment.id.toString(),
      date: new Date().toISOString().split('T')[0]
    }));
    setShowAddMaintenanceModal(true);
  };
  
  const getEquipmentStatusText = (status) => {
    switch(status) {
      case 'operational': return 'ใช้งานได้';
      case 'maintenance_required': return 'ต้องการบำรุงรักษา';
      case 'under_repair': return 'กำลังซ่อมแซม';
      case 'out_of_service': return 'ไม่สามารถใช้งานได้';
      default: return status;
    }
  };
  
  const getMaintenanceTypeText = (type) => {
    switch(type) {
      case 'regular': return 'บำรุงรักษาทั่วไป';
      case 'repair': return 'ซ่อมแซม';
      case 'scheduled': return 'บำรุงรักษาตามกำหนด';
      case 'emergency': return 'ซ่อมฉุกเฉิน';
      default: return type;
    }
  };
  
  const getMaintenanceStatusText = (status) => {
    switch(status) {
      case 'scheduled': return 'ตารางงาน';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };
  
  const getMaintRequiredCount = () => {
    return equipmentItems.filter(item => item.status === 'maintenance_required').length;
  };
  
  const getUpcomingMaintenanceCount = () => {
    return maintenanceLogs.filter(log => log.status === 'scheduled').length;
  };
  
  return (
    <div className="equipment-container">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">← กลับไปหน้าหลัก</Link>
          <h1>จัดการอุปกรณ์และซ่อมบำรุง</h1>
        </div>
      </header>
      
      <div className="equipment-tabs">
        <button 
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          อุปกรณ์
          {getMaintRequiredCount() > 0 && (
            <span className="alert-badge">{getMaintRequiredCount()}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          งานซ่อมบำรุง
          {getUpcomingMaintenanceCount() > 0 && (
            <span className="alert-badge">{getUpcomingMaintenanceCount()}</span>
          )}
        </button>
      </div>
      
      {activeTab === 'equipment' && (
        <div className="equipment-section">
          <div className="section-header">
            <h2>รายการอุปกรณ์</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddEquipmentModal(true)}
            >
              + เพิ่มอุปกรณ์
            </button>
          </div>
          
          <div className="equipment-filters">
            <div className="search-bar">
              <input type="text" placeholder="ค้นหาตามชื่อหรือรายละเอียด" />
              <button className="search-btn">ค้นหา</button>
            </div>
            
            <div className="filter-group">
              <label>ประเภท:</label>
              <select>
                <option value="all">ทั้งหมด</option>
                <option value="pump">เครื่องสูบน้ำ</option>
                <option value="tank">ถังเก็บน้ำ</option>
                <option value="chlorinator">เครื่องจ่ายคลอรีน</option>
                <option value="meter">มาตรวัดน้ำ</option>
                <option value="pipe">ท่อ/วาล์ว</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>สถานะ:</label>
              <select>
                <option value="all">ทั้งหมด</option>
                <option value="operational">ใช้งานได้</option>
                <option value="maintenance_required">ต้องการบำรุงรักษา</option>
                <option value="under_repair">กำลังซ่อมแซม</option>
                <option value="out_of_service">ไม่สามารถใช้งานได้</option>
              </select>
            </div>
          </div>
          
          <div className="equipment-list">
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>ประเภท</th>
                  <th>รุ่น/ยี่ห้อ</th>
                  <th>ตำแหน่งที่ตั้ง</th>
                  <th>วันที่ติดตั้ง</th>
                  <th>บำรุงรักษาล่าสุด</th>
                  <th>บำรุงรักษาครั้งถัดไป</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {equipmentItems.map(item => (
                  <tr key={item.id} className={item.status === 'maintenance_required' ? 'maintenance-required-row' : ''}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.brand} {item.model}</td>
                    <td>{item.location}</td>
                    <td>{item.installDate}</td>
                    <td>{item.lastMaintenance || '-'}</td>
                    <td>{item.nextMaintenance || '-'}</td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {getEquipmentStatusText(item.status)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn maintenance-btn"
                        onClick={() => openMaintenanceModal(item)}
                      >
                        บำรุงรักษา
                      </button>
                      <button className="action-btn edit-btn">แก้ไข</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'maintenance' && (
        <div className="maintenance-section">
          <div className="section-header">
            <h2>บันทึกการซ่อมบำรุง</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddMaintenanceModal(true)}
            >
              + เพิ่มงานซ่อมบำรุง
            </button>
          </div>
          
          <div className="maintenance-filters">
            <div className="search-bar">
              <input type="text" placeholder="ค้นหาตามรายละเอียดหรืออุปกรณ์" />
              <button className="search-btn">ค้นหา</button>
            </div>
            
            <div className="filter-group">
              <label>ประเภท:</label>
              <select>
                <option value="all">ทั้งหมด</option>
                <option value="regular">บำรุงรักษาทั่วไป</option>
                <option value="repair">ซ่อมแซม</option>
                <option value="scheduled">บำรุงรักษาตามกำหนด</option>
                <option value="emergency">ซ่อมฉุกเฉิน</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>สถานะ:</label>
              <select>
                <option value="all">ทั้งหมด</option>
                <option value="scheduled">ตารางงาน</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          </div>
          
          <div className="maintenance-list">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>อุปกรณ์</th>
                  <th>ประเภท</th>
                  <th>รายละเอียด</th>
                  <th>ค่าใช้จ่าย</th>
                  <th>ช่างเทคนิค</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.map(log => {
                  const equipment = equipmentItems.find(item => item.id === log.equipmentId);
                  return (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td>{equipment ? equipment.name : `อุปกรณ์ #${log.equipmentId}`}</td>
                      <td>{getMaintenanceTypeText(log.type)}</td>
                      <td>{log.description}</td>
                      <td>฿{log.cost}</td>
                      <td>{log.technician || '-'}</td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>
                          {getMaintenanceStatusText(log.status)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {log.status === 'scheduled' && (
                          <>
                            <button className="action-btn complete-btn">เสร็จสิ้น</button>
                            <button className="action-btn edit-btn">แก้ไข</button>
                          </>
                        )}
                        {log.status === 'in_progress' && (
                          <button className="action-btn complete-btn">เสร็จสิ้น</button>
                        )}
                        {log.status === 'completed' && (
                          <button className="action-btn view-btn">ดูรายละเอียด</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showAddEquipmentModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>เพิ่มอุปกรณ์ใหม่</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddEquipmentModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddEquipment}>
              <div className="form-group">
                <label>ชื่ออุปกรณ์:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newEquipment.name} 
                  onChange={handleEquipmentChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>ประเภท:</label>
                <select 
                  name="type" 
                  value={newEquipment.type} 
                  onChange={handleEquipmentChange}
                >
                  <option value="pump">เครื่องสูบน้ำ</option>
                  <option value="tank">ถังเก็บน้ำ</option>
                  <option value="chlorinator">เครื่องจ่ายคลอรีน</option>
                  <option value="meter">มาตรวัดน้ำ</option>
                  <option value="pipe">ท่อ/วาล์ว</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ยี่ห้อ:</label>
                  <input 
                    type="text" 
                    name="brand" 
                    value={newEquipment.brand} 
                    onChange={handleEquipmentChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>รุ่น:</label>
                  <input 
                    type="text" 
                    name="model" 
                    value={newEquipment.model} 
                    onChange={handleEquipmentChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>วันที่ติดตั้ง:</label>
                <input 
                  type="date" 
                  name="installDate" 
                  value={newEquipment.installDate} 
                  onChange={handleEquipmentChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>ตำแหน่งที่ตั้ง:</label>
                <input 
                  type="text" 
                  name="location" 
                  value={newEquipment.location} 
                  onChange={handleEquipmentChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>สถานะ:</label>
                <select 
                  name="status" 
                  value={newEquipment.status} 
                  onChange={handleEquipmentChange}
                >
                  <option value="operational">ใช้งานได้</option>
                  <option value="maintenance_required">ต้องการบำรุงรักษา</option>
                  <option value="under_repair">กำลังซ่อมแซม</option>
                  <option value="out_of_service">ไม่สามารถใช้งานได้</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>หมายเหตุ:</label>
                <textarea 
                  name="notes" 
                  value={newEquipment.notes} 
                  onChange={handleEquipmentChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddEquipmentModal(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="submit-btn">เพิ่มอุปกรณ์</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showAddMaintenanceModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>เพิ่มงานซ่อมบำรุง</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddMaintenanceModal(false);
                  setSelectedEquipment(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddMaintenance}>
              <div className="form-group">
                <label>อุปกรณ์:</label>
                <select 
                  name="equipmentId" 
                  value={newMaintenance.equipmentId} 
                  onChange={handleMaintenanceChange}
                  required
                >
                  <option value="">-- เลือกอุปกรณ์ --</option>
                  {equipmentItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>วันที่:</label>
                <input 
                  type="date" 
                  name="date" 
                  value={newMaintenance.date} 
                  onChange={handleMaintenanceChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>ประเภทงาน:</label>
                <select 
                  name="type" 
                  value={newMaintenance.type} 
                  onChange={handleMaintenanceChange}
                >
                  <option value="regular">บำรุงรักษาทั่วไป</option>
                  <option value="repair">ซ่อมแซม</option>
                  <option value="scheduled">บำรุงรักษาตามกำหนด</option>
                  <option value="emergency">ซ่อมฉุกเฉิน</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>รายละเอียด:</label>
                <textarea 
                  name="description" 
                  value={newMaintenance.description} 
                  onChange={handleMaintenanceChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ค่าใช้จ่าย (บาท):</label>
                  <input 
                    type="number" 
                    name="cost" 
                    value={newMaintenance.cost} 
                    onChange={handleMaintenanceChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>ทคนิค:</label>
                  <input 
                    type="text" 
                    name="technician" 
                    value={newMaintenance.technician} 
                    onChange={handleMaintenanceChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>สถานะ:</label>
                <select 
                  name="status" 
                  value={newMaintenance.status} 
                  onChange={handleMaintenanceChange}
                >
                  <option value="scheduled">ตารางงาน</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="completed">เสร็จสิ้น</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddMaintenanceModal(false);
                    setSelectedEquipment(null);
                  }}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="submit-btn">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentManagement;