'use client';

import React, { useEffect, useState, createElement } from 'react';
import { createPortal } from 'react-dom';
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
import { DeletePanel } from './DeletePanel';
import { EditPanel } from './EditPanel';
import FilesExplorerPanel from './../customer/FilesExplorerPanel';
import HtmlPanel from './HtmlPanel';

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

export interface ViewPanelProps {
  visible?: boolean;
  onClose?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onDeleteSuccess?: () => void;
  onEditSuccess?: () => void;
  title?: string;
  tableName?: string;
  recordid?: string;
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

const TrashIcon = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) =>
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
    createElement('polyline', { points: '3 6 5 6 21 6' }),
    createElement('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
  );

const EditIcon = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
    createElement('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
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

  @media print {
    body * {
      visibility: hidden;
    }
    #printable-view-panel, #printable-view-panel * {
      visibility: visible;
    }
    #printable-view-panel {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
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

export const ViewPanel: React.FC<ViewPanelProps> = ({
  visible = true,
  onClose,
  onDeleteClick,
  onEditClick,
  onDeleteSuccess,
  onEditSuccess,
  title = 'View Record',
  tableName = '',
  recordid = '',
  sessionId = '',
  selectedRecordForPrinting,
  children,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [recordData, setRecordData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [objectLabel, setObjectLabel] = useState<string>('');

  const [columnLayout, setColumnLayout] = useState<1 | 2>(2);
  const [isSummaryMenuOpen, setIsSummaryMenuOpen] = useState<boolean>(false);


  // Sub-panel Visibility States
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [showDeletePanel, setShowDeletePanel] = useState<boolean>(false);
  const [showFilesExplorer, setShowFilesExplorer] = useState<boolean>(false);
  const [showHtmlPanel, setShowHtmlPanel] = useState<boolean>(false);
  const [selectedFileValue, setSelectedFileValue] = useState<any>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        onClose &&
        !showEditPanel &&
        !showDeletePanel &&
        !showFilesExplorer &&
        !showHtmlPanel
      ) {
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
  }, [visible, onClose, showEditPanel, showDeletePanel, showFilesExplorer, showHtmlPanel]);

  const loadData = async () => {
    if (!visible) return;

    const trimmedTableName = tableName?.trim();
    const trimmedRecordId = String(recordid || '').trim();

    if (!trimmedTableName) {
      setErrorMessage('No valid Table Name provided.');
      return;
    }

    if (!trimmedRecordId) {
      setErrorMessage('No record selected to view.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      let schemaColumns: ColumnSchema[] = [];
      const schemaResult = await showForm({ tableName: trimmedTableName });
      if (schemaResult.success && schemaResult.data) {
        schemaColumns =
          schemaResult.data.columns ||
          schemaResult.data.schema?.columns ||
          (Array.isArray(schemaResult.data) ? schemaResult.data : []);
      }

      const recordResult = await viewObjectItem({
        objectid: trimmedTableName,
        sessionId: sessionId || '',
        whereClause: [
          {
            col_name: 'id',
            value: trimmedRecordId,
            operator: '=',
          },
        ],
      });

      if (recordResult.success && recordResult.data) {
        const rawResData = recordResult.data;
        const responseColumns: ColumnSchema[] =
          rawResData.columns ||
          rawResData.data?.columns ||
          [];

        setObjectLabel(recordResult?.data?.objectLabel || '');

        let fetchedRecord: Record<string, any> | null = null;
        if (Array.isArray(rawResData.data)) {
          fetchedRecord = rawResData.data[0] || null;
        } else if (rawResData.data) {
          fetchedRecord = rawResData.data;
        } else {
          fetchedRecord = rawResData;
        }

        setRecordData(fetchedRecord);

        if (responseColumns.length > 0) {
          setColumns(responseColumns);
        } else if (schemaColumns.length > 0) {
          setColumns(schemaColumns);
        } else if (fetchedRecord) {
          const autoCols: ColumnSchema[] = Object.keys(fetchedRecord).map((key) => ({
            col_name: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          }));
          setColumns(autoCols);
        }
      } else {
        setErrorMessage(recordResult.error || 'Failed to fetch record details.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error loading record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [visible, tableName, recordid, sessionId]);

  const handleDeletePress = () => {
    if (onDeleteClick) {
      onDeleteClick();
    } else {
      setShowDeletePanel(true);
    }
  };

  const handleEditPress = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      setShowEditPanel(true);
    }
  };

  // Handler for opening HtmlPanel top-stack overlay with current record data
  const handleOpenHtmlEditor = () => {
    setIsSummaryMenuOpen(false);
    setShowHtmlPanel(true);
  };

  // Handler for existing Print submenu: closes menu and triggers window.print()
  const handlePrintRecord = () => {
    setIsSummaryMenuOpen(false);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 50);
    }
  };

  // Handler for "Selected for Printing" submenu: pushes record details to ref and closes popup menu
  const handleSelectedForPrinting = () => {
    setIsSummaryMenuOpen(false);
    if (selectedRecordForPrinting && tableName && recordid) {
      selectedRecordForPrinting.current.push({
        objectid: tableName.trim(),
        recordid: String(recordid).trim(),
        sessionid: sessionId || '',
      });
      console.log('Record pushed to selectedRecordForPrinting:', selectedRecordForPrinting.current);
    }
  };

  const chunkColumns = (list: ColumnSchema[], size: number) => {
    const chunks: ColumnSchema[][] = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  const renderFieldContent = (col: ColumnSchema) => {
    const rawValue = recordData ? (recordData[col.col_name.toLowerCase()] ?? '—') : '—';
    const htmlType = col.html_type?.toLowerCase().trim() || '';
    const isFileField = htmlType === 'file';
    const isDropdown = htmlType === 'dropdown';
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '' && rawValue !== '—';

    const displayValue = isDropdown
      ? parseDropdownDisplayValue(rawValue)
      : typeof rawValue === 'boolean'
        ? rawValue ? 'Yes' : 'No'
        : String(rawValue ?? '—');

    const handleValuePress = () => {
      if (isFileField && hasValue) {
        setSelectedFileValue(rawValue);
        setShowFilesExplorer(true);
      }
    };

    return (
      <View style={[styles.fieldInnerContainer, isDesktop && styles.desktopCompactFieldInner]}>
        <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactFieldLabel]}>
          {col.label ? col.label.toUpperCase() : ''}
        </Text>
        {isFileField && hasValue ? (
          <TouchableOpacity
            onPress={handleValuePress}
            activeOpacity={0.7}
            style={{ cursor: 'pointer' } as any}
          >
            <Text style={[styles.valueText, styles.linkText, isDesktop && styles.desktopCompactValue]}>
              show files
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.valueText, isDesktop && styles.desktopCompactValue]}>
            {displayValue}
          </Text>
        )}
      </View>
    );
  };

  const renderPortal = (content: React.ReactNode, zIndexVal = 99999999) => {
    if (typeof window === 'undefined' || !document.body) return null;
    return createPortal(
      <View style={[styles.topStackOverlay, { zIndex: zIndexVal }]}>{content}</View>,
      document.body
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      {isDesktop && !isMaximized && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            if (isSummaryMenuOpen) {
              setIsSummaryMenuOpen(false);
            } else if (onClose) {
              onClose();
            }
          }}
        />
      )}

      {createElement('style', null, viewPanelTableStyles)}

      <div id="printable-view-panel" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                title={isMaximized ? 'Restore Viewport' : 'Maximize Viewport'}
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

          {/* ROW 2: CONTENT AREA */}
          <View style={[styles.contentRow, isDesktop && styles.desktopCompactContentRow]}>
            {children || (
              loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading record details...</Text>
                </View>
              ) : recordData ? (
                <ScrollView
                  style={styles.formScrollView}
                  contentContainerStyle={[styles.formScrollContent, isDesktop && styles.desktopCompactScrollContent]}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={[styles.formCardContainer, isDesktop && styles.desktopCompactCardContainer]}>
                    {/* RECORD SUMMARY HEADER LINE */}
                    <View style={[styles.formHeaderRow, isDesktop && styles.desktopCompactHeaderRow]}>
                      <View style={styles.summaryTitleWrapper}>
                        <Text style={[styles.formTitle, isDesktop && styles.desktopCompactFormTitle]}>Record Summary</Text>
                        <Text style={[styles.formSubtitle, isDesktop && styles.desktopCompactFormSubtitle]}>
                          Table: {objectLabel} | Record ID: {recordid}
                        </Text>
                      </View>

                      {/* RIGHT CORNER GROUP: LAYOUT TOGGLES & HAMBURGER MENU */}
                      <View style={styles.headerRightControlsGroup}>
                        <View style={[styles.layoutToggleContainer, isDesktop && styles.desktopCompactToggleContainer]}>
                          <TouchableOpacity
                            style={[
                              styles.layoutToggleBtn,
                              isDesktop && styles.desktopCompactToggleBtn,
                              columnLayout === 1 && styles.layoutToggleBtnActive,
                              { cursor: 'pointer' } as any,
                            ]}
                            onPress={() => setColumnLayout(1)}
                            activeOpacity={0.7}
                            accessibilityLabel="1 Column Per Line"
                          >
                            <SingleColumnIcon active={columnLayout === 1} size={isDesktop ? 10 : 16} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.layoutToggleBtn,
                              isDesktop && styles.desktopCompactToggleBtn,
                              columnLayout === 2 && styles.layoutToggleBtnActive,
                              { cursor: 'pointer' } as any,
                            ]}
                            onPress={() => setColumnLayout(2)}
                            activeOpacity={0.7}
                            accessibilityLabel="2 Columns Per Line"
                          >
                            <TwoColumnIcon active={columnLayout === 2} size={isDesktop ? 10 : 16} />
                          </TouchableOpacity>
                        </View>

                        {/* HAMBURGER MENU BUTTON & DROPDOWN */}
                        <View style={styles.hamburgerMenuWrapper}>
                          <TouchableOpacity
                            style={[
                              styles.hamburgerBtn,
                              isDesktop && styles.desktopCompactHamburgerBtn,
                              { cursor: 'pointer' } as any,
                            ]}
                            onPress={() => setIsSummaryMenuOpen((prev) => !prev)}
                            activeOpacity={0.7}
                            accessibilityLabel="Record Summary Actions Menu"
                          >
                            <HamburgerIcon color="#334155" size={isDesktop ? 11 : 14} />
                          </TouchableOpacity>

                          {isSummaryMenuOpen && (
                            <View style={styles.hamburgerDropdownMenu}>
                              <TouchableOpacity
                                // @ts-ignore
                                className="hamburger-menu-item-hover"
                                style={[styles.hamburgerMenuItem, { cursor: 'pointer' } as any]}
                                onPress={handleOpenHtmlEditor}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.hamburgerMenuIconText}>📝</Text>
                                <Text style={styles.hamburgerMenuItemText}>
                                  Open Cloud File in Html Editor
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                // @ts-ignore
                                className="hamburger-menu-item-hover"
                                style={[styles.hamburgerMenuItem, { cursor: 'pointer' } as any]}
                                onPress={handlePrintRecord}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.hamburgerMenuIconText}>🖨️</Text>
                                <Text style={styles.hamburgerMenuItemText}>
                                  Print
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                // @ts-ignore
                                className="hamburger-menu-item-hover"
                                style={[styles.hamburgerMenuItem, { cursor: 'pointer' } as any]}
                                onPress={handleSelectedForPrinting}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.hamburgerMenuIconText}>📌</Text>
                                <Text style={styles.hamburgerMenuItemText}>
                                  Selected for Printing
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* DYNAMIC RECORD TABLE ELEMENTS */}
                    <View style={[styles.formGrid, isDesktop && { margin: COMPACT_MARGIN, padding: COMPACT_PADDING }]}>
                      {columnLayout === 1 ? (
                        columns.map((col) => (
                          <View key={col.col_name} style={[styles.fieldRowSingle, isDesktop && styles.desktopCompactFieldRowSingle]}>
                            {renderFieldContent(col)}
                          </View>
                        ))
                      ) : (
                        chunkColumns(columns, 2).map((pair, rowIdx) => (
                          <View key={`row-${rowIdx}`} style={[styles.fieldRowDouble, isDesktop && styles.desktopCompactFieldRowDouble]}>
                            <View style={[styles.doubleColHalf, isDesktop && styles.desktopCompactDoubleColHalf]}>
                              {renderFieldContent(pair[0])}
                            </View>
                            <View style={[styles.doubleColHalf, styles.doubleColRight, isDesktop && styles.desktopCompactDoubleColRight]}>
                              {pair[1] ? renderFieldContent(pair[1]) : <View style={styles.emptyPlaceholder} />}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.centerContainer}>
                  <Text style={styles.errorTitle}>
                    {errorMessage || 'No data found for this record.'}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* ROW 3: ACTION BAR */}
          <View style={[styles.actionRow, isDesktop && styles.desktopCompactActionRow]}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                isDesktop && styles.desktopCompactDeleteBtn,
                { cursor: 'pointer' } as any,
              ]}
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <TrashIcon color="#DC2626" size={isDesktop ? 11 : 13} />
              <Text style={[styles.deleteButtonText, isDesktop && styles.desktopCompactBtnText]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editButton,
                isDesktop && styles.desktopCompactEditBtn,
                { cursor: 'pointer' } as any,
              ]}
              onPress={handleEditPress}
              activeOpacity={0.8}
            >
              <EditIcon color="#FFFFFF" size={isDesktop ? 11 : 13} />
              <Text style={[styles.editButtonText, isDesktop && styles.desktopCompactBtnText]}>Edit Record</Text>
            </TouchableOpacity>
          </View>

          {/* ROW 4: FOOTER */}
          <View style={[styles.footerRow, isDesktop && styles.desktopCompactFooter]}>
            <Text style={[styles.subtleText, isDesktop && styles.desktopCompactSubtleText]}>
              Table: {objectLabel || 'N/A'} | Record ID: {recordid || 'N/A'}
            </Text>
          </View>
        </View>
      </div>

      {/* HTML PANEL PORTAL - OPEN ON TOP OF ALL OBJECTS WITH CURRENT RECORD PROPS */}
      {showHtmlPanel &&
        renderPortal(
          <HtmlPanel
            key={`htmlpanel-${recordid || 'active'}-${Date.now()}`}
            sessionId={sessionId}
            record={recordData}
            onClose={() => setShowHtmlPanel(false)}
            defaultFloating={true}
          />,
          99999999
        )}

      {/* EDIT PANEL PORTAL */}
      {showEditPanel &&
        renderPortal(
          <EditPanel
            visible={showEditPanel}
            tableName={tableName}
            recordid={recordid}
            sessionId={sessionId}
            onClose={() => {
              setShowEditPanel(false);
              loadData();
              if (onEditSuccess) onEditSuccess();
            }}
          />,
          99999999
        )}

      {/* DELETE PANEL PORTAL */}
      {showDeletePanel &&
        renderPortal(
          <DeletePanel
            visible={showDeletePanel}
            tableName={tableName}
            recordid={recordid}
            sessionId={sessionId}
            onClose={() => setShowDeletePanel(false)}
            onSuccess={() => {
              setShowDeletePanel(false);
              if (onClose) onClose();
              if (onDeleteSuccess) onDeleteSuccess();
            }}
          />,
          99999999
        )}

      {/* FILES EXPLORER PANEL PORTAL */}
      {showFilesExplorer &&
        renderPortal(
          <FilesExplorerPanel
            visible={showFilesExplorer}
            tableName={tableName}
            sessionId={sessionId}
            fileValue={selectedFileValue}
            onClose={() => setShowFilesExplorer(false)}
          />,
          99999999
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
    zIndex: 2,
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
  contentRow: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  desktopCompactContentRow: {
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  formScrollView: {
    flex: 1,
    width: '100%',
  },
  formScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  desktopCompactScrollContent: {
    paddingVertical: COMPACT_PADDING,
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
    flexWrap: 'wrap',
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
  desktopCompactHamburgerBtn: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  hamburgerDropdownMenu: {
    position: 'absolute' as any,
    top: 26,
    right: 0,
    minWidth: 240,
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
    borderRightWidth: 0, marginTop: 1, paddingTop: 1,
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
    flexDirection: 'column', paddingTop: 1, marginTop: 1,
    alignItems: 'flex-start',
  },
  desktopCompactFieldInner: {
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155', paddingTop: 1,
    marginTop: 0
  },
  desktopCompactFieldLabel: {
    fontSize: COMPACT_FONT_SIZE,
    fontWeight: '700',
  },
  fieldKeyText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginBottom: 1, marginTop: 1,
  },
  desktopCompactFieldKey: {
    fontSize: `calc(${COMPACT_FONT_SIZE} - 1px)`,
    fontFamily: 'monospace',
  },
  valueText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '400',
    marginTop: 1,
  },
  linkText: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  desktopCompactValue: {
    fontSize: COMPACT_FONT_SIZE,
  },
  actionRow: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  desktopCompactActionRow: {
    minHeight: 22,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 0.5,
    borderTopColor: '#0F172A',
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  desktopCompactDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
    gap: 3,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  desktopCompactEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
    gap: 3,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  desktopCompactBtnText: {
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
  topStackOverlay: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ViewPanel;