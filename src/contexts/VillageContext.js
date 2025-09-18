// src/contexts/VillageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';

const VillageContext = createContext();

export function useVillage() {
  return useContext(VillageContext);
}

export function VillageProvider({ children }) {
  const { user } = useAuth();
  const [villages, setVillages] = useState([]);
  const [currentVillage, setCurrentVillage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // โหลดหมู่บ้านที่บันทึกไว้
    const storedVillage = localStorage.getItem('currentVillage');
    
    if (storedVillage && storedVillage !== 'undefined') {
      try {
        setCurrentVillage(JSON.parse(storedVillage));
      } catch (error) {
        console.error('Error parsing village data:', error);
        localStorage.removeItem('currentVillage');
      }
    }
  }, []);
  
  useEffect(() => {
    // โหลดรายการหมู่บ้านเมื่อผู้ใช้เข้าสู่ระบบ
   
    if (user && (user.role_name === 'admin' || user.role_name === 'village_admin' || user.role_name === 'meter')) {
      fetchVillages();
    }
  }, [user]);
  
  const fetchVillages = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await userService.getUserById(user.user_id);
      
      setVillages(response.data.data.villages || []);
      
      // ถ้ายังไม่ได้เลือกหมู่บ้าน ให้เลือกหมู่บ้านแรกโดยอัตโนมัติ
      if (!currentVillage && response.data.length > 0) {
        setCurrentVillage(response.data[0]);
        localStorage.setItem('currentVillage', JSON.stringify(response.data[0]));
      }
    } catch (err) {
      console.error('Error fetching villages:', err);
      setError(err.message || 'ไม่สามารถดึงข้อมูลหมู่บ้านได้');
    } finally {
      setLoading(false);
    }
  };
  
  const selectVillage = (village) => {
    setCurrentVillage(village);
    localStorage.setItem('currentVillage', JSON.stringify(village));
  };
  
  const value = {
    villages,
    currentVillage,
    loading,
    error,
    fetchVillages,
    selectVillage
  };
  
  return (
    <VillageContext.Provider value={value}>
      {children}
    </VillageContext.Provider>
  );
}