'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';

interface DatePickerInputProps {
  value?: string; // Format: YYYY-MM-DD[cite: 10]
  onChange?: (val: string) => void;
  onDateSelected?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseDateString = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // Expected format: YYYY-MM-DD[cite: 10]
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  return new Date();
};

const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value = '',
  onChange,
  onDateSelected,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDateString(value));
  const [viewDate, setViewDate] = useState<Date>(() => parseDateString(value));
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value) {
      const parsed = parseDateString(value);
      setSelectedDate(parsed);
      setViewDate(parsed);
    }
  }, [value]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    const formatted = formatDateString(newDate);
    
    if (onChange) onChange(formatted);
    if (onDateSelected) onDateSelected(formatted);
    
    setIsOpen(false);
    setShowYearPicker(false);
  };

  const handleSelectYear = (year: number) => {
    const targetDate = new Date(year, viewMonth, 1);
    const formattedDateString = formatDateString(targetDate);
    setViewDate(new Date(formattedDateString));
    setShowYearPicker(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const startDayOffset = getFirstDayOfWeek(viewYear, viewMonth);

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  const yearRange = Array.from({ length: 24 }, (_, i) => viewYear - 12 + i);

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const openPicker = () => {
    if (!disabled) {
      setViewDate(selectedDate);
      setShowYearPicker(false);
      setIsOpen(true);
    }
  };

  const modalContent = isOpen ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => {
        setIsOpen(false);
        setShowYearPicker(false);
      }}
    >
      <div
        style={{
          width: 320,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0px 20px 40px rgba(15, 23, 42, 0.3)',
          border: '1px solid #E2E8F0',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 12,
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          {!showYearPicker ? (
            <button
              onClick={handlePrevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontWeight: 500 }}
            >
              Previous
            </button>
          ) : (
            <button
              onClick={() => setViewDate(new Date(viewYear - 24, viewMonth, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 11, fontWeight: 600 }}
            >
              &laquo; -24 Years
            </button>
          )}

          <button
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: '700',
              color: '#0F172A',
              padding: '2px 6px',
              borderRadius: 4,
            }}
            title="Click to select year"
          >
            {MONTH_NAMES[viewMonth]} <span style={{ color: '#4F46E5', textDecoration: 'underline' }}>{viewYear}</span>
          </button>

          {!showYearPicker ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleNextMonth}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontWeight: 500 }}
              >
                Next
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowYearPicker(false);
                }}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: 4,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#475569',
                  fontWeight: '700',
                }}
                title="Close modal without changes"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={() => setViewDate(new Date(viewYear + 24, viewMonth, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 11, fontWeight: 600 }}
            >
              +24 Years &raquo;
            </button>
          )}
        </div>

        {/* Conditional View: Year Selection Grid vs Standard Days Grid */}
        {showYearPicker ? (
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>
              Select Year for Rapid Navigation
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 6,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {yearRange.map((yr) => {
                const isCurrentYear = yr === viewYear;
                return (
                  <button
                    key={`yr-${yr}`}
                    onClick={() => handleSelectYear(yr)}
                    style={{
                      width: 64,
                      height: 32,
                      borderRadius: 4,
                      border: isCurrentYear ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                      backgroundColor: isCurrentYear ? '#EEF2FF' : '#F8FAFC',
                      color: isCurrentYear ? '#4F46E5' : '#0F172A',
                      fontWeight: isCurrentYear ? '700' : '500',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              {DAYS_OF_WEEK.map((day) => (
                <span
                  key={day}
                  style={{ width: 38, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#64748B' }}
                >
                  {day}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
              }}
            >
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} style={{ width: `${100 / 7}%`, height: 38 }} />;
                }
                const active = isSelected(day);
                return (
                  <div
                    key={`day-${day}`}
                    style={{
                      width: `${100 / 7}%`,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      onClick={() => handleSelectDay(day)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        border: 'none',
                        backgroundColor: active ? '#84CC16' : 'transparent',
                        color: active ? '#000000' : '#0F172A',
                        fontWeight: active ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {day}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.textInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          editable={!disabled}
          onChangeText={onChange}
        />
        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.disabledButton]}
          onPress={openPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  textInput: {
    flex: 1, height: 32, borderWidth: 1, borderColor: '#000000', borderRadius: 2,
    paddingHorizontal: 8, fontSize: 12, color: '#0F172A', backgroundColor: '#FFFFFF', marginRight: 4,
  },
  pickerButton: {
    width: 32, height: 32, borderWidth: 1, borderColor: '#000000', borderRadius: 2,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  disabledButton: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
  pickerIcon: { fontSize: 10, color: '#000000' },
});

export default DatePickerInput;