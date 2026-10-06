'use client';

import React, { useState, useEffect, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { loadFiles } from './ts/FilesExplorerPanel';
import { showForm } from './../panel/ts/NewPanel';
import { updateObject } from './../panel/ts/EditPanel';
import { DOMAIN_FILES } from '../global';

const PAGE_SIZE = 10;

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '11px';
const COMPACT_PADDING = '2px';
const COMPACT_MARGIN = '2px';

export const FILES_URI = DOMAIN_FILES();

export interface FilesExplorerPanelProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  tableName?: string;
  sessionId?: string;
  fileValue?: any;
  children?: React.ReactNode;
}

// Arrow Left Icon (Outline Triangle)
const ArrowLeftIcon = ({ color = '#000000', size = 14 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('polygon', { points: '19 20 5 12 19 4 19 20' })
  );

// Arrow Right Icon (Outline Triangle)
const ArrowRightIcon = ({ color = '#000000', size = 14 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('polygon', { points: '5 4 19 12 5 20 5 4' })
  );

const CloseIcon = ({ color = '#475569', size = 14 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  );

const MaximizeIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('path', { d: 'M15 3h6v6' }),
    createElement('path', { d: 'M9 21H3v-6' }),
    createElement('path', { d: 'M21 3l-7 7' }),
    createElement('path', { d: 'M3 21l7-7' })
  );

const MinimizeIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('path', { d: 'M4 14h6v6' }),
    createElement('path', { d: 'M20 10h-6V4' }),
    createElement('path', { d: 'M14 10l7-7' }),
    createElement('path', { d: 'M10 14l-7 7' })
  );

// File Extension Icon generator & Clickable Link wrapper
const getFileBadgeHtml = (ext: string, fileName: string) => {
  let bg = '#475569';
  const lowerExt = ext.toLowerCase();
  if (lowerExt === 'pdf') bg = '#DC2626';
  else if (['jpg', 'jpeg', 'png'].includes(lowerExt)) bg = '#0284C7';
  else if (lowerExt === 'html') bg = '#D97706';
  else if (lowerExt === 'sql') bg = '#16A34A';
  else if (lowerExt === 'txt') bg = '#4B5563';

  const readUrl = `${FILES_URI}/api/read?fileName=${encodeURIComponent(fileName)}`; //`http://localhost:3002/api/read?fileName=${encodeURIComponent(fileName)}`;

  return `<a href="${readUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:4px; max-width:100%; word-break:break-word;"><span style="display:inline-block; font-size:9px; font-weight:bold; padding:1px 4px; border-radius:2px; background:${bg}; color:#fff; text-transform:uppercase; flex-shrink:0;">${ext}</span><span style="overflow-wrap:break-word; word-break:break-word; color:#4F46E5; text-decoration:underline;">${fileName}</span></a>`;
};

const fileExplorerTableStyles = `
  .file-explorer-table-container {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    overflow-x: auto;
    overflow-y: auto;
    background-color: #ffffff;
    box-sizing: border-box;
    display: block;
    cursor: default;
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
    font-size: ${COMPACT_FONT_SIZE};
  }

  .file-explorer-table-container::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .file-explorer-table-container::-webkit-scrollbar-track {
    background: #F1F5F9;
  }
  .file-explorer-table-container::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 2px;
  }
  .file-explorer-table-container::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }

  .file-explorer-table-container table {
    width: 100%;
    border-collapse: collapse;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: ${COMPACT_FONT_SIZE};
    color: #334155;
    margin: ${COMPACT_MARGIN};
  }

  .file-explorer-table-container tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
    border-bottom: 1px solid #F1F5F9;
    font-size: ${COMPACT_FONT_SIZE};
  }

  .file-explorer-table-container th {
    background-color: #F8FAFC;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: ${COMPACT_FONT_SIZE};
    text-align: left;
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    border-bottom: 1.5px solid #E2E8F0;
    border-right: 1px solid #F1F5F9;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .file-explorer-table-container td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    border-bottom: 1px solid #F8FAFC;
    border-right: 1px solid #F8FAFC;
    vertical-align: middle;
    max-width: 250px;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    font-size: ${COMPACT_FONT_SIZE};
  }

  .file-explorer-table-container tr:nth-child(even) {
    background-color: #FAFAFA;
  }

  .file-explorer-table-container tr:hover td {
    background-color: #EEF2FF;
    color: #312E81;
  }
`;

export const FilesExplorerPanel: React.FC<FilesExplorerPanelProps> = ({
  visible = true,
  onClose,
  title = 'Form: Files Explorer',
  tableName = 'Files Explorer',
  sessionId = '',
  fileValue,
  children,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [rowStart, setRowStart] = useState<number>(1);
  const [rowEnd, setRowEnd] = useState<number>(PAGE_SIZE);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [htmlTable, setHtmlTable] = useState<string>('');

  // State requirements
  const [formColumns, setFormColumns] = useState<any[]>([]);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState<boolean>(false);
  const [selectedColumnField, setSelectedColumnField] = useState<{ label: string; html_type: string; col_name?: string } | null>(null);

  // Save result popup states
  const [isSaveResultOpen, setIsSaveResultOpen] = useState<boolean>(false);
  const [saveResultMessage, setSaveResultMessage] = useState<string>('');

  const handleEditColumnClick = async () => {
    try {
      const res = await showForm({ tableName: "UPLOADED_FILES_FORM_ID" });
      if (res && res.success) {
        const columnsData = res.columns || res.data?.columns || res.data || [];
        const records = Array.isArray(columnsData) ? columnsData : columnsData.columns || [];
        setFormColumns(records);
        setIsColumnModalOpen(true);
      } else if (res && res.data) {
        const records = Array.isArray(res.data) ? res.data : res.data.columns || res.data.records || [];
        setFormColumns(records);
        setIsColumnModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching form columns:', err);
    }
  };

  const handleSelectColumnLabel = (col: any) => {
    const label = col.label || col.col_name || col.id || 'EDIT INPUT';
    const col_name = col.col_name || col.id || label.toLowerCase().replace(/\s+/g, '_');
    const html_type = (col.html_type || col.type || 'text').toLowerCase();
    setSelectedColumnField({ label, html_type, col_name });
    setIsColumnModalOpen(false);
  };

  const handleSaveColumnClick = async () => {
    if (!selectedColumnField || !selectedColumnField.label) return;

    let successCount = 0;
    let failCount = 0;

    if (typeof document !== 'undefined') {
      const container = document.querySelector('.file-explorer-table-container');
      if (!container) return;

      const inputs = container.querySelectorAll('input, select, textarea');
      if (inputs.length > 0) {
        for (let i = 0; i < inputs.length; i++) {
          const inputEl = inputs[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          const value = inputEl.value;
          const rowTr = inputEl.closest('tr');

          if (rowTr) {
            let recordId = '';
            const radioEl = rowTr.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radioEl && radioEl.value) {
              recordId = radioEl.value;
            }

            if (!recordId) {
              recordId = rowTr.getAttribute('data-recordid') || String(i + rowStart);
            }

            const targetColName = selectedColumnField.col_name || selectedColumnField.label.toLowerCase().replace(/\s+/g, '_');

            try {
              const payload = {
                tableName: 'UPLOADED_FILES_FORM_ID',
                sessionid: sessionId || '',
                recordid: recordId,
                columns: [{ col_name: targetColName, value: value }]
              };
              const res = await updateObject(payload);
              if (res && res.success) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (err) {
              console.error('Error updating object record:', err);
              failCount++;
            }
          }
        }
      }
    }

    // Show result in popup box
    setSaveResultMessage(`Save operation completed.\n`);
    setIsSaveResultOpen(true);

    // Hide Save Column & enable Edit Column
    setSelectedColumnField(null);

    // Refresh Panel table records
    fetchFilesData(rowStart, rowEnd);
  };

  const injectFileIconsAndEditColumnToHtml = (htmlString: string) => {
    if (!htmlString || typeof window === 'undefined') return htmlString;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const headers = Array.from(doc.querySelectorAll('th'));
    let savedNameColIdx = -1;
    let rowNoColIdx = -1;
    let matchedColIdx = -1;

    headers.forEach((th, idx) => {
      const text = th.textContent?.trim().toLowerCase() || '';
      if (text === 'savedname' || text === 'saved_name' || text === 'filename') {
        savedNameColIdx = idx;
      }
      if (text === 'row no' || text === 'row_no' || text === 'rowno' || text === 'no') {
        rowNoColIdx = idx;
      }
      if (selectedColumnField && text === selectedColumnField.label.trim().toLowerCase()) {
        matchedColIdx = idx;
      }
    });

    if (selectedColumnField && headers.length > 0) {
      const tableHeadTr = doc.querySelector('tr');
      if (tableHeadTr) {
        const newTh = doc.createElement('th');
        newTh.textContent = selectedColumnField.label;
        newTh.style.minWidth = '25px';
        if (rowNoColIdx !== -1 && tableHeadTr.children[rowNoColIdx + 1]) {
          tableHeadTr.insertBefore(newTh, tableHeadTr.children[rowNoColIdx + 1]);
        } else {
          tableHeadTr.appendChild(newTh);
        }
      }
    }

    if (savedNameColIdx !== -1 || doc.querySelectorAll('tr').length > 0) {
      const rows = doc.querySelectorAll('tr');
      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0 && selectedColumnField) return; // Skip header row if handled above
        const cells = row.querySelectorAll('td');

        let rowExistingValue = '';
        if (matchedColIdx !== -1 && cells[matchedColIdx]) {
          rowExistingValue = cells[matchedColIdx].textContent?.trim() || '';
        }

        if (cells[savedNameColIdx]) {
          const cell = cells[savedNameColIdx];
          const fileName = cell.textContent?.trim() || '';
          const match = fileName.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
          if (match) {
            const ext = match[1].toLowerCase();
            if (['pdf', 'html', 'txt', 'jpg', 'png', 'jpeg', 'sql'].includes(ext)) {
              cell.innerHTML = getFileBadgeHtml(ext, fileName);
            } else {
              const readUrl = `http://localhost:3002/api/read?fileName=${encodeURIComponent(fileName)}`;
              cell.innerHTML = `<a href="${readUrl}" target="_blank" rel="noopener noreferrer" style="color:#4F46E5; text-decoration:underline;">${fileName}</a>`;
            }
          } else if (fileName) {
            const readUrl = `http://localhost:3002/api/read?fileName=${encodeURIComponent(fileName)}`;
            cell.innerHTML = `<a href="${readUrl}" target="_blank" rel="noopener noreferrer" style="color:#4F46E5; text-decoration:underline;">${fileName}</a>`;
          }
        }

        if (selectedColumnField) {
          const newTd = doc.createElement('td');
          newTd.style.minWidth = '25px';
          const inputId = `edit-input-${rowIndex}`;
          const type = selectedColumnField.html_type;

          if (type === 'dropdown') {
            newTd.innerHTML = `<select id="${inputId}" style="width:100%; min-width:25px; padding:2px; font-size:11px;"><option value="${rowExistingValue}">${rowExistingValue || 'Select...'}</option></select>`;
          } else if (type === 'textarea') {
            newTd.innerHTML = `<textarea id="${inputId}" rows="3" style="width:100%; min-width:25px; height:60px; padding:2px; font-size:11px;">${rowExistingValue}</textarea>`;
          } else if (type === 'date' || type === 'timestamp') {
            newTd.innerHTML = `<input type="date" id="${inputId}" value="${rowExistingValue}" style="width:100%; min-width:25px; padding:2px; font-size:11px;" />`;
          } else {
            newTd.innerHTML = `<input type="text" id="${inputId}" value="${rowExistingValue}" style="width:100%; min-width:25px; padding:2px; font-size:11px;" placeholder="Edit..." />`;
          }

          if (rowNoColIdx !== -1 && cells[rowNoColIdx + 1]) {
            row.insertBefore(newTd, cells[rowNoColIdx + 1]);
          } else if (cells.length > 0) {
            row.insertBefore(newTd, cells[0]);
          } else {
            row.appendChild(newTd);
          }
        }
      });
    }

    return doc.body.innerHTML;
  };

  const fetchFilesData = async (start: number, end: number) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await loadFiles({
        sessionid: sessionId || '',
        filegroupid: fileValue || '',
        row_start: start,
        row_end: end,
      });

      if (response.success && response.data) {
        const rawRes = response.data;
        const tableHtml =
          rawRes?.htmlTable ||
          rawRes?.data?.htmlTable ||
          (Array.isArray(rawRes) && rawRes[0]?.htmlTable) ||
          (typeof rawRes === 'string' ? rawRes : '');

        const processedHtml = injectFileIconsAndEditColumnToHtml(tableHtml);

        const total =
          rawRes?.totalRecords ??
          rawRes?.data?.totalRecords ??
          (Array.isArray(rawRes) && rawRes[0]?.totalRecords) ??
          0;

        setHtmlTable(processedHtml);
        setTotalRecords(Number(total) || 0);
        setRowStart(start);
        setRowEnd(end);
      } else {
        setErrorMessage(response.error || 'Failed to load files data.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error executing loadFiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchFilesData(1, PAGE_SIZE);
    }
  }, [visible, fileValue, sessionId, selectedColumnField]);

  const handleNavBackward = () => {
    if (rowStart <= 1 || loading) return;
    const newStart = Math.max(1, rowStart - PAGE_SIZE);
    const newEnd = newStart + PAGE_SIZE - 1;
    fetchFilesData(newStart, newEnd);
  };

  const handleNavForward = () => {
    if (loading) return;
    if (totalRecords > 0 && rowEnd >= totalRecords) return;
    const newStart = rowStart + PAGE_SIZE;
    const newEnd = newStart + PAGE_SIZE - 1;
    fetchFilesData(newStart, newEnd);
  };

  const isBackwardDisabled = rowStart <= 1 || loading;
  const isForwardDisabled =
    loading || (totalRecords > 0 && rowEnd >= totalRecords) || totalRecords === 0;

  const currentCountDisplay =
    totalRecords > 0 ? Math.min(rowEnd, totalRecords) : 0;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isColumnModalOpen) {
          setIsColumnModalOpen(false);
        } else if (isSaveResultOpen) {
          setIsSaveResultOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    if (visible && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, isColumnModalOpen, isSaveResultOpen, onClose]);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      {isDesktop && !isMaximized && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {createElement('style', null, fileExplorerTableStyles)}

      <View
        style={[
          styles.container,
          isMaximized
            ? styles.maximizedModal
            : isDesktop
              ? styles.desktopModal
              : styles.mobileFullScreen,
        ]}
      >
        {/* ROW 1: TOP HEADER */}
        <View style={[styles.topMenuRow, isDesktop && styles.desktopCompactTopMenu]}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={[styles.maximizeButton, isDesktop && styles.desktopCompactMaximize]}
              onPress={() => setIsMaximized(!isMaximized)}
              accessibilityLabel={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
              title={isMaximized ? 'Restore Viewport' : 'Maximize Viewport'}
            >
              {isMaximized ? <MinimizeIcon color="#475569" size={10} /> : <MaximizeIcon color="#475569" size={10} />}
            </TouchableOpacity>
            <Text style={[styles.titleText, isDesktop && styles.desktopCompactTitle]}>{title}</Text>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, isDesktop && styles.desktopCompactClose]}
            onPress={onClose}
            accessibilityLabel="Close Panel"
          >
            <CloseIcon color="#475569" size={12} />
          </TouchableOpacity>
        </View>

        {/* ROW 2: NAVIGATION SECTION */}
        <View style={[styles.navigationRow, isDesktop && styles.desktopCompactNavigationRow]}>
          <View style={styles.customNavContainer}>
            <View />
            <View style={styles.rightNavGroup}>
              <TouchableOpacity
                style={[
                  styles.navIconButton,
                  isDesktop && styles.desktopCompactNavButton,
                  isBackwardDisabled && styles.navIconButtonDisabled,
                ]}
                onPress={handleNavBackward}
                disabled={isBackwardDisabled}
                activeOpacity={0.6}
                accessibilityLabel="Previous 10 Records"
              >
                <ArrowLeftIcon
                  color={isBackwardDisabled ? '#94A3B8' : '#000000'}
                  size={isDesktop ? 10 : 12}
                />
              </TouchableOpacity>

              <Text style={[styles.navCounterText, isDesktop && styles.desktopCompactText]}>
                {currentCountDisplay}/{totalRecords}
              </Text>

              <TouchableOpacity
                style={[
                  styles.navIconButton,
                  isDesktop && styles.desktopCompactNavButton,
                  isForwardDisabled && styles.navIconButtonDisabled,
                ]}
                onPress={handleNavForward}
                disabled={isForwardDisabled}
                activeOpacity={0.6}
                accessibilityLabel="Next 10 Records"
              >
                <ArrowRightIcon
                  color={isForwardDisabled ? '#94A3B8' : '#000000'}
                  size={isDesktop ? 10 : 12}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ROW 3: RECORDS SECTION */}
        <View style={[styles.recordsRow, isDesktop && styles.desktopCompactRecordsRow]}>
          {children ? (
            children
          ) : loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={[styles.loadingText, isDesktop && styles.desktopCompactText]}>Loading files...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.errorText, isDesktop && styles.desktopCompactText]}>{errorMessage}</Text>
            </View>
          ) : htmlTable ? (
            createElement('div', {
              className: 'file-explorer-table-container',
              dangerouslySetInnerHTML: { __html: htmlTable },
            })
          ) : (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, isDesktop && styles.desktopCompactText]}>No files found.</Text>
            </View>
          )}
        </View>

        {/* ROW ABOVE FOOTER: EDIT / SAVE COLUMN BUTTON ROW */}
        <View style={styles.editColumnBarRow}>
          <View style={styles.rightNavGroup}>
            <TouchableOpacity
              style={[styles.editColumnBtn, selectedColumnField !== null && styles.disabledBtn]}
              onPress={handleEditColumnClick}
              disabled={selectedColumnField !== null}
              activeOpacity={0.8}
            >
              <Text style={styles.editColumnBtnText}>Edit Column</Text>
            </TouchableOpacity>

            {selectedColumnField !== null && (
              <TouchableOpacity
                style={styles.saveColumnBtn}
                onPress={handleSaveColumnClick}
                activeOpacity={0.8}
              >
                <Text style={styles.saveColumnBtnText}>Save Column</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ROW 4: FOOTER */}
        <View style={[styles.footerRow, isDesktop && styles.desktopCompactFooter]}>
          <Text style={[styles.subtleText, isDesktop && styles.desktopCompactSubtleText]}>
            Table: {tableName} | File Group: {String(fileValue || 'N/A')}
          </Text>
        </View>
      </View>

      {/* POP UP BOX IN MIDDLE OF BROWSER FOR SELECTING COLUMN */}
      {isColumnModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999999,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1E293B' }}>Select Column Label</h3>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#64748B' }}
              >
                ✕
              </button>
            </div>
            {formColumns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formColumns.map((col, idx) => {
                  const labelText = col.label || col.col_name || col.id || `Column ${idx + 1}`;
                  return (
                    <button
                      key={`col-option-${idx}`}
                      onClick={() => handleSelectColumnLabel(col)}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#334155',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    >
                      {labelText}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', margin: '20px 0' }}>No columns found.</p>
            )}
          </div>
        </div>
      )}

      {/* POP UP BOX IN MIDDLE OF BROWSER FOR SAVE RESULT */}
      {isSaveResultOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999999,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '20px',
            width: '380px',
            maxWidth: '90%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>Save Result</h3>
            <p style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-line', margin: '0 0 20px 0' }}>{saveResultMessage}</p>
            <button
              onClick={() => setIsSaveResultOpen(false)}
              style={{
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 9999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopModal: {
    width: '90%',
    maxWidth: 920,
    height: '85%',
    maxHeight: 720,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#0F172A',
    boxShadow: '0px 10px 25px rgba(15, 23, 42, 0.15)',
    elevation: 10,
  },
  maximizedModal: {
    width: '100vw' as any,
    height: '100vh' as any,
    maxWidth: '100vw' as any,
    maxHeight: '100vh' as any,
    borderRadius: 0,
    borderWidth: 0,
  },
  mobileFullScreen: {
    width: '100%',
    height: '100%',
  },
  topMenuRow: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  desktopCompactTopMenu: {
    height: 24,
    paddingHorizontal: 6,
    margin: COMPACT_MARGIN,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0.5,
    borderBottomColor: '#0F172A',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maximizeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  desktopCompactMaximize: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 0.5,
    margin: COMPACT_MARGIN,
    padding: COMPACT_PADDING,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  desktopCompactTitle: {
    fontSize: COMPACT_FONT_SIZE,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopCompactClose: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    margin: COMPACT_MARGIN,
    padding: COMPACT_PADDING,
  },
  navigationRow: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  desktopCompactNavigationRow: {
    height: 28,
    paddingHorizontal: 6,
    margin: COMPACT_MARGIN,
    borderBottomWidth: 0.5,
    borderBottomColor: '#0F172A',
  },
  customNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: COMPACT_PADDING,
  },
  rightNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconButton: {
    width: 24,
    height: 18,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopCompactNavButton: {
    width: 20,
    height: 16,
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  navIconButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  navCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    minWidth: 36,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  desktopCompactText: {
    fontSize: COMPACT_FONT_SIZE,
  },
  recordsRow: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  desktopCompactRecordsRow: {
    margin: COMPACT_MARGIN,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#0F172A',
  },
  editColumnBarRow: {
    height: 36,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  editColumnBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  editColumnBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  saveColumnBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveColumnBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 11,
    color: '#64748B',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footerRow: {
    minHeight: 28,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  desktopCompactFooter: {
    minHeight: 20,
    paddingHorizontal: 6,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderTopWidth: 0.5,
    borderTopColor: '#0F172A',
  },
  subtleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  desktopCompactSubtleText: {
    fontSize: COMPACT_FONT_SIZE,
  },
});

FilesExplorerPanel.displayName = 'FilesExplorerPanel';

export default FilesExplorerPanel;