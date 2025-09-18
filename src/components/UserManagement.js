import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService, villageService, meterService } from '../services/api';
import Select from 'react-select';


function UserManagement({ user, currentVillage }) {
  const [users, setUsers] = useState([]); // เก็บข้อมูลผู้ใช้ทั้งหมดที่ดึงมาครั้งแรก
  const [filteredUsers, setFilteredUsers] = useState([]); // เก็บข้อมูลผู้ใช้ที่ถูกกรองและแสดงผล
  const [villages, setVillages] = useState([]);
  const [meters, setMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // สถานะสำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zones, setZones] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setselectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newUser, setnewUser] = useState({
    username: '',
    name: '',
    role_name: 'village_admin',
    email: '',
    zoneIds: [],
    zone: '',
    phone: '',
    password: '',
    confirmPassword: '',
    meterId: '',
    villageId: currentVillage ? currentVillage.village_id : ''
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await meterService.getZones(currentVillage.village_id);
        if (response.data && response.data.data) {
          setZones(response.data.data);
        } else {
          setZones([]);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
        setZones([]);
      }
    };

    fetchZones();
  }, []);
  // ดึงข้อมูลผู้ใช้ทั้งหมดเมื่อโหลดคอมโพเนนต์ครั้งแรก
  // และจะเรียกใช้เมื่อ user หรือ currentVillage เปลี่ยนแปลงเท่านั้น
  useEffect(() => {


    fetchAllUsers();
  }, [user, currentVillage]); // Dependency array: เรียกใช้เมื่อ user หรือ currentVillage เปลี่ยน
  const fetchAllUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let response;


      if (user.role_name === 'village_admin' && currentVillage) {
        // ถ้าเป็นผู้ดูแลหมู่บ้าน ให้ดึงเฉพาะผู้ใช้ในหมู่บ้านที่ดูแล
        response = await userService.getUsers(currentVillage.village_id); // ไม่ส่ง searchTerm, roleFilter, statusFilter ไป API

        console.log('Fetched users for village admin:', response.data);
      } else if (user.role_name === 'admin') {
        // ถ้าเป็น admin ให้ดึงผู้ใช้ทั้งหมด
        response = await userService.getAllUsers(); // ไม่ส่ง searchTerm, roleFilter, statusFilter ไป API
        //console.log('Fetched users:', response.data);
      } else {
        // กรณีอื่นๆ หรือไม่มีข้อมูลที่จำเป็น
        setUsers([]);
        setFilteredUsers([]);
        setIsLoading(false);
        return;
      }
      console.log('Fetched users:', response.data);
      if (response.data && response.data.data) {
        setUsers(response.data.data);
        setFilteredUsers(response.data.data); // กำหนดให้ filteredUsers เป็นข้อมูลทั้งหมดในตอนแรก
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    } finally {
      setIsLoading(false);
    }
  };
  // ดึงข้อมูลหมู่บ้าน
  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await villageService.getVillages();

        if (response.data && response.data.data) {
          setVillages(response.data.data);
        } else {
          setVillages([]);
        }
      } catch (error) {
        console.error('Error fetching villages:', error);
      }
    };

    fetchVillages();
  }, []);

  // ดึงข้อมูลมิเตอร์ตามหมู่บ้านที่เลือก (สำหรับการเพิ่ม/แก้ไขผู้ใช้)
  useEffect(() => {
    const fetchMeters = async () => {
      // ตรวจสอบว่ามีการเลือกหมู่บ้านใน newUser หรือ selectedUser หรือไม่
      const targetVillageId = showAddUserModal ? newUser.villageId : (showEditUserModal && selectedUser ? selectedUser.villageId : null);

      if (!targetVillageId) {
        setMeters([]); // ล้างมิเตอร์ถ้าไม่มีหมู่บ้านถูกเลือก
        return;
      }

      try {
        const response = await meterService.getMeters(parseInt(targetVillageId));

        if (response.data && response.data.data) {
          setMeters(response.data.data);
        } else {
          setMeters([]);
        }
      } catch (error) {
        console.error('Error fetching meters:', error);
      }
    };

    fetchMeters();
  }, [newUser.villageId, selectedUser?.villageId, showAddUserModal, showEditUserModal]); // เพิ่ม showAddUserModal, showEditUserModal ใน dependency array

  // ฟังก์ชันสำหรับการกรองข้อมูลที่ Frontend
  useEffect(() => {
    let tempUsers = [...users]; // เริ่มต้นด้วยข้อมูลผู้ใช้ทั้งหมด

    // กรองตาม searchTerm
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      tempUsers = tempUsers.filter(u =>
        u.username.toLowerCase().includes(lowerCaseSearchTerm) ||
        u.full_name.toLowerCase().includes(lowerCaseSearchTerm) ||
        u.email.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // กรองตาม roleFilter
    if (roleFilter !== 'all') {
      tempUsers = tempUsers.filter(u => u.role_name === roleFilter);
    }

    // กรองตาม statusFilter
    if (statusFilter !== 'all') {
      tempUsers = tempUsers.filter(u =>
        statusFilter === 'active' ? u.is_active : !u.is_active
      );
    }

    setFilteredUsers(tempUsers); // อัปเดตข้อมูลที่แสดงผล
  }, [users, searchTerm, roleFilter, statusFilter]); // Dependencies: กรองใหม่เมื่อข้อมูลผู้ใช้, searchTerm, roleFilter หรือ statusFilter เปลี่ยน

  // ฟังก์ชันสำหรับการค้นหา (ตอนนี้แค่ป้องกันการ submit ฟอร์ม)
  const handleSearch = (e) => {
    e.preventDefault();
    // การกรองเกิดขึ้นใน useEffect ด้านบนแล้ว
  };

  // เมื่อเปลี่ยนข้อความค้นหา
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // เมื่อเปลี่ยนตัวกรองบทบาท
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  // เมื่อเปลี่ยนตัวกรองสถานะ
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlenewUserChange = (e) => {
    const { name, value } = e.target;
    setnewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUserChange = (e) => {
    console.log('handleEditUserChange called with:', e.target.name, e.target.value);
    const { name, value } = e.target;
    setselectedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // ตรวจสอบรหัสผ่าน
    if (newUser.password !== newUser.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSaving(true);

    try {
      // สร้างข้อมูลผู้ใช้ใหม่สำหรับส่งไป API
      const userData = {
        username: newUser.username,
        full_name: newUser.name,
        role: newUser.role_name,
        email: newUser.email,
        phone_number: newUser.phone,
        password: newUser.password,
        village_id: newUser.villageId ? parseInt(newUser.villageId) : null,
        meter_id: newUser.meterId ? parseInt(newUser.meterId) : null,
        zone_ids: newUser.zoneIds || [],

      };

      // เรียก API เพื่อเพิ่มผู้ใช้
      const response = await userService.createUser(userData);

      if (response.data && response.data.success) {
        // เพิ่มผู้ใช้ใหม่เข้าไปในรายการหลัก (users)
        const newUserData = response.data.data;
        setUsers(prev => [...prev, newUserData]); // อัปเดต users state

        // รีเซ็ตฟอร์มและปิดโมดัล
        setnewUser({
          username: '',
          name: '',
          role_name: 'village_admin',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          meterId: '',
          villageId: currentVillage ? currentVillage.village_id : ''
        });
        setShowAddUserModal(false);
        fetchAllUsers();
        alert('เพิ่มผู้ใช้สำเร็จแล้ว');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`เกิดข้อผิดพลาดในการเพิ่มผู้ใช้: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    // ตรวจสอบรหัสผ่านถ้ามีการเปลี่ยนแปลง
    if (selectedUser.password && selectedUser.password !== selectedUser.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }
    console.log('Updating user:', selectedUser);
    setIsSaving(true);

    try {
      // สร้างข้อมูลสำหรับอัพเดท
      const userData = {
        full_name: selectedUser.name, // ใช้ name จาก selectedUser state
        role: selectedUser.role_name,
        email: selectedUser.email,
        phone_number: selectedUser.phone, // ใช้ phone จาก selectedUser state
        village_id: selectedUser.villageId ? parseInt(selectedUser.villageId) : null,
        meter_id: selectedUser.meterId ? parseInt(selectedUser.meterId) : null,
        zone_id: selectedUser.zone_id ? parseInt(selectedUser.zone_id) : null, // เพิ่ม zone_id ถ้ามี
        zone_ids: selectedUser.zoneIds || [],
      };

      // เพิ่มรหัสผ่านถ้ามีการกรอก
      if (selectedUser.password) {
        userData.password = selectedUser.password;
      }

      // เรียก API เพื่ออัพเดทผู้ใช้
      const response = await userService.updateUser(selectedUser.user_id, userData);

      if (response.data && response.data.success) {
        // อัพเดทผู้ใช้ในรายการหลัก (users)
        const updatedUserResponse = response.data.data; // ข้อมูลผู้ใช้ที่อัพเดตแล้วจาก API
        setUsers(prev => prev.map(userItem => {
          if (userItem.user_id === selectedUser.user_id) {
            // อัปเดตข้อมูลผู้ใช้ใน state ด้วยข้อมูลที่ได้จากการตอบกลับของ API
            return {
              ...userItem,
              ...updatedUserResponse, // ใช้ข้อมูลที่อัพเดตจริงจาก API
              // ตรวจสอบให้แน่ใจว่า field ที่จำเป็นถูก map ถูกต้อง
              full_name: updatedUserResponse.full_name || updatedUserResponse.name,
              phone_number: updatedUserResponse.phone_number || updatedUserResponse.phone,
              village_id: updatedUserResponse.village_id,
              meter_id: updatedUserResponse.meter_id,
              // role_name อาจต้องดึงจาก updatedUserResponse หรือ selectedUser.role_name
              role_name: updatedUserResponse.role_name || selectedUser.role_name
            };
          }
          return userItem;
        }));

        setShowEditUserModal(false);
        setselectedUser(null);

        alert('อัพเดทผู้ใช้สำเร็จแล้ว');
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`เกิดข้อผิดพลาดในการอัพเดทผู้ใช้: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleZoneCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setnewUser(prev => ({
      ...prev,
      zoneIds: checked
        ? [...(prev.zoneIds || []), value]
        : (prev.zoneIds || []).filter(id => id !== value)
    }));
  };

  const handleEditZoneCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setselectedUser(prev => ({
      ...prev,
      zoneIds: checked
        ? [...(prev.zoneIds || []), value]
        : (prev.zoneIds || []).filter(id => id !== value)
    }));
  };
  const handleEditUser = (userToEdit) => {
    console.log('Editing user:', userToEdit);
    setselectedUser({
      ...userToEdit,
      name: userToEdit.full_name,
      phone: userToEdit.phone_number,
      villageId: userToEdit.village_id,
      meterId: userToEdit.meter_id,
      // ถ้า backend ส่ง zone_ids เป็น array อยู่แล้ว ใช้ได้เลย
      zoneIds: userToEdit.zone_ids ? userToEdit.zone_ids.map(String) : [],
      password: '',
      confirmPassword: ''
    });
    setShowEditUserModal(true);
  };

  const toggleUserStatus = async (id) => {
    const userToToggle = users.find(userItem => userItem.user_id === id);

    if (!userToToggle) return;

    const newStatus = !userToToggle.is_active; // สลับสถานะ

    const confirmationMessage = newStatus
      ? `คุณต้องการเปิดใช้งานผู้ใช้ "${userToToggle.username}" ใช่หรือไม่?`
      : `คุณต้องการระงับการใช้งานผู้ใช้ "${userToToggle.username}" ใช่หรือไม่?`;

    if (window.confirm(confirmationMessage)) {
      try {
        // เรียก API เพื่อเปลี่ยนสถานะผู้ใช้
        const response = await userService.deleteUser(id, newStatus);

        if (response.data && response.data.success) {
          // อัพเดทสถานะผู้ใช้ในรายการหลัก (users)
          fetchAllUsers();

          alert(`${newStatus ? 'ลบ' : 'ลบ'}ผู้ใช้สำเร็จแล้ว`);
        } else {
          alert(`เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้: ${response.data?.message || 'ไม่ทราบข้อผิดพลาด'}`);
        }
      } catch (error) {
        console.error('Error toggling user status:', error);
        alert(`เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'village_admin': return 'ผู้ดูแลหมู่บ้าน';
      case 'meter': return 'เจ้าหน้าที่จดมิเตอร์';
      //case 'technician': return 'ช่างเทคนิค';
      //case 'resident': return 'ผู้อยู่อาศัย'; // เพิ่มบทบาท resident
      default: return role;
    }
  };

  // แสดงข้อความกำลังโหลด
  if (isLoading && users.length === 0) {
    return <div className="loading-container">กำลังโหลดข้อมูล...</div>;
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="user-management-container">
      <header className="page-header">
        <div className="header-content">
          <Link to="/" className="back-link">← กลับไปหน้าหลัก</Link>
          <h1>จัดการผู้ใช้งาน</h1>
        </div>
        <button
          className="add-user-btn"
          onClick={() => setShowAddUserModal(true)}
        >
          + เพิ่มผู้ใช้งาน
        </button>
      </header>

      <div className="user-filters">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="ค้นหาตามชื่อหรืออีเมล"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="submit" className="search-btn">ค้นหา</button>
        </form>

        <div className="filter-group">
          <label>บทบาท:</label>
          <select value={roleFilter} onChange={handleRoleFilterChange}>
            <option value="all">ทั้งหมด</option>
            {user.role_name === 'admin' && ( // Admin สามารถกรองบทบาท admin ได้
              <option value="admin">ผู้ดูแลระบบ</option>
            )}
            <option value="village_admin">ผู้ดูแลหมู่บ้าน</option>
            <option value="meter">เจ้าหน้าที่จดมิเตอร์</option>
            {/* เพิ่มผู้อยู่อาศัยใน filter} <option value="technician">ช่างเทคนิค</option>{ */}
            {/* เพิ่มผู้อยู่อาศัยใน filter  <option value="resident">ผู้อยู่อาศัย</option> {/* เพิ่มผู้อยู่อาศัยใน filter */}
          </select>
        </div>


      </div>

      <div className="users-list">
        {isLoading && users.length > 0 && <div className="loading-overlay">กำลังโหลดข้อมูล...</div>}

        <table className="users-table">
          <thead>
            <tr>
              <th>ชื่อผู้ใช้</th>
              <th>ชื่อ-นามสกุล</th>
              <th>บทบาท</th>
              <th>อีเมล</th>
              <th>เบอร์โทรศัพท์</th>
              <th>เข้าสู่ระบบล่าสุด</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? ( // ใช้ filteredUsers สำหรับแสดงผล
              <tr>
                <td colSpan="8" className="no-data">ไม่พบข้อมูลผู้ใช้</td>
              </tr>
            ) : (
              filteredUsers.map(userItem => ( // ใช้ filteredUsers สำหรับ map
                <tr key={userItem.user_id} className={!userItem.is_active ? 'inactive-row' : ''}>
                  <td>{userItem.username}</td>
                  <td>{userItem.full_name}</td>
                  <td>{getRoleName(userItem.role_name)}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.phone_number}</td>
                  <td>{userItem.last_login ? new Date(userItem.last_login).toLocaleString('th-TH') : '-'}</td>
                  <td>
                    <span className={`status-badge ${userItem.is_active ? 'status-active' : 'status-inactive'}`}>
                      {userItem.is_active ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditUser(userItem)} // ส่ง userItem ที่ถูกต้อง
                    >
                      แก้ไข
                    </button>
                    <button
                      className={`action-btn ${userItem.is_active ? 'deactivate-btn' : 'activate-btn'}`}
                      onClick={() => toggleUserStatus(userItem.user_id)}
                    >
                      {userItem.is_active ? 'ลบ' : 'ลบ'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่มผู้ใช้ */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>เพิ่มผู้ใช้งาน</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddUserModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddUser}>


              <div className="form-group">
                <label>ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handlenewUserChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>บทบาท:</label>
                <select
                  name="role_name"
                  value={newUser.role_name}
                  onChange={handlenewUserChange}
                >
                  {user.role_name === 'admin' && (
                    <option value="admin">ผู้ดูแลระบบ</option>
                  )}
                  <option value="village_admin">ผู้ดูแลหมู่บ้าน</option>
                  <option value="meter">เจ้าหน้าที่จดมิเตอร์</option>
                  {/* เพิ่มผู้อยู่อาศัยใน filter} <option value="technician">ช่างเทคนิค</option>{ */}
                  {/* เพิ่มผู้อยู่อาศัยใน filter  <option value="resident">ผู้อยู่อาศัย</option> {/* เพิ่มผู้อยู่อาศัยใน filter */}
                </select>
              </div>

              {
                (newUser.role_name === 'village_admin' || newUser.role_name === 'meter' || newUser.role_name === 'resident' || newUser.role_name === 'technician') && (
                  <div className="form-group">
                    <label>หมู่บ้าน:</label>
                    {user.role_name === 'admin' ? (
                      <select
                        name="villageId"
                        value={newUser.villageId}
                        onChange={handlenewUserChange}
                        required
                      >
                        <option value="">-- เลือกหมู่บ้าน --</option>
                        {villages.map(village => (
                          <option key={village.village_id} value={village.village_id}>
                            {village.village_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="village-display">
                        {currentVillage ? (
                          <>
                            <input
                              type="hidden"
                              name="villageId"
                              value={currentVillage.village_id}
                            />
                            <span className="readonly-field">{currentVillage.village_name}</span>
                          </>
                        ) : (
                          <span className="error-text">ไม่พบข้อมูลหมู่บ้านของคุณ</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              {newUser.role_name === 'meter' && (
                <div className="form-group">
                  <label>โซน:</label>
                  <Select
                    isMulti
                    name="zoneIds"
                    options={zones.map(zone => ({
                      value: String(zone.zone_id),
                      label: zone.zone_name
                    }))}
                    value={zones
                      .filter(zone => newUser.zoneIds?.includes(String(zone.zone_id)))
                      .map(zone => ({
                        value: String(zone.zone_id),
                        label: zone.zone_name
                      }))
                    }
                    onChange={selected =>
                      setnewUser(prev => ({
                        ...prev,
                        zoneIds: selected ? selected.map(opt => opt.value) : []
                      }))
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="เลือกโซน"
                  />
                </div>
              )}
              {newUser.role_name === 'resident' && (
                <div className="form-group">
                  <label>เลขมิเตอร์:</label>
                  <select
                    name="meterId"
                    value={newUser.meterId}
                    onChange={handlenewUserChange}
                    required
                  >
                    <option value="">-- เลือกมิเตอร์ --</option>
                    {meters.map(meter => (
                      <option key={meter.meter_id} value={meter.meter_id}>
                        {meter.meter_number} - {meter.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>อีเมล:</label>
                  <input
                    type="email"
                    name="email"
                     placeholder='อีเมลสำหรับแจ้งเตือนรหัสผ่าน'
                    value={newUser.email}
                    onChange={handlenewUserChange}
                  />
                </div>

                <div className="form-group">
                  <label>เบอร์โทรศัพท์:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newUser.phone}
                    onChange={handlenewUserChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>ชื่อผู้ใช้:</label>
                <input
                  type="text"
                  placeholder='username สำหรับเข้าสู่ระบบ'
                  name="username"
                  value={newUser.username}
                  onChange={handlenewUserChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>รหัสผ่าน:</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handlenewUserChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ยืนยันรหัสผ่าน:</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={newUser.confirmPassword}
                    onChange={handlenewUserChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={isSaving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'กำลังบันทึก...' : 'เพิ่มผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขผู้ใช้ */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>แก้ไขผู้ใช้งาน</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditUserModal(false);
                  setselectedUser(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>


              <div className="form-group">
                <label>ชื่อ-นามสกุล:</label>
                <input
                  type="text"
                  name="name"
                  value={selectedUser.name || ''} // ใช้ selectedUser.name
                  onChange={handleEditUserChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>บทบาท:</label>
                <select
                  name="role_name"
                  value={selectedUser.role_name || ''}
                  onChange={handleEditUserChange}
                >
                  {user.role_name === 'admin' && (
                    <option value="admin">ผู้ดูแลระบบ</option>
                  )}
                  <option value="village_admin">ผู้ดูแลหมู่บ้าน</option>
                  <option value="meter">เจ้าหน้าที่จดมิเตอร์</option>
                  {/* เพิ่มผู้อยู่อาศัยใน filter} <option value="technician">ช่างเทคนิค</option>{ */}
                  {/* เพิ่มผู้อยู่อาศัยใน filter  <option value="resident">ผู้อยู่อาศัย</option> {/* เพิ่มผู้อยู่อาศัยใน filter */}
                </select>
              </div>

              {
                (selectedUser.role_name === 'village_admin' || selectedUser.role_name === 'meter' || selectedUser.role_name === 'resident' || selectedUser.role_name === 'technician') && (
                  <div className="form-group">
                    <label>หมู่บ้าน:</label>
                    {user.role_name === 'admin' ? (

                      <select
                        name="villageId"
                        value={selectedUser.villageId || ''} // ใช้ selectedUser.villageId
                        onChange={handleEditUserChange}
                        required
                      >

                        <option value="">-- เลือกหมู่บ้าน --</option>
                        {villages.map(village => (
                          <option key={village.village_id} value={village.village_id}>
                            {village.village_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="village-display">
                        {currentVillage ? (
                          <>
                            <input
                              type="hidden"
                              name="villageId"
                              value={currentVillage.village_id}
                            />
                            <span className="readonly-field">{currentVillage.village_name}</span>
                          </>
                        ) : (
                          <span className="error-text">ไม่พบข้อมูลหมู่บ้านของคุณ</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              }


              {selectedUser?.role_name === 'meter' && (
                <div className="form-group">
                  <label>โซน:</label>
                  <Select
                    isMulti
                    name="zoneIds"
                    options={zones.map(zone => ({
                      value: String(zone.zone_id),
                      label: zone.zone_name
                    }))}
                    value={zones
                      .filter(zone => selectedUser.zoneIds?.includes(String(zone.zone_id)))
                      .map(zone => ({
                        value: String(zone.zone_id),
                        label: zone.zone_name
                      }))
                    }
                    onChange={selected =>
                      setselectedUser(prev => ({
                        ...prev,
                        zoneIds: selected ? selected.map(opt => opt.value) : []
                      }))
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="เลือกโซน"

                  />
                </div>
              )}
              {selectedUser.role_name === 'resident' && (
                <div className="form-group">
                  <label>เลขมิเตอร์:</label>
                  <select
                    name="meterId"
                    value={selectedUser.meterId || ''} // ใช้ selectedUser.meterId
                    onChange={handleEditUserChange}
                    required
                  >
                    <option value="">-- เลือกมิเตอร์ --</option>
                    {meters.map(meter => (
                      <option key={meter.meter_id} value={meter.meter_id}>
                        {meter.meter_number} - {meter.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>อีเมล:</label>
                  <input
                    type="email"
                    name="email"
                    value={selectedUser.email || ''}
                    onChange={handleEditUserChange}
                  />
                </div>

                <div className="form-group">
                  <label>เบอร์โทรศัพท์:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={selectedUser.phone || ''} // ใช้ selectedUser.phone
                    onChange={handleEditUserChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>ชื่อผู้ใช้:</label>
                <input
                  type="text"
                  name="username"
                  value={selectedUser.username}
                  disabled // ไม่อนุญาตให้แก้ไขชื่อผู้ใช้
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>รหัสผ่านใหม่: (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</label>
                  <input
                    type="password"
                    name="password"
                    value={selectedUser.password || ''}
                    onChange={handleEditUserChange}
                  />
                </div>

                <div className="form-group">
                  <label>ยืนยันรหัสผ่านใหม่:</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={selectedUser.confirmPassword || ''}
                    onChange={handleEditUserChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setselectedUser(null);
                  }}
                  disabled={isSaving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default UserManagement;