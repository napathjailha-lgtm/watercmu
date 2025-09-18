import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billingService } from '../services/api'; // Ensure this path is correct
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ต้องติดตั้งและ import เพิ่ม

import '../fonts/SarabunNew.js';
function BillingManagement({ user, currentVillage }) {
  // Initialize billingPeriod with current month and year
  const [billingPeriod, setBillingPeriod] = useState({
    month: new Date().getMonth() + 1, // Month is 0-indexed in Date, so add 1
    year: new Date().getFullYear()
  });

  // State variables for data, loading, and errors
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showGenerateBillsModal, setShowGenerateBillsModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false); // Corrected: Added initialization for setShowEditBillModal
  const [selectedBill, setSelectedBill] = useState(null);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [sortBy, setSortBy] = useState('meterNumber');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const toThaiYear = (year) => year + 543;

  // Thai month names for dropdown
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  /**
   * Generates an array of years starting from the current year and extending for the next 5 years.
   * @returns {number[]} An array of year numbers.
   */
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) { // Current year + next 5 years = 6 years total
      years.push(currentYear + i);
    }
    return years;
  };

  /**
   * Formats the billing period (month and year) into 'MM-YYYY' string format for API requests.
   * @param {object} period - An object containing month (number) and year (number).
   * @returns {string} The formatted billing period string (e.g., '05-2023').
   */
  const formatBillingPeriodForAPI = (period) => {
    const month = period.month.toString().padStart(2, '0');
    return `${month}-${period.year}`;
  };

  /**
   * Applies filters and sorting to the raw bills data.
   */
  const applyFilters = () => {
    let filtered = [...bills];

    // Filter by search term (meter number, resident name, address)
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.meter_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by payment status
    if (statusFilter !== 'all') {
      const targetStatus = statusFilter === 'paid'; // true for 'paid', false for 'unpaid'
      filtered = filtered.filter(bill => bill.is_paid === targetStatus);
    }

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'meterNumber':
          aValue = a.meter_number;
          bValue = b.meter_number;
          break;
        case 'resident':
          aValue = a.customer_name;
          bValue = b.customer_name;
          break;
        case 'usage':
          aValue = a.water_usage || 0;
          bValue = b.water_usage || 0;
          break;
        case 'total':
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case 'dueDate':
          // Construct full date for comparison, assuming payment_due_date is just the day
          const currentMonthPadded = billingPeriod.month.toString().padStart(2, '0');
          const currentYear = billingPeriod.year;
          aValue = new Date(`${currentYear}-${currentMonthPadded}-${currentVillage.payment_due_date || '01'}`);
          bValue = new Date(`${currentYear}-${currentMonthPadded}-${currentVillage.payment_due_date || '01'}`);
          break;
        case 'status':
          // Sort by boolean: false (unpaid) comes before true (paid) for ascending
          aValue = a.is_paid;
          bValue = b.is_paid;
          break;
        default:
          aValue = a.meter_number; // Default sort
          bValue = b.meter_number;
      }

      // Convert to lowercase for case-insensitive string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Apply sort order
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBills(filtered);
  };

  // Re-apply filters whenever bills, search term, status filter, or sort options change
  useEffect(() => {
    applyFilters();
  }, [bills, searchTerm, statusFilter, sortBy, sortOrder, billingPeriod]); // Added billingPeriod to dependency array

  /**
   * Fetches bills from the API based on the selected village and billing period.
   */
  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const billingMonthFormatted = formatBillingPeriodForAPI(billingPeriod);

      const response = await billingService.getBills(currentVillage.village_id, billingMonthFormatted);
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to load bill data.');
      }


      console.log('Fetched bills:', response.data.data);
      setBills(response.data.data); // Assuming API returns data.data as an array of bills
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err.message || 'An error occurred while fetching bills.');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bills whenever the billing period or current village changes
  useEffect(() => {
    if (currentVillage?.village_id) {
      fetchBills();
    }
  }, [billingPeriod, currentVillage?.village_id]); // Only refetch if villageId changes

  /**
   * Handles change in month selection.
   * @param {Event} e - The change event from the select element.
   */


  /**
   * Formats a number with commas and a specified number of decimal places.
   * @param {string|number} value The number to format.
   * @param {number} [decimalPlaces=2] The number of decimal places to show. Defaults to 2.
   * @returns {string} The formatted number string.
   */
  const formatNumber = (value, decimalPlaces = 2) => {
    // Try to parse the value as a float, default to 0 if it fails.
    const num = parseFloat(value) || 0;

    // Use toLocaleString to format the number with commas and decimal places.
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };


  const handleMonthChange = (e) => {
    setBillingPeriod(prev => ({
      ...prev,
      month: parseInt(e.target.value)
    }));
  };

  /**
   * Handles change in year selection.
   * @param {Event} e - The change event from the select element.
   */
  const handleYearChange = (e) => {
    setBillingPeriod(prev => ({
      ...prev,
      year: parseInt(e.target.value)
    }));
  };

  /**
   * Sets the selected bill for editing and shows the edit modal.
   * @param {object} bill - The bill object to be edited.
   */
  const handleEditBill = (bill) => {
    setSelectedBill({ ...bill }); // Create a copy to avoid direct state mutation
    setShowEditBillModal(true);
  };

  /**
   * Handles the submission of the bill edit form, updating the bill via API.
   * @param {Event} e - The form submission event.
   */
  const handleBillUpdate = async (e) => {
    e.preventDefault();

    if (!selectedBill) return;

    // Get only water charge from form field
    const waterCharge = parseFloat(e.target.waterCharge.value);
    const updatedNote = e.target.note.value;

    // Keep existing values for other charges
    const maintenanceCharge = selectedBill.additional_fees_amount || 0;
    const otherCharge = selectedBill.other_charges || 0;

    console.log('Updating water charge to:', waterCharge);

    // Calculate total charge (only water charge changes, others stay the same)
    const totalCharge = waterCharge + maintenanceCharge + otherCharge;

    // Prepare data object matching backend's expected fields
    const updatedData = {
      payment_method: "cash", // Assuming cash for now, can be changed later
      base_amount: waterCharge, // Only this field is being updated
      maintenance_fee: maintenanceCharge, // Keep existing value
      other_charges: otherCharge, // Keep existing value
      total_amount: totalCharge, // Recalculated total
      note: updatedNote,
    };

    setLoading(true);
    try {
      const response = await billingService.updateBill(selectedBill.bill_id, updatedData);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update bill.');
      }

      // Update local state with the changes
      await fetchBills();
      // Re-apply filters to update the displayed data
      applyFilters();
      alert('อัปเดตค่าน้ำเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Error updating bill:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตบิล');
    } finally {
      setLoading(false);
      setShowEditBillModal(false);
      setSelectedBill(null);
    }
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

        if (placeIndex === 1 && digit === 1) { // "สิบ" (for 10-19)
          result += places[1];
        } else if (placeIndex === 1 && digit === 2) { // "ยี่สิบ" (for 20-29)
          result += 'ยี่' + places[1];
        } else {
          result += units[digit];
          if (placeIndex > 0) {
            result += places[placeIndex];
          }
        }
      }
      // Handle "เอ็ด"
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

  // Helper function to convert image URL to Base64 (you need to implement this if not already)
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

  // Helper function to draw a single invoice onto a section of the PDF
  const drawInvoiceVerticalHalfPage = async (doc, bill, village, offsetY) => {
    const totalPageWidth = doc.internal.pageSize.getWidth(); // 210 mm for A4 portrait
    const singleInvoiceHeight = doc.internal.pageSize.getHeight() / 2; // ~148.5 mm for half A4 portrait height
    const marginX = 10; // Left/Right margin for the full width of the invoice
    let currentY = 10 + offsetY; // Starting Y position for this half-page, adjusted by offsetY

    // --- Header Section ---
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = marginX; // Logo X position is fixed on the left margin
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

    currentY = Math.max(currentAddressY + 5, logoY + logoHeight + 5); // Ensure currentY is below logo/address

    // Invoice Header (Top Right)
    doc.setFontSize(16);
    doc.text('ใบแจ้งหนี้/INVOICE', totalPageWidth - marginX, logoY, { align: 'right' });

    // Invoice Details (Right Side)
    doc.setFontSize(10);
    let invoiceNumberFormatted = 'N/A';
    if (bill.billing_month && bill.bill_id) {
      const [month, year] = bill.billing_month.split('/');
      const formattedMonth = month.padStart(2, '0');
      invoiceNumberFormatted = `${year}${formattedMonth}${bill.bill_id}`;
    }
    doc.text(`เลขที่ใบแจ้งหนี้/Invoice No: ${invoiceNumberFormatted}`, totalPageWidth - marginX, logoY + 10, { align: 'right' });
    doc.text(`วันที่ออกใบแจ้งหนี้/Issued Date: ${formatReadingDate(new Date(bill.current_meter_date))}`, totalPageWidth - marginX, logoY + 15, { align: 'right' });
    doc.text(`วันที่ครบกำหนดชำระ/Due Date: ${parseMonthYearToDate(bill.billing_month) ? new Date(parseMonthYearToDate(bill.billing_month)).toLocaleDateString('th-TH') : 'N/A'}`, totalPageWidth - marginX, logoY + 20, { align: 'right' });

    //currentY = Math.max(currentY + 8); // Ensure currentY is below invoice details
    currentY = currentY - 4;
    // Customer Details (Left Side)
    doc.setFontSize(10);
    doc.text(`บ้านเลขที่/Code: ${bill.house_number || bill.address || 'N/A'}`, marginX, currentY);
    currentY += 5;
    doc.text(`ชื่อผู้ใช้น้ำ/NAME: ${bill.customer_name || 'N/A'}`, marginX, currentY);
    currentY += 5;

    // Table Header for Usage Details
    doc.setFontSize(10);
    doc.setFillColor(230, 230, 230);
    doc.rect(marginX, currentY, (totalPageWidth - 50) - (2 * marginX), 6, 'F'); // Full width of the content area
    doc.setTextColor(0, 0, 0);
    doc.text('ลำดับ/No.', marginX + 3, currentY + 4);
    doc.text('รายละเอียด/Description', marginX + 20, currentY + 4, { align: 'left' });
    doc.text('จำนวนหน่วยที่ใช้/Units Used', totalPageWidth - marginX - 100, currentY + 4, { align: 'right' });
    doc.text('จำนวนเงิน/Amount', totalPageWidth - marginX - 55, currentY + 4, { align: 'right' });
    currentY += 6;

    // Table Body - Water Bill
    doc.text('1', marginX + 3, currentY + 4);
    doc.text('ค่าน้ำประปา', marginX + 15, currentY + 4);
    doc.text(`${bill.water_usage || '0'}`, totalPageWidth - marginX - 110, currentY + 4, { align: 'right' });
    doc.text(`${formatNumber(bill.base_amount)}`, totalPageWidth - marginX - 60, currentY + 4, { align: 'right' });
    currentY += 6;

    // Water Meter Reading Description
    doc.setFontSize(9);



    const currentBillingDateObj = parseMonthYearToDate(bill.billing_month);
    let previousBillingDateObj = null;
    if (currentBillingDateObj) {
      previousBillingDateObj = new Date(currentBillingDateObj);
      previousBillingDateObj.setMonth(previousBillingDateObj.getMonth() - 1); // For previous month's reading
    }
    const currentReadingDateStr = formatReadingDate(new Date(bill.current_meter_date));
    const previousReadingDateStr = formatReadingDate(new Date(bill.previous_meter_data));
    const previousReadingLine = `ครั้งก่อน ${previousReadingDateStr} เลขมิเตอร์  ${bill.previous_meter_reading || '0'} ครั้งนี้ ${currentReadingDateStr} เลขมิเตอร์  ${bill.current_meter_reading || '0'}`;
    doc.text(previousReadingLine, marginX + 15, currentY + 3);
    //currentY += 5;
    //doc.text(currentReadingLine, marginX + 15, currentY + 6);

    currentY += 5;

    // Add Images
    const imgXOffset = marginX + 5;
    const imgWidth = 45;
    const imgHeight = 35;
    const imgSpacing = 5;

    if (bill.previous_meter_image_url) {
      try {
        const img1 = await toBase64(bill.previous_meter_image_url);
        if (img1) {
          doc.addImage(img1, 'PNG', totalPageWidth - imgXOffset - 35, currentY + -20, imgWidth, imgHeight);
          doc.text('ภาพมิเตอร์ครั้งก่อน', totalPageWidth - imgWidth + 17, currentY + imgHeight - 15, { align: 'center' });
        }
      } catch (error) {
        console.error("Failed to load current meter image:", error);
      }
    }
    if (bill.current_meter_image_url) {
      try {
        const img2 = await toBase64(bill.current_meter_image_url);
        if (img2) {
          // Adjusted position for the second image to be beside the first
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
    // doc.rect(marginX, currentY, (totalPageWidth-50) - (2 * marginX), 6, 'F');
    doc.line(marginX, currentY, totalPageWidth - 62, currentY);
    currentY += 4;
    doc.text('จำนวนเงินเดือนนี้', marginX, currentY);
    doc.text(`${formatNumber(bill.base_amount) || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    doc.text('ค่าบำรุง', marginX, currentY);
    doc.text(`${bill.additional_fees_amount || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    currentY += 5;

    doc.text('ค่าใช้จ่ายอื่นๆ', marginX, currentY);
    doc.text(`${bill.other_charges || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
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
    doc.text(`${formatNumber(bill.total_amount) || '0.00'}`, totalPageWidth - marginX - 55, currentY, { align: 'right' });
    doc.setFontSize(10);
    const amountInWords = convertBahtToThaiWords(bill.total_amount);
    doc.text(amountInWords, (totalPageWidth / 2) - 20, currentY, { align: 'center' }); // Centered for full width
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
    //currentY += 4;
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
    //currentY += 5;
    doc.setFontSize(10);
    doc.text('ผู้แจ้งยอด', totalPageWidth - marginX - 57, currentY - 15, { align: 'right' });
  };

  const handlePrintSingleBill = async (bill, village) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('THSarabunNew', 'normal');
    const singleInvoiceHeight = doc.internal.pageSize.getHeight() / 2;
    await drawInvoiceVerticalHalfPage(doc, bill, village, 0);
    doc.setDrawColor(150, 150, 150);
    doc.line(10, singleInvoiceHeight, doc.internal.pageSize.getWidth() - 10, singleInvoiceHeight); // Line across the middle
    doc.setDrawColor(0, 0, 0); // Reset draw color

    await drawInvoiceVerticalHalfPage(doc, bill, village, singleInvoiceHeight); // offsetY = singleInvoiceHeight for the bottom section

    doc.save(`Bill_${bill.meter_number || 'unknown'}.pdf`);
  };

  // ฟังก์ชัน formatAddress (เหมือนใน VillageSettings)
  function formatAddress(village) {
    return `หมู่ที่ ${village.village_number || '-'} ต.${village.sub_district || '-'} อ.${village.district || '-'} จ.${village.province || '-'} ${village.postal_code || ''}`;
  }
  /**
   * Generates a single PDF containing a summary table of all filtered bills using jsPDF-AutoTable.
   * This is much easier for table generation.
   */
  const handlePrintAllBills = () => {
    if (filteredBills.length === 0) {
      alert('ไม่พบบิลที่ต้องการพิมพ์');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('Sarabun'); // Make sure this font is available/embedded
    doc.setFontSize(12);

    let yPos = 20;

    doc.setFontSize(16);
    doc.text(`สรุปบิลค่าน้ำ ประจำเดือน ${months[billingPeriod.month - 1]} ${billingPeriod.year}`, 105, yPos, { align: 'center' });
    yPos += 15;

    const headers = [
      ['เลขมิเตอร์', 'ชื่อผู้ใช้น้ำ', 'ที่อยู่', 'หน่วยที่ใช้', 'ค่าน้ำ', 'ค่าบำรุง', 'อื่นๆ', 'ยอดรวม', 'สถานะ']
    ];
    const data = filteredBills.map(bill => [
      bill.meter_number || '',
      bill.customer_name || '',
      bill.address || '',
      (bill.water_usage || 0) + ' หน่วย',
      (formatNumber(bill.base_amount) || 0).toLocaleString(),
      (bill.additional_fees_amount || 0).toLocaleString(),
      (bill.other_charges || 0).toLocaleString(),
      (formatNumber(bill.total_amount) || 0).toLocaleString(),
      bill.is_paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'
    ]);

    // Add table to PDF using jspdf-autotable plugin
    doc.autoTable({
      head: headers,
      body: data,
      startY: yPos,
      theme: 'grid', // 'striped', 'grid', 'plain'
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold' },
      styles: {
        font: 'Sarabun', // Apply the font to the table content
        fontSize: 10,
        cellPadding: 2
      },
      columnStyles: {
        // Example: right align numeric columns
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      }
    });

    doc.save(`All_Bills_Summary_${formatBillingPeriodForAPI(billingPeriod)}.pdf`);
  };
  /**
   * Handles marking a bill as paid, interacting with the backend payment recording API.
   * @param {number} billId - The ID of the bill to mark as paid.
   * @param {number} billTotalAmount - The total amount of the bill to be recorded as payment.
   * @param {boolean} currentPaidStatus - The current paid status of the bill.
   */
  const handleMarkAsPaid = async (billId, billTotalAmount, currentPaidStatus) => {
    if (currentPaidStatus) {
      alert('This bill is already paid.');
      return;
    }

    if (!window.confirm('Do you want to mark this bill as paid?')) {
      return; // User cancelled
    }

    setLoading(true);
    setError(null);
    console.log('Payment response:', billTotalAmount);
    try {

      // Prepare payment data for the backend API
      const paymentData = {
        base_amount: billTotalAmount,
        payment_date: new Date().toISOString(), // Current date/time in ISO format
        payment_method: 'Cash', // Default method, could be made configurable via a modal
        payment_reference: 'Manual Mark Paid (Admin Panel)', // Reference note
        received_by: user?.name || 'Admin User', // Fallback to 'Admin User' if user name not available
        payment_note: 'Marked as paid through admin panel.'
      };

      // Call the recordPayment API
      const response = await billingService.updateBillpay(billId, paymentData);

      if (!response.data.success) {
        throw new Error(response.message || 'Failed to mark bill as paid.');
      }

      // Update local state to reflect the paid status
      setBills(prevBills =>
        prevBills.map(bill =>
          bill.id === billId ? { ...bill, is_paid: true, status: 'paid' } : bill // Update is_paid and status
        )
      );
      fetchBills();
      alert('Bill successfully marked as paid!');
    } catch (err) {
      console.error('Error marking bill as paid:', err);
      setError(err.message || 'An error occurred while marking the bill as paid.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the generation of new bills (placeholder logic).
   */
  const handleGenerateBills = () => {
    alert(`Bills for ${months[billingPeriod.month - 1]} ${billingPeriod.year} have been generated.`);
    setShowGenerateBillsModal(false);
    // In a real application, you would call an API to trigger bill generation on the backend.
    // After successful generation, you might refetch bills: fetchBills();
  };

  // --- Statistics Calculation Functions ---
  const getTotalBilledAmount = () => {
    console.log('Calculating total billed amount for filtered bills:', filteredBills);
    return filteredBills.reduce((total, bill) =>
      total + Number(bill.total_amount || 0), 0
    );
  };

  const getTotalPaidAmount = () => {
    return filteredBills.reduce((total, bill) =>
      total + (bill.is_paid === true ? Number(bill.total_amount || 0) : 0), 0
    );
  };

  const getUnpaidCount = () => {
    return filteredBills.filter(bill => bill.is_paid === false).length;
  };

  // --- Filter and Export Actions ---
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('meterNumber');
    setSortOrder('asc');
  };

  const exportToCSV = () => {
    const csvData = filteredBills.map(bill => ({
      'เลขมิเตอร์': bill.meter_number || '',
      'ชื่อผู้ใช้น้ำ': bill.customer_name || '',
      'ที่อยู่': bill.address || '',
      'หน่วยที่ใช้': bill.water_usage || 0,
      'ค่าน้ำ': formatNumber(bill.base_amount) || 0,
      'ค่าบำรุง': bill.maintenance_fee || 0,
      'อื่นๆ': bill.other_charges || 0,
      'ยอดรวม': formatNumber(bill.total_amount) || 0,
      'กำหนดชำระ': currentVillage.payment_due_date ? `ทุกวันที่ ${currentVillage.payment_due_date}` : 'N/A',
      'สถานะ': bill.is_paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && (value.includes(',') || value.includes('\n')) ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ].join('\n');

    // เพิ่ม BOM เพื่อรองรับภาษาไทย
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bills_${months[billingPeriod.month - 1]}_${billingPeriod.year}.csv`;
    link.click();
  };

  return (
    <div className="billing-container">
      <header className="page-header">
        <div className="header-content">
          <h1>จัดการบิลค่าน้ำ</h1>
          {user?.role === 'admin' && (
            <button
              className="generate-bills-btn"
              onClick={() => setShowGenerateBillsModal(true)}
            >
              สร้างบิลประจำเดือน
            </button>
          )}
        </div>
      </header>

      <div className="billing-period-selector">
        <div className="period-label">บิลประจำเดือน:</div>
        <div className="period-controls">
          <select value={billingPeriod.month} onChange={handleMonthChange}>
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select value={billingPeriod.year} onChange={handleYearChange}>
            {generateYears().map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="billing-stats">
          <div className="stat-box">
            <div className="stat-label">จำนวนบิล</div>
            <div className="stat-value">{filteredBills.length} / {bills.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">ยอดเรียกเก็บ</div>
            <div className="stat-value">฿{getTotalBilledAmount().toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">ชำระแล้ว</div>
            <div className="stat-value">฿{getTotalPaidAmount().toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">ค้างชำระ</div>
            <div className="stat-value">{getUnpaidCount()} ราย</div>
          </div>
        </div>
      </div>

      <div className="billing-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="ค้นหาตามเลขมิเตอร์, ชื่อผู้ใช้น้ำ หรือที่อยู่"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn" onClick={applyFilters}>ค้นหา</button>
        </div>

        <div className="filter-group">
          <label>สถานะ:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="unpaid">ยังไม่ชำระ</option>
          </select>
        </div>

        <div className="filter-group">
          <label>เรียงตาม:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="meterNumber">เลขมิเตอร์</option>
            <option value="resident">ชื่อผู้ใช้น้ำ</option>
            <option value="usage">หน่วยที่ใช้</option>
            <option value="total">ยอดรวม</option>
            <option value="dueDate">กำหนดชำระ</option>
            <option value="status">สถานะ</option>
          </select>
        </div>

        <div className="filter-group">
          <label>ลำดับ:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">น้อยไปมาก</option>
            <option value="desc">มากไปน้อย</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="clear-filter-btn" onClick={clearFilters}>
            ล้างตัวกรอง
          </button>
          <button className="export-btn" onClick={exportToCSV}>
            ส่งออก CSV
          </button>

        </div>
      </div>

      {bills.length > 0 && (
        <div className="filter-results">
          <span>แสดง {filteredBills.length} รายการจากทั้งหมด {bills.length} รายการ</span>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">เกิดข้อผิดพลาด: {error}</p>
          <button onClick={fetchBills} className="retry-btn">ลองใหม่</button>
        </div>
      )}

      <div className="bills-list">
        <table className="bills-table">
          <thead>
            <tr>
              <th>เลขมิเตอร์</th>
              <th>ชื่อผู้ใช้น้ำ</th>
              <th>ที่อยู่</th>
              <th>หน่วยที่ใช้</th>
              <th>ค่าน้ำ</th>
              <th>ค่าบำรุง</th>
              <th>อื่นๆ</th>
              <th>ยอดรวม</th>
              <th>กำหนดชำระ</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 && !loading ? (
              <tr>
                <td colSpan="11" className="no-data">
                  {bills.length === 0 ? 'ไม่พบข้อมูลบิลสำหรับเดือนนี้' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
                </td>
              </tr>
            ) : (
              filteredBills.map(bill => (
                <tr key={bill.bill_id}>
                  <td>{bill.meter_number}</td>
                  <td>{bill.customer_name}</td>
                  <td>{bill.address}</td>
                  <td>{bill.water_usage || 0} หน่วย</td>
                  <td>฿{(formatNumber(bill.base_amount) || 0).toLocaleString()}</td>
                  <td>฿{(bill.additional_fees_amount || 0).toLocaleString()}</td>
                  <td>฿{(bill.other_charges || 0).toLocaleString()}</td>
                  <td>฿{(formatNumber(bill.total_amount) || 0).toLocaleString()}</td>
                  <td>ทุกวันที่ {currentVillage.payment_due_date}</td>
                  <td>
                    <span className={`status-badge ${bill.is_paid ? 'status-paid' : 'status-unpaid'}`}>
                      {bill.is_paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditBill(bill)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="action-btn pay-btn"
                      onClick={() => handleMarkAsPaid(bill.bill_id, bill.total_amount, bill.is_paid)}
                      disabled={bill.is_paid}
                    >
                      {bill.is_paid ? 'ชำระแล้ว' : 'ทำเครื่องหมายว่าชำระแล้ว'}
                    </button>
                    {/* Direct Print Button using jsPDF */}
                    <button
                      className="action-btn print-single-btn"
                      onClick={() => handlePrintSingleBill(bill, currentVillage)}
                    >
                      พิมพ์ (PDF)
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Bill Modal - แก้ไขให้แสดงเฉพาะฟิลด์ที่แก้ไขได้ */}
      {showEditBillModal && selectedBill && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>แก้ไขบิลค่าน้ำ</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowEditBillModal(false);
                  setSelectedBill(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="bill-info">
              <div><strong>เลขมิเตอร์:</strong> {selectedBill.meter_number}</div>
              <div><strong>ชื่อผู้ใช้น้ำ:</strong> {selectedBill.customer_name}</div>
              <div><strong>ที่อยู่:</strong> {selectedBill.address}</div>
              <div><strong>หน่วยที่ใช้:</strong> {selectedBill.water_usage || 0} หน่วย</div>
            </div>

            <form onSubmit={handleBillUpdate}>
              {/* ช่องที่แก้ไขได้ - ค่าน้ำ */}
              <div className="form-group">
                <label>ค่าน้ำ (บาท): <span style={{ color: '#4CAF50', fontSize: '0.8em', fontWeight: 'bold' }}>*แก้ไขได้</span></label>
                <input
                  type="number"
                  name="waterCharge"
                  defaultValue={selectedBill.base_amount || 0}
                  min="0"
                  step="0.01"
                  required
                  style={{ border: '2px solid #4CAF50', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* ช่องที่แก้ไขไม่ได้ - แสดงข้อมูลอย่างเดียว */}
              <div className="form-group">
                <label>ค่าบำรุง (บาท): <span style={{ color: '#999', fontSize: '0.8em', fontStyle: 'italic' }}>อ่านอย่างเดียว</span></label>
                <input
                  type="number"
                  name="maintenanceCharge"
                  value={selectedBill.additional_fees_amount || 0}
                  readOnly
                  disabled
                  style={{ border: '1px solid #ddd', backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>ค่าใช้จ่ายอื่นๆ (บาท): <span style={{ color: '#999', fontSize: '0.8em', fontStyle: 'italic' }}>อ่านอย่างเดียว</span></label>
                <input
                  type="number"
                  name="otherCharge"
                  value={selectedBill.other_charges || 0}
                  readOnly
                  disabled
                  style={{ border: '1px solid #ddd', backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>วันกำหนดชำระ:</label>
                <input
                  type="text"
                  name="dueDate"
                  readOnly
                  disabled
                  defaultValue={'ทุกวันที่ ' + (currentVillage.payment_due_date || 'N/A') + ' ของทุกเดือน'}
                  style={{ border: '1px solid #ddd', backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>หมายเหตุ: <span style={{ color: '#4CAF50', fontSize: '0.8em', fontWeight: 'bold' }}>*แก้ไขได้</span></label>
                <textarea
                  name="note"
                  defaultValue={selectedBill.note || ''}
                  style={{ border: '2px solid #4CAF50', backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditBillModal(false);
                    setSelectedBill(null);
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

      {/* Generate Bills Modal (remains unchanged) */}
      {showGenerateBillsModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>สร้างบิลประจำเดือน</h2>
              <button
                className="close-btn"
                onClick={() => setShowGenerateBillsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="generate-bills-content">
              <p>คุณกำลังจะสร้างบิลค่าน้ำประจำเดือน {months[billingPeriod.month - 1]} {billingPeriod.year}</p>

              <div className="warning-message">
                <strong>หมายเหตุ:</strong> การดำเนินการนี้จะสร้างบิลค่าน้ำสำหรับผู้ใช้น้ำทุกรายที่มีการบันทึกค่ามิเตอร์ในระบบ
              </div>

              <div className="form-group">
                <label>วันกำหนดชำระ:</label>
                <input type="date" name="dueDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowGenerateBillsModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="confirm-btn"
                onClick={handleGenerateBills}
              >
                สร้างบิล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingManagement;