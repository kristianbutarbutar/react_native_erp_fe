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
import { showForm, getList } from './../apiService';
import { doSearch } from './ts/SearchPanel';

export interface ColumnSchema {
    id?: string;
    col_name: string;
    label: string;
    html_type?: string;
    mandatory?: boolean;
}

export interface SearchPanelProps {
    visible?: boolean;
    onClose?: () => void;
    onSearch?: (searchResult: any) => void;
    objectid?: string;
    sessionid?: string;
    title?: string;
    children?: React.ReactNode;
}

const CloseIcon = ({ color = '#475569', size = 20 }: { color?: string; size?: number }) =>
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

const MaximizeIcon = ({ color = '#475569', size = 16 }: { color?: string; size?: number }) =>
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

const MinimizeIcon = ({ color = '#475569', size = 16 }: { color?: string; size?: number }) =>
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

export const SearchPanel: React.FC<SearchPanelProps> = ({
    visible = true,
    onClose,
    onSearch,
    objectid = '',
    sessionid = '',
    title = 'Search Form Records',
    children,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [columns, setColumns] = useState<ColumnSchema[]>([]);
    const [searchData, setSearchData] = useState<Record<string, any>>({});
    const [displayLabels, setDisplayLabels] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Dropdown Popup Selection States
    const [activeDropdownCol, setActiveDropdownCol] = useState<string | null>(null);
    const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);
    const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

    // Date Picker Popup States
    const [activeDateCol, setActiveDateCol] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState<string>('');

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeDropdownCol) {
                    setActiveDropdownCol(null);
                } else if (activeDateCol) {
                    setActiveDateCol(null);
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
    }, [visible, activeDropdownCol, activeDateCol, onClose]);

    // Load Schema via showForm
    const loadSchema = async () => {
        if (!visible) return;
        const trimmedObjectId = objectid?.trim();

        if (!trimmedObjectId) {
            setErrorMessage('No valid Object ID provided.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const result = await showForm({
                objectid: trimmedObjectId,
                sessionId: sessionid || '',
            });

            if (result.success && result.columns) {
                const fetchedCols = result.columns;
                setColumns(fetchedCols);

                const initialValues: Record<string, any> = {};
                const initialLabels: Record<string, string> = {};
                fetchedCols.forEach((col: ColumnSchema) => {
                    initialValues[col.col_name.toLowerCase()] = '';
                    initialLabels[col.col_name.toLowerCase()] = '';
                });
                setSearchData(initialValues);
                setDisplayLabels(initialLabels);
            } else {
                setErrorMessage(result.error || 'Failed to load search schema.');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Error loading schema.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchema();
    }, [visible, objectid, sessionid]);

    const handleInputChange = (colName: string, value: any) => {
        setSearchData((prev) => ({
            ...prev,
            [colName.toLowerCase()]: value,
        }));
    };

    const handleDisplayLabelChange = (colName: string, label: string) => {
        setDisplayLabels((prev) => ({
            ...prev,
            [colName.toLowerCase()]: label,
        }));
    };

    const formatDateToDDMMYYYY = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };

    const handleDropdownPress = async (col: ColumnSchema) => {
        const colId = col.id || col.col_name;
        setActiveDropdownCol(col.col_name);
        setLoadingOptions(true);
        setDropdownOptions([]);

        try {
            const result = await getList({
                col_id: colId,
                sessionid: sessionid || '',
            });

            if (result.success && result.data) {
                const opts = Array.isArray(result.data) ? result.data : result.data.options || [];
                setDropdownOptions(opts);
            } else if (Array.isArray(result)) {
                setDropdownOptions(result);
            } else {
                setDropdownOptions([]);
            }
        } catch (err) {
            console.error('Failed to load list options:', err);
            setDropdownOptions([]);
        } finally {
            setLoadingOptions(false);
        }
    };

    // Execute doSearch and pass results back
    const handleSearchClick = async () => {
        const trimmedObjectId = objectid?.trim();
        if (!trimmedObjectId) return;

        setSubmitting(true);
        setErrorMessage('');

        try {
            // Build search array payload [{col_name, value}]
            const searchArray = columns.map((col) => {
                const key = col.col_name.toLowerCase();
                return {
                    col_name: col.col_name,
                    value: searchData[key] ?? '',
                    operator: ' like ',
                };
            });

            const searchResponse = await doSearch({
                objectid: trimmedObjectId,
                search: searchArray,
                sessionId: sessionid || '',
                row_start: 1,
                row_end: 10,
            });

            if (onSearch) {
                onSearch(searchResponse);
            }
            if (onClose) {
                onClose();
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Search execution failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!visible) return null;

    const leftColumns = columns.filter((_, index) => index % 2 === 0);
    const rightColumns = columns.filter((_, index) => index % 2 !== 0);

    return (
        <SafeAreaView style={[styles.overlay, isMaximized && styles.overlayMaximized]}>
            {isDesktop && !isMaximized && (
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            )}

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
                {/* TOP: TITLE & MAXIMIZE BAR */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeftGroup}>
                        <TouchableOpacity
                            style={styles.maximizeButton}
                            onPress={() => setIsMaximized(!isMaximized)}
                            accessibilityLabel={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
                        >
                            {isMaximized ? <MinimizeIcon color="#475569" size={16} /> : <MaximizeIcon color="#475569" size={16} />}
                        </TouchableOpacity>
                        <Text style={styles.titleText}>{title}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close Panel">
                        <CloseIcon color="#475569" size={20} />
                    </TouchableOpacity>
                </View>

                {/* NAVIGATION / SUB-HEADER BAR */}
                <View style={styles.navigationRow}>
                    <Text style={styles.navigationText}>Navigation</Text>
                </View>

                {/* CONTENT BOX (2-Section Left/Right Split) */}
                <View style={styles.contentRow}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={styles.loadingText}>Loading search parameters...</Text>
                        </View>
                    ) : errorMessage ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.errorTitle}>{errorMessage}</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.contentScrollView}
                            contentContainerStyle={styles.contentScrollContent}
                            showsVerticalScrollIndicator={true}
                        >
                            <View style={styles.columnsWrapper}>
                                {/* Left Section */}
                                <View style={styles.sectionColumn}>
                                    {leftColumns.map((col) => {
                                        const key = col.col_name.toLowerCase();
                                        const displayVal = displayLabels[key] ?? '';
                                        const htmlType = (col.html_type || 'text').toLowerCase();
                                        const isDatePicker = htmlType.includes('date picker') || htmlType === 'date' || htmlType.includes('timestamp');

                                        return (
                                            <View key={col.col_name} style={styles.fieldGroup}>
                                                <Text style={styles.fieldLabel}>{col.label || col.col_name}</Text>
                                                {htmlType === 'dropdown' ? (
                                                    <TouchableOpacity
                                                        style={styles.dropdownTrigger}
                                                        onPress={() => handleDropdownPress(col)}
                                                    >
                                                        <Text style={[styles.dropdownTriggerText, !displayVal && styles.placeholderText]}>
                                                            {displayVal ? String(displayVal) : `Select ${col.label || col.col_name}...`}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : isDatePicker ? (
                                                    <TouchableOpacity
                                                        style={styles.dropdownTrigger}
                                                        onPress={() => {
                                                            setActiveDateCol(col.col_name);
                                                            setTempDate(searchData[key] || '');
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownTriggerText, !displayVal && styles.placeholderText]}>
                                                            {displayVal ? String(displayVal) : 'dd/mm/yyyy'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TextInput
                                                        style={styles.textInput}
                                                        value={String(displayVal)}
                                                        onChangeText={(text) => {
                                                            handleDisplayLabelChange(key, text);
                                                            handleInputChange(key, text);
                                                        }}
                                                        placeholder={`Enter ${col.label || col.col_name}...`}
                                                        placeholderTextColor="#94A3B8"
                                                    />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Right Section */}
                                <View style={styles.sectionColumn}>
                                    {rightColumns.map((col) => {
                                        const key = col.col_name.toLowerCase();
                                        const displayVal = displayLabels[key] ?? '';
                                        const htmlType = (col.html_type || 'text').toLowerCase();
                                        const isDatePicker = htmlType.includes('date picker') || htmlType === 'date' || htmlType.includes('timestamp');

                                        return (
                                            <View key={col.col_name} style={styles.fieldGroup}>
                                                <Text style={styles.fieldLabel}>{col.label || col.col_name}</Text>
                                                {htmlType === 'dropdown' ? (
                                                    <TouchableOpacity
                                                        style={styles.dropdownTrigger}
                                                        onPress={() => handleDropdownPress(col)}
                                                    >
                                                        <Text style={[styles.dropdownTriggerText, !displayVal && styles.placeholderText]}>
                                                            {displayVal ? String(displayVal) : `Select ${col.label || col.col_name}...`}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : isDatePicker ? (
                                                    <TouchableOpacity
                                                        style={styles.dropdownTrigger}
                                                        onPress={() => {
                                                            setActiveDateCol(col.col_name);
                                                            setTempDate(searchData[key] || '');
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownTriggerText, !displayVal && styles.placeholderText]}>
                                                            {displayVal ? String(displayVal) : 'dd/mm/yyyy'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TextInput
                                                        style={styles.textInput}
                                                        value={String(displayVal)}
                                                        onChangeText={(text) => {
                                                            handleDisplayLabelChange(key, text);
                                                            handleInputChange(key, text);
                                                        }}
                                                        placeholder={`Enter ${col.label || col.col_name}...`}
                                                        placeholderTextColor="#94A3B8"
                                                    />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* ACTION BOX (Right Aligned Search Button) */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.searchButton, submitting && styles.disabledButton]}
                        onPress={handleSearchClick}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.searchButtonText}>Search</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* DROPDOWN POPUP SELECTION BOX */}
                {activeDropdownCol && (
                    <View style={styles.popupOverlay}>
                        <TouchableOpacity
                            style={styles.popupBackdrop}
                            activeOpacity={1}
                            onPress={() => setActiveDropdownCol(null)}
                        />
                        <View style={styles.popupContainer}>
                            <View style={styles.popupHeader}>
                                <Text style={styles.popupTitle}>Select {activeDropdownCol}</Text>
                                <TouchableOpacity onPress={() => setActiveDropdownCol(null)}>
                                    <CloseIcon color="#475569" size={18} />
                                </TouchableOpacity>
                            </View>
                            {loadingOptions ? (
                                <View style={styles.popupLoading}>
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                    <Text style={styles.loadingText}>Loading options...</Text>
                                </View>
                            ) : dropdownOptions.length > 0 ? (
                                <ScrollView style={styles.popupScroll} contentContainerStyle={styles.popupScrollContent}>
                                    {dropdownOptions.map((opt, idx) => {
                                        const optDescription = opt.description || opt.label || opt.name || String(opt);
                                        const optId = opt.id ?? opt.value ?? opt;
                                        return (
                                            <TouchableOpacity
                                                key={`opt-${idx}`}
                                                style={styles.popupItem}
                                                onPress={() => {
                                                    const colKey = activeDropdownCol.toLowerCase();
                                                    handleInputChange(colKey, optId);
                                                    handleDisplayLabelChange(colKey, optDescription);
                                                    setActiveDropdownCol(null);
                                                }}
                                            >
                                                <Text style={styles.popupItemText}>{optDescription}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <View style={styles.popupLoading}>
                                    <Text style={styles.emptyText}>No options available.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* DATE PICKER POPUP BOX */}
                {activeDateCol && (
                    <View style={styles.popupOverlay}>
                        <TouchableOpacity
                            style={styles.popupBackdrop}
                            activeOpacity={1}
                            onPress={() => setActiveDateCol(null)}
                        />
                        <View style={styles.popupContainer}>
                            <View style={styles.popupHeader}>
                                <Text style={styles.popupTitle}>Select Date ({activeDateCol})</Text>
                                <TouchableOpacity onPress={() => setActiveDateCol(null)}>
                                    <CloseIcon color="#475569" size={18} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 16, gap: 12 }}>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>Choose date (Format: dd/mm/yyyy)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={tempDate}
                                    onChangeText={setTempDate}
                                    placeholder="YYYY-MM-DD or DD/MM/YYYY"
                                    placeholderTextColor="#94A3B8"
                                />
                                <TouchableOpacity
                                    style={[styles.searchButton, { alignItems: 'center', justifyContent: 'center', marginTop: 8 }]}
                                    onPress={() => {
                                        const colKey = activeDateCol.toLowerCase();
                                        handleInputChange(colKey, tempDate);
                                        handleDisplayLabelChange(colKey, formatDateToDDMMYYYY(tempDate) || tempDate);
                                        setActiveDateCol(null);
                                    }}
                                >
                                    <Text style={styles.searchButtonText}>Confirm Date</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
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
        zIndex: 99999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayMaximized: {
        backgroundColor: '#0F172A',
        padding: 0,
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
        borderWidth: 1,
        borderColor: '#0F172A',
    },
    desktopModal: {
        width: '85%',
        maxWidth: 960,
        height: '85%',
        maxHeight: 720,
        borderRadius: 4,
    },
    maximizedModal: {
        // @ts-ignore
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
    headerRow: {
        height: 44,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#0F172A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    maximizeButton: {
        width: 28,
        height: 28,
        borderRadius: 2,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#0F172A',
    },
    titleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navigationRow: {
        height: 36,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#0F172A',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    navigationText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
    },
    contentRow: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 11,
        color: '#64748B',
    },
    errorTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
    contentScrollView: {
        flex: 1,
        width: '100%',
    },
    contentScrollContent: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    columnsWrapper: {
        flexDirection: 'row',
        gap: 24,
        width: '100%',
    },
    sectionColumn: {
        flex: 1,
        flexDirection: 'column',
        gap: 12,
    },
    fieldGroup: {
        flexDirection: 'column',
        margin: 0,
        padding: 0,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 0,
        margin: 0,
        padding: 0,
    },
    textInput: {
        height: 34,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 2,
        paddingHorizontal: 8,
        fontSize: 12,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        marginTop: 0,
    },
    dropdownTrigger: {
        height: 34,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 2,
        paddingHorizontal: 8,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginTop: 0,
    },
    dropdownTriggerText: {
        fontSize: 12,
        color: '#0F172A',
    },
    placeholderText: {
        color: '#94A3B8',
    },
    actionRow: {
        height: 44,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#0F172A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    searchButton: {
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 2,
        backgroundColor: '#4F46E5',
    },
    disabledButton: {
        opacity: 0.7,
    },
    searchButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    popupOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw' as any,
        height: '100vh' as any,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        zIndex: 100000,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupBackdrop: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    popupContainer: {
        width: '85%',
        maxWidth: 360,
        maxHeight: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#0F172A',
        overflow: 'hidden',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
    },
    popupHeader: {
        height: 40,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    popupTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    popupLoading: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popupScroll: {
        flex: 1,
    },
    popupScrollContent: {
        paddingVertical: 4,
    },
    popupItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    popupItemText: {
        fontSize: 12,
        color: '#334155',
    },
    emptyText: {
        fontSize: 11,
        color: '#94A3B8',
    },
});

export default SearchPanel;