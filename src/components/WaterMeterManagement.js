// src/components/WaterMeterManagement.js
import React, { useState, useEffect } from 'react';
import { meterService } from '../services/api';
import MeterQRCodeGenerator from './MeterQRCodeGenerator'; // Import the new component

function WaterMeterManagement({ user, currentVillage }) {
    const [meters, setMeters] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [meterNumberError, setMeterNumberError] = useState('');
    const [formData, setFormData] = useState({
        meter_number: '',
        location: '',
        zone_id: '',
        customer_name: '',
        customer_phone: '',
        installation_date: '',
        current_reading: '',
        is_active: true
    });
    const [editingId, setEditingId] = useState(null);
    const [showQrGenerator, setShowQrGenerator] = useState(false); // New state to control QR generator visibility

    useEffect(() => {
        console.log("Current Village in WaterMeterManagement:", currentVillage);
        if (currentVillage && currentVillage.village_id) {
            fetchMeters();
            fetchZones();
        }
    }, [currentVillage, currentVillage?.village_id]);

    const checkDuplicateMeterNumber = (meterNumber) => {
        if (!meterNumber.trim()) return false;

        const isDuplicate = meters.some(meter => {
            if (editingId && (meter.id === editingId || meter.meter_id === editingId)) {
                return false;
            }
            return meter.meter_number === meterNumber.trim();
        });

        return isDuplicate;
    };

    const fetchZones = async () => {
        if (!currentVillage || !currentVillage.village_id) {
            console.log("No village selected for zones");
            return;
        }

        setZonesLoading(true);

        try {
            console.log("Fetching zones for village ID:", currentVillage.village_id);
            const response = await meterService.getZones(currentVillage.village_id);
            console.log("Zones API response:", response);

            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    const activeZones = response.data.filter(zone => zone.is_active !== false);
                    setZones(activeZones);
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    const activeZones = response.data.data.filter(zone => zone.is_active !== false);
                    setZones(activeZones);
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
            setZones([]);
        } finally {
            setZonesLoading(false);
        }
    };

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

    const fetchMeters = async () => {
        if (!currentVillage || !currentVillage.village_id) {
            console.log("No village selected or village has no ID");
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log("Fetching meters for village ID:", currentVillage.village_id);
            const response = await meterService.getMeters(currentVillage.village_id);
            console.log("API response:", response);

            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    setMeters(response.data);
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    setMeters(response.data.data);
                } else {
                    console.error('Unexpected data format:', response.data);
                    setMeters([]);
                }
            } else {
                console.error('No data in response');
                setMeters([]);
            }
        } catch (err) {
            console.error('Error fetching meters:', err);
            showMessage(err.message || 'ไม่สามารถดึงข้อมูลมิเตอร์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
       
        if (name === 'meter_number') {
            const trimmedValue = value.trim();
            setMeterNumberError('');

            if (trimmedValue && checkDuplicateMeterNumber(trimmedValue)) {
                setMeterNumberError('เลขมิเตอร์นี้มีอยู่ในระบบแล้ว กรุณาใช้เลขอื่น');
            }
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetForm = () => {
        setFormData({
            meter_number: '',
            location: '',
            zone_id: '',
            customer_name: '',
            customer_phone: '',
            installation_date: '',
            current_reading: '',
            is_active: true
        });
        setEditingId(null);
        setMeterNumberError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.meter_number.trim()) {
            setMeterNumberError('กรุณาใส่เลขมิเตอร์');
            return;
        }

        if (checkDuplicateMeterNumber(formData.meter_number)) {
            setMeterNumberError('เลขมิเตอร์นี้มีอยู่ในระบบแล้ว กรุณาใช้เลขอื่น');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setMeterNumberError('');

        try {
            const meterData = {
                ...formData,
                meter_number: formData.meter_number.trim(),
                village_id: currentVillage.village_id
            };

            if (editingId) {
                console.log("Updating meter with ID:", editingId, "Data:", meterData);
                await meterService.updateMeter(editingId, meterData);
                showMessage('อัปเดตข้อมูลมิเตอร์เรียบร้อยแล้ว', 'success');
            } else {
                console.log("Creating new meter. Data:", meterData);
                await meterService.createMeter(meterData);
                showMessage('เพิ่มมิเตอร์ใหม่เรียบร้อยแล้ว', 'success');
            }

            resetForm();
            await fetchMeters();

        } catch (err) {
            console.error('Error saving meter:', err);
            showMessage(err.message || 'ไม่สามารถบันทึกข้อมูลมิเตอร์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (meter) => {
        console.log("Editing meter:", meter);

        setFormData({
            meter_number: meter.meter_number || '',
            location: meter.location || '',
            zone_id: meter.zone || '',
            customer_name: meter.customer_name || '',
            customer_phone: meter.customer_phone || '',
            installation_date: meter.installation_date ?
                new Date(meter.installation_date).toISOString().split('T')[0] :
                (meter.created_at ? new Date(meter.created_at).toISOString().split('T')[0] : ''),
            current_reading: meter.current_reading || meter.meter_read || '', // Use current_reading or meter_read
            is_active: meter.is_active !== undefined ? meter.is_active : true
        });

        setEditingId(meter.id || meter.meter_id);
        setMeterNumberError('');

        document.querySelector('.form-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบมิเตอร์นี้?')) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log("Deleting meter with ID:", id);
            await meterService.deleteMeter(id);
            showMessage('ลบมิเตอร์เรียบร้อยแล้ว', 'success');
            await fetchMeters();
        } catch (err) {
            console.error('Error deleting meter:', err);
            showMessage(err.message || 'ไม่สามารถลบมิเตอร์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

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

    const getZoneLabel = (zoneId) => {
        if (!zoneId) return 'ไม่ระบุโซน';

        const zone = zones.find(z => z.zone_id === parseInt(zoneId));
        return zone ? zone.zone_name : `โซน ID: ${zoneId}`;
    };

    const getZoneStats = () => {
        const zoneStats = {};
        meters.forEach(meter => {
            const zoneId = meter.zone_id;
            const zoneName = getZoneLabel(zoneId);

            if (!zoneStats[zoneName]) {
                zoneStats[zoneName] = { total: 0, active: 0, inactive: 0 };
            }
            zoneStats[zoneName].total++;
            if (meter.is_active === true) {
                zoneStats[zoneName].active++;
            } else {
                zoneStats[zoneName].inactive++;
            }
        });
        return zoneStats;
    };

    if (!currentVillage) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    กรุณาเลือกหมู่บ้านก่อนเพื่อจัดการผู้พักอาศัย
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">จัดการผู้พักอาศัย - {currentVillage.village_name}</h1>

            {/* Success and Error Messages */}
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

            {/* Form to Add/Edit Meter */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 form-container">
                <h2 className="text-xl font-semibold mb-4">
                    {editingId ? 'แก้ไขข้อมูลมิเตอร์' : 'เพิ่มมิเตอร์ใหม่'}
                </h2>

                {!editingId && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>สำคัญ:</strong> กรุณาใส่เลขมิเตอร์ (Serial Number) และเลขมิเตอร์เริ่มต้น (Start Reading) ให้ถูกต้องครั้งแรก เนื่องจากข้อมูลเหล่านี้จะใช้ในการจัดการลูกบ้านและการคำนวณค่าน้ำ
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="mb-4 md:col-span-2 lg:col-span-1">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="meter_number">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                เลขมิเตอร์ <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                                meterNumberError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            id="meter_number"
                            name="meter_number"
                            type="text"
                            placeholder="เลขมิเตอร์ (ตัวอย่าง: M001, 123456)"
                            value={formData.meter_number}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            autoComplete="off"
                        />
                        {meterNumberError && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {meterNumberError}
                            </p>
                        )}
                        {!meterNumberError && formData.meter_number && !editingId && (
                            <p className="text-green-500 text-xs mt-1 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                เลขมิเตอร์สามารถใช้ได้
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                            ที่อยู่/ตำแหน่ง <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="location"
                            name="location"
                            type="text"
                            placeholder="บ้านเลขที่ หรือตำแหน่งติดตั้ง"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            autoComplete="off"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zone_id">
                            โซน <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="zone_id"
                            name="zone_id"
                            value={formData.zone_id}
                            onChange={handleInputChange}
                            required
                            disabled={loading || zonesLoading}
                        >
                            <option value="">
                                {zonesLoading ? "กำลังโหลดโซน..." : "-- เลือกโซน --"}
                            </option>
                            {zones.map(zone => (
                                <option key={zone.zone_id} value={zone.zone_id}>
                                    {zone.zone_name}
                                    {zone.zone_description && ` - ${zone.zone_description}`}
                                </option>
                            ))}
                            {zones.length === 0 && !zonesLoading && (
                                <option value="" disabled>ไม่พบข้อมูลโซน</option>
                            )}
                        </select>
                        {zones.length === 0 && !zonesLoading && (
                            <p className="text-xs text-gray-500 mt-1">
                                กรุณาเพิ่มข้อมูลโซนในระบบก่อนเพื่อใช้งานฟีเจอร์นี้
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customer_name">
                            ชื่อผู้ใช้น้ำ <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="customer_name"
                            name="customer_name"
                            type="text"
                            placeholder="ชื่อผู้ใช้น้ำ"
                            value={formData.customer_name}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customer_phone">
                            เบอร์โทรศัพท์
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="customer_phone"
                            name="customer_phone"
                            type="text"
                            placeholder="เบอร์โทรศัพท์"
                            value={formData.customer_phone}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="installation_date">
                            วันที่ติดตั้ง
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="installation_date"
                            name="installation_date"
                            type="date"
                            value={formData.installation_date}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="current_reading">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                เลขมิเตอร์เริ่มต้น <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-yellow-50 border-yellow-300"
                            id="current_reading"
                            name="current_reading"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="เลขที่แสดงบนหน้าปัดมิเตอร์ (เช่น 123.45)"
                            value={formData.current_reading}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            **สำคัญ:** ใส่เลขที่แสดงบนหน้าปัดมิเตอร์ปัจจุบัน สำหรับคำนวณค่าน้ำ
                        </p>
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
                                ใช้งานได้
                            </label>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end space-x-2">
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
                            disabled={loading || !!meterNumberError}
                        >
                            {loading ? 'กำลังบันทึก...' : editingId ? 'อัปเดต' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Table displaying meter list */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h2 className="text-xl font-semibold mb-4">รายการมิเตอร์น้ำ</h2>

                {loading && !meters.length ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : !meters.length ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">ไม่พบข้อมูลมิเตอร์</p>
                        <p className="text-sm text-gray-500 mt-2">เพิ่มมิเตอร์ใหม่เพื่อเริ่มต้นใช้งาน</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">เลขมิเตอร์</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">ที่อยู่/ตำแหน่ง</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">โซน</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">ผู้ใช้น้ำ</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">เบอร์โทรศัพท์</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">เลขมิเตอร์เริ่มต้น</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">วันที่ติดตั้ง</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                                        <th className="py-3 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-700">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meters.map((meter) => (
                                        
                                        <tr key={meter.id || meter.meter_id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <span className="font-medium bg-blue-50 px-2 py-1 rounded text-blue-800">
                                                    {meter.meter_number}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">{meter.location || '-'}</td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                                    {meter.zone_name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">{meter.customer_name || '-'}</td>
                                            <td className="py-3 px-4 border-b border-gray-200">{meter.customer_phone || '-'}</td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <span className="bg-green-50 px-2 py-1 rounded text-green-800 font-medium">
                                                        {parseFloat(meter.meter_read || 0).toLocaleString()} หน่วย
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                {formatDate(meter.installation_date || meter.created_at)}
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    meter.is_active === true ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                    {meter.is_active === true ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(meter)}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                                                        disabled={loading}
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(meter.id || meter.meter_id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                                                        disabled={loading}
                                                        title="ลบข้อมูล"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Toggle button for QR Code Generator */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowQrGenerator(!showQrGenerator)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                                {showQrGenerator ? 'ซ่อน' : 'แสดง'} เครื่องสร้าง QR Code
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* QR Code Generator Section */}
            {showQrGenerator && meters.length > 0 && (
                <div className="mt-8">
                    <MeterQRCodeGenerator
                        meters={meters}
                        onGeneratePDF={() => showMessage('สร้างไฟล์ PDF QR Code เรียบร้อยแล้ว')}
                    />
                </div>
            )}

            {/* Total Statistics */}
            {meters.length > 0 && (
                <div className="mt-4 space-y-4">
                    {/* General Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-100 border border-blue-300 rounded px-4 py-3">
                            <div className="text-blue-800 text-sm font-semibold">มิเตอร์ทั้งหมด</div>
                            <div className="text-blue-900 text-2xl font-bold">{meters.length}</div>
                        </div>
                        <div className="bg-green-100 border border-green-300 rounded px-4 py-3">
                            <div className="text-green-800 text-sm font-semibold">ใช้งานได้</div>
                            <div className="text-green-900 text-2xl font-bold">
                                {meters.filter(m => m.is_active === true).length}
                            </div>
                        </div>
                        <div className="bg-red-100 border border-red-300 rounded px-4 py-3">
                            <div className="text-red-800 text-sm font-semibold">ไม่ใช้งาน</div>
                            <div className="text-red-900 text-2xl font-bold">
                                {meters.filter(m => m.is_active === false).length}
                            </div>
                        </div>
                    </div>

                    {/* Statistics by Zone */}
                    <div className="bg-white shadow-md rounded px-6 py-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">สถิติตามโซน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Object.entries(getZoneStats()).map(([zone, stats]) => (
                                <div key={zone} className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                    <div className="text-gray-700 text-sm font-semibold mb-1">
                                        {zone}
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">รวม: <span className="font-medium">{stats.total}</span></span>
                                        <span className="text-green-600">ใช้งาน: <span className="font-medium">{stats.active}</span></span>
                                        <span className="text-red-600">ไม่ใช้งาน: <span className="font-medium">{stats.inactive}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WaterMeterManagement;