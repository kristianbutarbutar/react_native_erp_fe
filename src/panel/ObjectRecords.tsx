'use client';

import React, { useState, useEffect, createElement } from 'react';
import { createPortal } from 'react-dom';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { tableRecords } from './ts/ObjectRecords';
import ViewPanel from './ViewPanel';
import { NewPanel } from './NewPanel';
import SearchPanel from './SearchPanel';
import { showForm } from './../panel/ts/NewPanel';
import { updateObject } from './../panel/ts/EditPanel';

const PAGE_SIZE = 10;
const DEFAULT_SESSION_ID = 'sess_12345';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '10px';
const COMPACT_PADDING = '1px';
const COMPACT_MARGIN = '1px';

export interface ObjectRecordsProps {
    formid?: string;
    formLabel?: string;
    sessionId?: string;
    actionContent?: React.ReactNode;
    navigationContent?: React.ReactNode;
    recordsContent?: React.ReactNode;
    onFilterPress?: () => void;
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

// Filter Icon
const FilterIcon = ({ color = '#000000', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' })
    );

// Plus / New Record Icon
const PlusIcon = ({ color = '#000000', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
        createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
    );

// Edit Column Icon (Fancy Outline Pencil / Edit)
const EditColumnIcon = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) =>
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

// Save Column Icon (Fancy Outline Check / Floppy Save hybrid)
const SaveColumnIcon = ({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) =>
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
        createElement('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
        createElement('polyline', { points: '17 21 17 13 7 13 7 21' }),
        createElement('polyline', { points: '7 3 7 8 15 8' })
    );

const tableStyles = `
  .object-records-table-container {
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
  }

  .object-records-table-container::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .object-records-table-container::-webkit-scrollbar-track {
    background: #F1F5F9;
  }
  .object-records-table-container::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 2px;
  }
  .object-records-table-container::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }

  .object-records-table-container table {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: ${COMPACT_FONT_SIZE};
    color: #334155;
    margin: ${COMPACT_MARGIN};
  }

  .object-records-table-container tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
  }

  .object-records-table-container th {
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
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .object-records-table-container td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    border-bottom: 1px solid #F1F5F9;
    border-right: 1px solid #F1F5F9;
    vertical-align: middle;
    white-space: nowrap;
    cursor: pointer;
  }

  .object-records-table-container tr:nth-child(even) {
    background-color: #FAFAFA;
  }

  .object-records-table-container tr:hover td {
    background-color: #EEF2FF;
    color: #312E81;
  }

  .object-records-table-container tr.selected-row td {
    background-color: #E0E7FF;
    color: #3730A3;
    font-weight: 600;
  }
`;

export const ObjectRecords: React.FC<ObjectRecordsProps> = ({
    formid = '',
    formLabel = 'Form Label',
    sessionId = DEFAULT_SESSION_ID,
    actionContent,
    navigationContent,
    recordsContent,
    onFilterPress,
    children,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [rowStart, setRowStart] = useState<number>(1);
    const [rowEnd, setRowEnd] = useState<number>(PAGE_SIZE);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [htmlTable, setHtmlTable] = useState<string>('');

    // Modal & Selection States
    const [isViewPanelOpen, setIsViewPanelOpen] = useState<boolean>(false);
    const [isNewPanelOpen, setIsNewPanelOpen] = useState<boolean>(false);
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState<boolean>(false);
    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [modalKey, setModalKey] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [searchSelections, setSearchSelections] = useState<any | null>(null);

    // Column Editing States
    const [formColumns, setFormColumns] = useState<any[]>([]);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState<boolean>(false);
    const [selectedColumnField, setSelectedColumnField] = useState<{ label: string; html_type: string; col_name?: string } | null>(null);
    const [isSaveResultOpen, setIsSaveResultOpen] = useState<boolean>(false);
    const [saveResultMessage, setSaveResultMessage] = useState<string>('');

    const injectEditColumnToHtml = (htmlString: string) => {
        if (!htmlString || typeof window === 'undefined') return htmlString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const headers = Array.from(doc.querySelectorAll('th'));
        let rowNoColIdx = -1;
        let matchedColIdx = -1;

        headers.forEach((th, idx) => {
            const text = th.textContent?.trim().toLowerCase() || '';
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

        if (doc.querySelectorAll('tr').length > 0) {
            const rows = doc.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
                if (rowIndex === 0 && selectedColumnField) return;
                const cells = row.querySelectorAll('td');

                let rowExistingValue = '';
                if (matchedColIdx !== -1 && cells[matchedColIdx]) {
                    rowExistingValue = cells[matchedColIdx].textContent?.trim() || '';
                }

                if (selectedColumnField) {
                    const newTd = doc.createElement('td');
                    newTd.style.minWidth = '25px';
                    const inputId = `edit-input-${rowIndex}`;
                    const type = selectedColumnField.html_type;

                    if (type === 'dropdown') {
                        newTd.innerHTML = `<select id="${inputId}" style="width:100%; min-width:25px; padding:2px; font-size:10px;"><option value="${rowExistingValue}">${rowExistingValue || 'Select...'}</option></select>`;
                    } else if (type === 'textarea') {
                        newTd.innerHTML = `<textarea id="${inputId}" rows="3" style="width:100%; min-width:25px; height:50px; padding:2px; font-size:10px;">${rowExistingValue}</textarea>`;
                    } else if (type === 'date' || type === 'timestamp') {
                        newTd.innerHTML = `<input type="date" id="${inputId}" value="${rowExistingValue}" style="width:100%; min-width:25px; padding:2px; font-size:10px;" />`;
                    } else {
                        newTd.innerHTML = `<input type="text" id="${inputId}" value="${rowExistingValue}" style="width:100%; min-width:25px; padding:2px; font-size:10px;" placeholder="Edit..." />`;
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

    const searchSelectionsFunction = (search: any) => {
        setSearchSelections(search);
    };

    const fetchRecords = async (start: number, end: number) => {
        if (!formid || formid.trim() === '') {
            setHtmlTable('');
            setTotalRecords(0);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const queryPayload = {
                tableName: formid.trim(),
                whereClause: [],
                row_start: start,
                row_end: end,
            };

            const response = await tableRecords(queryPayload);

            let rawResponse = response;
            if (typeof response === 'string') {
                try {
                    rawResponse = JSON.parse(response);
                } catch (e) {
                    // ignore parsing error
                }
            }

            const tableHtml =
                rawResponse?.htmlTable ||
                rawResponse?.data?.htmlTable ||
                (Array.isArray(rawResponse) && rawResponse[0]?.htmlTable) ||
                '';

            const processedHtml = injectEditColumnToHtml(tableHtml);

            const total =
                rawResponse?.totalRecords ??
                rawResponse?.data?.totalRecords ??
                (Array.isArray(rawResponse) && rawResponse[0]?.totalRecords) ??
                0;

            setHtmlTable(processedHtml);
            setTotalRecords(Number(total) || 0);
            setRowStart(start);
            setRowEnd(end);
        } catch (err: any) {
            console.error('Error fetching table records:', err);
            setError(err?.message || 'Failed to fetch table records.');
            setHtmlTable('');
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords(1, PAGE_SIZE);
    }, [formid, selectedColumnField]);

    const handleEditColumnClick = async () => {
        try {
            const res = await showForm({ tableName: formid || 'UPLOADED_FILES_FORM_ID' });
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
            const container = document.querySelector('.object-records-table-container');
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
                        if (radioEl) {
                            if (radioEl.value) {
                                recordId = radioEl.value;
                            } else if (radioEl.getAttribute('data-recordid')) {
                                recordId = radioEl.getAttribute('data-recordid') || '';
                            } else if (radioEl.id) {
                                recordId = radioEl.id;
                            }
                        }

                        if (!recordId) {
                            const checkboxEl = rowTr.querySelector('input[type="checkbox"]') as HTMLInputElement;
                            if (checkboxEl && checkboxEl.value) {
                                recordId = checkboxEl.value;
                            }
                        }

                        if (!recordId) {
                            recordId = rowTr.getAttribute('data-recordid') || String(i + rowStart);
                        }

                        const targetColName = selectedColumnField.col_name || selectedColumnField.label.toLowerCase().replace(/\s+/g, '_');

                        try {
                            const payload = {
                                tableName: formid,
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

        setSaveResultMessage(`Save operation completed.\n`);
        setIsSaveResultOpen(true);
        setSelectedColumnField(null);
        fetchRecords(rowStart, rowEnd);
    };

    // Handle incoming search response from SearchPanel and plug it into records view
    const handleSearchResult = (searchResponse: any) => {
        let rawResponse = searchResponse;
        if (typeof searchResponse === 'string') {
            try {
                rawResponse = JSON.parse(searchResponse);
            } catch (e) {
                // ignore parsing error
            }
        }

        const tableHtml =
            rawResponse?.htmlTable ||
            rawResponse?.data?.htmlTable ||
            (Array.isArray(rawResponse) && rawResponse[0]?.htmlTable) ||
            '';

        const processedHtml = injectEditColumnToHtml(tableHtml);

        const total =
            rawResponse?.totalRecords ??
            rawResponse?.data?.totalRecords ??
            (Array.isArray(rawResponse) && rawResponse[0]?.totalRecords) ??
            0;

        setHtmlTable(processedHtml);
        setTotalRecords(Number(total) || 0);
        setRowStart(1);
        setRowEnd(PAGE_SIZE);
        setIsSearchPanelOpen(false);
    };

    const handleTableContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (!target) return;
        if (target.tagName === 'TH' || target.closest('th') || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

        const row = target.closest('tr');
        if (row) {
            const radioButton = row.querySelector('input[type="radio"]') as HTMLInputElement | null;
            let radioVal = '';

            if (radioButton) {
                radioButton.checked = true;
                radioVal = radioButton.value || '';
            }

            const fallbackId =
                row.getAttribute('data-id') ||
                row.cells[0]?.textContent?.trim() ||
                '';

            const finalRecordId = radioVal || fallbackId;

            if (finalRecordId) {
                const container = (e.currentTarget as HTMLElement);
                const allRows = container.querySelectorAll('tr');
                allRows.forEach((r) => r.classList.remove('selected-row'));
                row.classList.add('selected-row');

                setSelectedRecordId(finalRecordId);
                setModalKey((prev) => prev + 1);
                setIsViewPanelOpen(true);
            }
        }
    };

    const handleCloseViewPanel = () => {
        setIsViewPanelOpen(false);
        setSelectedRecordId('');
    };

    const handleNavBackward = () => {
        if (rowStart <= 1 || loading) return;
        const newStart = Math.max(1, rowStart - PAGE_SIZE);
        const newEnd = newStart + PAGE_SIZE - 1;
        fetchRecords(newStart, newEnd);
    };

    const handleNavForward = () => {
        if (loading) return;
        if (totalRecords > 0 && rowEnd >= totalRecords) return;
        const newStart = rowStart + PAGE_SIZE;
        const newEnd = newStart + PAGE_SIZE - 1;
        fetchRecords(newStart, newEnd);
    };

    const isBackwardDisabled = rowStart <= 1 || loading;
    const isForwardDisabled =
        loading || (totalRecords > 0 && rowEnd >= totalRecords) || totalRecords === 0;

    const currentCountDisplay =
        totalRecords > 0 ? Math.min(rowEnd, totalRecords) : 0;

    // Helper to render portals directly onto document.body for true 1st top stack rendering
    const renderPortal = (content: React.ReactNode) => {
        if (typeof window === 'undefined' || !document.body) return null;
        return createPortal(content, document.body);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {createElement('style', null, tableStyles)}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    !isDesktop && styles.scrollContentMobile,
                ]}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.container}>
                    {/* Header Label */}
                    <Text style={[styles.formLabelTitle, !isDesktop && styles.formLabelTitleMobile]}>
                        Selected Form {formLabel} {formid ? `(${formid})` : ''}
                    </Text>

                    {/* 1. Action Box */}
                    <View
                        style={[
                            styles.borderBox,
                            isDesktop ? styles.actionBoxDesktop : styles.actionBoxMobile,
                        ]}
                    >
                        {actionContent ? (
                            actionContent
                        ) : (
                            < View style={styles.customActionContainer}>
                                <View />
                                <View style={styles.actionRightGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.iconActionButton,
                                            styles.editIconBtn,
                                            selectedColumnField !== null && styles.disabledBtn,
                                        ]}
                                        onPress={handleEditColumnClick}
                                        disabled={selectedColumnField !== null}
                                        activeOpacity={0.7}
                                        accessibilityLabel="Edit Column"
                                    >
                                        <EditColumnIcon color="#FFFFFF" size={13} />
                                    </TouchableOpacity>

                                    {selectedColumnField !== null && (
                                        <TouchableOpacity
                                            style={[styles.iconActionButton, styles.saveIconBtn]}
                                            onPress={handleSaveColumnClick}
                                            activeOpacity={0.7}
                                            accessibilityLabel="Save Column"
                                        >
                                            <SaveColumnIcon color="#FFFFFF" size={13} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* 2. Navigation Box */}
                    <View
                        style={[
                            styles.borderBox,
                            isDesktop ? styles.navigationBoxDesktop : styles.navigationBoxMobile,
                        ]}
                    >
                        {navigationContent ? (
                            navigationContent
                        ) : (
                            <View style={styles.customNavContainer}>
                                <View />

                                <View style={styles.rightNavGroup}>
                                    <TouchableOpacity
                                        style={[
                                            styles.navIconButton,
                                            isBackwardDisabled && styles.navIconButtonDisabled,
                                        ]}
                                        onPress={handleNavBackward}
                                        disabled={isBackwardDisabled}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Previous 10 Records"
                                    >
                                        <ArrowLeftIcon
                                            color={isBackwardDisabled ? '#94A3B8' : '#000000'}
                                            size={12}
                                        />
                                    </TouchableOpacity>

                                    <Text style={styles.navCounterText}>
                                        {currentCountDisplay}/{totalRecords}
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.navIconButton,
                                            isForwardDisabled && styles.navIconButtonDisabled,
                                        ]}
                                        onPress={handleNavForward}
                                        disabled={isForwardDisabled}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Next 10 Records"
                                    >
                                        <ArrowRightIcon
                                            color={isForwardDisabled ? '#94A3B8' : '#000000'}
                                            size={12}
                                        />
                                    </TouchableOpacity>

                                    <View style={styles.iconDivider} />

                                    {/* Filter Icon Button (Opens SearchPanel) */}
                                    <TouchableOpacity
                                        style={styles.navIconButton}
                                        onPress={() => {
                                            if (onFilterPress) {
                                                onFilterPress();
                                            }
                                            setIsSearchPanelOpen(true);
                                        }}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Filter Records"
                                    >
                                        <FilterIcon color="#000000" size={11} />
                                    </TouchableOpacity>

                                    {/* New Record Icon Button */}
                                    <TouchableOpacity
                                        style={styles.navIconButton}
                                        onPress={() => setIsNewPanelOpen(true)}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Create New Record"
                                    >
                                        <PlusIcon color="#000000" size={12} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* 3. Records Box */}
                    <View
                        style={[
                            styles.borderBox,
                            isDesktop ? styles.recordsBoxDesktop : styles.recordsBoxMobile,
                        ]}
                    >
                        {recordsContent || children ? (
                            recordsContent || children
                        ) : loading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text style={styles.loadingText}>Loading records...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : htmlTable ? (
                            createElement('div', {
                                className: 'object-records-table-container',
                                onClick: handleTableContainerClick,
                                dangerouslySetInnerHTML: { __html: htmlTable },
                            })
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>
                                    {formid ? 'No records found for this form.' : 'No form ID provided.'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* VIEW PANEL PORTAL TO DOCUMENT BODY */}
            {
                isViewPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <ViewPanel
                            key={`viewpanel-${selectedRecordId}-${modalKey}`}
                            visible={isViewPanelOpen}
                            onClose={handleCloseViewPanel}
                            onDeleteSuccess={() => {
                                handleCloseViewPanel();
                                fetchRecords(rowStart, rowEnd);
                            }}
                            onEditSuccess={() => {
                                fetchRecords(rowStart, rowEnd);
                            }}
                            title={formLabel}
                            tableName={formid}
                            recordid={selectedRecordId}
                            sessionId={sessionId}
                        />
                    </View>
                )
            }

            {/* NEW PANEL PORTAL TO DOCUMENT BODY */}
            {
                isNewPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <NewPanel
                            visible={isNewPanelOpen}
                            onClose={() => setIsNewPanelOpen(false)}
                            onSuccess={() => {
                                setIsNewPanelOpen(false);
                                fetchRecords(rowStart, rowEnd);
                            }}
                            title={`New ${formLabel}`}
                            tableName={formid}
                            sessionId={sessionId}
                        />
                    </View>
                )
            }

            {/* SEARCH PANEL PORTAL TO DOCUMENT BODY */}
            {
                isSearchPanelOpen &&
                renderPortal(
                    <SearchPanel
                        visible={isSearchPanelOpen}
                        objectid={formid}
                        sessionid={sessionId}
                        title={`Search ${formLabel}`}
                        onClose={() => setIsSearchPanelOpen(false)}
                        onSearch={handleSearchResult}
                        searchSelectionsFunction={searchSelectionsFunction}
                        searchSelection={searchSelections}
                    />
                )
            }

            {/* POP UP BOX IN MIDDLE OF BROWSER FOR SELECTING COLUMN */}
            {
                isColumnModalOpen &&
                renderPortal(
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
                )
            }

            {/* POP UP BOX IN MIDDLE OF BROWSER FOR SAVE RESULT */}
            {
                isSaveResultOpen &&
                renderPortal(
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
                )
            }
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        height: '100%',
        width: '100%',
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        padding: 2,
        flexGrow: 1,
        width: '100%',
        maxWidth: '100%',
    },
    scrollContentMobile: {
        padding: 8,
    },
    container: {
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    formLabelTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 1,
    },
    formLabelTitleMobile: {
        fontSize: 12,
    },
    borderBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#0F172A',
        borderRadius: 2,
        padding: 1,
        margin: 1,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box' as any,
    },

    actionBoxDesktop: {
        minHeight: 20,
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 1,
        margin: 1,
    },
    navigationBoxDesktop: {
        minHeight: 22,
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 1,
        margin: 1,
    },
    recordsBoxDesktop: {
        // @ts-ignore
        height: '62vh',
        minHeight: 260,
        padding: 1,
        margin: 1,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },

    actionBoxMobile: {
        minHeight: 36,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    navigationBoxMobile: {
        minHeight: 36,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    recordsBoxMobile: {
        height: 350,
        minHeight: 280,
        padding: 0,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },

    customActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 1,
    },
    actionRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    customNavContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 1,
    },
    rightNavGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 2,
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
    navIconButtonDisabled: {
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    navCounterText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000000',
        minWidth: 36,
        textAlign: 'center',
        fontFamily: 'monospace',
    },

    iconActionButton: {
        width: 24,
        height: 18,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editIconBtn: {
        backgroundColor: '#4F46E5',
    },
    saveIconBtn: {
        backgroundColor: '#16A34A',
    },
    disabledBtn: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },

    topStackOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        zIndex: 999999,
        alignItems: 'center',
        justifyContent: 'center',
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        minHeight: 200,
    },
    loadingText: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 6,
    },
    errorText: {
        fontSize: 10,
        color: '#DC2626',
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 10,
        color: '#94A3B8',
        textAlign: 'center',
    },
});

export default ObjectRecords;