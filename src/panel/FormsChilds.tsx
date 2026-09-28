'use client';

import React, { useState, useEffect } from 'react';
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
import { showForms, saveFormChilds, type ShowFormsPayload } from './ts/FormsChilds';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '11px';
const COMPACT_PADDING = '2px';
const COMPACT_MARGIN = '2px';
const CONTAINER_HORIZONTAL_MARGIN = 15;

export interface FormItem {
    id?: string;
    label: string;
    tableName?: string;
    level?: number;
    seqno?: number;
    description?: string;
    [key: string]: any;
}

export interface FormsChildsProps {
    children?: React.ReactNode;
    onSave?: (result: any) => void;
}

// 1. Payload for Forms Lists 1 Box
const DEFAULT_FORMS_LIST_1_PAYLOAD: ShowFormsPayload = {
    tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
    whereClause: [
        { col_name: 'pid', value: 'ROOT', type: 'STRING', operator: '=' },
    ],
};

// 2. Payload for Form Lists 2 Box
const DEFAULT_FORMS_LIST_2_PAYLOAD: ShowFormsPayload = {
    tableName: 'VNBSHQXYCQFLYNQVCMXSGWNLGHGNAQEAYJIOVVQFOKGYXBAUDQ',
    whereClause: [
        { col_name: 'status', value: 'active', type: 'STRING', operator: '=' },
    ],
};

export const FormsChilds: React.FC<FormsChildsProps> = ({ children, onSave }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Master Data State for Forms Lists 1
    const [parentFormsList, setParentFormsList] = useState<FormItem[]>([]);
    const [selectedParentForm, setSelectedParentForm] = useState<FormItem | null>(null);

    // Form Lists 2 vs Form Childs State
    const [availableChildsList, setAvailableChildsList] = useState<FormItem[]>([]);
    const [selectedFormChilds, setSelectedFormChilds] = useState<FormItem[]>([]);

    // Form Level State
    const [formLevelText, setFormLevelText] = useState<string>('1');

    // Loading & Error States
    const [loadingList1, setLoadingList1] = useState<boolean>(true);
    const [loadingList2, setLoadingList2] = useState<boolean>(true);
    const [loadingChilds, setLoadingChilds] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [errorList1, setErrorList1] = useState<string>('');
    const [errorList2, setErrorList2] = useState<string>('');
    const [errorChilds, setErrorChilds] = useState<string>('');
    const [saveMessage, setSaveMessage] = useState<string>('');

    const extractFormsArray = (response: any): FormItem[] => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.result)) return response.result;
        if (Array.isArray(response.rows)) return response.rows;
        return [];
    };

    const formatItemDisplay = (item: FormItem): string => {
        const label = item.label;
        const tableName = item.tableName || item.id || 'N/A';
        return `${label} - ${tableName}`;
    };

    // 1. On Mount: Fetch Forms Lists 1 (tableName: 't_mn', pid: 'ROOT')
    useEffect(() => {
        let isMounted = true;

        const fetchFormsList1Data = async () => {
            setLoadingList1(true);
            setErrorList1('');

            try {
                const result = await showForms(DEFAULT_FORMS_LIST_1_PAYLOAD);

                if (!isMounted) return;

                if (result.success && result.data) {
                    const fetchedForms = extractFormsArray(result.data);
                    setParentFormsList(fetchedForms);

                    if (fetchedForms.length > 0) {
                        const firstParent = fetchedForms[0];
                        handleSelectParentForm(firstParent);
                    }
                } else {
                    setErrorList1(result.error || 'Failed to load menu forms from t_mn.');
                }
            } catch (err: any) {
                if (isMounted) {
                    setErrorList1(err?.message || 'Error fetching menu forms data.');
                }
            } finally {
                if (isMounted) {
                    setLoadingList1(false);
                }
            }
        };

        fetchFormsList1Data();

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. On Mount: Fetch Form Lists 2 (tableName: 't_form', status: 'active')
    useEffect(() => {
        let isMounted = true;

        const fetchFormsList2Data = async () => {
            setLoadingList2(true);
            setErrorList2('');

            try {
                const result = await showForms(DEFAULT_FORMS_LIST_2_PAYLOAD);

                if (!isMounted) return;

                if (result.success && result.data) {
                    const fetchedForms = extractFormsArray(result.data);
                    setAvailableChildsList(fetchedForms);
                } else {
                    setErrorList2(result.error || 'Failed to load active forms for Form Lists 2.');
                }
            } catch (err: any) {
                if (isMounted) {
                    setErrorList2(err?.message || 'Error fetching Form Lists 2 data.');
                }
            } finally {
                if (isMounted) {
                    setLoadingList2(false);
                }
            }
        };

        fetchFormsList2Data();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handler: Select record in Forms Lists 1 -> Fetch child records for Form Childs box
    const handleSelectParentForm = async (form: FormItem) => {
        setSelectedParentForm(form);
        setFormLevelText(String(form.level ?? '1'));
        setSaveMessage('');

        const recordId = form.id || form.formid;
        if (!recordId) {
            setSelectedFormChilds([]);
            return;
        }

        setLoadingChilds(true);
        setErrorChilds('');

        try {
            const childsPayload: ShowFormsPayload = {
                tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                whereClause: [
                    { col_name: 'pid', value: recordId, type: 'STRING', operator: '=' },
                ],
            };

            const result = await showForms(childsPayload);

            if (result.success && result.data) {
                const fetchedChilds = extractFormsArray(result.data);
                setSelectedFormChilds(fetchedChilds);
            } else {
                setErrorChilds(result.error || 'Failed to load form childs.');
            }
        } catch (err: any) {
            setErrorChilds(err?.message || 'Error fetching child records.');
        } finally {
            setLoadingChilds(false);
        }
    };

    // Handler: Move record from Form Lists 2 to Form Childs
    const handleMoveToChilds = (itemToMove: FormItem) => {
        setAvailableChildsList((prev) =>
            prev.filter((item) => (item.id || item.label) !== (itemToMove.id || itemToMove.label))
        );
        setSelectedFormChilds((prev) => [...prev, itemToMove]);
    };

    // Handler: Move record back from Form Childs to Form Lists 2
    const handleRemoveFromChilds = (itemToRemove: FormItem) => {
        setSelectedFormChilds((prev) =>
            prev.filter((item) => (item.id || item.label) !== (itemToRemove.id || itemToRemove.label))
        );
        setAvailableChildsList((prev) => [...prev, itemToRemove]);
    };

    // Handler: Save Button Click -> calls saveFormChilds
    const handleSave = async () => {
        if (!selectedParentForm) {
            setErrorChilds('Please select a parent form first.');
            return;
        }

        const selectedFormId = selectedParentForm.id || selectedParentForm.formid || '';

        setSaving(true);
        setSaveMessage('');
        setErrorChilds('');

        try {
            const mappedChildren = selectedFormChilds.map((childItem, index) => ({
                pid: selectedFormId,
                label: childItem.label || '',
                status: 'ACTIVE',
                level: formLevelText,
                formid: childItem.tableName || childItem.id || '',
                seqno: childItem.seqno ?? index + 1,
            }));

            const payload = {
                tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                recordid: selectedFormId,
                children: mappedChildren,
            };

            const result = await saveFormChilds(payload);

            if (result.success) {
                setSaveMessage('Saved successfully!');
                if (onSave) {
                    onSave(result);
                }
            } else {
                setErrorChilds(result.error || 'Failed to save form child records.');
            }
        } catch (err: any) {
            setErrorChilds(err?.message || 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* TOP HEADER BAR WITH SAVE BUTTON */}
            <View style={[styles.topHeaderBar, isDesktop && styles.desktopCompactTopBar]}>
                <View style={styles.topHeaderLeft}>
                    <Text style={[styles.topHeaderTitle, isDesktop && styles.desktopCompactText]}>Forms & Childs Configuration</Text>
                    {saveMessage ? <Text style={styles.saveSuccessText}>{saveMessage}</Text> : null}
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isDesktop && styles.desktopCompactSaveBtn, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving || loadingList1 || loadingList2}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.saveButtonText, isDesktop && styles.desktopCompactText]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout, !isDesktop && styles.mainLayoutMobile]}>
                {/* ================= COLUMN 1: FORMS LISTS 1 ================= */}
                <View style={[isDesktop ? styles.vw13BoxContainer : styles.columnMobile]}>
                    <Text style={[styles.columnHeaderTitle, isDesktop && styles.desktopCompactText]}>Select Parent Form</Text>
                    <View style={[styles.borderBox, isDesktop ? styles.desktopCompactBox : styles.borderBoxMobile]}>
                        <Text style={[styles.boxTitleLabel, isDesktop && styles.desktopCompactText]}>Forms Lists 1</Text>

                        {loadingList1 ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text style={styles.loadingText}>Loading forms...</Text>
                            </View>
                        ) : errorList1 ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.errorText}>{errorList1}</Text>
                            </View>
                        ) : parentFormsList.length > 0 ? (
                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.scrollContentInner}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {parentFormsList.map((item, idx) => {
                                    const itemKey = item.id || `parent-form-${idx}`;
                                    const isSelected =
                                        (selectedParentForm?.id && selectedParentForm.id === item.id) ||
                                        (selectedParentForm?.label && selectedParentForm.label === item.label);

                                    return (
                                        <TouchableOpacity
                                            key={itemKey}
                                            style={[styles.listItemCard, isDesktop && styles.desktopCompactCard, isSelected && styles.listItemCardSelected]}
                                            onPress={() => handleSelectParentForm(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[styles.listItemTitle, isDesktop && styles.desktopCompactText, isSelected && styles.listItemTitleSelected]}
                                            >
                                                {formatItemDisplay(item)}
                                            </Text>
                                            {item.id && <Text style={[styles.listItemSubtext, isDesktop && styles.desktopCompactSubtext]}>ID: {item.id}</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>No active forms found in t_mn.</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ================= COLUMN 2: SELECTED FORM & FORM LISTS 2 ================= */}
                <View style={[isDesktop ? styles.middleGroupContainer : styles.columnMobile]}>
                    <Text style={[styles.columnHeaderTitle, isDesktop && styles.desktopCompactText]}>Selected Parent Form</Text>
                    <View style={[styles.selectedParentRow, isDesktop && styles.desktopCompactParentRow]}>
                        <View
                            style={[
                                styles.borderBox,
                                isDesktop ? styles.vw13BoxContainer : styles.flexBox1,
                                isDesktop ? styles.desktopCompactSelectedForm : styles.selectedFormHeight,
                            ]}
                        >
                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.scrollContentInner}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                <Text style={[styles.selectedFormLabelText, isDesktop && styles.desktopCompactText]}>Selected Form</Text>
                                <Text style={[styles.selectedFormValueText, isDesktop && styles.desktopCompactText]} numberOfLines={1}>
                                    {selectedParentForm ? formatItemDisplay(selectedParentForm) : 'No Form Selected'}
                                </Text>
                            </ScrollView>
                        </View>

                        <View style={[styles.borderBox, styles.formLevelBadgeBox, isDesktop && styles.desktopCompactFormLevelBox]}>
                            <Text style={[styles.formLevelTitleText, isDesktop && styles.desktopCompactText]}>Form Level</Text>
                            <TextInput
                                style={[styles.formLevelTextInput, isDesktop && styles.desktopCompactLevelInput]}
                                value={formLevelText}
                                onChangeText={setFormLevelText}
                                keyboardType="numeric"
                                placeholder="1"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </View>

                    <Text style={[styles.columnHeaderTitle, { marginTop: isDesktop ? 2 : 12 }, isDesktop && styles.desktopCompactText]}>
                        Select Form Childs
                    </Text>
                    <View
                        style={[
                            styles.borderBox,
                            isDesktop ? styles.desktopCompactBoxList2 : styles.flexBox1,
                            !isDesktop && styles.borderBoxMobile,
                        ]}
                    >
                        <Text style={[styles.boxTitleLabel, isDesktop && styles.desktopCompactText]}>Form Lists 2</Text>

                        {loadingList2 ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text style={styles.loadingText}>Loading forms...</Text>
                            </View>
                        ) : errorList2 ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.errorText}>{errorList2}</Text>
                            </View>
                        ) : availableChildsList.length > 0 ? (
                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.scrollContentInner}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {availableChildsList.map((item, idx) => {
                                    const itemKey = item.id || `child-form-available-${idx}`;

                                    return (
                                        <TouchableOpacity
                                            key={itemKey}
                                            style={[styles.listItemCard, isDesktop && styles.desktopCompactCard]}
                                            onPress={() => handleMoveToChilds(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.listItemTitle, isDesktop && styles.desktopCompactText]}>{formatItemDisplay(item)}</Text>
                                            <Text style={[styles.actionHintText, isDesktop && styles.desktopCompactSubtext]}>Click to move to Form Childs →</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>All records moved to Form Childs.</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ================= COLUMN 3: FORM CHILDS ================= */}
                <View style={[isDesktop ? styles.vw13BoxContainer : styles.columnMobile]}>
                    <Text style={[styles.columnHeaderTitle, isDesktop && styles.desktopCompactText]}>Selected Form Childs</Text>
                    <View style={[styles.borderBox, isDesktop ? styles.desktopCompactBox : styles.borderBoxMobile]}>
                        <Text style={[styles.boxTitleLabel, isDesktop && styles.desktopCompactText]}>Form childs ({selectedFormChilds.length})</Text>

                        {loadingChilds ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text style={styles.loadingText}>Loading child records...</Text>
                            </View>
                        ) : errorChilds ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.errorText}>{errorChilds}</Text>
                            </View>
                        ) : children ? (
                            children
                        ) : selectedFormChilds.length > 0 ? (
                            <ScrollView
                                style={styles.scrollArea}
                                contentContainerStyle={styles.scrollContentInner}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {selectedFormChilds.map((item, idx) => {
                                    const itemKey = item.id || `selected-child-${idx}`;

                                    return (
                                        <TouchableOpacity
                                            key={itemKey}
                                            style={[styles.listItemCard, isDesktop && styles.desktopCompactCard, styles.selectedChildCard]}
                                            onResponseChange={() => { }}
                                            onPress={() => handleRemoveFromChilds(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.listItemTitle, isDesktop && styles.desktopCompactText, styles.selectedChildTitle]}>
                                                {formatItemDisplay(item)}
                                            </Text>
                                            <Text style={[styles.removeHintText, isDesktop && styles.desktopCompactSubtext]}>← Click to return to Form Lists 2</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>
                                    No child forms found for selected record.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    topHeaderBar: {
        paddingHorizontal: 16,
        marginTop: 2,
        marginBottom: 2,
        paddingTop: 2,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    desktopCompactTopBar: {
        height: 24,
        paddingHorizontal: 6,
        paddingVertical: COMPACT_PADDING,
        marginHorizontal: CONTAINER_HORIZONTAL_MARGIN,
        marginVertical: COMPACT_MARGIN,
        borderBottomWidth: 0.5,
    },
    topHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    topHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    saveSuccessText: {
        fontSize: 11,
        color: '#16A34A',
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopCompactSaveBtn: {
        paddingHorizontal: 10,
        paddingVertical: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 2,
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    mainLayout: {
        flex: 1,
        height: '100%',
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    desktopMainLayout: {
        paddingHorizontal: CONTAINER_HORIZONTAL_MARGIN,
        paddingVertical: COMPACT_MARGIN,
        gap: COMPACT_MARGIN,
    },
    mainLayoutMobile: {
        flexDirection: 'column',
        gap: 20,
    },

    vw13BoxContainer: {
        // @ts-ignore
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },

    middleGroupContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },

    desktopCompactBox: {
        // @ts-ignore
        height: '50vh',
        minHeight: 220,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 2,
        borderWidth: 0.5,
    },
    desktopCompactBoxList2: {
        // @ts-ignore
        height: '45vh',
        minHeight: 200,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 2,
        borderWidth: 0.5,
    },

    columnMobile: {
        flex: 1,
        width: '100%',
        height: 'auto',
    },
    columnHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },

    desktopCompactText: {
        fontSize: COMPACT_FONT_SIZE,
    },

    borderBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#0F172A',
        borderRadius: 4,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    borderBoxMobile: {
        minHeight: 220,
        maxHeight: 280,
    },
    flexBox1: {
        flex: 1,
    },
    boxTitleLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 10,
        textAlign: 'center',
    },

    selectedParentRow: {
        flexDirection: 'row',
        gap: 8,
        minHeight: 70,
        maxHeight: 80,
    },
    desktopCompactParentRow: {
        height: '5vh',
        maxHeight: '5vh',
        minHeight: 22,
        gap: COMPACT_MARGIN,
        margin: COMPACT_MARGIN,
    },
    selectedFormHeight: {
        height: 72,
    },
    desktopCompactSelectedForm: {
        height: '5vh',
        minHeight: 22,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderWidth: 0.5,
        borderRadius: 2,
        justifyContent: 'center',
    },
    selectedFormLabelText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
    },
    selectedFormValueText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 1,
    },
    formLevelBadgeBox: {
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    desktopCompactFormLevelBox: {
        width: 65,
        height: '5vh',
        minHeight: 22,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderWidth: 0.5,
        borderRadius: 2,
        justifyContent: 'center',
    },
    formLevelTitleText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },

    formLevelTextInput: {
        width: '100%',
        height: 28,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#4F46E5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 0,
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5',
        backgroundColor: '#EEF2FF',
        textAlign: 'center',
    },
    desktopCompactLevelInput: {
        height: 16,
        marginTop: 0,
        borderWidth: 0.5,
        borderRadius: 1,
        fontSize: COMPACT_FONT_SIZE,
        padding: 0,
    },

    scrollArea: {
        flex: 1,
        width: '100%',
    },
    scrollContentInner: {
        flexGrow: 1,
        paddingBottom: 8,
    },

    listItemCard: {
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    desktopCompactCard: {
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 1,
        borderWidth: 0.5,
    },
    listItemCardSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    selectedChildCard: {
        backgroundColor: '#F0FDF4',
        borderColor: '#86EFAC',
    },
    listItemTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    listItemTitleSelected: {
        color: '#FFFFFF',
    },
    selectedChildTitle: {
        color: '#166534',
    },
    listItemSubtext: {
        fontSize: 9,
        color: '#94A3B8',
        marginTop: 2,
    },
    desktopCompactSubtext: {
        fontSize: 9,
        marginTop: 0,
    },
    actionHintText: {
        fontSize: 9,
        color: '#4F46E5',
        fontWeight: '500',
        marginTop: 4,
    },
    removeHintText: {
        fontSize: 9,
        color: '#DC2626',
        fontWeight: '500',
        marginTop: 4,
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 6,
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
});

export default FormsChilds;