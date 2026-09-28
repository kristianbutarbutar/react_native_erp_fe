'use client';

import React, { useEffect, useState, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { showForm, viewObjectItem } from './ts/ViewPanel';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '10px';
const COMPACT_PADDING = '1px';
const COMPACT_MARGIN = '1px';

export interface ColumnSchema {
  id?: string;
  col_name: string;
  label: string;
  html_type?: string;
}

export interface PrintPanelProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  sessionId?: string;
  selectedRecordForPrinting?: React.MutableRefObject<
    Array<{ objectid: string; recordid: string; sessionid: string }>
  >;
  children?: React.ReactNode;
}

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

const HamburgerIcon = ({ color = '#334155', size = 13 }: { color?: string; size?: number }) =>
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
    createElement('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
    createElement('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
    createElement('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
  );

const SingleColumnIcon = ({ active = false, size = 12 }: { active?: boolean; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: active ? '#FFFFFF' : '#64748B',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('rect', { x: '4', y: '4', width: '16', height: '16', rx: '2' }),
    createElement('line', { x1: '8', y1: '9', x2: '16', y2: '9' }),
    createElement('line', { x1: '8', y1: '14', x2: '16', y2: '14' })
  );

const TwoColumnIcon = ({ active = false, size = 12 }: { active?: boolean; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: active ? '#FFFFFF' : '#64748B',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('rect', { x: '3', y: '4', width: '8', height: '16', rx: '1.5' }),
    createElement('rect', { x: '13', y: '4', width: '8', height: '16', rx: '1.5' }),
    createElement('line', { x1: '5.5', y1: '9', x2: '8.5', y2: '9' }),
    createElement('line', { x1: '15.5', y1: '9', x2: '18.5', y2: '9' })
  );

const viewPanelTableStyles = `
  .view-panel-compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${COMPACT_FONT_SIZE};
    margin: ${COMPACT_MARGIN};
  }
  .view-panel-compact-table tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
  }
  .view-panel-compact-table th,
  .view-panel-compact-table td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    font-size: ${COMPACT_FONT_SIZE};
  }
  .hamburger-menu-item-hover:hover {
    background-color: #EEF2FF !important;
  }

  /* HOVER EFFECT FOR INSERT LINE BUTTON */
  .insert-line-container {
    opacity: 0.15;
    transition: opacity 0.2s ease-in-out;
  }
  .insert-line-container:hover {
    opacity: 1;
  }

  /* FULL A4 MULTI-PAGE NATURAL FLOW PRINT OPTIMIZATION */
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    html, body {
      height: auto !important;
      overflow: visible !important;
      background: #FFFFFF !important;
    }
    body * {
      visibility: hidden !important;
    }
    #printable-print-panel, #printable-print-panel * {
      visibility: visible !important;
    }
    #printable-print-panel {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: auto !important;
      display: block !important;
      overflow: visible !important;
      background: #FFFFFF !important;
    }
    .topMenuRow, .actionToolbarRow, .footerRow, .backdrop, .maximizeButton, .closeButton, .insert-line-container {
      display: none !important;
    }
    div, section, article, ScrollView, RCTScrollView {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
      position: static !important;
    }
    .formCardContainer {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 20px !important;
      border: 1px solid #CBD5E1 !important;
      box-shadow: none !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  }
`;

function parseDropdownDisplayValue(raw: any): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';

  const str = String(raw).trim();
  if (str.startsWith('[')) {
    const match = str.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return match[2] && match[2].trim().length > 0 ? match[2].trim() : match[1];
    }
  }

  return str;
}

export const PrintPanel: React.FC<PrintPanelProps> = ({
  visible = true,
  onClose,
  title = 'Batch Print Records',
  sessionId = '',
  selectedRecordForPrinting,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [loadedRecords, setLoadedRecords] = useState<
    Array<{ objectLabel: string; objectid: string; recordid: string; columns: ColumnSchema[]; recordData: Record<string, any> | null }>
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [columnLayout, setColumnLayout] = useState<1 | 2>(2);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState<boolean>(false);

  // State to track dynamically inserted extra separation lines/rows below each card index
  const [insertedLines, setInsertedLines] = useState<Record<number, number>>({});

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
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
  }, [visible, onClose]);

  // Loop through selectedRecordForPrinting array on load and load data for each record
  useEffect(() => {
    const loadBatchRecords = async () => {
      if (!visible || !selectedRecordForPrinting || !selectedRecordForPrinting.current) return;

      const items = selectedRecordForPrinting.current;
      if (items.length === 0) {
        setErrorMessage('No records selected for printing.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      const results: Array<{ objectLabel: string; objectid: string; recordid: string; columns: ColumnSchema[]; recordData: Record<string, any> | null }> = [];

      try {
        for (const item of items) {
          const trimmedTableName = item.objectid?.trim();
          const trimmedRecordId = String(item.recordid || '').trim();
          const itemSessionId = item.sessionid || sessionId || '';

          if (!trimmedTableName || !trimmedRecordId) continue;

          let schemaColumns: ColumnSchema[] = [];
          const schemaResult = await showForm({ tableName: trimmedTableName });

          if (schemaResult && schemaResult.success) {
            const rawCols =
              schemaResult.columns ||
              schemaResult.data?.columns ||
              schemaResult.data?.schema?.columns ||
              [];

            if (Array.isArray(rawCols)) {
              schemaColumns = rawCols.map((c: any) => ({
                col_name: c.col_name || c.id || c.name || '',
                label: c.label || c.col_name || c.id || '',
                html_type: c.html_type || c.type || '',
              }));
            }
          }

          const recordResult = await viewObjectItem({
            tableName: trimmedTableName,
            sessionId: itemSessionId,
            whereClause: [
              {
                col_name: 'id',
                value: trimmedRecordId,
                operator: '=',
              },
            ],
          });

          if (recordResult && recordResult.success) {
            const rawResData = recordResult.data;
            let fetchedRecord: Record<string, any> | null = null;

            if (Array.isArray(rawResData)) {
              fetchedRecord = rawResData[0] || null;
            } else if (rawResData && typeof rawResData === 'object') {
              if (Array.isArray(rawResData.data)) {
                fetchedRecord = rawResData.data[0] || null;
              } else if (rawResData.data && typeof rawResData.data === 'object') {
                fetchedRecord = rawResData.data;
              } else {
                fetchedRecord = rawResData;
              }
            }

            let columns = schemaColumns;
            if ((!columns || columns.length === 0) && fetchedRecord) {
              columns = Object.keys(fetchedRecord).map((key) => ({
                col_name: key,
                label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              }));
            }

            results.push({
              objectLabel: recordResult?.data?.objectLabel,
              objectid: trimmedTableName,
              recordid: trimmedRecordId,
              columns: columns || [],
              recordData: fetchedRecord,
            });
          }
        }

        setLoadedRecords(results);
        if (results.length === 0) {
          setErrorMessage('Failed to fetch details for selected print records.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error loading batch records.');
      } finally {
        setLoading(false);
      }
    };

    loadBatchRecords();
  }, [visible, sessionId, selectedRecordForPrinting]);

  // Handler for Print sub menu in the new row hamburger popup
  const handleBatchPrintAction = () => {
    setIsBatchMenuOpen(false);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 50);
    }
  };

  // Handler for "Reset Print Selection" sub menu: clears ref data and closes the panel
  const handleResetPrintSelection = () => {
    setIsBatchMenuOpen(false);
    if (selectedRecordForPrinting) {
      selectedRecordForPrinting.current = [];
    }
    setLoadedRecords([]);
    if (onClose) {
      onClose();
    }
  };

  // Handler for clicking the "+" button to add a new line below the specific record
  const handleAddLineBelow = (index: number) => {
    setInsertedLines((prev) => ({
      ...prev,
      [index]: (prev[index] || 0) + 1,
    }));
  };

  const chunkColumns = (list: ColumnSchema[], size: number) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const chunks: ColumnSchema[][] = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  const renderFieldContent = (col: ColumnSchema, recordData: Record<string, any> | null) => {
    const fieldKey = col.col_name?.toLowerCase();
    const rawValue = recordData && fieldKey
      ? (recordData[fieldKey] ?? recordData[col.col_name] ?? recordData[col.col_name?.toUpperCase()] ?? '—')
      : '—';
    const htmlType = col.html_type?.toLowerCase().trim() || '';
    const isDropdown = htmlType === 'dropdown';

    const displayValue = isDropdown
      ? parseDropdownDisplayValue(rawValue)
      : typeof rawValue === 'boolean'
        ? rawValue ? 'Yes' : 'No'
        : String(rawValue ?? '—');

    return (
      <View style={[styles.fieldInnerContainer, isDesktop && styles.desktopCompactFieldInner]}>
        <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactFieldLabel]}>
          {col.label ? col.label.toUpperCase() : col.col_name?.toUpperCase()}
        </Text>
        <Text style={[styles.valueText, isDesktop && styles.desktopCompactValue]}>
          {displayValue}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      {isDesktop && !isMaximized && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      )}

      {createElement('style', null, viewPanelTableStyles)}

      <div id="printable-print-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', overflow: 'visible' }}>
        <View
          style={[
            styles.container,
            isMaximized
              ? styles.maximizedModal
              : isDesktop
                ? styles.desktopResponsiveModal
                : styles.mobileFullScreen,
          ]}
        >
          {/* ROW 1: HEADER */}
          <View style={[styles.topMenuRow, isDesktop && styles.desktopCompactTopMenu]}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={[
                  styles.maximizeButton,
                  isDesktop && styles.desktopCompactMaximize,
                  { cursor: 'pointer' } as any,
                ]}
                onPress={() => setIsMaximized(!isMaximized)}
                accessibilityLabel={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
              >
                {isMaximized ? <MinimizeIcon color="#475569" size={10} /> : <MaximizeIcon color="#475569" size={10} />}
              </TouchableOpacity>
              <Text style={[styles.titleText, isDesktop && styles.desktopCompactTitle]}>{title}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                isDesktop && styles.desktopCompactClose,
                { cursor: 'pointer' } as any,
              ]}
              onPress={onClose}
              accessibilityLabel="Close Panel"
            >
              <CloseIcon color="#475569" size={12} />
            </TouchableOpacity>
          </View>

          {/* NEW ROW ABOVE CONTENT AREA WITH RIGHT-ALIGNED HAMBURGER MENU */}
          <View style={styles.actionToolbarRow}>
            <View style={styles.hamburgerMenuWrapper}>
              <TouchableOpacity
                style={[styles.hamburgerBtn, { cursor: 'pointer' } as any]}
                onPress={() => setIsBatchMenuOpen((prev) => !prev)}
                activeOpacity={0.7}
                accessibilityLabel="Batch Print Actions Menu"
              >
                <HamburgerIcon color="#334155" size={14} />
              </TouchableOpacity>

              {isBatchMenuOpen && (
                <View style={styles.hamburgerDropdownMenu}>
                  <TouchableOpacity
                    // @ts-ignore
                    className="hamburger-menu-item-hover"
                    style={[styles.hamburgerMenuItem, { cursor: 'pointer' } as any]}
                    onPress={handleBatchPrintAction}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.hamburgerMenuIconText}>🖨️</Text>
                    <Text style={styles.hamburgerMenuItemText}>Print</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    // @ts-ignore
                    className="hamburger-menu-item-hover"
                    style={[styles.hamburgerMenuItem, { borderTopWidth: 1, borderTopColor: '#F1F5F9', cursor: 'pointer' } as any]}
                    onPress={handleResetPrintSelection}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.hamburgerMenuIconText}>🔄</Text>
                    <Text style={styles.hamburgerMenuItemText}>Reset Print Selection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ROW 2: CONTENT AREA - STACKED RECORDS FROM TOP TO DOWN */}
          <View style={[styles.contentRow, isDesktop && styles.desktopCompactContentRow, { height: 'auto', flex: 'none', overflow: 'visible' }]}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading records for batch printing...</Text>
              </View>
            ) : loadedRecords.length > 0 ? (
              <View style={{ width: '100%', height: 'auto', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
                {loadedRecords.map((item, index) => {
                  const extraLinesCount = insertedLines[index] || 0;
                  return (
                    <React.Fragment key={`print-record-group-${index}`}>
                      <View
                        style={[styles.formCardContainer, isDesktop && styles.desktopCompactCardContainer, index > 0 && { marginTop: 16 }]}
                      >
                        <View style={[styles.formHeaderRow, isDesktop && styles.desktopCompactHeaderRow]}>
                          <View style={styles.summaryTitleWrapper}>
                            <Text style={[styles.formTitle, isDesktop && styles.desktopCompactFormTitle]}>
                              Record Summary #{index + 1}
                            </Text>
                            <Text style={[styles.formSubtitle, isDesktop && styles.desktopCompactFormSubtitle]}>
                              Table: {item.objectLabel} | Record ID: {item.recordid}
                            </Text>
                          </View>

                          <View style={styles.headerRightControlsGroup}>
                            <View style={[styles.layoutToggleContainer, isDesktop && styles.desktopCompactToggleContainer]}>
                              <TouchableOpacity
                                style={[
                                  styles.layoutToggleBtn,
                                  isDesktop && styles.desktopCompactToggleBtn,
                                  columnLayout === 1 && styles.layoutToggleBtnActive,
                                ]}
                                onPress={() => setColumnLayout(1)}
                                activeOpacity={0.7}
                              >
                                <SingleColumnIcon active={columnLayout === 1} size={isDesktop ? 10 : 16} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.layoutToggleBtn,
                                  isDesktop && styles.desktopCompactToggleBtn,
                                  columnLayout === 2 && styles.layoutToggleBtnActive,
                                ]}
                                onPress={() => setColumnLayout(2)}
                                activeOpacity={0.7}
                              >
                                <TwoColumnIcon active={columnLayout === 2} size={isDesktop ? 10 : 16} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.formGrid, isDesktop && { margin: COMPACT_MARGIN, padding: COMPACT_PADDING }]}>
                          {columnLayout === 1 ? (
                            item.columns.map((col) => (
                              <View key={`col-single-${col.col_name}`} style={[styles.fieldRowSingle, isDesktop && styles.desktopCompactFieldRowSingle]}>
                                {renderFieldContent(col, item.recordData)}
                              </View>
                            ))
                          ) : (
                            chunkColumns(item.columns, 2).map((pair, rowIdx) => (
                              <View key={`col-double-${rowIdx}`} style={[styles.fieldRowDouble, isDesktop && styles.desktopCompactFieldRowDouble]}>
                                <View style={[styles.doubleColHalf, isDesktop && styles.desktopCompactDoubleColHalf]}>
                                  {renderFieldContent(pair[0], item.recordData)}
                                </View>
                                <View style={[styles.doubleColHalf, styles.doubleColRight, isDesktop && styles.desktopCompactDoubleColRight]}>
                                  {pair[1] ? renderFieldContent(pair[1], item.recordData) : <View style={styles.emptyPlaceholder} />}
                                </View>
                              </View>
                            ))
                          )}
                        </View>
                      </View>

                      {/* LINE WITH HOVER-ACTIVATED "+" BUTTON */}
                      <div className="insert-line-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: '100%', height: '1px', backgroundColor: '#CBD5E1', position: 'absolute', top: '50%' }}></div>
                        <button
                          onClick={() => handleAddLineBelow(index)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: '#4F46E5',
                            color: '#FFFFFF',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            zIndex: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                          title="Add line below"
                        >
                          +
                        </button>
                      </div>

                      {/* RENDER DYNAMICALLY ADDED EXTRA SEPARATION ROWS */}
                      {Array.from({ length: extraLinesCount }).map((_, lineIdx) => (
                        <div
                          key={`extra-line-${index}-${lineIdx}`}
                          style={{
                            width: '100%',
                            height: '24px',
                            borderBottom: '1px dashed #94A3B8',
                            margin: '8px 0',
                          }}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.errorTitle}>
                  {errorMessage || 'No data found for selected records.'}
                </Text>
              </View>
            )}
          </View>

          {/* ROW 3: FOOTER */}
          <View style={[styles.footerRow, isDesktop && styles.desktopCompactFooter]}>
            <Text style={[styles.subtleText, isDesktop && styles.desktopCompactSubtleText]}>
              Total Records Queued for Print: {loadedRecords.length}
            </Text>
          </View>
        </View>
      </div>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflowY: 'auto',
    paddingVertical: 24,
  },
  backdrop: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
    zIndex: 2,
  },
  desktopResponsiveModal: {
    width: '90%',
    maxWidth: 920,
    height: 'auto',
    minHeight: 'auto',
    overflow: 'visible',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#0F172A',
    boxShadow: '0px 10px 25px rgba(15, 23, 42, 0.15)',
    elevation: 10,
    marginBottom: 40,
  },
  maximizedModal: {
    width: '100vw' as any,
    minHeight: '100vh' as any,
    height: 'auto',
    maxWidth: '100vw' as any,
    borderRadius: 0,
    borderWidth: 0,
    marginVertical: 0,
    marginBottom: 0,
  },
  mobileFullScreen: {
    width: '100%',
    minHeight: '100%',
    height: 'auto',
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
    height: 22,
    paddingHorizontal: 4,
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
  actionToolbarRow: {
    height: 36,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'visible',
    zIndex: 9999,
  },
  hamburgerMenuWrapper: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 999999,
  },
  hamburgerBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerDropdownMenu: {
    position: 'absolute' as any,
    top: 32,
    right: 0,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 4,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
    zIndex: 9999999,
    elevation: 999,
    overflow: 'hidden',
  },
  hamburgerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  hamburgerMenuIconText: {
    fontSize: 12,
  },
  hamburgerMenuItemText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  contentRow: {
    flex: 'none',
    backgroundColor: '#F8FAFC',
    padding: 16,
    height: 'auto',
  },
  desktopCompactContentRow: {
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    backgroundColor: '#FFFFFF',
    height: 'auto',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  formCardContainer: {
    width: '100%',
    maxWidth: 880,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    overflow: 'visible',
  },
  desktopCompactCardContainer: {
    width: '80%',
    maxWidth: '80%',
    borderWidth: 0.5,
    borderColor: '#0F172A',
    borderRadius: 4,
    padding: COMPACT_PADDING,
    marginHorizontal: '10%',
    marginVertical: COMPACT_MARGIN,
    boxShadow: 'none',
    overflow: 'visible',
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 20,
    flexWrap: 'nowrap',
    gap: 12,
    overflow: 'visible',
    zIndex: 100,
  },
  desktopCompactHeaderRow: {
    paddingBottom: COMPACT_PADDING,
    marginBottom: `calc(${COMPACT_MARGIN} * 2)`,
    margin: COMPACT_MARGIN,
    overflow: 'visible',
    zIndex: 100,
  },
  summaryTitleWrapper: {
    flex: 1,
    minWidth: 180,
  },
  headerRightControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'visible',
    zIndex: 100,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  desktopCompactFormTitle: {
    fontSize: COMPACT_FONT_SIZE,
    fontWeight: '700',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  desktopCompactFormSubtitle: {
    fontSize: `calc(${COMPACT_FONT_SIZE} - 1px)`,
  },
  layoutToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  desktopCompactToggleContainer: {
    borderRadius: 2,
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  layoutToggleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  desktopCompactToggleBtn: {
    width: 16,
    height: 16,
    borderRadius: 2,
    margin: COMPACT_MARGIN,
    padding: COMPACT_PADDING,
  },
  layoutToggleBtnActive: {
    backgroundColor: '#4F46E5',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
  },
  fieldRowSingle: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingVertical: 10,
  },
  desktopCompactFieldRowSingle: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingVertical: COMPACT_PADDING,
    marginVertical: COMPACT_MARGIN,
  },
  fieldRowDouble: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    width: '100%',
  },
  desktopCompactFieldRowDouble: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingVertical: COMPACT_PADDING,
    marginVertical: COMPACT_MARGIN,
  },
  doubleColHalf: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#F8FAFC',
    paddingVertical: 10,
    paddingRight: 8,
  },
  desktopCompactDoubleColHalf: {
    borderRightWidth: 0.5,
    borderRightColor: '#F8FAFC',
    paddingVertical: COMPACT_PADDING,
    paddingRight: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  doubleColRight: {
    borderRightWidth: 0,
    marginTop: 1,
    paddingTop: 1,
    paddingLeft: 8,
  },
  desktopCompactDoubleColRight: {
    paddingLeft: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  emptyPlaceholder: {
    flex: 1,
  },
  fieldInnerContainer: {
    flexDirection: 'column',
    paddingTop: 1,
    marginTop: 1,
    alignItems: 'flex-start',
  },
  desktopCompactFieldInner: {
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    paddingTop: 1,
    marginTop: 0,
  },
  desktopCompactFieldLabel: {
    fontSize: COMPACT_FONT_SIZE,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '400',
    marginTop: 1,
  },
  desktopCompactValue: {
    fontSize: COMPACT_FONT_SIZE,
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
    minHeight: 18,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  subtleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  desktopCompactSubtleText: {
    fontSize: `calc(${COMPACT_FONT_SIZE} - 1px)`,
  },
});

export default PrintPanel;