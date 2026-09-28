'use client';

import React, { useEffect, useState, createElement } from 'react';
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
import { showForm, createForm } from './ts/NewPanel';
import { getList } from './../apiService';
import { doUpload } from './../customer/ts/ObjectFile';
import DatePickerInput from './DatePickerInput';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '11px';
const COMPACT_PADDING = '2px';
const COMPACT_MARGIN = '2px';

export interface ColumnSchema {
  id: string;
  col_name: string;
  label: string;
  html_type?: string;
  mandatory?: boolean;
  visible?: string;
}

export interface NewPanelProps {
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  tableName?: string;
  sessionId?: string;
  parentid?: string;
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

const newPanelTableStyles = `
  .new-panel-compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${COMPACT_FONT_SIZE};
    margin: ${COMPACT_MARGIN};
  }
  .new-panel-compact-table tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
  }
  .new-panel-compact-table th,
  .new-panel-compact-table td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    font-size: ${COMPACT_FONT_SIZE};
  }
  .web-file-input {
    display: none;
  }
`;

const DISABLED_COLUMNS = ['id', 'pid', 'createdby', 'createddate', 'updatedby', 'updateddate', 'delflag'];

export const NewPanel: React.FC<NewPanelProps> = ({
  visible = true,
  onClose,
  onSuccess,
  title = 'New Record',
  tableName = '',
  sessionId = '',
  parentid = '',
  children,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [displayLabels, setDisplayLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Column Layout mode: 1 column per line vs 2 columns per line
  const [columnLayout, setColumnLayout] = useState<1 | 2>(2);

  // Dropdown popup state management
  const [activeDropdownCol, setActiveDropdownCol] = useState<ColumnSchema | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);
  const [loadingDropdown, setLoadingDropdown] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdownCol) {
          setActiveDropdownCol(null);
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
  }, [visible, activeDropdownCol, onClose]);

  // Load Schema
  const loadSchema = async () => {
    if (!visible) return;
    const trimmedTableName = tableName?.trim();
    if (!trimmedTableName) {
      setErrorMessage('No valid Table Name provided.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await showForm({ tableName: trimmedTableName });
      if (result.success && result.data) {
        const fetchedCols =
          result.data.columns ||
          result.data.schema?.columns ||
          (Array.isArray(result.data) ? result.data : []);

        setColumns(fetchedCols);

        // Initialize form state & display labels, setting PID if applicable
        const initialValues: Record<string, any> = {};
        const initialLabels: Record<string, string> = {};

        fetchedCols.forEach((col: ColumnSchema) => {
          const key = col.col_name.toLowerCase();
          if (key === 'pid') {
            initialValues[key] = parentid || '';
            initialLabels[key] = parentid || '';
          } else {
            initialValues[key] = '';
            initialLabels[key] = '';
          }
        });

        setFormData(initialValues);
        setDisplayLabels(initialLabels);
      } else {
        setErrorMessage(result.error || 'Failed to load form schema.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error loading schema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, [visible, tableName, parentid]);

  const handleInputChange = (colName: string, value: any) => {
    const key = colName.toLowerCase();
    if (DISABLED_COLUMNS.includes(key)) return;

    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDisplayLabels((prev) => ({
      ...prev,
      [key]: String(value ?? ''),
    }));
  };

  // Web-compatible multi-file picker via HTML input element injection
  const handlePickFiles = (col: ColumnSchema) => {
    const key = col.col_name.toLowerCase();
    if (DISABLED_COLUMNS.includes(key) || typeof document === 'undefined') return;

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
      const fileNamesDisplay = combinedFiles.map((f: any) => f.name).join(', ');

      setFormData((prev) => ({
        ...prev,
        [key]: combinedFiles,
      }));
      setDisplayLabels((prev) => ({
        ...prev,
        [key]: fileNamesDisplay,
      }));
    };

    fileInput.click();
  };

  const handleRemoveFile = (colName: string, indexToRemove: number) => {
    const key = colName.toLowerCase();
    const currentFiles = Array.isArray(formData[key]) ? formData[key] : [];
    const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToRemove);
    const fileNamesDisplay = updatedFiles.map((f: any) => f.name).join(', ');

    setFormData((prev) => ({
      ...prev,
      [key]: updatedFiles,
    }));
    setDisplayLabels((prev) => ({
      ...prev,
      [key]: fileNamesDisplay,
    }));
  };

  // Open dropdown list modal & fetch list options dynamically via getList
  const handleOpenDropdown = async (col: ColumnSchema) => {
    const key = col.col_name.toLowerCase();
    if (DISABLED_COLUMNS.includes(key)) return;

    setActiveDropdownCol(col);
    setLoadingDropdown(true);
    setDropdownOptions([]);

    try {
      const colId: string = col.id;
      const response = await getList({ col_id: colId, sessionid: sessionId || '' });

      if (response) {
        const items = Array.isArray(response)
          ? response
          : response.data || response.rows || [];
        setDropdownOptions(items);
      }
    } catch (err) {
      console.error('Error loading dropdown options:', err);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const handleSelectDropdownItem = (colName: string, item: any) => {
    const key = colName.toLowerCase();
    const optLabel = item.description || item.label || item.name || '';
    const optId = item.id || item.value || '';

    setFormData((prev) => ({
      ...prev,
      [key]: optId,
    }));

    const displayValue = optId && optLabel ? `${optLabel}` : optId || optLabel || String(item);
    setDisplayLabels((prev) => ({
      ...prev,
      [key]: displayValue,
    }));

    setActiveDropdownCol(null);
  };

  const handleSave = async () => {
    const trimmedTableName = tableName?.trim();
    if (!trimmedTableName) {
      alert('Objectid is missing.');
      return;
    }

    setSubmitting(true);

    try {
      const finalFormData = { ...formData };

      // Process file columns before submission
      for (const col of columns) {
        const key = col.col_name.toLowerCase();
        const htmlType = col.html_type?.toLowerCase() || '';
        const filesToUpload = finalFormData[key];

        if (htmlType === 'file' && Array.isArray(filesToUpload) && filesToUpload.length > 0) {
          const uploadResult = await doUpload({
            files: filesToUpload,
            sessionid: sessionId || '',
          });

          if (uploadResult && uploadResult.success) {
            finalFormData[key] = uploadResult.data.id;
          } else {
            throw new Error(uploadResult.error || `File upload failed for column: ${col.col_name}`);
          }
        }
      }

      const columnPayload = columns.map((col) => {
        const key = col.col_name.toLowerCase();
        return {
          col_name: col.col_name,
          value: finalFormData[key] ?? '',
        };
      });

      const result = await createForm({
        tableName: trimmedTableName,
        sessionId: sessionId || '',
        columns: columnPayload,
      });

      if (result.success) {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        alert(result.error || 'Failed to save record.');
      }
    } catch (err: any) {
      alert(err?.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to chunk columns into pairs for 2-column layout
  const chunkColumns = (list: ColumnSchema[], size: number) => {
    const chunks: ColumnSchema[][] = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  // Render individual input control based on column definition metadata
  const renderFieldInput = (col: ColumnSchema) => {
    const key = col.col_name.toLowerCase();
    const val = formData[key] ?? '';
    const displayVal = displayLabels[key] ?? '';
    const htmlType = col.html_type?.toLowerCase() || '';
    const isDisabled = DISABLED_COLUMNS.includes(key);
    const isDropdown = htmlType === 'dropdown';
    const isFile = htmlType === 'file';
    const isTextArea = htmlType === 'textarea';
    const isDateOrTimestamp = htmlType === 'date' || htmlType === 'timestamp' || htmlType.includes('timestamp');
    const attachedFiles = Array.isArray(val) ? val : [];
    const isHidden = col.visible?.toString().toLowerCase() === 'no';

    return (
      <View
        style={[
          styles.fieldInnerContainer,
          isDesktop && styles.desktopCompactFieldInner,
          isHidden && { display: 'none' },
        ]}
      >
        <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactFieldLabel]}>
          {col.label}
          {col.mandatory && !isDisabled && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
        <View style={styles.controlWrapper}>
          {isFile ? (
            <View style={styles.fileUploadWrapper}>
              <TouchableOpacity
                style={[styles.dropdownControl, isDesktop && styles.desktopCompactControl, isDisabled && styles.disabledField]}
                onPress={() => !isDisabled && handlePickFiles(col)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text style={[styles.dropdownText, isDesktop && styles.desktopCompactInputText, !displayVal && styles.placeholderText, isDisabled && styles.disabledText]} numberOfLines={1}>
                  {displayVal ? String(displayVal) : isDisabled ? '(Auto)' : `Select files...`}
                </Text>
              </TouchableOpacity>
              {attachedFiles.length > 0 && (
                <View style={styles.fileChipContainer}>
                  {attachedFiles.map((fileItem: any, fIdx: number) => (
                    <View key={`file-${fIdx}`} style={styles.fileChip}>
                      <Text style={styles.fileChipText} numberOfLines={1}>{fileItem.name}</Text>
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
          ) : isDropdown ? (
            <TouchableOpacity
              style={[styles.dropdownControl, isDesktop && styles.desktopCompactControl, isDisabled && styles.disabledField]}
              onPress={() => !isDisabled && handleOpenDropdown(col)}
              activeOpacity={isDisabled ? 1 : 0.7}
            >
              <Text style={[styles.dropdownText, isDesktop && styles.desktopCompactInputText, !displayVal && styles.placeholderText, isDisabled && styles.disabledText]} numberOfLines={1}>
                {displayVal ? String(displayVal) : isDisabled ? '(Auto)' : `Select ${col.label || col.col_name}...`}
              </Text>
            </TouchableOpacity>
          ) : isDateOrTimestamp ? (
            <DatePickerInput
              value={String(val)}
              onChange={(selectedDate) => handleInputChange(key, selectedDate)}
              onDateSelected={(selectedDate) => handleInputChange(key, selectedDate)}
              disabled={isDisabled}
            />
          ) : isTextArea ? (
            <TextInput
              style={[styles.textAreaInput, isDesktop && styles.desktopCompactTextArea, isDisabled && styles.disabledField]}
              value={String(val)}
              onChangeText={(text) => handleInputChange(key, text)}
              placeholder={isDisabled ? '(Auto)' : `Enter ${col.label || col.col_name}...`}
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={4}
              editable={!isDisabled}
            />
          ) : (
            <TextInput
              style={[styles.textInput, isDesktop && styles.desktopCompactInput, isDisabled && styles.disabledField]}
              value={String(val)}
              onChangeText={(text) => handleInputChange(key, text)}
              placeholder={isDisabled ? '(Auto)' : `Enter ${col.label || col.col_name}...`}
              placeholderTextColor="#94A3B8"
              editable={!isDisabled}
            />
          )}
        </View>
      </View>
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

      {createElement('style', null, newPanelTableStyles)}

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

        {/* ROW 2: CONTENT AREA */}
        <View style={[styles.contentRow, isDesktop && styles.desktopCompactContentRow]}>
          {children || (
            loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading form schema...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorTitle}>{errorMessage}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.formScrollView}
                contentContainerStyle={[styles.formScrollContent, isDesktop && styles.desktopCompactScrollContent]}
                showsVerticalScrollIndicator={true}
              >
                <View style={[styles.formCardContainer, isDesktop && styles.desktopCompactCardContainer]}>
                  {/* FORM CARD HEADER WITH LAYOUT TOGGLE ICONS */}
                  <View style={[styles.formHeader, isDesktop && styles.desktopCompactHeader]}>
                    <View>
                      <Text style={[styles.formTitle, isDesktop && styles.desktopCompactFormTitle]}>Record Entry</Text>
                      <Text style={[styles.formSubtitle, isDesktop && styles.desktopCompactFormSubtitle]}>Table: {tableName}</Text>
                    </View>

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
                        <SingleColumnIcon active={columnLayout === 1} size={isDesktop ? 10 : 14} />
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
                        <TwoColumnIcon active={columnLayout === 2} size={isDesktop ? 10 : 14} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* FORM FIELDS GRID CONTAINER */}
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
            )
          )}
        </View>

        {/* ROW 3: ACTION BAR */}
        <View style={[styles.actionRow, isDesktop && styles.desktopCompactActionRow]}>
          <TouchableOpacity
            style={[styles.cancelButton, isDesktop && styles.desktopCompactCancelBtn]}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={[styles.cancelButtonText, isDesktop && styles.desktopCompactBtnText]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isDesktop && styles.desktopCompactSaveBtn, submitting && styles.disabledButton]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveButtonText, isDesktop && styles.desktopCompactBtnText]}>Save Record</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ROW 4: FOOTER */}
        <View style={[styles.footerRow, isDesktop && styles.desktopCompactFooter]}>
          <Text style={[styles.subtleText, isDesktop && styles.desktopCompactSubtleText]}>Table: {tableName || 'N/A'}</Text>
        </View>
      </View>

      {/* DROPDOWN OPTIONS MODAL POPUP */}
      {activeDropdownCol && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setActiveDropdownCol(null)}
          />
          <View style={styles.dropdownModalBox}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitleText}>
                Select {activeDropdownCol.label || activeDropdownCol.col_name}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdownCol(null)}>
                <CloseIcon color="#475569" size={14} />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownBody}>
              {loadingDropdown ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading options...</Text>
                </View>
              ) : dropdownOptions.length > 0 ? (
                <ScrollView style={styles.dropdownScroll} contentContainerStyle={styles.dropdownScrollContent}>
                  {dropdownOptions.map((opt, idx) => {
                    const optLabel = opt.description || opt.label || '';
                    const optId = opt.id || opt.value || '';
                    const displayLabel = optId && optLabel ? `${optLabel}` : optId || optLabel || JSON.stringify(opt);

                    return (
                      <TouchableOpacity
                        key={`drop-opt-${idx}`}
                        style={styles.dropdownItemRow}
                        onPress={() => handleSelectDropdownItem(activeDropdownCol.col_name, opt)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.dropdownItemText}>{displayLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>No options found.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 1100,
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
  formHeader: {
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
  desktopCompactHeader: {
    paddingBottom: COMPACT_PADDING,
    marginBottom: COMPACT_MARGIN * 2,
    margin: COMPACT_MARGIN,
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
    marginTop: 1,
    paddingTop: 1,
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
  requiredAsterisk: {
    color: '#EF4444',
  },
  controlWrapper: {
    width: '100%',
  },
  textInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
  },
  desktopCompactInput: {
    fontSize: COMPACT_FONT_SIZE,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    borderRadius: 2,
    borderWidth: 0.5,
    marginTop: 1,
  },
  textAreaInput: {
    width: '100%',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
    textAlignVertical: 'top',
  },
  desktopCompactTextArea: {
    height: 40,
    fontSize: COMPACT_FONT_SIZE,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    borderRadius: 2,
    borderWidth: 0.5,
    marginTop: 1,
  },
  dropdownControl: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    marginTop: 2,
  },
  desktopCompactControl: {
    fontSize: COMPACT_FONT_SIZE,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    borderRadius: 2,
    borderWidth: 0.5,
    marginTop: 1,
    height: 22,
  },
  disabledField: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  dropdownText: {
    fontSize: 13,
    color: '#0F172A',
  },
  desktopCompactInputText: {
    fontSize: COMPACT_FONT_SIZE,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  disabledText: {
    color: '#94A3B8',
  },
  fileUploadWrapper: {
    width: '100%',
  },
  fileChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
  },
  desktopCompactActionRow: {
    minHeight: 22,
    paddingHorizontal: 4,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 0.5,
    borderTopColor: '#0F172A',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  desktopCompactCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
    marginRight: 4,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopCompactSaveBtn: {
    paddingHorizontal: 8,
    paddingVertical: COMPACT_PADDING,
    margin: COMPACT_MARGIN,
    borderRadius: 2,
  },
  disabledButton: {
    opacity: 0.7,
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

  // DROPDOWN POPUP MODAL STYLES
  dropdownOverlay: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownModalBox: {
    width: '85%',
    maxWidth: 420,
    height: '70%',
    maxHeight: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0F172A',
    overflow: 'hidden',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 10px 25px rgba(15, 23, 42, 0.2)',
  },
  dropdownHeader: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dropdownScroll: {
    flex: 1,
    width: '100%',
  },
  dropdownScrollContent: {
    paddingVertical: 4,
  },
  dropdownItemRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default NewPanel;