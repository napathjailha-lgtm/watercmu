// src/components/MeterReadings.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { billingService } from '../services/api';

// กำหนดค่า API URL
const API_BASE_URL = 'https://api.abchomey.com/api';

// DataTable Component
const MeterReadingsDataTable = ({ user, currentVillage, readings, onReadingClick, onVerifyReading, onExportCSV, onPrintBill, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('meterNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Format number function
  const formatNumber = (value) => {
    if (value == null || value === undefined || isNaN(value)) {
      return '-';
    }
    return Number(value).toLocaleString();
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...readings];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(meter => 
        meter.meterNumber.toLowerCase().includes(searchLower) ||
        meter.resident.toLowerCase().includes(searchLower) ||
        (meter.address && meter.address.toLowerCase().includes(searchLower)) ||
        (meter.reader && meter.reader.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(meter => {
        if (statusFilter === 'read') return meter.currentReading !== null;
        if (statusFilter === 'unread') return meter.currentReading === null;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convert to string for comparison
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue, 'th', { numeric: true });
      } else {
        return bValue.localeCompare(aValue, 'th', { numeric: true });
      }
    });

    return filtered;
  }, [readings, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const actualItemsPerPage = itemsPerPage === 9999 ? totalItems : itemsPerPage;
  const totalPages = Math.ceil(totalItems / actualItemsPerPage);
  const startIndex = (currentPage - 1) * actualItemsPerPage;
  const endIndex = Math.min(startIndex + actualItemsPerPage, totalItems);
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pagination controls
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPaginationRange = () => {
    const range = [];
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('...');
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) range.push('...');
      range.push(totalPages);
    }

    return range;
  };

  // Image component
  const ImageDisplay = ({ photoUrl, meterNumber }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const showLargeImage = () => {
      if (!photoUrl) return;

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); display: flex; justify-content: center;
        align-items: center; z-index: 1001; cursor: pointer;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        max-width: 90%; max-height: 90%; display: flex; flex-direction: column;
        align-items: center; background: white; padding: 20px; border-radius: 8px;
        position: relative;
      `;

      const img = document.createElement('img');
      img.src = photoUrl;
      img.style.cssText = `
        max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 4px;
      `;

      const caption = document.createElement('p');
      caption.textContent = `รูปมิเตอร์: ${meterNumber}`;
      caption.style.cssText = `margin: 10px 0 0 0; font-weight: bold; color: #333;`;

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '× ปิด';
      closeBtn.style.cssText = `
        position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7);
        color: white; border: none; padding: 8px 12px; border-radius: 4px;
        cursor: pointer; font-size: 14px; font-weight: bold;
      `;

      container.appendChild(img);
      container.appendChild(caption);
      container.appendChild(closeBtn);
      modal.appendChild(container);

      const closeModal = () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      modal.onclick = closeModal;
      closeBtn.onclick = closeModal;
      container.onclick = (e) => e.stopPropagation();

      document.body.appendChild(modal);
    };

    if (imageError || !photoUrl) {
      return (
        <div style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          ไม่มีรูป
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <img
          src={photoUrl}
          alt={`รูปมิเตอร์ ${meterNumber}`}
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'cover',
            borderRadius: '4px',
            cursor: 'pointer',
            border: '1px solid #d1d5db',
            transition: 'transform 0.2s'
          }}
          onLoad={() => setImageLoading(false)}
          onClick={showLargeImage}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title={`คลิกเพื่อดูรูปขนาดใหญ่ - ${meterNumber}`}
        />
        {!imageLoading && !imageError && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
        )}
      </div>
    );
  };

  const SortableHeader = ({ field, children, className = "", style = {} }) => (
    <th 
      className={`sortable-header ${className}`}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: '500',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        ...style
      }}
      onClick={() => handleSort(field)}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
      onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {children}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '4px' }}>
          <span style={{ 
            fontSize: '10px',
            color: sortField === field && sortDirection === 'asc' ? '#2563eb' : '#d1d5db'
          }}>▲</span>
          <span style={{ 
            fontSize: '10px',
            color: sortField === field && sortDirection === 'desc' ? '#2563eb' : '#d1d5db'
          }}>▼</span>
        </div>
      </div>
    </th>
  );

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header with controls */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '384px' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '16px'
            }}>🔍</div>
            <input
              type="text"
              placeholder="ค้นหาเลขมิเตอร์ ชื่อ ที่อยู่ หรือคนอ่าน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Filters and controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="read">อ่านแล้ว</option>
              <option value="unread">ยังไม่ได้อ่าน</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value={5}>5 รายการ</option>
              <option value={10}>10 รายการ</option>
              <option value={20}>20 รายการ</option>
              <option value={25}>25 รายการ</option>
              <option value={50}>50 รายการ</option>
              <option value={100}>100 รายการ</option>
              <option value={200}>200 รายการ</option>
              <option value={500}>500 รายการ</option>
              <option value={1000}>1000 รายการ</option>
              <option value={9999}>ทั้งหมด</option>
            </select>

            <button
              onClick={onExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
            >
              <span>📊</span>
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          <span>ทั้งหมด: <span style={{ fontWeight: '600', color: '#111827' }}>{totalItems}</span></span>
          <span>อ่านแล้ว: <span style={{ fontWeight: '600', color: '#059669' }}>{readings.filter(m => m.currentReading !== null).length}</span></span>
          <span>ยังไม่ได้อ่าน: <span style={{ fontWeight: '600', color: '#dc2626' }}>{readings.filter(m => m.currentReading === null).length}</span></span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative' }}>
          <thead>
            <tr>
              <SortableHeader field="meterNumber">เลขมิเตอร์</SortableHeader>
              <SortableHeader field="resident">ชื่อผู้ใช้น้ำ</SortableHeader>
              <SortableHeader field="address">ที่อยู่</SortableHeader>
              <SortableHeader field="previousReading" style={{ textAlign: 'right' }}>ค่าก่อนหน้า</SortableHeader>
              <SortableHeader field="currentReading" style={{ textAlign: 'right' }}>ค่าปัจจุบัน</SortableHeader>
              <SortableHeader field="usage" style={{ textAlign: 'right' }}>ใช้ไป</SortableHeader>
              <SortableHeader field="readDate">วันที่อ่าน</SortableHeader>
              <SortableHeader field="reader">ผู้อ่าน</SortableHeader>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                textTransform: 'uppercase',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>รูปภาพ</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                textTransform: 'uppercase',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>สถานะ</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                textTransform: 'uppercase',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #3b82f6',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    กำลังโหลดข้อมูล...
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={11} style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  ไม่พบข้อมูลที่ค้นหา
                </td>
              </tr>
            ) : (
              currentData.map((meter) => (
                <tr 
                  key={meter.meterId} 
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                >
                  <td style={{
                    padding: '16px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {meter.meterNumber}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#111827'
                  }}>
                    {meter.resident}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#111827'
                  }}>
                    {meter.address || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    color: '#111827',
                    textAlign: 'right'
                  }}>
                    {formatNumber(meter.previousReading)}
                  </td>
                  <td style={{
                    padding: '16px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    color: '#111827',
                    textAlign: 'right'
                  }}>
                    {formatNumber(meter.currentReading)}
                  </td>
                  <td style={{
                    padding: '16px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    color: '#111827',
                    textAlign: 'right'
                  }}>
                    {meter.usage != null ? `${formatNumber(meter.usage)} หน่วย` : '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    color: '#111827'
                  }}>
                    {meter.readDate || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#111827'
                  }}>
                    {meter.reader || '-'}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <ImageDisplay
                      photoUrl={meter.photoUrl}
                      meterNumber={meter.meterNumber}
                    />
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      ...(meter.currentReading !== null 
                        ? { backgroundColor: '#dcfce7', color: '#166534' }
                        : { backgroundColor: '#fee2e2', color: '#991b1b' })
                    }}>
                      {meter.currentReading !== null ? 'อ่านแล้ว' : 'ยังไม่ได้อ่าน'}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {meter.status === 'unread' || meter.currentReading === null ? (
                        <button
                          onClick={() => onReadingClick(meter)}
                          style={{
                            padding: '4px',
                            color: '#2563eb',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="บันทึกค่ามิเตอร์"
                        >
                          ✏️
                        </button>
                      ) : meter.status === 'pending' && user.role_name === 'ADMIN' ? (
                        <button
                          onClick={() => onVerifyReading(meter.id)}
                          style={{
                            padding: '4px',
                            color: '#059669',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="ตรวจสอบ"
                        >
                          ✅
                        </button>
                      ) : (
                        <button
                          onClick={() => onReadingClick(meter)}
                          style={{
                            padding: '4px',
                            color: '#2563eb',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                      )}

                      {meter.currentReading !== null && (
                        <button
                          onClick={() => onPrintBill(meter, currentVillage)}
                          style={{
                            padding: '4px',
                            color: '#4b5563',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="สร้าง PDF"
                        >
                          📄
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && itemsPerPage !== 9999 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#374151'
        }}>
          <div>
            แสดง {startIndex + 1} ถึง {endIndex} จาก {totalItems} รายการ
            {itemsPerPage === 9999 && <span> (แสดงทั้งหมด)</span>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* First page button */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) e.target.style.backgroundColor = 'white';
              }}
              title="หน้าแรก"
            >
              ««
            </button>

            {/* Previous page button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) e.target.style.backgroundColor = 'white';
              }}
              title="หน้าก่อนหน้า"
            >
              ‹
            </button>

            {/* Page numbers */}
            {getPaginationRange().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && goToPage(page)}
                disabled={page === '...'}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: page === '...' ? 'default' : 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  ...(page === currentPage
                    ? { backgroundColor: '#2563eb', color: 'white' }
                    : page === '...'
                    ? { backgroundColor: 'transparent', color: '#9ca3af' }
                    : { backgroundColor: 'white', border: '1px solid #d1d5db', color: '#6b7280' })
                }}
                onMouseEnter={(e) => {
                  if (page !== '...' && page !== currentPage) {
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== '...' && page !== currentPage) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {page}
              </button>
            ))}

            {/* Next page button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) e.target.style.backgroundColor = 'white';
              }}
              title="หน้าถัดไป"
            >
              ›
            </button>

            {/* Last page button */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) e.target.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) e.target.style.backgroundColor = 'white';
              }}
              title="หน้าสุดท้าย"
            >
              »»
            </button>

            {/* Page jump input */}
            {totalPages > 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>ไปหน้า:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder={currentPage}
                  style={{
                    width: '60px',
                    padding: '4px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show summary when showing all */}
      {itemsPerPage === 9999 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '14px',
          color: '#374151',
          backgroundColor: '#f9fafb'
        }}>
          แสดงทั้งหมด {totalItems} รายการ
        </div>
      )}
    </div>
  );
};

// Main MeterReadings Component
function MeterReadings({ user, currentVillage }) {
  const [readingPeriod, setReadingPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // States สำหรับการถ่ายรูป
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // สร้าง Axios instance พร้อมกับ token
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });

  // โหลดข้อมูลการอ่านมิเตอร์เมื่อคอมโพเนนต์โหลดหรือเมื่อเปลี่ยนงวด
  useEffect(() => {
    if (currentVillage?.village_id) {
      fetchMeterReadings();
    }
  }, [readingPeriod, currentVillage]);

  // ปิดกล้องเมื่อ component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ฟังก์ชันเปิดกล้อง
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setShowCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);

    } catch (err) {
      console.error('Error accessing camera:', err);
      showNotification('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาต', 'error');
    }
  };

  // ฟังก์ชันปิดกล้อง
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // ฟังก์ชันถ่ายรูป
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage({
          blob: blob,
          url: imageUrl,
          file: new File([blob], `meter-${selectedMeter?.meterNumber}-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          })
        });
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  // ฟังก์ชันลบรูปที่ถ่าย
  const removeCapturedImage = () => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
  };

  // ฟังก์ชัน Export CSV
  const exportToCSV = () => {
    if (readings.length === 0) {
      showNotification('ไม่มีข้อมูลสำหรับ export', 'warning');
      return;
    }

    const formatNumberForCSV = (value) => {
      if (value == null || value === undefined || isNaN(value)) {
        return '';
      }
      return Number(value).toLocaleString();
    };

    const headers = [
      'เลขมิเตอร์',
      'ชื่อผู้ใช้น้ำ',
      'ที่อยู่',
      'ค่าก่อนหน้า',
      'ค่าปัจจุบัน',
      'การใช้งาน (หน่วย)',
      'วันที่อ่าน',
      'ผู้อ่าน',
      'หมายเหตุ',
      'สถานะ'
    ];

    const csvContent = [
      headers.join(','),
      ...readings.map(meter => [
        `"${meter.meterNumber}"`,
        `"${meter.resident}"`,
        `"${meter.address || ''}"`,
        `"${formatNumberForCSV(meter.previousReading)}"`,
        `"${formatNumberForCSV(meter.currentReading)}"`,
        `"${formatNumberForCSV(meter.usage)}"`,
        `"${meter.readDate || ''}"`,
        `"${meter.reader || ''}"`,
        `"${meter.note || ''}"`,
        `"${meter.currentReading !== null ? 'อ่านแล้ว' : 'ยังไม่ได้อ่าน'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const fileName = `meter_readings_${currentVillage?.village_name || 'village'}_${months[readingPeriod.month - 1]}_${readingPeriod.year}.csv`;
    link.setAttribute('download', fileName);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showNotification('Export CSV เรียบร้อยแล้ว', 'success');
  };

  // ฟังก์ชันอัพโหลดรูป
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('meter_photo', file);
    formData.append('meter_id', selectedMeter.meterId);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/meter-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      return response.data.photo_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
    }
  };

  // ดึงข้อมูลการอ่านมิเตอร์จาก API
  const fetchMeterReadings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/readings/village/${currentVillage.village_id}`, {
        params: {
          village_id: currentVillage.village_id,
          month: readingPeriod.month,
          year: readingPeriod.year
        }
      });

      if (response.data && response.data.success) {
        const formattedReadings = response.data.data.map(reading => ({
          id: reading.current_month_reading_id,
          meterNumber: reading.meter_number,
          meterId: reading.meter_id,
          resident: reading.customer_name,
          reading_date: reading.current_month_reading_date,
          address: reading.address,
          previousReading: reading.current_month_previous_reading != null ? Number(reading.current_month_previous_reading) : Number(reading.previous_month_reading) ? Number(reading.previous_month_reading) : Number(reading.meter_read),
          currentReading: reading.current_month_reading != null ? Number(reading.current_month_reading) : null,
          usage: reading.current_month_reading != null ? Number(reading.current_month_reading - (reading.current_month_previous_reading || reading.meter_read)) : null,
          readDate: reading.current_month_reading_date ? formatDateThai(reading.current_month_reading_date) : null,
          status: reading.status,
          reader: reading.current_month_reader_name,
          readerId: reading.reader_id,
          note: reading.note,
          photoUrl: reading.current_month_reading_image,
          createdAt: reading.created_at,
          updatedAt: reading.updated_at
        }));

        setReadings(formattedReadings);
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถดึงข้อมูลการอ่านมิเตอร์ได้');
      }
    } catch (err) {
      console.error('Error fetching meter readings:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      showNotification('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // แปลงวันที่เป็นรูปแบบไทย
  const formatDateThai = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // แสดงตัวเลขแบบปลอดภัย
  const formatNumber = (value) => {
    if (value == null || value === undefined || isNaN(value)) {
      return '-';
    }
    return Number(value).toLocaleString();
  };

  // แสดงการแจ้งเตือน
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleMonthChange = (e) => {
    setReadingPeriod(prev => ({
      ...prev,
      month: parseInt(e.target.value)
    }));
  };

  const handleYearChange = (e) => {
    setReadingPeriod(prev => ({
      ...prev,
      year: parseInt(e.target.value)
    }));
  };

  // PDF Generation Functions
  const drawInvoiceVerticalHalfPage = async (doc, bill, village, offsetY) => {
    const totalPageWidth = doc.internal.pageSize.getWidth();
    const singleInvoiceHeight = doc.internal.pageSize.getHeight() / 2;
    const marginX = 10;
    let currentY = 10 + offsetY;

    // Header Section
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = marginX;
    const logoY = currentY;

    if (village.logo_url) {
      try {
        const logoImg = await toBase64(village.logo_url);
        if (logoImg) {
          doc.addImage(logoImg, 'PNG', logoX, logoY - 5, logoWidth, logoHeight);
        }
      } catch (error) {
        console.error("Failed to load or add village logo:", error);
      }
    }

    const addressTextX = logoX + logoWidth + 3;

    const formatReadingDate = (dateObj) => {
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });
      }
      return 'N/A';
    };

    const parseMonthYearToDate = (monthYearString) => {
      if (!monthYearString || typeof monthYearString !== 'string') {
        return null;
      }
      const parts = monthYearString.split('/');
      if (parts.length !== 2) {
        return null;
      }
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);

      if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return null;
      }
      return new Date(year, month - 1, village.payment_due_date);
    };

    let currentAddressY = currentY;

    doc.setFontSize(16);
    if (village.village_name) {
      doc.text(`หมู่บ้าน ${village.village_name}`, addressTextX, currentAddressY);
    }
    currentAddressY += 6;

    doc.setFontSize(10);
    if (village.office_address) {
      doc.text('เลขที่ ' + village.office_address, addressTextX, currentAddressY);
    }
    currentAddressY += 4;
    if (village.sub_district) {
      doc.text('ตำบล ' + village.sub_district, addressTextX, currentAddressY);
    }
    currentAddressY += 4;
    if (village.district) {
      doc.text('อำเภอ ' + village.district, addressTextX, currentAddressY);
    }
    currentAddressY += 4;

    if (village.province) {
      doc.text('จังหวัด ' + village.province, addressTextX, currentAddressY);
    }
    currentAddressY += 4;

    if (village.postal_code) {
      doc.text('รหัสไปรษณีย์ ' + village.postal_code, addressTextX, currentAddressY);
    }
    currentAddressY += 4;
    if (village.phone_number || village.tax_id) {
      doc.text(`โทร ${village.phone_number || 'xxx-xxxxxxx'} เลขประจำตัวผู้เสียภาษี ${village.tax_id || ''}`, addressTextX, currentAddressY);
    }

    currentY = Math.max(currentAddressY + 5, logoY + logoHeight + 5);

    // Invoice Header (Top Right)
    doc.setFontSize(16);
    doc.text('ใบแจ้งหนี้/INVOICE', totalPageWidth - marginX, logoY, { align: 'right' });

    const response = await billingService.getBillsbyreading(currentVillage.village_id, bill.id, bill.reading_date);
    const billData = response.data.data[0];

    // Invoice Details (Right Side)
    doc.setFontSize(10);
    let invoiceNumberFormatted = 'N/A';
    if (billData.billing_month && billData.bill_id) {
      const [month, year] = billData.billing_month.split('/');
      const formattedMonth = month.padStart(2, '0');
      invoiceNumberFormatted = `${year}${formattedMonth}${billData.bill_id}`;
    }
    doc.text(`เลขที่ใบแจ้งหนี้/Invoice No: ${invoiceNumberFormatted}`, totalPageWidth - marginX, logoY + 10, { align: 'right' });
    doc.text(`วันที่ออกใบแจ้งหนี้/Issued Date: ${formatReadingDate(new Date(billData.current_meter_date))}`, totalPageWidth - marginX, logoY + 15, { align: 'right' });
    doc.text(`วันที่ครบกำหนดชำระ/Due Date: ${parseMonthYearToDate(billData.billing_month) ? new Date(parseMonthYearToDate(billData.billing_month)).toLocaleDateString('th-TH') : 'N/A'}`, totalPageWidth - marginX, logoY + 20, { align: 'right' });

    currentY = currentY - 4;
    // Customer Details (Left Side)
    doc.setFontSize(10);
    doc.text(`บ้านเลขที่/Code: ${bill.house_number || bill.address || 'N/A'}`, marginX, currentY);
    currentY += 5;
    doc.text(`ชื่อผู้ใช้น้ำ/NAME: ${billData.customer_name || 'N/A'}`, marginX, currentY);
    currentY += 5;

    // Table Header for Usage Details
    doc.setFontSize(10);
    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, currentY, (totalPageWidth - 50) - (2 * marginX), 6, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text('ลำดับ/No.', marginX + 3, currentY + 4);
    doc.text('รายละเอียด/Description', marginX + 20, currentY + 4, { align: 'left' });
    doc.text('จำนวนหน่วยที่ใช้/Units Used', totalPageWidth - marginX - 100, currentY + 4, { align: 'right' });
    doc.text('จำนวนเงิน/Amount', totalPageWidth - marginX - 55, currentY + 4, { align: 'right' });
    currentY += 6;

    // Table Body - Water Bill
    doc.text('1', marginX + 3, currentY + 4);
    doc.text('ค่าน้ำประปา', marginX + 15, currentY + 4);
    doc.text(`${billData.water_usage || '0'}`, totalPageWidth - marginX - 110, currentY + 4, { align: 'right' });
    doc.text(`${formatNumber(billData.base_amount)}`, totalPageWidth - marginX - 60, currentY + 4, { align: 'right' });
    currentY += 6;

    // Water Meter Reading Description
    doc.setFontSize(9);

    const currentBillingDateObj = parseMonthYearToDate(billData.billing_month);
    let previousBillingDateObj = null;
    if (currentBillingDateObj) {
      previousBillingDateObj = new Date(currentBillingDateObj);
      previousBillingDateObj.setMonth(previousBillingDateObj.getMonth() - 1);
    }
    const currentReadingDateStr = formatReadingDate(new Date(billData.current_meter_date));
    const previousReadingDateStr = formatReadingDate(new Date(billData.previous_meter_data));
    const previousReadingLine = `ครั้งก่อน ${previousReadingDateStr} เลขมิเตอร์  ${billData.previous_meter_reading || '0'} ครั้งนี้ ${currentReadingDateStr} เลขมิเตอร์  ${billData.current_meter_reading || '0'}`;
    doc.text(previousReadingLine, marginX + 15, currentY + 3);

    currentY += 5;

    // Add Images
    const imgXOffset = marginX + 5;
    const imgWidth = 45;
    const imgHeight = 35;
    const imgSpacing = 5;

    if (billData.previous_meter_image_url) {
      try {
        const img1 = await toBase64(billData.previous_meter_image_url);
        if (img1) {
          doc.addImage(img1, 'PNG', totalPageWidth - imgXOffset - 35, currentY + -20, imgWidth, imgHeight);
          doc.text('ภาพมิเตอร์ครั้งก่อน', totalPageWidth - imgWidth + 17, currentY + imgHeight - 15, { align: 'center' });
        }
      } catch (error) {
        console.error("Failed to load current meter image:", error);
      }
    }
    if (billData.current_meter_image_url) {
      try {
        const img2 = await toBase64(billData.current_meter_image_url);
        if (img2) {
          doc.addImage(img2, 'PNG', totalPageWidth - imgXOffset - 35, currentY + 30, imgWidth, imgHeight);
          doc.text('ภาพมิเตอร์ปัจจุบัน', totalPageWidth - imgWidth + 17, currentY + imgHeight + 35, { align: 'center' });
        }
      } catch (error) {
        console.error("Failed to load previous meter image:", error);
      }
    }
    currentY += imgHeight - 10;
    // Bill Summary Section
    doc.setFontSize(9);
    doc.line(marginX, currentY, totalPageWidth - 62, currentY);
    currentY += 4;
    doc.text('จำนวนเงินเดือนนี้', marginX, currentY);
    doc.text(`${formatNumber(billData.base_amount) || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    doc.text('ค่าบำรุง', marginX, currentY);
    doc.text(`${billData.additional_fees_amount || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    doc.text('ค่าใช้จ่ายอื่นๆ', marginX, currentY);
    doc.text(`${billData.other_charges || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    doc.text('เงินเพิ่มชำระล่าช้า', marginX, currentY);
    doc.text('0.00', totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    // Total Amount
    doc.setFontSize(10);
    doc.line(marginX, currentY, totalPageWidth - marginX - 50, currentY);
    currentY += 1;
    doc.line(marginX, currentY, totalPageWidth - marginX - 50, currentY);
    currentY += 4;
    doc.setFontSize(12);
    doc.text('รวมทั้งสิ้น', marginX, currentY);
    doc.text(`${formatNumber(billData.total_amount) || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    doc.setFontSize(10);
    const amountInWords = convertBahtToThaiWords(billData.total_amount);
    doc.text(amountInWords, (totalPageWidth / 2) - 20, currentY, { align: 'center' });
    currentY += 2;
    doc.line(marginX, currentY, totalPageWidth - marginX - 50, currentY);
    currentY += 1;
    doc.line(marginX, currentY, totalPageWidth - marginX - 50, currentY);
    currentY += 5;
    doc.setFontSize(9);
    doc.text('ช่องทางการชำระเงิน', marginX, currentY);
    currentY += 5;
    doc.text('1. เงินสด', marginX, currentY);
    doc.text(`เบอร์โทร. ${village.contact_phone || 'กรุณาติดต่อผู้ดูแลของคุณ'}`, totalPageWidth - marginX - 50, currentY - 5, { align: 'right' });
    currentY += 5;

    doc.text(`2. โอนเงินเข้าบัญชี ธนาคาร ${village.bank_name || 'กรุณาติดต่อผู้ดูแล'} เลขที่บัญชี ${village.account_number || 'กรุณาติดต่อผู้ดูแล'}`, marginX, currentY);
    doc.line(totalPageWidth - marginX - 50, currentY, totalPageWidth - marginX - 80, currentY);
    doc.text(`(${village.contact_person || 'N/A'})`, totalPageWidth - marginX - 55, currentY + 5, { align: 'right' });
    const qrXOffset = marginX + 50;

    currentY += 4;
    const qrWidth = 20;
    const qrHeight = 20;
    if (village.qr_code_url) {
      try {
        const qrImg1 = await toBase64(village.qr_code_url);
        if (qrImg1) {
          doc.addImage(qrImg1, 'PNG', qrXOffset + 25, currentY - 18, qrWidth, qrHeight);
        }
      } catch (error) {
        console.error("Failed to load QR code 1:", error);
      }
    }
    currentY += qrHeight;
    doc.text(`เมื่อชำระเงินแล้ว กรุณาส่งสำเนาการชำระเงินมาที่ : E-mail ${village.contact_email || 'N/A'}`, marginX, currentY - 20);
    doc.setFontSize(10);
    doc.text('ผู้แจ้งยอด', totalPageWidth - marginX - 57, currentY - 15, { align: 'right' });
  };

  const convertBahtToThaiWords = (amount) => {
    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    const convertLessThanMillion = (num) => {
      let result = '';
      let s = num.toString();
      let len = s.length;

      for (let i = 0; i < len; i++) {
        let digit = parseInt(s[i], 10);
        let placeIndex = len - i - 1;

        if (digit === 0) continue;

        if (placeIndex === 1 && digit === 1) {
          result += places[1];
        } else if (placeIndex === 1 && digit === 2) {
          result += 'ยี่' + places[1];
        } else {
          result += units[digit];
          if (placeIndex > 0) {
            result += places[placeIndex];
          }
        }
      }
      if (len > 1 && s[len - 1] === '1' && s[len - 2] !== '0' && s[len - 2] !== '1') {
        result = result.replace(/หนึ่ง$/, 'เอ็ด');
      }
      return result;
    };

    if (amount === 0) return 'ศูนย์บาทถ้วน';
    if (amount < 0) return 'ไม่สามารถแปลงจำนวนเงินติดลบได้';

    let totalAmountFixed = parseFloat(amount).toFixed(2);
    let [bahtStr, satangStr] = totalAmountFixed.split('.');

    const baht = parseInt(bahtStr, 10);
    const satang = parseInt(satangStr, 10);

    let finalResult = '';

    if (baht > 0) {
      const millionPart = Math.floor(baht / 1000000);
      const remainderBaht = baht % 1000000;

      if (millionPart > 0) {
        finalResult += convertLessThanMillion(millionPart) + 'ล้าน';
        if (remainderBaht === 0) {
          finalResult += 'บาทถ้วน';
          return finalResult;
        }
      }
      finalResult += convertLessThanMillion(remainderBaht) + 'บาท';
    } else {
      finalResult += 'ศูนย์บาท';
    }

    if (satang > 0) {
      finalResult += convertLessThanMillion(satang) + 'สตางค์';
    } else {
      finalResult += 'ถ้วน';
    }

    return finalResult;
  };

  async function toBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const handlePrintSingleBill = async (bill, village) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('THSarabunNew', 'normal');
    const singleInvoiceHeight = doc.internal.pageSize.getHeight() / 2;
    await drawInvoiceVerticalHalfPage(doc, bill, village, 0);
    doc.setDrawColor(150, 150, 150);
    doc.line(10, singleInvoiceHeight, doc.internal.pageSize.getWidth() - 10, singleInvoiceHeight);
    doc.setDrawColor(0, 0, 0);

    await drawInvoiceVerticalHalfPage(doc, bill, village, singleInvoiceHeight);

    doc.save(`Bill_${bill.meterNumber || 'unknown'}.pdf`);
  };

  const handleReadingClick = (meter) => {
    setSelectedMeter(meter);
    setShowReadingForm(true);
    if (meter.photoUrl) {
      setCapturedImage({
        url: meter.photoUrl,
        blob: null,
        file: null
      });
    } else {
      setCapturedImage(null);
    }
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();

    const readingValue = parseInt(e.target.reading.value);
    const note = e.target.note.value;

    setLoading(true);

    try {
      let photoUrl = null;

      if (capturedImage?.file) {
        photoUrl = await uploadImage(capturedImage.file);
      }

      if (capturedImage?.url) {
        photoUrl = capturedImage.url;
      }

      const readingData = {
        meter_id: selectedMeter.meterId,
        current_reading: readingValue,
        previous_reading: selectedMeter.previousReading || 0,
        usage: readingValue - (selectedMeter.previousReading || 0),
        read_date: new Date().toISOString().split('T')[0],
        month: readingPeriod.month,
        year: readingPeriod.year,
        note: note,
        reader_id: user.user_id,
        photo_url: photoUrl,
        reading_image: photoUrl
      };

      let response;

      if (selectedMeter.id && selectedMeter.currentReading !== null) {
        response = await api.put(`/readings/${selectedMeter.id}`, readingData);
      } else {
        response = await api.post('/readings', readingData);
      }

      if (response.data && response.data.success) {
        await fetchMeterReadings();
        showNotification('บันทึกค่ามิเตอร์เรียบร้อยแล้ว', 'success');
        setShowReadingForm(false);
        setSelectedMeter(null);
        removeCapturedImage();
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถบันทึกค่ามิเตอร์ได้');
      }
    } catch (err) {
      console.error('Error saving meter reading:', err);
      showNotification('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyReading = async (id) => {
    setLoading(true);

    try {
      const response = await api.patch(`/readings/${id}/verify`, {
        verified_by: user.user_id,
        verified_at: new Date().toISOString()
      });

      if (response.data && response.data.success) {
        setReadings(prev => prev.map(meter => {
          if (meter.id === id) {
            return {
              ...meter,
              status: 'verified'
            };
          }
          return meter;
        }));

        showNotification('ตรวจสอบค่ามิเตอร์เรียบร้อยแล้ว', 'success');
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถตรวจสอบค่ามิเตอร์ได้');
      }
    } catch (err) {
      console.error('Error verifying meter reading:', err);
      showNotification('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // สร้างปีสำหรับ dropdown
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="readings-container">
      {/* CSS Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sortable-header:hover {
          background-color: #f3f4f6 !important;
        }
      `}</style>

      {/* Notification */}
      {notification.show && (
        <div
          className={`notification ${notification.type}`}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 2000,
            minWidth: 280,
            maxWidth: 360,
            padding: '18px 24px 18px 18px',
            borderRadius: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            color: notification.type === 'error' ? '#fff' : '#155724',
            background:
              notification.type === 'success'
                ? '#d1fae5'
                : notification.type === 'error'
                  ? '#ef4444'
                  : '#fffbe6',
            border:
              notification.type === 'success'
                ? '2px solid #10b981'
                : notification.type === 'error'
                  ? '2px solid #dc2626'
                  : '2px solid #facc15',
            display: 'flex',
            alignItems: 'center',
            fontSize: 16,
            fontWeight: 500,
            gap: 12,
          }}
        >
          <span style={{
            fontSize: 22,
            marginRight: 8,
            display: 'flex',
            alignItems: 'center'
          }}>
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
          </span>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: notification.type === 'error' ? '#fff' : '#333',
              cursor: 'pointer',
              marginLeft: 8,
              lineHeight: 1,
            }}
            aria-label="ปิดการแจ้งเตือน"
          >
            ×
          </button>
        </div>
      )}

      <header className="page-header">
        <div className="header-content">
          <h1>บันทึกค่ามิเตอร์</h1>
          {currentVillage && (
            <div className="village-info">
              หมู่บ้าน: {currentVillage.village_name}
            </div>
          )}
        </div>
      </header>

      <div className="period-selector">
        <div className="period-label">งวดการอ่านมิเตอร์:</div>
        <div className="period-controls">
          <select value={readingPeriod.month} onChange={handleMonthChange} disabled={loading}>
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select value={readingPeriod.year} onChange={handleYearChange} disabled={loading}>
            {getYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            className="refresh-btn"
            onClick={fetchMeterReadings}
            disabled={loading}
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>เกิดข้อผิดพลาด:</strong> {error}
          <button onClick={fetchMeterReadings} className="retry-btn">ลองใหม่</button>
        </div>
      )}

      {/* DataTable */}
      <div className="readings-list">
        <MeterReadingsDataTable 
          user={user}
          currentVillage={currentVillage}
          readings={readings}
          onReadingClick={handleReadingClick}
          onVerifyReading={verifyReading}
          onExportCSV={exportToCSV}
          onPrintBill={handlePrintSingleBill}
          loading={loading}
        />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="camera-container" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="camera-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>อัพโหลดรูปมิเตอร์</h3>
              <button
                className="close-camera-btn"
                onClick={stopCamera}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div className="camera-body">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>

            <div className="camera-controls" style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px'
            }}>
              <button
                className="capture-btn"
                onClick={capturePhoto}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                📷 อัพโหลดรูปมิเตอร์
              </button>
              <button
                className="cancel-camera-btn"
                onClick={stopCamera}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Form Modal */}
      {showReadingForm && selectedMeter && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>บันทึกค่ามิเตอร์</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowReadingForm(false);
                  setSelectedMeter(null);
                  removeCapturedImage();
                }}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="meter-info">
              <div><strong>เลขมิเตอร์:</strong> {selectedMeter.meterNumber}</div>
              <div><strong>ชื่อผู้ใช้น้ำ:</strong> {selectedMeter.resident}</div>
              <div><strong>ที่อยู่:</strong> {selectedMeter.address}</div>
              <div><strong>เลขมิเตอร์ก่อนหน้า:</strong> {formatNumber(selectedMeter.previousReading)}</div>
              {selectedMeter.currentReading && (
                <div><strong>เลขมิเตอร์ปัจจุบัน:</strong> {formatNumber(selectedMeter.currentReading)}</div>
              )}
            </div>

            <form onSubmit={handleReadingSubmit}>
              <div className="form-group">
                <label>เลขมิเตอร์ปัจจุบัน:</label>
                <input
                  type="number"
                  name="reading"
                  defaultValue={selectedMeter.currentReading || ''}
                  min={selectedMeter.previousReading || 0}
                  step="0.01"
                  required
                  disabled={loading}
                  onInvalid={(e) => {
                    if (e.target.validity.rangeUnderflow) {
                      e.target.setCustomValidity(`ค่ามิเตอร์ต้องมากกว่าหรือเท่ากับ ${selectedMeter.previousReading || 0}`);
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  onInput={(e) => {
                    e.target.setCustomValidity('');
                  }}
                />
                <div className="hint">
                  * ค่ามิเตอร์ต้องมากกว่าหรือเท่ากับค่าก่อนหน้า ({formatNumber(selectedMeter.previousReading) || '0'})
                </div>
              </div>

              <div className="form-group">
                <label>หมายเหตุ:</label>
                <textarea
                  name="note"
                  defaultValue={selectedMeter.note || ''}
                  disabled={loading}
                ></textarea>
              </div>

              {/* Photo Section */}
              <div className="form-group">
                <label>รูปภาพมิเตอร์:</label>
                <div className="photo-section" style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  {capturedImage ? (
                    <div className="captured-image" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <img
                        src={capturedImage.url}
                        alt="รูปที่ถ่าย"
                        className="preview-image"
                        style={{
                          maxWidth: '300px',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #ddd'
                        }}
                      />
                      <div className="image-controls" style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="retake-btn"
                          onClick={() => {
                            removeCapturedImage();
                            startCamera();
                          }}
                          disabled={loading}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          📷 ถ่ายใหม่
                        </button>
                        <button
                          type="button"
                          className="remove-photo-btn"
                          onClick={removeCapturedImage}
                          disabled={loading}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ ลบรูป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-image">
                      <p style={{ color: '#666', marginBottom: '15px' }}>ยังไม่มีรูปภาพ</p>
                      <button
                        type="button"
                        className="take-photo-btn"
                        onClick={startCamera}
                        disabled={loading}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        📷 อัพโหลดรูปมิเตอร์
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowReadingForm(false);
                    setSelectedMeter(null);
                    removeCapturedImage();
                  }}
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeterReadings;