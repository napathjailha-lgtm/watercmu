// src/components/ZoneManagement.js
import React, { useState, useEffect } from 'react';
import { meterService } from '../services/api';

function ZoneManagement({ user, currentVillage }) {
  const [zones, setZones] = useState([]);
  const [meters, setMeters] = useState([]); // สำหรับตรวจสอบการใช้งาน zone
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    zone_name: '',
    zone_description: '',
    is_active: true
  });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    console.log("Current Village in ZoneManagement:", currentVillage);
    if (currentVillage && currentVillage.village_id) {
      fetchZones();
      fetchMeters(); // ดึงข้อมูลมิเตอร์เพื่อตรวจสอบการใช้งาน
    }
  }, [currentVillage, currentVillage?.village_id]);

  // แสดงข้อความแจ้งเตือน
  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(message);
      setSuccess('');
    }
  };

  // ดึงข้อมูล zones
  const fetchZones = async () => {
    if (!currentVillage || !currentVillage.village_id) {
      console.log("No village selected or village has no ID");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching zones for village ID:", currentVillage.village_id);
      
      // ตรวจสอบว่า meterService มีฟังก์ชัน getZones หรือไม่
      if (typeof meterService.getAllZones !== 'function') {
        console.warn("meterService.getZones is not implemented yet");
        showMessage('ระบบจัดการโซนยังไม่พร้อมใช้งาน', 'error');
        setZones([]);
        return;
      }

      const response = await meterService.getAllZones(currentVillage.village_id);
      console.log("Zones API response:", response);
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // แสดงทั้ง active และ inactive zones
          setZones(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setZones(response.data.data);
        } else {
          console.error('Unexpected zones data format:', response.data);
          setZones([]);
        }
      } else {
        console.error('No zones data in response');
        setZones([]);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
      showMessage(err.message || 'ไม่สามารถดึงข้อมูลโซนได้', 'error');
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลมิเตอร์เพื่อตรวจสอบการใช้งาน zone
  const fetchMeters = async () => {
    if (!currentVillage || !currentVillage.village_id) return;
    
    try {
      const response = await meterService.getMeters(currentVillage.village_id);
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          setMeters(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setMeters(response.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching meters for zone usage check:', err);
      setMeters([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const resetForm = () => {
    setFormData({
      zone_name: '',
      zone_description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const zoneData = {
        ...formData,
        village_id: currentVillage.village_id
      };
      
      if (editingId) {
        // อัปเดตโซนที่มีอยู่
        console.log("Updating zone with ID:", editingId, "Data:", zoneData);
        await meterService.updateZone(editingId, zoneData);
        showMessage('อัปเดตข้อมูลโซนเรียบร้อยแล้ว', 'success');
      } else {
        // สร้างโซนใหม่
        console.log("Creating new zone. Data:", zoneData);
        await meterService.createZone(zoneData);
        showMessage('เพิ่มโซนใหม่เรียบร้อยแล้ว', 'success');
      }
      
      // รีเซ็ตฟอร์มและดึงข้อมูลใหม่
      resetForm();
      await fetchZones();
      
    } catch (err) {
      console.error('Error saving zone:', err);
      showMessage(err.message || 'ไม่สามารถบันทึกข้อมูลโซนได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone) => {
    console.log("Editing zone:", zone);
    
    setFormData({
      zone_name: zone.zone_name || '',
      zone_description: zone.zone_description || '',
      is_active: zone.is_active !== undefined ? zone.is_active : true
    });
    
    setEditingId(zone.zone_id);
    
    // เลื่อนไปที่ form
    document.querySelector('.form-container')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const handleDelete = async (zoneId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log("Deleting zone with ID:", zoneId);
      await meterService.deleteZone(zoneId);
      showMessage('ลบโซนเรียบร้อยแล้ว', 'success');
      setDeleteConfirm(null);
      await fetchZones();
      await fetchMeters(); // รีเฟรชข้อมูลมิเตอร์
    } catch (err) {
      console.error('Error deleting zone:', err);
      showMessage(err.message || 'ไม่สามารถลบโซนได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบว่า zone มีการใช้งานหรือไม่
  const getZoneUsage = (zoneId) => {
    const metersInZone = meters.filter(meter => 
      meter.zone_id === zoneId && meter.is_active === true
    );
    return metersInZone.length;
  };

  // ฟอร์แมตวันที่สำหรับแสดงผล
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  if (!currentVillage) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          กรุณาเลือกหมู่บ้านก่อนเพื่อจัดการโซน
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">จัดการโซน - {currentVillage.village_name}</h1>
      
      {/* แสดงข้อความสำเร็จ */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button 
              onClick={() => setSuccess('')}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* แสดงข้อความผิดพลาด */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* ฟอร์มเพิ่ม/แก้ไขโซน */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 form-container">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'แก้ไขข้อมูลโซน' : 'เพิ่มโซนใหม่'}
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zone_name">
              ชื่อโซน <span className="text-red-500">*</span>
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="zone_name"
              name="zone_name"
              type="text"
              placeholder="เช่น โซน A, โซนเหนือ, ย่านที่ 1"
              value={formData.zone_name}
              onChange={handleInputChange}
              required
              disabled={loading}
              maxLength={50}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zone_description">
              คำอธิบายโซน
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="zone_description"
              name="zone_description"
              rows="3"
              placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับโซนนี้ (ไม่บังคับ)"
              value={formData.zone_description}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              สถานะการใช้งาน
            </label>
            <div className="flex items-center">
              <input
                className="mr-2 leading-tight"
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
                disabled={loading}
              />
              <label className="text-sm" htmlFor="is_active">
                เปิดใช้งานโซนนี้
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              โซนที่ปิดใช้งานจะไม่แสดงในตัวเลือกเมื่อเพิ่มมิเตอร์ใหม่
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                disabled={loading}
              >
                ยกเลิก
              </button>
            )}
            
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : editingId ? 'อัปเดต' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
      
      {/* ตารางแสดงรายการโซน */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">รายการโซนทั้งหมด</h2>
        
        {loading && !zones.length ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !zones.length ? (
          <div className="text-center py-8">
            <p className="text-gray-600">ไม่พบข้อมูลโซน</p>
            <p className="text-sm text-gray-500 mt-2">เพิ่มโซนใหม่เพื่อเริ่มต้นใช้งาน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">ชื่อโซน</th>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">คำอธิบาย</th>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">จำนวนมิเตอร์</th>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">วันที่สร้าง</th>
                  <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const meterCount = zone.meter_count || getZoneUsage(zone.zone_id);
                  console.log(`Zone ID: ${zone.zone_id}, Meter Count: ${meterCount}`);
                  const canDelete = meterCount == 0;
                  
                  return (
                    <tr key={zone.zone_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="font-medium">{zone.zone_name}</span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                          {zone.zone_description || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          meterCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {meterCount} มิเตอร์
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          zone.is_active === true ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {zone.is_active === true ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                          {formatDate(zone.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(zone)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                            disabled={loading}
                            title="แก้ไขข้อมูล"
                          >
                            แก้ไข
                          </button>
                          
                          <button
                            onClick={() => setDeleteConfirm(zone.zone_id)}
                            className={`font-bold py-1 px-3 rounded text-sm transition-colors ${
                              canDelete 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={loading || !canDelete}
                            title={canDelete ? 'ลบข้อมูล' : 'ไม่สามารถลบได้เนื่องจากมีมิเตอร์ในโซนนี้'}
                          >
                            ลบ
                          </button>
                        </div>
                        
                        {!canDelete && (
                          <p className="text-xs text-red-500 mt-1">
                            ไม่สามารถลบได้ (มีมิเตอร์ใช้งาน)
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ยืนยันการลบ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">ยืนยันการลบโซน</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  คุณแน่ใจหรือไม่ว่าต้องการลบโซนนี้? 
                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                  disabled={loading}
                >
                  {loading ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* สถิติรวม */}
      {zones.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 border border-blue-300 rounded px-4 py-3">
            <div className="text-blue-800 text-sm font-semibold">โซนทั้งหมด</div>
            <div className="text-blue-900 text-2xl font-bold">{zones.length}</div>
          </div>
          <div className="bg-green-100 border border-green-300 rounded px-4 py-3">
            <div className="text-green-800 text-sm font-semibold">โซนที่ใช้งาน</div>
            <div className="text-green-900 text-2xl font-bold">
              {zones.filter(z => z.is_active === true).length}
            </div>
          </div>
          <div className="bg-yellow-100 border border-yellow-300 rounded px-4 py-3">
            <div className="text-yellow-800 text-sm font-semibold">โซนที่มีมิเตอร์</div>
            <div className="text-yellow-900 text-2xl font-bold">
              {zones.filter(z => z.meter_count > 0).length}
            </div>
          </div>
          <div className="bg-purple-100 border border-purple-300 rounded px-4 py-3">
            <div className="text-purple-800 text-sm font-semibold">มิเตอร์ทั้งหมด</div>
            <div className="text-purple-900 text-2xl font-bold">
              {meters.filter(m => m.is_active === true).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZoneManagement;