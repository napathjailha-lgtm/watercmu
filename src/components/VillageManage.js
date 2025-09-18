import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
  Toolbar,
  TablePagination,
  Chip,
  Autocomplete,
  Grid,
  Divider
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import WaterIcon from '@mui/icons-material/Water';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

// สร้างเมนูของระบบ
const menuItems = [
  { text: 'หน้าหลัก', icon: <DashboardIcon />, path: '/' },
  { text: 'จัดการหมู่บ้าน', icon: <HomeIcon />, path: '/village-manage' },
  { text: 'จัดการผู้ใช้', icon: <PeopleIcon />, path: '/users' },
  { text: 'จัดการน้ำประปา', icon: <WaterIcon />, path: '/water-meters' },
  { text: 'ตั้งค่าระบบ', icon: <SettingsIcon />, path: '/settings' },
  { text: 'ออกจากระบบ', icon: <ExitToAppIcon />, path: '/logout' }
];

// กำหนดค่า API URL
const API_BASE_URL = 'https://api.abchomey.com/api';

// Hook สำหรับจัดการข้อมูลที่อยู่
const useAddressData = () => {
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [allAmphures, setAllAmphures] = useState([]);
  const [allTambons, setAllTambons] = useState([]);
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลจังหวัดเมื่อเริ่มต้น
  useEffect(() => {
    const loadAddressData = async () => {
      try {
        setLoading(true);
        
        // โหลดข้อมูลทั้งหมดพร้อมกัน
        const [provincesRes, amphuresRes, tambonsRes] = await Promise.all([
          fetch('/data/province.json'),
          fetch('/data/amphure.json'),
          fetch('/data/tambon.json')
        ]);

        if (provincesRes.ok) {
          const provincesData = await provincesRes.json();
          setProvinces(provincesData);
        }

        if (amphuresRes.ok) {
          const amphuresData = await amphuresRes.json();
          setAllAmphures(amphuresData);
        }

        if (tambonsRes.ok) {
          const tambonsData = await tambonsRes.json();
          setAllTambons(tambonsData);
        }
      } catch (error) {
        console.error('Error loading address data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAddressData();
  }, []);

  // ฟังก์ชันกรองอำเภอตามจังหวัดที่เลือก
  const loadAmphures = (provinceId) => {
    if (!provinceId) {
      setAmphures([]);
      return;
    }
    const filtered = allAmphures.filter(amphure => amphure.province_id === provinceId);
    setAmphures(filtered);
  };

  // ฟังก์ชันกรองตำบลตามอำเภอที่เลือก
  const loadTambons = (amphureId) => {
    if (!amphureId) {
      setTambons([]);
      return;
    }
    const filtered = allTambons.filter(tambon => tambon.amphure_id === amphureId);
    setTambons(filtered);
  };

  // ฟังก์ชันค้นหาข้อมูลที่อยู่จากรหัสไปรษณีย์
  const getAddressByPostalCode = (postalCode) => {
    if (!postalCode || postalCode.length !== 5) return null;

    const tambon = allTambons.find(t => t.zip_code === postalCode);
    if (!tambon) return null;

    const amphure = allAmphures.find(a => a.id === tambon.amphure_id);
    if (!amphure) return null;

    const province = provinces.find(p => p.id === amphure.province_id);
    if (!province) return null;

    return { province, amphure, tambon };
  };

  return {
    provinces,
    amphures,
    tambons,
    loading,
    loadAmphures,
    loadTambons,
    getAddressByPostalCode
  };
};

// Component สำหรับเลือกที่อยู่ด้วย Material-UI
const AddressSelector = ({ 
  value = {},
  onChange,
  disabled = false 
}) => {
  const {
    provinces,
    amphures,
    tambons,
    loading,
    loadAmphures,
    loadTambons,
    getAddressByPostalCode
  } = useAddressData();

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedAmphure, setSelectedAmphure] = useState(null);
  const [selectedTambon, setSelectedTambon] = useState(null);
  const [postalCode, setPostalCode] = useState('');

  // อัปเดต state เมื่อ value เปลี่ยน
  useEffect(() => {
    if (value.province) {
      const province = provinces.find(p => p.name_th === value.province);
      if (province) {
        setSelectedProvince(province);
        loadAmphures(province.id);
      }
    }
    if (value.district) {
      const amphure = amphures.find(a => a.name_th === value.district);
      if (amphure) {
        setSelectedAmphure(amphure);
        loadTambons(amphure.id);
      }
    }
    if (value.sub_district) {
      const tambon = tambons.find(t => t.name_th === value.sub_district);
      if (tambon) {
        setSelectedTambon(tambon);
      }
    }
    if (value.postal_code) {
      setPostalCode(value.postal_code);
    }
  }, [value, provinces, amphures, tambons]);

  // จัดการการเลือกจังหวัด
  const handleProvinceChange = (event, newValue) => {
    setSelectedProvince(newValue);
    setSelectedAmphure(null);
    setSelectedTambon(null);
    
    if (newValue) {
      loadAmphures(newValue.id);
      onChange({
        province: newValue.name_th,
        district: '',
        sub_district: '',
        postal_code: postalCode
      });
    } else {
      onChange({
        province: '',
        district: '',
        sub_district: '',
        postal_code: postalCode
      });
    }
  };

  // จัดการการเลือกอำเภอ
  const handleAmphureChange = (event, newValue) => {
    setSelectedAmphure(newValue);
    setSelectedTambon(null);
    
    if (newValue) {
      loadTambons(newValue.id);
      onChange({
        province: selectedProvince?.name_th || '',
        district: newValue.name_th,
        sub_district: '',
        postal_code: postalCode
      });
    } else {
      onChange({
        province: selectedProvince?.name_th || '',
        district: '',
        sub_district: '',
        postal_code: postalCode
      });
    }
  };

  // จัดการการเลือกตำบล
  const handleTambonChange = (event, newValue) => {
    setSelectedTambon(newValue);
    
    if (newValue) {
      setPostalCode(newValue.zip_code);
      onChange({
        province: selectedProvince?.name_th || '',
        district: selectedAmphure?.name_th || '',
        sub_district: newValue.name_th,
        postal_code: newValue.zip_code
      });
    } else {
      onChange({
        province: selectedProvince?.name_th || '',
        district: selectedAmphure?.name_th || '',
        sub_district: '',
        postal_code: postalCode
      });
    }
  };

  // จัดการการพิมพ์รหัสไปรษณีย์
  const handlePostalCodeChange = (event) => {
    const code = event.target.value;
    setPostalCode(code);
    
    if (code.length === 5) {
      const addressData = getAddressByPostalCode(code);
      if (addressData) {
        setSelectedProvince(addressData.province);
        setSelectedAmphure(addressData.amphure);
        setSelectedTambon(addressData.tambon);
        
        loadAmphures(addressData.province.id);
        loadTambons(addressData.amphure.id);
        
        onChange({
          province: addressData.province.name_th,
          district: addressData.amphure.name_th,
          sub_district: addressData.tambon.name_th,
          postal_code: code
        });
        return;
      }
    }
    
    onChange({
      province: selectedProvince?.name_th || '',
      district: selectedAmphure?.name_th || '',
      sub_district: selectedTambon?.name_th || '',
      postal_code: code
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">ข้อมูลที่อยู่</Typography>
      </Box>
      
   
       <Box sx={{ width: '100%' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sx={{ minWidth: '300px' }}>
            <Autocomplete
              value={selectedProvince}
              onChange={handleProvinceChange}
              options={provinces}
              getOptionLabel={(option) => option.name_th || ''}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              loading={loading}
              disabled={disabled}
              fullWidth
              sx={{ width: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="จังหวัด"
                  required
                  fullWidth
                  size="large"
                  sx={{ width: '100%', minWidth: '300px' }}
                  InputProps={{
                    ...params.InputProps,
                    sx: { height: 56, ...params.InputProps.sx },
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name_th}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name_en}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ minWidth: '300px' }}>
            <Autocomplete
              value={selectedAmphure}
              onChange={handleAmphureChange}
              options={amphures}
              getOptionLabel={(option) => option.name_th || ''}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              disabled={disabled || !selectedProvince}
              fullWidth
              sx={{ width: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="อำเภอ/เขต"
                  required
                  fullWidth
                  size="large"
                  sx={{ width: '100%', minWidth: '300px' }}
                  InputProps={{
                    ...params.InputProps,
                    sx: { height: 56, ...params.InputProps.sx }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name_th}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name_en}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ minWidth: '300px' }}>
            <Autocomplete
              value={selectedTambon}
              onChange={handleTambonChange}
              options={tambons}
              getOptionLabel={(option) => option.name_th || ''}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              disabled={disabled || !selectedAmphure}
              fullWidth
              sx={{ width: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ตำบล/แขวง"
                  required
                  fullWidth
                  size="large"
                  sx={{ width: '100%', minWidth: '300px' }}
                  InputProps={{
                    ...params.InputProps,
                    sx: { height: 56, ...params.InputProps.sx }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name_th}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name_en}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ minWidth: '300px' }}>
            <TextField
              label="รหัสไปรษณีย์"
              value={postalCode}
              onChange={handlePostalCodeChange}
              fullWidth
              required
              disabled={disabled}
              size="large"
              sx={{ width: '100%', minWidth: '300px' }}
              InputProps={{
                sx: { height: 56 }
              }}
              inputProps={{ maxLength: 5, pattern: '[0-9]{5}' }}
              helperText="5 หลัก หรือพิมพ์เพื่อค้นหาอัตโนมัติ"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const VillageManagement = () => {
  const [villages, setVillages] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVillage, setCurrentVillage] = useState({
    village_id: null,
    village_name: '',
    village_code: '',
    office_address: '',
    village_number: '',
    sub_district: '',
    district: '',
    province: '',
    postal_code: '',
    village_head: '',
    village_head_email: '',
    village_head_phone: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    default_rate_per_unit: 30,
    meter_rental_fee: 20,
    payment_due_date: '15',
    bank_name: '',
    account_number: '',
    collector_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // สร้าง Axios instance พร้อมกับ token
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });

  // โหลดข้อมูลหมู่บ้านเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchVillages();
  }, [page, rowsPerPage]);

  // ดึงข้อมูลหมู่บ้านจาก API
  const fetchVillages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // เรียกใช้ endpoint GET /villages
      const response = await api.get('/villages', {
        params: {
          page: page + 1, // API อาจใช้ 1-based pagination
          limit: rowsPerPage
        }
      });
      console.log(response)
      if (response.data && response.data.success) {
        // ปรับ format ข้อมูลให้ตรงกับโครงสร้างที่ต้องการ
        const formattedVillages = response.data.data.map(village => ({
          id: village.village_id,
          village_id: village.village_id,
          name: village.village_name,
          village_code: village.village_code || '',
          office_address: village.office_address || '',
          village_number: village.village_number || '',
          sub_district: village.sub_district || '',
          district: village.district || '',
          province: village.province || '',
          postal_code: village.postal_code || '',
          village_head: village.village_head || '',
          village_head_email: village.village_head_email || '',
          village_head_phone: village.village_head_phone || '',
          contact_person: village.contact_person || '',
          contact_email: village.contact_email || '',
          contact_phone: village.contact_phone || '',
          default_rate_per_unit: village.default_rate_per_unit || 30,
          meter_rental_fee: village.meter_rental_fee || 20,
          payment_due_date: village.payment_due_date || '15',
          bank_name: village.bank_name || '',
          account_number: village.account_number || '',
          collector_name: village.collector_name || '',
          // Stats from API
          total_residents: village.total_residents || 0,
          active_residents: village.active_residents || 0,
          total_zones: village.total_zones || 0,
          total_equipment: village.total_equipment || 0,
          zones: village.zones || [],
          created_at: village.created_at,
          updated_at: village.updated_at
        }));
        
        setVillages(formattedVillages);
        
        // ถ้ามีข้อมูลจำนวนทั้งหมด
        if (response.data.pagination) {
          setTotalCount(response.data.pagination.total || formattedVillages.length);
        } else {
          setTotalCount(formattedVillages.length);
        }
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถดึงข้อมูลหมู่บ้านได้');
      }
    } catch (err) {
      console.error('Error fetching villages:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมู่บ้าน');
      
      // แสดงข้อความแจ้งเตือน
      setNotification({
        open: true,
        message: `เกิดข้อผิดพลาด: ${err.response?.data?.message || err.message || 'ไม่สามารถดึงข้อมูลหมู่บ้านได้'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // การจัดการหน้า pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // เปิด/ปิด drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // เปิดกล่องเพิ่มหมู่บ้าน
  const handleOpenDialog = () => {
    setEditMode(false);
    setCurrentVillage({
      village_id: null,
      village_name: '',
      village_code: '',
      office_address: '',
      village_number: '',
      sub_district: '',
      district: '',
      province: '',
      postal_code: '',
      village_head: '',
      village_head_email: '',
      village_head_phone: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      default_rate_per_unit: 30,
      meter_rental_fee: 20,
      payment_due_date: '15',
      bank_name: '',
      account_number: '',
      collector_name: ''
    });
    setOpenDialog(true);
  };

  // เปิดกล่องแก้ไขหมู่บ้าน
  const handleEditVillage = (village) => {
    setEditMode(true);
    setCurrentVillage({
      village_id: village.village_id,
      village_name: village.name,
      village_code: village.village_code,
      office_address: village.office_address,
      village_number: village.village_number,
      sub_district: village.sub_district,
      district: village.district,
      province: village.province,
      postal_code: village.postal_code,
      village_head: village.village_head,
      village_head_email: village.village_head_email,
      village_head_phone: village.village_head_phone,
      contact_person: village.contact_person,
      contact_email: village.contact_email,
      contact_phone: village.contact_phone,
      default_rate_per_unit: village.default_rate_per_unit,
      meter_rental_fee: village.meter_rental_fee,
      payment_due_date: village.payment_due_date,
      bank_name: village.bank_name,
      account_number: village.account_number,
      collector_name: village.collector_name
    });
    setOpenDialog(true);
  };

  // ปิดกล่องเพิ่ม/แก้ไขหมู่บ้าน
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // ปิดการแจ้งเตือน
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // จัดการการเปลี่ยนแปลงข้อมูลที่อยู่
  const handleAddressChange = (addressData) => {
    setCurrentVillage({
      ...currentVillage,
      province: addressData.province || '',
      district: addressData.district || '',
      sub_district: addressData.sub_district || '',
      postal_code: addressData.postal_code || ''
    });
  };

  // บันทึกข้อมูลหมู่บ้าน
  const handleSaveVillage = async () => {
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!currentVillage.village_name.trim()) {
      setNotification({
        open: true,
        message: 'กรุณากรอกชื่อหมู่บ้าน',
        severity: 'warning'
      });
      return;
    }

    if (!currentVillage.village_code.trim()) {
      setNotification({
        open: true,
        message: 'กรุณากรอกรหัสหมู่บ้าน',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      // ข้อมูลที่จะส่งไปยัง API
      const villageData = {
        village_name: currentVillage.village_name,
        village_code: currentVillage.village_code,
        office_address: currentVillage.office_address,
        village_number: currentVillage.village_number,
        sub_district: currentVillage.sub_district,
        district: currentVillage.district,
        province: currentVillage.province,
        postal_code: currentVillage.postal_code,
        village_head: currentVillage.village_head,
        village_head_email: currentVillage.village_head_email,
        village_head_phone: currentVillage.village_head_phone,
        contact_person: currentVillage.contact_person,
        contact_email: currentVillage.contact_email,
        contact_phone: currentVillage.contact_phone,
        default_rate_per_unit: parseFloat(currentVillage.default_rate_per_unit) || 30,
        meter_rental_fee: parseFloat(currentVillage.meter_rental_fee) || 20,
        payment_due_date: currentVillage.payment_due_date,
        bank_name: currentVillage.bank_name,
        account_number: currentVillage.account_number,
        collector_name: currentVillage.collector_name
      };
      
      if (editMode) {
        // แก้ไขหมู่บ้าน - PUT /villages/:id
        response = await api.put(`/villages/${currentVillage.village_id}`, villageData);
      } else {
        // เพิ่มหมู่บ้านใหม่ - POST /villages
        response = await api.post('/villages', villageData);
      }
      
      if (response.data && response.data.success) {
        // โหลดข้อมูลหมู่บ้านใหม่
        fetchVillages();

        // Event bus ถ้ามี
        try {
          const { default: eventBus } = await import('../utils/eventBus');
          eventBus.dispatch('villages-updated', null);
        } catch (err) {
          console.log('EventBus not available');
        }
        
        // แสดงข้อความแจ้งเตือน
        setNotification({
          open: true,
          message: editMode ? 'แก้ไขหมู่บ้านเรียบร้อยแล้ว' : 'เพิ่มหมู่บ้านเรียบร้อยแล้ว',
          severity: 'success'
        });
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถบันทึกข้อมูลหมู่บ้านได้');
      }
    } catch (err) {
      console.error('Error saving village:', err);
      
      // แสดงข้อความแจ้งเตือน
      setNotification({
        open: true,
        message: `เกิดข้อผิดพลาด: ${err.response?.data?.message || err.message || 'ไม่สามารถบันทึกข้อมูลหมู่บ้านได้'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  // ลบหมู่บ้าน
  const handleDeleteVillage = async (id) => {
    if (window.confirm('คุณต้องการลบหมู่บ้านนี้ใช่หรือไม่? การลบจะไม่สามารถกู้คืนได้')) {
      setLoading(true);
      
      try {
        // ลบหมู่บ้าน - DELETE /villages/:id
        const response = await api.delete(`/villages/${id}`);
        
        if (response.data && response.data.success) {
          // โหลดข้อมูลหมู่บ้านใหม่
          fetchVillages();
          
          // Event bus ถ้ามี
          try {
            const { default: eventBus } = await import('../utils/eventBus');
            eventBus.dispatch('villages-updated', null);
          } catch (err) {
            console.log('EventBus not available');
          }
          
          // แสดงข้อความแจ้งเตือน
          setNotification({
            open: true,
            message: 'ลบหมู่บ้านเรียบร้อยแล้ว',
            severity: 'success'
          });
        } else {
          throw new Error(response.data?.message || 'ไม่สามารถลบหมู่บ้านได้');
        }
      } catch (err) {
        console.error('Error deleting village:', err);
        
        // แสดงข้อความแจ้งเตือน
        setNotification({
          open: true,
          message: `เกิดข้อผิดพลาด: ${err.response?.data?.message || err.message || 'ไม่สามารถลบหมู่บ้านได้'}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // อัพเดทข้อมูลหมู่บ้านที่กำลังแก้ไข
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVillage({
      ...currentVillage,
      [name]: value
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Toolbar />
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            {menuItems.map((item, index) => (
              <ListItem button key={item.text} onClick={() => window.location.href = item.path}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 250px)` } }}
      >
        <Toolbar />
        <Typography variant="h5" sx={{ mb: 3 }}>
          จัดการหมู่บ้าน
        </Typography>

        {/* ปุ่มเพิ่มหมู่บ้าน */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={loading}
          >
            เพิ่มหมู่บ้าน
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchVillages}
            disabled={loading}
          >
            รีเฟรช
          </Button>
        </Box>

        {/* แสดง Error ถ้ามี */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* แสดง Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* ตารางแสดงหมู่บ้าน */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>รหัส</TableCell>
                <TableCell>รหัสหมู่บ้าน</TableCell>
                <TableCell>ชื่อหมู่บ้าน</TableCell>
                <TableCell>ตำบล</TableCell>
                <TableCell>อำเภอ</TableCell>
                <TableCell>จังหวัด</TableCell>
                <TableCell>ผู้อยู่อาศัย</TableCell>
                <TableCell>โซน</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {villages.length > 0 ? (
                villages.map((village) => (
                  <TableRow key={village.id}>
                    <TableCell>{village.village_id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={village.village_code || 'ไม่มีรหัส'} 
                        size="small" 
                        color={village.village_code ? "default" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {village.name}
                        </Typography>
                        {village.village_head && (
                          <Typography variant="caption" color="text.secondary">
                            ประธาน: {village.village_head}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{village.sub_district || '-'}</TableCell>
                    <TableCell>{village.district || '-'}</TableCell>
                    <TableCell>{village.province || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          ทั้งหมด: {village.total_residents || 0}
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          ใช้งาน: {village.active_residents || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${village.total_zones || 0} โซน`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="ใช้งาน" 
                        size="small" 
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleEditVillage(village)}
                          disabled={loading}
                          title="แก้ไข"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="info" 
                          size="small"
                          title="ดูรายละเอียด"
                        >
                          <InfoIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteVillage(village.village_id)}
                          disabled={loading}
                          title="ลบ"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลหมู่บ้าน'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="แสดงรายการต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
          />
        </TableContainer>

        {/* กล่องเพิ่ม/แก้ไขหมู่บ้าน */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
          <DialogTitle>
            {editMode ? 'แก้ไขหมู่บ้าน' : 'เพิ่มหมู่บ้านใหม่'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* ข้อมูลพื้นฐาน */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 1 }} />
                ข้อมูลพื้นฐาน
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="village_name"
                    label="ชื่อหมู่บ้าน"
                    fullWidth
                    value={currentVillage.village_name}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="village_code"
                    label="รหัสหมู่บ้าน"
                    fullWidth
                    value={currentVillage.village_code}
                    onChange={handleInputChange}
                    required
                    placeholder="เช่น VIL001"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="village_number"
                    label="หมู่ที่"
                    fullWidth
                    value={currentVillage.village_number}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="office_address"
                    label="ที่อยู่ที่ทำการ"
                    fullWidth
                    value={currentVillage.office_address}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* ข้อมูลที่อยู่ */}
              <AddressSelector
                value={{
                  province: currentVillage.province,
                  district: currentVillage.district,
                  sub_district: currentVillage.sub_district,
                  postal_code: currentVillage.postal_code
                }}
                onChange={handleAddressChange}
                disabled={loading}
              />

              <Divider sx={{ my: 3 }} />

              {/* ข้อมูลประธานหมู่บ้าน */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1 }} />
                ข้อมูลประธานหมู่บ้าน*
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    name="village_head"
                    label="ชื่อประธานหมู่บ้าน"
                    fullWidth
                    value={currentVillage.village_head}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="village_head_email"
                    label="อีเมลประธานหมู่บ้าน"
                    type="email"
                    fullWidth
                    value={currentVillage.village_head_email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="village_head_phone"
                    label="โทรศัพท์ประธานหมู่บ้าน"
                    fullWidth
                    value={currentVillage.village_head_phone}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* ข้อมูลผู้ติดต่อ */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1 }} />
                ข้อมูลผู้ติดต่อ
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    name="contact_person"
                    label="ชื่อผู้ติดต่อ"
                    fullWidth
                    value={currentVillage.contact_person}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="contact_email"
                    label="อีเมลผู้ติดต่อ"
                    type="email"
                    fullWidth
                    value={currentVillage.contact_email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="contact_phone"
                    label="โทรศัพท์ผู้ติดต่อ"
                    fullWidth
                    value={currentVillage.contact_phone}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* ข้อมูลการเงิน */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <WaterIcon sx={{ mr: 1 }} />
                ข้อมูลการเงิน
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="default_rate_per_unit"
                    label="ราคาต่อหน่วย (บาท)"
                    type="number"
                    fullWidth
                    value={currentVillage.default_rate_per_unit}
                    onChange={handleInputChange}
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="meter_rental_fee"
                    label="ค่าเช่ามิเตอร์ (บาท)"
                    type="number"
                    fullWidth
                    value={currentVillage.meter_rental_fee}
                    onChange={handleInputChange}
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="payment_due_date"
                    label="กำหนดชำระ (วันที่)"
                    fullWidth
                    value={currentVillage.payment_due_date}
                    onChange={handleInputChange}
                    placeholder="เช่น 15"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="bank_name"
                    label="ธนาคาร"
                    fullWidth
                    value={currentVillage.bank_name}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="account_number"
                    label="เลขที่บัญชี"
                    fullWidth
                    value={currentVillage.account_number}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="collector_name"
                    label="ชื่อผู้เก็บเงิน"
                    fullWidth
                    value={currentVillage.collector_name}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSaveVillage} 
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editMode ? 'บันทึกการแก้ไข' : 'เพิ่มหมู่บ้าน'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification */}
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default VillageManagement;