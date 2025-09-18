// src/components/AddressSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAddressForm } from '../hooks/useAddressData';
import { addressService } from '../services/addressService';

// Component สำหรับ Autocomplete Input
const AutocompleteInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = null,
  required = false,
  displayKey = 'name_th',
  valueKey = 'id',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // กรองและเรียงลำดับตัวเลือก
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options.slice(0, 100); // จำกัด 100 รายการ

    const filtered = addressService.searchItems(options, searchTerm, [displayKey, 'name_en']);
    return filtered.slice(0, 50); // จำกัด 50 รายการเมื่อค้นหา
  }, [options, searchTerm, displayKey]);

  const selectedOption = options.find(option => option[valueKey] === value);

  // จัดการการเลือก
  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // จัดการการพิมพ์
  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);

    if (!isOpen) setIsOpen(true);
  };

  // จัดการ keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const element = listRef.current.children[highlightedIndex];
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`form-group ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      <div className="autocomplete-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedOption ? selectedOption[displayKey] : '')}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearchTerm('');
              setHighlightedIndex(-1);
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`autocomplete-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          autoComplete="off"
        />

        {isOpen && !disabled && (
          <div className="autocomplete-dropdown" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option[valueKey]}
                  className={`autocomplete-option ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="option-main">{option[displayKey]}</div>
                  {option.name_en && option.name_en !== option[displayKey] && (
                    <div className="option-sub">{option.name_en}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="autocomplete-no-options">
                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// Component หลักสำหรับเลือกที่อยู่
const AddressSelector = ({
  initialValues = {},
  onChange,
  disabled = false,
  showLabels = true,
  layout = 'grid', // 'grid' | 'vertical'
  className = ''
}) => {
  const {
    selectedProvince,
    selectedAmphure,
    selectedTambon,
    postalCode,
    errors,
    provinces,
    amphures,
    tambons,
    loading,
    error,
    handleProvinceChange,
    handleAmphureChange,
    handleTambonChange,
    handlePostalCodeChange,
    getAddressData,
    isValid,
    isComplete
  } = useAddressForm(initialValues);

  // แจ้งเตือนการเปลี่ยนแปลงกลับไปยัง parent component

  useEffect(() => {
    // province
    if (
      initialValues.province &&
      typeof initialValues.province === 'string' &&
      provinces.length > 0 &&
      (!selectedProvince || selectedProvince.name_th !== initialValues.province)
    ) {
      const found = provinces.find(p => p.name_th === initialValues.province);
      if (found) handleProvinceChange(found);
    }
    // district
    if (
      initialValues.district &&
      typeof initialValues.district === 'string' &&
      amphures.length > 0 &&
      (!selectedAmphure || selectedAmphure.name_th !== initialValues.district)
    ) {
      const found = amphures.find(a => a.name_th === initialValues.district);
      if (found) handleAmphureChange(found);
    }
    // sub_district
    if (
      initialValues.sub_district &&
      typeof initialValues.sub_district === 'string' &&
      tambons.length > 0 &&
      (!selectedTambon || selectedTambon.name_th !== initialValues.sub_district)
    ) {
      const found = tambons.find(t => t.name_th === initialValues.sub_district);
      if (found) handleTambonChange(found);
    }
    // postal_code
    if (
      initialValues.postal_code &&
      typeof initialValues.postal_code === 'string' &&
      initialValues.postal_code !== postalCode
    ) {
      handlePostalCodeChange(initialValues.postal_code);
    }
    // eslint-disable-next-line
  }, [
    initialValues.province,
    initialValues.district,
    initialValues.sub_district,
    initialValues.postal_code,
    provinces,
    amphures,
    tambons
  ]);
  if (error) {
    return (
      <div className="address-selector-error">
        <p>เกิดข้อผิดพลาด: {error}</p>
        <button onClick={() => window.location.reload()}>โหลดใหม่</button>
      </div>
    );
  }

  return (
    <div className={`address-selector ${layout} ${className}`}>
      {showLabels && <h4 className="address-selector-title">ที่อยู่</h4>}

      <div className={`address-form ${layout === 'grid' ? 'grid-layout' : 'vertical-layout'}`}>
        <AutocompleteInput
          label="จังหวัด"
          value={selectedProvince?.id}
          onChange={handleProvinceChange}
          options={provinces}
          placeholder="เลือกหรือพิมพ์ชื่อจังหวัด"
          disabled={disabled || loading}
          error={errors.province}
          required
        />

        <AutocompleteInput
          label="อำเภอ/เขต"
          value={selectedAmphure?.id}
          onChange={handleAmphureChange}
          options={amphures}
          placeholder="เลือกหรือพิมพ์ชื่ออำเภอ"
          disabled={disabled || loading || !selectedProvince}
          error={errors.amphure}
          required
        />

        <AutocompleteInput
          label="ตำบล/แขวง"
          value={selectedTambon?.id}
          onChange={handleTambonChange}
          options={tambons}
          placeholder="เลือกหรือพิมพ์ชื่อตำบล"
          disabled={disabled || loading || !selectedAmphure}
          error={errors.tambon}
          required
        />

        <div className="form-group">
          <label className="form-label">
            รหัสไปรษณีย์
            <span className="required">*</span>
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => handlePostalCodeChange(e.target.value)}
            placeholder="5 หลัก หรือจะถูกเติมอัตโนมัติ"
            maxLength="5"
            pattern="[0-9]{5}"
            disabled={disabled || loading}
            className={`form-input ${errors.postalCode ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          />
          {errors.postalCode && <div className="error-message">{errors.postalCode}</div>}
          <small className="help-text">
            สามารถพิมพ์รหัสไปรษณีย์เพื่อเลือกที่อยู่อัตโนมัติ
          </small>
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          <span className="loading-spinner"></span>
          กำลังโหลดข้อมูล...
        </div>
      )}
    </div>
  );
};

// Styles สำหรับ AddressSelector
const AddressSelectorStyles = `
  .address-selector {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    background: #f8fafc;
  }

  .address-selector-title {
    margin: 0 0 16px 0;
    color: #374151;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  }

  .address-selector-error {
    padding: 20px;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #991b1b;
    text-align: center;
  }

  .address-form.grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .address-form.vertical-layout .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #374151;
    font-size: 14px;
  }

  .required {
    color: #ef4444;
    margin-left: 2px;
  }

  .autocomplete-wrapper {
    position: relative;
  }

  .autocomplete-input,
  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
  }

  .autocomplete-input:focus,
  .form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .autocomplete-input.error,
  .form-input.error {
    border-color: #ef4444;
  }

  .autocomplete-input.disabled,
  .form-input.disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 6px 6px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .autocomplete-option {
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
  }

  .autocomplete-option:hover,
  .autocomplete-option.highlighted {
    background: #f3f4f6;
  }

  .autocomplete-option:last-child {
    border-bottom: none;
  }

  .option-main {
    font-weight: 500;
    color: #374151;
  }

  .option-sub {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  .autocomplete-no-options {
    padding: 12px;
    color: #6b7280;
    text-align: center;
    font-style: italic;
  }

  .error-message {
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
  }

  .help-text {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
    display: block;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    color: #6b7280;
    font-size: 14px;
    background: #f9fafb;
    border-radius: 6px;
    margin-top: 16px;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .address-form.grid-layout {
      grid-template-columns: 1fr;
    }
  }
`;

export { AddressSelector, AutocompleteInput, AddressSelectorStyles };