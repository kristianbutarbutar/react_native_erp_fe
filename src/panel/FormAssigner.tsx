'use client';

import React, { useState, createElement } from 'react';
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
import { getObjectRecords, doSave } from './../apiService';

export interface FormAssignerProps {
    parentid?: string;
    parentLabel?: string;
    formlevel?: number | string;
    rootMenuLabel?: string;
    rootMenuId?: string;
    sessionId?: string;
    onSaveSuccess?: () => void;
    onClose?: () => void;
}

const CloseIcon = ({ color = '#475569', size = 18 }: { color?: string; size?: number }) =>
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

const MaximizeIcon = ({ color = '#475569', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '15 3 21 3 21 9' }),
        createElement('polyline', { points: '9 21 3 21 3 15' }),
        createElement('line', { x1: '21', y1: '3', x2: '14', y2: '10' }),
        createElement('line', { x1: '3', y1: '21', x2: '10', y2: '14' })
    );

const MinimizeIcon = ({ color = '#475569', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '4 14 10 14 10 20' }),
        createElement('polyline', { points: '20 10 14 10 14 4' }),
        createElement('line', { x1: '14', y1: '10', x2: '21', y2: '3' }),
        createElement('line', { x1: '10', y1: '14', x2: '3', y2: '21' })
    );

export const FormAssigner: React.FC<FormAssignerProps> = ({
    parentid = 'ROOT',
    parentLabel = 'Root Parent',
    formlevel = 2,
    rootMenuLabel = 'Root Menu',
    rootMenuId = '',
    sessionId = 'sess_12345',
    onSaveSuccess,
    onClose,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Maximize / Minimize state
    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    // Form state
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedChildDisplay, setSelectedChildDisplay] = useState<string>('');
    const [selectedItemLabel, setSelectedItemLabel] = useState<string>('');
    const [targetTsxValue, setTargetTsxValue] = useState<string>('ObjectRecords.tsx');
    const [formLevelValue, setFormLevelValue] = useState<string>(String(formlevel));

    // Popup list box state
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [popupRecords, setPopupRecords] = useState<any[]>([]);
    const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
    const [popupError, setPopupError] = useState<string>('');

    // Saving state
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');

    // Fetch Object Records when Popup opens
    const handleOpenPopup = async () => {
        setIsPopupOpen(true);
        setLoadingRecords(true);
        setPopupError('');

        try {
            const result = await getObjectRecords({
                tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                whereClause: [],
            });

            if (result) {
                const records = Array.isArray(result)
                    ? result
                    : result.data || result.rows || [];
                setPopupRecords(records);
            } else {
                setPopupError('Failed to load object records.');
            }
        } catch (err: any) {
            setPopupError(err?.message || 'Error fetching records.');
        } finally {
            setLoadingRecords(false);
        }
    };

    // Save Assignment using doSave with root_menu attribute
    const handleSave = async () => {
        if (!selectedChildId) {
            setSaveError('Please select a children object first.');
            return;
        }

        setSaving(true);
        setSaveError('');

        try {
            const savePayload = {
                tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                columns: [
                    { col_name: 'pid', value: parentid },
                    { col_name: 'formid', value: selectedChildId },
                    { col_name: 'level', value: Number(formLevelValue) || 0 },
                    { col_name: 'label', value: selectedItemLabel },
                    { col_name: 'target_tsx', value: targetTsxValue.trim() },
                    { col_name: 'root_menu', value: rootMenuId || parentid },
                ],
            };

            const result = await doSave(savePayload);

            if (result && result.success !== false) {
                if (onSaveSuccess) onSaveSuccess();
                if (onClose) onClose();
            } else {
                setSaveError(result?.error || 'Failed to save assignment.');
            }
        } catch (err: any) {
            setSaveError(err?.message || 'Error during save execution.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, isMaximized && styles.safeAreaMaximized]}>
            <View style={[styles.container, isMaximized && styles.containerMaximized]}>
                {/* 1. Header Box with Maximize / Minimize Control */}
                <View style={styles.headerBox}>
                    <View style={styles.headerLeftGroup}>
                        <TouchableOpacity
                            style={styles.maximizeButton}
                            onPress={() => setIsMaximized(!isMaximized)}
                            accessibilityLabel={isMaximized ? 'Minimize Window' : 'Maximize Window'}
                        >
                            {isMaximized ? <MinimizeIcon color="#475569" size={14} /> : <MaximizeIcon color="#475569" size={14} />}
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Assign Child</Text>
                    </View>
                    {onClose && (
                        <TouchableOpacity style={styles.headerCloseBtn} onPress={onClose} accessibilityLabel="Close Window">
                            <CloseIcon color="#475569" size={18} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 2. Content Box */}
                <View style={styles.contentBox}>
                    <Text style={styles.contentBoxWatermark}>content box</Text>

                    <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={true}>
                        <View style={styles.formSection}>
                            {/* Parent Object Field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Parent Object</Text>
                                <View style={styles.inputControl}>
                                    <Text style={styles.inputText}>{parentLabel} ({parentid})</Text>
                                </View>
                            </View>

                            {/* Root Menu Context Disabled Text Form Element */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Root Menu Context</Text>
                                <View style={styles.inputControlDisabled}>
                                    <Text style={styles.inputDisabledText}>
                                        {rootMenuLabel} {rootMenuId ? `(${rootMenuId})` : ''}
                                    </Text>
                                </View>
                            </View>

                            {/* Children Object Field (Clickable to open Pop Up Lists Objects) */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Children Object</Text>
                                <TouchableOpacity
                                    style={styles.inputControlClickable}
                                    onPress={handleOpenPopup}
                                    activeOpacity={0.7}
                                    accessibilityLabel="Select Children Object"
                                >
                                    <Text style={[styles.inputText, !selectedChildDisplay && styles.placeholderText]}>
                                        {selectedChildDisplay ? selectedChildDisplay : 'Click to select children object...'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Target tsx Field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Target tsx</Text>
                                <TextInput
                                    style={styles.textInputControl}
                                    value={targetTsxValue}
                                    onChangeText={setTargetTsxValue}
                                    placeholder="ObjectRecords.tsx"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            {/* Form Level Field (Now Editable) */}
                            <View style={styles.fieldGroupSmall}>
                                <Text style={styles.fieldLabel}>Form Level</Text>
                                <TextInput
                                    style={styles.textInputControl}
                                    value={formLevelValue}
                                    onChangeText={setFormLevelValue}
                                    placeholder="2"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
                    </ScrollView>
                </View>

                {/* 3. Action Box */}
                <View style={styles.actionBox}>
                    <Text style={styles.actionBoxLabel}>Action Box</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.7}
                        accessibilityLabel="Save Assignment"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#0F172A" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* POP UP LISTS OBJECTS (Centered Modal) */}
                {isPopupOpen && (
                    <View style={styles.popupOverlay}>
                        <TouchableOpacity
                            style={styles.popupBackdrop}
                            activeOpacity={1}
                            onPress={() => setIsPopupOpen(false)}
                        />
                        <View style={styles.popupContainer}>
                            <View style={styles.popupHeader}>
                                <Text style={styles.popupTitleText}>Pop Up Lists Objects</Text>
                                <TouchableOpacity onPress={() => setIsPopupOpen(false)} accessibilityLabel="Close Popup">
                                    <CloseIcon color="#475569" size={18} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.popupBody}>
                                {loadingRecords ? (
                                    <View style={styles.centerContainer}>
                                        <ActivityIndicator size="large" color="#4F46E5" />
                                        <Text style={styles.loadingText}>Loading records...</Text>
                                    </View>
                                ) : popupError ? (
                                    <View style={styles.centerContainer}>
                                        <Text style={styles.errorText}>{popupError}</Text>
                                    </View>
                                ) : popupRecords.length > 0 ? (
                                    <ScrollView style={styles.popupScroll} contentContainerStyle={styles.popupScrollContent}>
                                        {popupRecords.map((item, idx) => {
                                            const itemLabel = item.label || item.name || 'Unnamed';
                                            const itemTableName = item.tablename || item.formid || item.id || `item-${idx}`;
                                            const displayString = `${itemLabel} - ${itemTableName}`;

                                            return (
                                                <TouchableOpacity
                                                    key={`popup-item-${idx}`}
                                                    style={styles.popupItemRow}
                                                    onPress={() => {
                                                        setSelectedChildId(itemTableName);
                                                        setSelectedChildDisplay(displayString);
                                                        setSelectedItemLabel(itemLabel);
                                                        setIsPopupOpen(false);
                                                    }}
                                                    activeOpacity={0.6}
                                                >
                                                    <Text style={styles.popupItemText}>{displayString}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.centerContainer}>
                                        <Text style={styles.emptyText}>No records found.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: '100%',
    },
    safeAreaMaximized: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw' as any,
        height: '100vh' as any,
        zIndex: 99999,
        padding: 0,
    },
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        gap: 6,
    },
    containerMaximized: {
        width: '100vw' as any,
        height: '100vh' as any,
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    headerBox: {
        height: 40,
        borderWidth: 1,
        borderColor: '#0F172A',
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    maximizeButton: {
        width: 26,
        height: 26,
        borderRadius: 2,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerCloseBtn: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#0F172A',
        borderRadius: 2,
        padding: 16,
        backgroundColor: '#FFFFFF',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    contentBoxWatermark: {
        position: 'absolute',
        top: 6,
        right: 10,
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: 'monospace',
    },
    formScrollContent: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    formSection: {
        flexDirection: 'column',
        gap: 14,
        maxWidth: 420,
    },
    fieldGroup: {
        flexDirection: 'column',
        gap: 4,
    },
    fieldGroupSmall: {
        flexDirection: 'column',
        gap: 4,
        width: 140,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
    },
    inputControl: {
        height: 36,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 2,
        paddingHorizontal: 8,
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    inputControlDisabled: {
        height: 36,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 2,
        paddingHorizontal: 8,
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    inputDisabledText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    inputControlClickable: {
        height: 36,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 2,
        paddingHorizontal: 8,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    textInputControl: {
        height: 36,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 2,
        paddingHorizontal: 8,
        fontSize: 12,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    inputText: {
        fontSize: 12,
        color: '#0F172A',
    },
    placeholderText: {
        color: '#94A3B8',
    },
    actionBox: {
        height: 44,
        borderWidth: 1,
        borderColor: '#0F172A',
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    actionBoxLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
    },
    saveButton: {
        paddingHorizontal: 24,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#0F172A',
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
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
    errorText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '500',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 11,
        color: '#94A3B8',
    },

    // POP UP LISTS OBJECTS MODAL (Centered)
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
        zIndex: 999999,
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
        maxWidth: 480,
        height: '75%',
        maxHeight: 520,
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
        height: 44,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    popupTitleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    popupBody: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    popupScroll: {
        flex: 1,
    },
    popupScrollContent: {
        paddingVertical: 4,
    },
    popupItemRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    popupItemText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
    },
});

export default FormAssigner;