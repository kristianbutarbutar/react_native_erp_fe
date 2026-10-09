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
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { showForm, updateObject } from './ts/EditPanel';
import { getObjectRecords } from './../apiService';
import { viewObjectItem } from './../panel/ts/ViewPanel';
import FilesExplorerPanel from './../customer/FilesExplorerPanel';
import { doUpload } from './../customer/ts/ObjectFile';
import HtmlPanel from './HtmlPanel';
import DatePickerInput from './DatePickerInput';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '10px';
const COMPACT_PADDING = '1px';
const COMPACT_MARGIN = '1px';

export interface ColumnSchema {
  id?: string;
  col_name: string;
  label: string;
  html_type?: string;
  dt_type?: string;
  isdisabled?: string;
  isempty?: string;
  default?: string;
  value?: string;
}

export interface EditPanelProps {
  handleParentFunction?: () => void;
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  tableName?: string;
  recordid?: string;
  sessionId?: string;
}

const FontAwesomeIcon = ({ name, size = 24, color = 'black' }: { name: string; size?: number; color?: string }) => {
  try {
    const FontAwesome = require('react-native-vector-icons/FontAwesome').default;
    return createElement(FontAwesome, { name, size, color });
  } catch (e) {
    return createElement(Text, { style: { fontSize: size, color } }, '★');
  }
};

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

const SaveIcon = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
    createElement('polyline', { points: '17 21 17 13 7 13 7 21' }),
    createElement('polyline', { points: '7 3 7 8 15 8' })
  );

const editPanelTableStyles = `
  .edit-panel-compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${COMPACT_FONT_SIZE};
    margin: ${COMPACT_MARGIN};
  }
  .web-file-input {
    display: none;
  }
`;

export const EditPanel: React.FC<EditPanelProps> = ({
  visible = true,
  onClose,
  onSuccess,
  title = 'Edit Record',
  handleParentFunction,
  tableName = '',
  recordid = '',
  sessionId = '',
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedId, setSavedId] = useState<string>('');

  const [objectLabel, setObjectLabel] = useState<string>('');
  const [columnLayout, setColumnLayout] = useState<1 | 2>(2);

  // Sub-panel Visibility
  const [showFilesExplorer, setShowFilesExplorer] = useState<boolean>(false);
  const [selectedFileValue, setSelectedFileValue] = useState<any>(null);

  // HtmlPanel Visibility, Active Column & Record Data
  const [showHtmlPanel, setShowHtmlPanel] = useState<boolean>(false);
  const [activeHtmlColName, setActiveHtmlColName] = useState<string>('');
  const [htmlRecordData, setHtmlRecordData] = useState<any>(null);

  // Icon Selector Popup States
  const [showIconModal, setShowIconModal] = useState<boolean>(false);
  const [iconList, setIconList] = useState<any[]>([]);
  const [iconLoading, setIconLoading] = useState<boolean>(false);
  const [activeIconColName, setActiveIconColName] = useState<string>('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && typeof onClose === 'function' && !showFilesExplorer && !showIconModal && !showHtmlPanel) {
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
  }, [visible, onClose, showFilesExplorer, showIconModal, showHtmlPanel]);

  const setSavedFileId = (html: string) => {
    setSavedId(html);
    if (activeHtmlColName) {
      handleFieldChange(activeHtmlColName, html);
    }
  };

  const loadData = async () => {
    if (!visible) return;

    const trimmedTableName = tableName?.trim();
    const trimmedRecordId = String(recordid || '').trim();

    if (!trimmedTableName || !trimmedRecordId) {
      setErrorMessage('Missing Table Name or Record ID.');
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

        setObjectLabel(recordResult?.data.objectLabel || '');

        let fetchedRecord: Record<string, any> | null = null;
        if (Array.isArray(rawResData.data)) {
          fetchedRecord = rawResData.data[0] || null;
        } else if (rawResData.data) {
          fetchedRecord = rawResData.data;
        } else {
          fetchedRecord = rawResData;
        }

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

        if (fetchedRecord) {
          const normalizedForm: Record<string, any> = {};
          Object.keys(fetchedRecord).forEach((k) => {
            normalizedForm[k.toLowerCase()] = fetchedRecord[k];
          });
          setFormData(normalizedForm);
        }
      } else {
        setErrorMessage(recordResult.error || 'Failed to fetch record for editing.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error loading record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [visible, tableName, recordid, sessionId, objectLabel]);

  const handleFieldChange = (colName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [colName.toLowerCase()]: value,
    }));
  };

  const handlePickFiles = (col: ColumnSchema) => {
    const key = col.col_name.toLowerCase();
    if (typeof document === 'undefined') return;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.className = 'web-file-input';

    fileInput.onchange = (e: any) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const currentFiles = Array.isArray(formData[key]) ? formData[key] : [];
      const newFiles = Array.from(files).map((file: any) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type || 'application/octet-stream',
        originFile: file,
      }));

      const combinedFiles = [...currentFiles, ...newFiles];

      setFormData((prev) => ({
        ...prev,
        [key]: combinedFiles,
      }));
    };

    fileInput.click();
  };

  const handleRemoveFile = (colName: string, indexToRemove: number) => {
    const key = colName.toLowerCase();
    const currentFiles = Array.isArray(formData[key]) ? formData[key] : [];
    const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToRemove);

    setFormData((prev) => ({
      ...prev,
      [key]: updatedFiles,
    }));
  };

  const handleOpenHtmlEditor = async (colName: string) => {
    setActiveHtmlColName(colName);
    
    console.log("handleOpenHtmlEditor > colName = ", colName);
    
    const rawValue = formData[colName.toLowerCase()];

    if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
      try {
        const __payload = {
          objectid: 'UPLOADED_FILES_FORM_ID',
          sessionId: sessionId || '',
          whereClause: [
            {
              col_name: 'pid',
              value: String(rawValue),
              operator: '=',
            },
          ],
        };
        console.log("handleOpenHtmlEditor payload > ", JSON.stringify(__payload));

        const recordResult = await viewObjectItem(__payload);
        
        console.log("handleOpenHtmlEditor result > ", JSON.stringify(recordResult))

        const __record = recordResult?.data?.data?.[0] || null;

        setHtmlRecordData(__record);

      } catch (err) {
        console.error('Error fetching uploaded files record for html editor:', err);
        setHtmlRecordData(null);
      }
    } else {
      setHtmlRecordData(null);
    }
    setShowHtmlPanel(true);
  };

  const handleOpenIconModal = async (colName: string) => {
    setActiveIconColName(colName);
    setShowIconModal(true);
    setIconLoading(true);

    try {
      const res = await getObjectRecords({
        tableName: 'form_icons_id',
        whereClause: [],
      });

      if (res && res.success && res.data) {
        const records = Array.isArray(res.data) ? res.data : res.data.data || [];
        setIconList(records);
      } else {
        setIconList([]);
      }
    } catch (err) {
      console.error('Error fetching icons list:', err);
      setIconList([]);
    } finally {
      setIconLoading(false);
    }
  };

  const handleSelectIconItem = (iconName: string) => {
    if (activeIconColName) {
      handleFieldChange(activeIconColName, iconName);
    }
    setShowIconModal(false);
  };

  const formatTimestampToTarget = (val: any): any => {
    if (!val || typeof val !== 'string') return val;
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    const parsedDate = new Date(val);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const hours = String(parsedDate.getHours()).padStart(2, '0');
      const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
      const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return val;
  };

  const runReloadProp = () => {
        handleParentFunction?.();
        console.log("runReloadProp");
  }
  const handleSaveRecord = async () => {
    if (!tableName || !recordid) return;

    setSaving(true);
    setErrorMessage('');

    try {
      const finalFormData = { ...formData };

      for (const col of columns) {
        const key = col.col_name.toLowerCase();
        const htmlType = col.html_type?.toLowerCase().trim() || '';
        const filesToUpload = finalFormData[key];

        if (htmlType === 'file' && Array.isArray(filesToUpload) && filesToUpload.length > 0) {
          const uploadResult = await doUpload({
            files: filesToUpload,
            sessionId: sessionId || '',
          });

          if (uploadResult && uploadResult.success) {
            finalFormData[key] = uploadResult.data?.id || uploadResult.id || uploadResult.data;
          } else {
            throw new Error(uploadResult.error || `File upload failed for column: ${col.col_name}`);
          }
        }
      }

      const columnData = Object.keys(finalFormData).map((key) => {
        let val = finalFormData[key];
        const matchedCol = columns.find((c) => c.col_name.toLowerCase() === key.toLowerCase());
        const htmlType = matchedCol?.html_type?.toLowerCase().trim() || '';
        const dtType = matchedCol?.dt_type?.toLowerCase().trim() || '';
        const isTimestamp = htmlType === 'date' || htmlType === 'timestamp' || htmlType.includes('timestamp') || dtType.includes('date') || dtType.includes('timestamp');
        const isHtml = htmlType === 'html';
        const isDropdown = htmlType === 'dropdown';

        if (isHtml) {
          val = savedId !== '' ? savedId : val;
        }

        if (isDropdown && val !== undefined && val !== null) {
          const strVal = String(val);
          const bracketMatch = strVal.match(/^\[(.*?)\]/);
          if (bracketMatch && bracketMatch[1]) {
            val = bracketMatch[1];
          }
        }

        if (isTimestamp && val !== undefined && val !== null && String(val).trim() !== '') {
          val = formatTimestampToTarget(val);
        }

        return {
          col_name: key,
          value: val,
        };
      });

      const payload = {
        tableName: tableName.trim(),
        sessionid: sessionId || '',
        recordid: recordid,
        columns: columnData,
      };

      const result = await updateObject(payload);

      if (result && result.success) {

        if (typeof handleParentFunction === 'function') handleParentFunction();
        if (typeof onSuccess === 'function') onSuccess();
        if (typeof onClose === 'function') onClose();
        
      } else {
        setErrorMessage(result?.error || 'Failed to update record.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error saving record.');
    } finally {
      setSaving(false);
    }
  };

  const chunkColumns = (list: ColumnSchema[], size: number) => {
    const chunks: ColumnSchema[][] = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  const renderFieldInput = (col: ColumnSchema) => {
    const colKey = col.col_name.toLowerCase();
    const rawValue = formData[colKey] !== undefined && formData[colKey] !== null ? formData[colKey] : '';
    const htmlType = col.html_type?.toLowerCase().trim() || '';
    const dtType = col.dt_type?.toLowerCase().trim() || '';
    const isFileField = htmlType === 'file';
    const isIconField = htmlType === 'icon';
    const isHtmlField = htmlType === 'html';
    const isDateOrTimestamp = htmlType === 'date' || htmlType === 'timestamp' || htmlType.includes('timestamp') || dtType.includes('date') || dtType.includes('timestamp');
    const isMoneyType = dtType.includes('money') || htmlType.includes('money');
    const isIdField = colKey === 'id';

    const isDisabled = isIdField || (col.isdisabled && String(col.isdisabled).trim().toUpperCase() === 'YES');

    if (isIdField) {
      return (
        <View style={[styles.fieldInnerContainer, isDesktop && styles.desktopCompactFieldInner]}>
          <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactFieldLabel]}>
            {col.label ? col.label.toUpperCase() : ''} (ID - ReadOnly)
          </Text>
          <Text style={[styles.valueText, styles.readOnlyText, isDesktop && styles.desktopCompactValue]}>
            {String(rawValue)}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.fieldInnerContainer, isDesktop && styles.desktopCompactFieldInner]}>
        <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactFieldLabel]}>
          {col.label ? col.label.toUpperCase() : ''}
        </Text>
        {isHtmlField ? (
          <View style={styles.fileFieldContainer}>
            <TextInput
              style={[styles.textInput, isDesktop && styles.desktopCompactInput, styles.disabledField]}
              value={String(rawValue)}
              editable={false}
              placeholder="HTML content managed via editor..."
            />
            {!isDisabled && (
              <TouchableOpacity
                style={styles.htmlEditorBtn}
                onPress={() => handleOpenHtmlEditor(col.col_name)}
                activeOpacity={0.7}
              >
                <Text style={styles.htmlEditorBtnText}>Html Editor</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isFileField ? (
          <View style={styles.fileFieldContainerCol}>
            <View style={styles.fileInputRow}>
              <TextInput
                style={[styles.textInput, isDesktop && styles.desktopCompactInput, isDisabled && styles.disabledField, { flex: 1, marginTop: 0 }]}
                value={typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue.map((f: any) => f.name).join(', ') : ''}
                onChangeText={(text) => !isDisabled && handleFieldChange(col.col_name, text)}
                placeholder="Enter file value or path..."
                editable={!isDisabled}
              />
              {!isDisabled && (
                <TouchableOpacity
                  style={[styles.fileActionBtn, isDesktop && styles.desktopCompactFileActionBtn]}
                  onPress={() => handlePickFiles(col)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.fileActionBtnText, isDesktop && styles.desktopCompactBtnText]}>Upload</Text>
                </TouchableOpacity>
              )}
              {!isDisabled && (
                <TouchableOpacity
                  style={[styles.fileActionBtn, isDesktop && styles.desktopCompactFileActionBtn]}
                  onPress={() => {
                    setSelectedFileValue(rawValue);
                    setShowFilesExplorer(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.fileActionBtnText, isDesktop && styles.desktopCompactBtnText]}>File</Text>
                </TouchableOpacity>
              )}
            </View>
            {Array.isArray(rawValue) && rawValue.length > 0 && (
              <View style={styles.fileChipContainer}>
                {rawValue.map((fileItem: any, fIdx: number) => (
                  <View key={`file-${fIdx}`} style={styles.fileChip}>
                    <Text style={styles.fileChipText} numberOfLines={1}>{fileItem.name || String(fileItem)}</Text>
                    {!isDisabled && (
                      <TouchableOpacity onPress={() => handleRemoveFile(col.col_name, fIdx)}>
                        <CloseIcon color="#DC2626" size={10} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : isIconField ? (
          <TouchableOpacity
            style={[styles.iconTriggerBox, isDesktop && styles.desktopCompactIconTrigger, isDisabled && styles.disabledField]}
            onPress={() => !isDisabled && handleOpenIconModal(col.col_name)}
            activeOpacity={isDisabled ? 1 : 0.7}
          >
            <View style={styles.iconPreviewRow}>
              {rawValue ? (
                createElement(FontAwesomeIcon, { color: isDisabled ? '#94A3B8' : 'black', name: String(rawValue), size: 24 })
              ) : (
                <Text style={styles.iconPlaceholderText}>Select Icon...</Text>
              )}
              <Text style={[styles.iconValueText, isDisabled && styles.disabledText]}>{rawValue ? String(rawValue) : 'No icon selected'}</Text>
            </View>
            {!isDisabled && <Text style={styles.iconSelectAction}>Browse ▾</Text>}
          </TouchableOpacity>
        ) : isDateOrTimestamp ? (
          <DatePickerInput
            value={String(rawValue)}
            onChange={(selectedDate) => !isDisabled && handleFieldChange(col.col_name, selectedDate)}
            onDateSelected={(selectedDate) => !isDisabled && handleFieldChange(col.col_name, selectedDate)}
            disabled={isDisabled}
          />
        ) : isMoneyType ? (
          <TextInput
            style={[styles.textInput, isDesktop && styles.desktopCompactInput, isDisabled && styles.disabledField]}
            value={String(rawValue)}
            onChangeText={(text) => !isDisabled && handleFieldChange(col.col_name, text)}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            editable={!isDisabled}
          />
        ) : (
          <TextInput
            style={[styles.textInput, isDesktop && styles.desktopCompactInput, isDisabled && styles.disabledField]}
            value={String(rawValue)}
            onChangeText={(text) => !isDisabled && handleFieldChange(col.col_name, text)}
            placeholder={`Enter ${col.label || col.col_name}...`}
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            editable={!isDisabled}
          />
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
          onPress={onClose}
        />
      )}

      {createElement('style', null, editPanelTableStyles)}

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
              style={[styles.maximizeButton, isDesktop && styles.desktopCompactMaximize]}
              onPress={() => setIsMaximized(!isMaximized)}
              accessibilityLabel={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
              title={isMaximized ? 'Restore Viewport' : 'Maximize Viewport'}
            >
              {isMaximized ? <MinimizeIcon color="#475569" size={10} /> : <MaximizeIcon color="#475569" size={10} />}
            </TouchableOpacity>
            <Text style={[styles.titleText, isDesktop && styles.desktopCompactTitle]}>{objectLabel}</Text>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, isDesktop && styles.desktopCompactClose]}
            onPress={onClose}
            accessibilityLabel="Close Panel"
          >
            <CloseIcon color="#475569" size={12} />
          </TouchableOpacity>
        </View>

        {/* ROW 2: CONTENT AREA */}
        <View style={[styles.contentRow, isDesktop && styles.desktopCompactContentRow]}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading record for editing...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.formScrollView}
              contentContainerStyle={[styles.formScrollContent, isDesktop && styles.desktopCompactScrollContent]}
              showsVerticalScrollIndicator={true}
            >
              <View style={[styles.formCardContainer, isDesktop && styles.desktopCompactCardContainer]}>
                {/* RECORD FORM HEADER */}
                <View style={[styles.formHeaderRow, isDesktop && styles.desktopCompactHeaderRow]}>
                  <View style={styles.summaryTitleWrapper}>
                    <Text style={[styles.formTitle, isDesktop && styles.desktopCompactFormTitle]}>Edit Record Details</Text>
                    <Text style={[styles.formSubtitle, isDesktop && styles.desktopCompactFormSubtitle]}>
                      Table: {objectLabel} | Record ID: {recordid}
                    </Text>
                  </View>

                  {/* LAYOUT TOGGLES */}
                  <View style={[styles.layoutToggleContainer, isDesktop && styles.desktopCompactToggleContainer]}>
                    <TouchableOpacity
                      style={[
                        styles.layoutToggleBtn,
                        isDesktop && styles.desktopCompactToggleBtn,
                        columnLayout === 1 && styles.layoutToggleBtnActive,
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
                      ]}
                      onPress={() => setColumnLayout(2)}
                      activeOpacity={0.7}
                      accessibilityLabel="2 Columns Per Line"
                    >
                      <TwoColumnIcon active={columnLayout === 2} size={isDesktop ? 10 : 16} />
                    </TouchableOpacity>
                  </View>
                </View>

                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* DYNAMIC FORM FIELDS */}
                <View style={[styles.formGrid, isDesktop && { margin: COMPACT_MARGIN, padding: COMPACT_PADDING }]}>
                  {columnLayout === 1 ? (
                    columns.map((col) => (
                      <View key={col.col_name} style={[styles.fieldRowSingle, isDesktop && styles.desktopCompactFieldRowSingle]}>
                        {renderFieldInput(col)}
                      </View>
                    ))
                  ) : (
                    chunkColumns(columns, 2).map((pair, rowIdx) => (
                      <View key={`row-${rowIdx}`} style={[styles.fieldRowDouble, isDesktop && styles.desktopCompactFieldRowDouble]}>
                        <View style={[styles.doubleColHalf, isDesktop && styles.desktopCompactDoubleColHalf]}>
                          {renderFieldInput(pair[0])}
                        </View>
                        <View style={[styles.doubleColHalf, styles.doubleColRight, isDesktop && styles.desktopCompactDoubleColRight]}>
                          {pair[1] ? renderFieldInput(pair[1]) : <View style={styles.emptyPlaceholder} />}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </View>

        {/* ROW 3: ACTION BAR */}
        <View style={[styles.actionRow, isDesktop && styles.desktopCompactActionRow]}>
          <TouchableOpacity
            style={[styles.cancelButton, isDesktop && styles.desktopCompactCancelBtn]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, isDesktop && styles.desktopCompactBtnText]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isDesktop && styles.desktopCompactSaveBtn]}
            onPress={handleSaveRecord}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <SaveIcon color="#FFFFFF" size={isDesktop ? 11 : 13} />
                <Text style={[styles.saveButtonText, isDesktop && styles.desktopCompactBtnText]}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ROW 4: FOOTER */}
        <View style={[styles.footerRow, isDesktop && styles.desktopCompactFooter]}>
          <Text style={[styles.subtleText, isDesktop && styles.desktopCompactSubtleText]}>
            Editing Table: {objectLabel || 'N/A'} | Record ID: {recordid || 'N/A'}
          </Text>
        </View>
      </View>

      {/* POPUP MODAL: SELECT ICON */}
      {showIconModal &&
        renderPortal(
          <View style={styles.iconModalOverlay}>
            <View style={styles.iconModalCard}>
              <View style={styles.iconModalHeader}>
                <Text style={styles.iconModalTitle}>Select FontAwesome Icon</Text>
                <TouchableOpacity
                  style={styles.iconModalCloseBtn}
                  onPress={() => setShowIconModal(false)}
                  activeOpacity={0.7}
                >
                  <CloseIcon color="#0F172A" size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.iconModalBody}>
                {iconLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading icons catalog...</Text>
                  </View>
                ) : iconList.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>No icons found in repository.</Text>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={styles.iconGridContainer} showsVerticalScrollIndicator={true}>
                    {iconList.map((item, idx) => {
                      const iconName = item.icon || item.col_name || item.label;
                      return (
                        <TouchableOpacity
                          key={`icon-item-${idx}-${iconName}`}
                          style={styles.iconGridItem}
                          onPress={() => handleSelectIconItem(iconName)}
                          activeOpacity={0.7}
                        >
                          {createElement(FontAwesomeIcon, { color: 'black', name: iconName, size: 24 })}
                          <Text style={styles.iconGridLabel} numberOfLines={1}>
                            {iconName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>,
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

      {/* HTML PANEL PORTAL */}
      {showHtmlPanel &&
        renderPortal(
          <HtmlPanel
            sessionid={sessionId}
            record={htmlRecordData}
            setSavedFileId={setSavedFileId}
            onClose={() => setShowHtmlPanel(false)}
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
  errorContainer: {
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
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
  },
  desktopCompactHeaderRow: {
    paddingBottom: COMPACT_PADDING,
    marginBottom: 2,
    margin: COMPACT_MARGIN,
  },
  summaryTitleWrapper: {
    flex: 1,
    minWidth: 180,
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
    fontSize: COMPACT_FONT_SIZE,
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
    borderWidth: 0,
    marginTop: 0,
    paddingTop: 0,
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
    borderWidth: 0,
    borderBottomWidth: 1,
    paddingTop: 1,
    marginTop: 1,
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
    alignItems: 'flex-start',
    width: '100%',
  },
  desktopCompactFieldInner: {
    padding: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 1,
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
  readOnlyText: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  textInput: {
    width: '100%',
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  desktopCompactInput: {
    height: 20,
    fontSize: COMPACT_FONT_SIZE,
    borderRadius: 2,
    borderWidth: 0.5,
    paddingHorizontal: 4,
  },
  disabledField: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  disabledText: {
    color: '#94A3B8',
  },
  fileFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  fileFieldContainerCol: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 2,
  },
  fileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  fileActionBtn: {
    height: 38,
    paddingHorizontal: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  desktopCompactFileActionBtn: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 2,
    marginTop: 0,
  },
  fileActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fileChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  fileChipText: {
    fontSize: 10,
    color: '#334155',
    maxWidth: 150,
  },
  htmlEditorBtn: {
    paddingHorizontal: 12,
    height: 31,
    backgroundColor: '#4F46E5',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  htmlEditorBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  iconTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    marginTop: 2,
    // @ts-ignore
    cursor: 'pointer',
  },
  desktopCompactIconTrigger: {
    height: 24,
    borderRadius: 2,
    borderWidth: 0.5,
    paddingHorizontal: 4,
  },
  iconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPlaceholderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  iconValueText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  iconSelectAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  iconModalOverlay: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    zIndex: 9999999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconModalCard: {
    width: '90%',
    maxWidth: 680,
    height: '80%',
    maxHeight: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  iconModalHeader: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  iconModalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  iconModalBody: {
    flex: 1,
    width: '100%',
    padding: 16,
    backgroundColor: '#F1F5F9',
  },
  iconGridContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  iconGridItem: {
    width: '18%',
    minWidth: 100,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
    // @ts-ignore
    cursor: 'pointer',
  },
  iconGridLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
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
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  desktopCompactCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  desktopCompactSaveBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
    gap: 3,
  },
  saveButtonText: {
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
    zIndex: 1,
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
    fontSize: COMPACT_FONT_SIZE,
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

export default EditPanel;