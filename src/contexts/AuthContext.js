// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // ตรวจสอบ token เมื่อโหลดแอพ
    const storedUser = localStorage.getItem('waterSystemUser');
    console.log('Stored user data:', storedUser);
    if (storedUser && storedUser !== 'undefined') {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData.user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('waterSystemUser');
      }
    }
    
    setLoading(false);
  }, []);
  
  const login = async (username, password) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login(username, password);
      const userData = response.data;
      
      // เก็บข้อมูลใน localStorage
      localStorage.setItem('waterSystemUser', JSON.stringify(userData));
      
      // อัปเดตสถานะ
      setUser(userData.data.user);
      
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    setLoading(true);
    
    try {
      // เรียก API logout
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
      // ดำเนินการออกจากระบบแม้ว่าจะมีข้อผิดพลาดจาก API
    } finally {
      // ลบข้อมูลจาก localStorage
      localStorage.removeItem('waterSystemUser');
      localStorage.removeItem('currentVillage');
      
      // รีเซ็ตสถานะ
      setUser(null);
      setLoading(false);
    }
  };
  
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}