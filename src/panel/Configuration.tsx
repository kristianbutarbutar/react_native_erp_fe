'use client';

import React, { useState, useEffect, createElement } from 'react';
import { createPortal } from 'react-dom';

// @ts-ignore
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
import { loadTabs, getTabs, type LoadTabsPayload } from './ts/Configuration';
import { dropMenu } from './mnt/Maintenance';
import { renderFontAwesomeIcon } from './../customer/FontAwesomeIcon';

// Dynamic panel/component imports
import FormsChilds from './FormsChilds';
import ObjectRecords from './ObjectRecords';
import NewPanel from './NewPanel';
import HtmlPanel from './HtmlPanel';
import EditPanel from './EditPanel';
import DeletePanel from './DeletePanel';
import ViewPanel from './ViewPanel';
import SearchPanel from './SearchPanel';
import FormAssigner from './FormAssigner';

export interface TabItem {
    id?: string;
    label: string;
    pid?: string;
    level?: number;
    icon: string;
    formid?: string;
    target_tsx?: string;
    [key: string]: any;
}

export interface CustomTabsBoxItem {
    tabBoxName: string;
    tabs: Array<{
        parenttab?: string;
        tabid?: string;
        tablabel?: string;
        icon: string;
        parentrecordid?: string;
        formid?: string;
        target_tsx?: string;
        [key: string]: any;
    }>;
}

export interface ConfigurationProps {
    children?: React.ReactNode;
}

const DEFAULT_PARENT_PAYLOAD: LoadTabsPayload = {
    tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
    whereClause: [
        { col_name: 'level', value: 1, type: 'INT', operator: '=' },
        { col_name: 'pid', value: 'ROOT', type: 'STRING', operator: '=' },
    ],
};

const SESSION_ID = 'sess_12345';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '10px';
const COMPACT_PADDING = '1px';
const COMPACT_MARGIN = '1px';

// Helper to safely extract target_tsx regardless of property casing
const getTargetTsx = (item: TabItem | null | undefined): string => {
    if (!item) return '';
    const val =
        item.target_tsx ??
        item.TARGET_TSX ??
        item.targetTsx ??
        item.target_TSX ??
        '';
    return String(val).trim();
};

// Helper to safely extract formid regardless of property casing
const getFormId = (item: TabItem | null | undefined): string => {
    if (!item) return '';
    const val =
        item.formid ??
        item.FORMID ??
        item.formId ??
        item.tableName ??
        item.tablename ??
        item.id ??
        '';
    return String(val).trim();
};

// Maximize Icon (Expand)
const MaximizeIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
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

// Minimize Icon (Contract)
const MinimizeIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
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

// Hamburger Menu Icon Component
const HamburgerIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
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
        createElement('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
        createElement('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
        createElement('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
    );

const configurationTableStyles = `
  .configuration-compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${COMPACT_FONT_SIZE};
    margin: ${COMPACT_MARGIN};
  }
  .configuration-compact-table tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
  }
  .configuration-compact-table th,
  .configuration-compact-table td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    font-size: ${COMPACT_FONT_SIZE};
  }
`;

export const Configuration: React.FC<ConfigurationProps> = ({ children }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Fullsize Workspace Toggle State
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    // Parent Tabs State
    const [parentTabs, setParentTabs] = useState<TabItem[]>([]);
    const [selectedParent, setSelectedParent] = useState<TabItem | null>(null);
    const [loadingParents, setLoadingParents] = useState<boolean>(true);
    const [parentError, setParentError] = useState<string>('');

    // Child Tabs State
    const [childTabs, setChildTabs] = useState<TabItem[]>([]);
    const [selectedChild, setSelectedChild] = useState<TabItem | null>(null);
    const [loadingChildren, setLoadingChildren] = useState<boolean>(false);
    const [childError, setChildError] = useState<string>('');

    // Dynamic Custom Tabs Boxes State & Counter
    const [customTabsBoxes, setCustomTabsBoxes] = useState<CustomTabsBoxItem[]>([]);
    const [childTabCounter, setChildTabCounter] = useState<number>(1);

    // Active clicked tab reference (includes parent, child, or custom sub-tab items)
    const [activeTab, setActiveTab] = useState<TabItem | null>(null);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    // Popup Menu State ('parent' | 'child' | string | null) - can hold box name for custom boxes
    const [activeMenuType, setActiveMenuType] = useState<string | null>(null);

    // Captured Trigger Source for Add/Drop Child ("parent" | "child" | string | null)
    const [menuTriggerSource, setMenuTriggerSource] = useState<string | null>(null);

    // Active Custom Box Object for Deletion/Addition
    const [activeCustomBoxItem, setActiveCustomBoxItem] = useState<CustomTabsBoxItem | null>(null);

    // Track the currently selected sub-tab item inside dynamic custom tabs boxes
    const [selectedCustomTabItem, setSelectedCustomTabItem] = useState<any | null>(null);

    // FormAssigner Modal State
    const [isFormAssignerOpen, setIsFormAssignerOpen] = useState<boolean>(false);

    // Deletion Clarification Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);

    // Helper to drop specific tabsBox from screen
    const dropTabsBox = (tabBoxName: string) => {
        setCustomTabsBoxes((prev) => prev.filter((box) => box.tabBoxName !== tabBoxName));
    };

    // Helper to close/delete all custom tabs boxes strictly below a given box name
    const dropDescendantTabsBoxes = (currentBoxName: string) => {
        setCustomTabsBoxes((prev) => {
            const index = prev.findIndex((b) => b.tabBoxName === currentBoxName);
            if (index >= 0) {
                // Keep the current box and everything before it, remove everything below it
                return prev.slice(0, index + 1);
            }
            return prev;
        });
    };

    // Helper to add a new tabsBox under child tabs
    const addTabsBoxUnderChildTabs = ({
        tabBoxName,
        tabs,
        parentBoxName,
    }: {
        tabBoxName: string;
        tabs: Array<{ parenttab?: string; tabid?: string; tablabel?: string; icon: string; parentrecordid?: string;[key: string]: any }>;
        parentBoxName?: string;
    }) => {
        if (!tabBoxName) return;
        setCustomTabsBoxes((prev) => {
            if (parentBoxName) {
                const parentIndex = prev.findIndex((b) => b.tabBoxName === parentBoxName);
                if (parentIndex >= 0) {
                    const truncated = prev.slice(0, parentIndex + 1);
                    const existingTargetIndex = truncated.findIndex((b) => b.tabBoxName === tabBoxName);
                    if (existingTargetIndex >= 0) {
                        truncated[existingTargetIndex] = { tabBoxName, tabs };
                        return truncated;
                    }
                    return [...truncated, { tabBoxName, tabs }];
                }
            }

            const existingIndex = prev.findIndex((b) => b.tabBoxName === tabBoxName);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { tabBoxName, tabs };
                return updated;
            }
            return [...prev, { tabBoxName, tabs }];
        });
    };

    // Helper to extract clean array from loadTabs/getTabs response
    const extractTabArray = (response: any): TabItem[] => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.result)) return response.result;
        if (Array.isArray(response.rows)) return response.rows;
        return [];
    };

    // Trigger getTabs on tab click, populate custom tabs box, and handle active selection/highlighting
    const handleTabClickFetchSubTabs = async (tabItem: TabItem, currentBoxName?: string) => {
        const tabId = tabItem.id || getFormId(tabItem);
        if (!tabId) return;

        setIsTransitioning(true);
        setActiveTab(tabItem);

        if (currentBoxName) {
            dropDescendantTabsBoxes(currentBoxName);
        }

        try {
            const res = await getTabs({
                objectid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                parenttabid: tabId,
                recordid: 'rec_default_01',
            });

            if (res.success && res.data) {
                const rawTabsData = res.data?.data || res.data?.rows || res.data;
                const fetchedTabs = extractTabArray(rawTabsData);
                const newBoxName = `child_tab_${childTabCounter}`;
                setChildTabCounter((prev) => prev + 1);

                if (fetchedTabs.length > 0) {
                    addTabsBoxUnderChildTabs({
                        tabBoxName: newBoxName,
                        parentBoxName: currentBoxName,
                        tabs: fetchedTabs.map((t) => ({
                            parenttab: tabId,
                            tabid: t.id || getFormId(t),
                            tablabel: t.label,
                            formid: t.formid || t.tableName || t.id,
                            target_tsx: t.target_tsx || 'ObjectRecords',
                            icon: t.icon,
                            parentrecordid: 'rec_default_01',
                        })),
                    });
                }
            }
        } catch (err) {
            console.error('Error calling getTabs on tab click:', err);
        } finally {
            setTimeout(() => {
                setIsTransitioning(false);
            }, 0);
        }
    };

    // Refresh parents list helper
    const fetchParentTabs = async () => {
        setLoadingParents(true);
        setParentError('');

        try {
            const result = await loadTabs(DEFAULT_PARENT_PAYLOAD);

            if (result.success && result.data) {
                const fetchedTabs = extractTabArray(result.data);
                setParentTabs(fetchedTabs);

                if (fetchedTabs.length > 0 && !selectedParent) {
                    handleSelectParent(fetchedTabs[0]);
                }
            } else {
                setParentError(result.error || 'Failed to load parent configuration tabs.');
            }
        } catch (err: any) {
            setParentError(err?.message || 'Error fetching parent configuration tabs.');
        } finally {
            setLoadingParents(false);
        }
    };

    // 1. On Mount: Fetch Parent Tabs (Level 1, PID ROOT)
    useEffect(() => {
        let isMounted = true;

        const initFetch = async () => {
            if (isMounted) {
                await fetchParentTabs();
            }
        };

        initFetch();

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. On Parent Tab Click: Drop specific/all tabs boxes, clear content first, then fetch child tabs & load target TSX
    const handleSelectParent = async (parentTab: TabItem) => {
        customTabsBoxes.forEach((box) => {
            dropTabsBox(box.tabBoxName);
        });

        setSelectedChild(null);
        setSelectedParent(parentTab);
        setChildTabs([]);
        setChildError('');

        const parentId = parentTab.id || getFormId(parentTab);
        if (!parentId) {
            setChildError('Selected parent tab has no valid ID.');
            return;
        }

        setLoadingChildren(true);

        try {
            const childPayload: LoadTabsPayload = {
                tableName: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                whereClause: [
                    { col_name: 'level', value: 2, type: 'INT', operator: '=' },
                    { col_name: 'pid', value: parentId, type: 'STRING', operator: '=' },
                ],
            };

            const result = await loadTabs(childPayload);

            if (result.success && result.data) {
                const fetchedChildTabs = extractTabArray(result.data);
                setChildTabs(fetchedChildTabs);
            } else {
                setChildError(result.error || 'Failed to load child tabs.');
            }
        } catch (err: any) {
            setChildError(err?.message || 'Error fetching child tabs.');
        } finally {
            setLoadingChildren(false);
        }
    };

    // 3. On Child Tab Click: Clear content first, then load child target TSX
    const handleSelectChild = async (childTab: TabItem) => {
        customTabsBoxes.forEach((box) => {
            dropTabsBox(box.tabBoxName);
        });
        setSelectedChild(childTab);
        await handleTabClickFetchSubTabs(childTab);
    };

    // 4. On Custom Sub-Tab Click (Dynamic Tabs Boxes): Highlight and load target component with props
    const handleSelectCustomTab = async (tItem: any, boxItem: CustomTabsBoxItem) => {
        setActiveCustomBoxItem(boxItem);
        setSelectedCustomTabItem(tItem);
        const customTabObj: TabItem = {
            id: tItem.tabid,
            label: tItem.tablabel || tItem.label,
            formid: tItem.formid || tItem.tabid,
            target_tsx: tItem.target_tsx || 'ObjectRecords',
        };
        await handleTabClickFetchSubTabs(customTabObj, boxItem.tabBoxName);
    };

    // 5. Dynamic Component Resolver for Content Area based on target_tsx
    const renderTabContent = () => {
        if (isTransitioning) {
            return (
                <View style={styles.inlineCenter}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                </View>
            );
        }

        const targetTsx =
            getTargetTsx(activeTab) ||
            getTargetTsx(selectedChild) ||
            getTargetTsx(selectedParent);

        const currentFormId =
            getFormId(activeTab) ||
            getFormId(selectedChild) ||
            getFormId(selectedParent);

        const currentFormLabel =
            activeTab?.label ||
            selectedChild?.label ||
            selectedParent?.label ||
            '';

        if (targetTsx) {
            const normalizedTarget = targetTsx
                .toLowerCase()
                .replace(/(\.tsx|\.ts)$/, '')
                .trim();

            switch (normalizedTarget) {
                case 'htmlpanel':
                    return <HtmlPanel />;
                case 'formschilds':
                    return <FormsChilds />;

                case 'objectrecords':
                    return (
                        <ObjectRecords
                            key={`obj-rec-${currentFormId}`}
                            formid={currentFormId}
                            formLabel={currentFormLabel}
                            sessionId={SESSION_ID}
                        />
                    );

                case 'searchpanel':
                    return (
                        <SearchPanel
                            key={`search-panel-${currentFormId}`}
                            visible={true}
                            objectid={currentFormId}
                            sessionid={SESSION_ID}
                            title={`Search ${currentFormLabel}`}
                        />
                    );

                case 'newpanel':
                    return (
                        <NewPanel
                            key={`new-panel-${currentFormId}`}
                            visible={true}
                            tableName={currentFormId}
                            sessionId={SESSION_ID}
                        />
                    );

                case 'editpanel':
                    return (
                        <EditPanel
                            key={`edit-panel-${currentFormId}`}
                            visible={true}
                            tableName={currentFormId}
                            sessionId={SESSION_ID}
                        />
                    );

                case 'deletepanel':
                    return (
                        <DeletePanel
                            key={`del-panel-${currentFormId}`}
                            visible={true}
                            tableName={currentFormId}
                            sessionId={SESSION_ID}
                        />
                    );

                case 'viewpanel':
                    return (
                        <ViewPanel
                            key={`view-panel-${currentFormId}`}
                            visible={true}
                            tableName={currentFormId}
                            sessionId={SESSION_ID}
                        />
                    );

                default:
                    return (
                        <ObjectRecords
                            key={`obj-rec-fallback-${currentFormId}`}
                            formid={currentFormId}
                            formLabel={currentFormLabel}
                            sessionId={SESSION_ID}
                        />
                    );
            }
        }

        return (
            <ObjectRecords
                key={`obj-rec-default-${currentFormId}`}
                formid={currentFormId}
                formLabel={currentFormLabel}
                sessionId={SESSION_ID}
            />
        );
    };

    const handleMenuAction = (action: string, type: string, boxItem?: CustomTabsBoxItem) => {
        setActiveMenuType(null);
        setMenuTriggerSource(type);
        if (boxItem) {
            setActiveCustomBoxItem(boxItem);
        }

        if (action === 'Add Child') {
            setIsFormAssignerOpen(true);
        } else if (action === 'Add Tab Box') {
            const boxName = prompt('Enter Tab Box Name:');
            if (boxName) {
                const parentId = type === 'parent'
                    ? selectedParent?.id
                    : type === 'child'
                    ? selectedChild?.id
                    : selectedCustomTabItem?.tabid || activeTab?.id || selectedChild?.id || selectedParent?.id;

                addTabsBoxUnderChildTabs({
                    tabBoxName: boxName,
                    parentBoxName: boxItem?.tabBoxName,
                    tabs: [
                        {
                            parenttab: parentId || 'ROOT',
                            tabid: 'sample_tab_1',
                            tablabel: 'Sample Sub Tab',
                            formid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                            target_tsx: 'ObjectRecords',
                            icon: 'folder',
                            parentrecordid: 'rec_01',
                        },
                    ],
                });
            }
        } else if (action === 'Drop Child') {
            const targetTab = type === 'parent'
                ? selectedParent
                : type === 'child'
                ? selectedChild
                : selectedCustomTabItem
                ? { id: selectedCustomTabItem.tabid, label: selectedCustomTabItem.tablabel }
                : activeTab;

            if (!targetTab) {
                alert(`No item selected to drop.`);
                return;
            }
            setIsDeleteModalOpen(true);
        } else if (action === 'Open Children Tabs') {
            const targetTab = type === 'parent'
                ? selectedParent
                : type === 'child'
                ? selectedChild
                : selectedCustomTabItem
                ? { id: selectedCustomTabItem.tabid, label: selectedCustomTabItem.tablabel }
                : activeTab;

            if (targetTab) {
                handleTabClickFetchSubTabs(targetTab, boxItem?.tabBoxName);
            }
        } else {
            alert(`${action} triggered for ${type}`);
        }
    };

    // Execute dropMenu API call on confirmation
    const handleDeleteConfirmation = async () => {
        const isChildTrigger = menuTriggerSource === 'child';
        const isCustomBoxTrigger = menuTriggerSource && menuTriggerSource.startsWith('child_tab_');
        const targetTab = isChildTrigger ? selectedChild : isCustomBoxTrigger ? (selectedCustomTabItem ? { id: selectedCustomTabItem.tabid, label: selectedCustomTabItem.tablabel } : activeTab) : selectedParent;

        if (!targetTab) {
            setIsDeleteModalOpen(false);
            return;
        }

        const selectedMenuId = targetTab.id || getFormId(targetTab);
        if (!selectedMenuId) {
            alert('Selected tab item has no valid ID.');
            setIsDeleteModalOpen(false);
            return;
        }

        setDeleting(true);

        try {
            const dropResult = await dropMenu({
                objectid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                selectedmenuid: selectedMenuId,
                sessionid: SESSION_ID,
            });

            if (dropResult && dropResult.success !== false) {
                setIsDeleteModalOpen(false);
                if (isChildTrigger) {
                    setSelectedChild(null);
                    if (selectedParent) {
                        await handleSelectParent(selectedParent);
                    }
                } else if (isCustomBoxTrigger && activeCustomBoxItem) {
                    dropTabsBox(activeCustomBoxItem.tabBoxName);
                    setActiveCustomBoxItem(null);
                    setSelectedCustomTabItem(null);
                } else {
                    setSelectedParent(null);
                    setSelectedChild(null);
                    setChildTabs([]);
                    await fetchParentTabs();
                }
            } else {
                alert(dropResult?.error || 'Failed to drop object.');
            }
        } catch (err: any) {
            alert(err?.message || 'Error occurred while dropping object.');
        } finally {
            setDeleting(false);
        }
    };

    const renderPortal = (content: React.ReactNode) => {
        if (typeof window === 'undefined' || !document.body) return null;
        return createPortal(content, document.body);
    };

    // Evaluate exact parent ID, label, and root menu context based on origin trigger source
    const isChildTrigger = menuTriggerSource === 'child';
    const isCustomBoxTrigger = menuTriggerSource && menuTriggerSource.startsWith('child_tab_');

    // 1. Parent Object assignment context (Using selected child's tab.id coming from DYNAMIC CUSTOM TABS BOXES when triggered there)
    const assignerParentId = isChildTrigger && selectedChild
        ? (selectedChild.id || getFormId(selectedChild))
        : isCustomBoxTrigger && selectedCustomTabItem
        ? (selectedCustomTabItem.tabid || selectedCustomTabItem.id)
        : (selectedParent?.id || getFormId(selectedParent) || 'ROOT');

    const assignerParentLabel = isChildTrigger && selectedChild
        ? selectedChild.label
        : isCustomBoxTrigger && selectedCustomTabItem
        ? (selectedCustomTabItem.tablabel || selectedCustomTabItem.label)
        : (selectedParent?.label || 'Root Parent');

    const assignerFormLevel = isChildTrigger ? 3 : isCustomBoxTrigger ? 4 : 2;

    // 2. Root Menu Context assignment
    const assignerRootMenuId = selectedParent?.id || getFormId(selectedParent) || '';
    const assignerRootMenuLabel = selectedParent?.label || 'Root Menu';

    const targetTabForDelete = isChildTrigger ? selectedChild : isCustomBoxTrigger ? (selectedCustomTabItem ? { id: selectedCustomTabItem.tabid, label: selectedCustomTabItem.tablabel } : activeTab) : selectedParent;

    return (
        <SafeAreaView style={styles.safeArea}>
            {createElement('style', null, configurationTableStyles)}

            <View style={[styles.container, isDesktop && styles.desktopContainer]}>
                {/* ================= 1. PARENT TABS BOX ================= */}
                {(!isExpanded || !isDesktop) && (
                    <View style={[styles.parentContainer, isDesktop && styles.desktopCompactContainer, !isDesktop && styles.mobilePadding]}>
                        <Text style={styles.sectionDebugLabel}>parent</Text>

                        <View style={styles.boxInnerRow}>
                            <View style={styles.tabsScrollWrapper}>
                                {loadingParents ? (
                                    <View style={styles.inlineCenter}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={styles.loadingText}>Loading parent tabs...</Text>
                                    </View>
                                ) : parentError ? (
                                    <View style={styles.inlineCenter}>
                                        <Text style={styles.errorText}>{parentError}</Text>
                                    </View>
                                ) : parentTabs.length > 0 ? (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={[styles.parentScrollContent, isDesktop && styles.desktopScrollContent]}
                                    >
                                        {parentTabs.map((tab, idx) => {
                                            const tabKey = tab.id || getFormId(tab) || `parent-${idx}`;
                                            const isActive =
                                                selectedParent?.id === tab.id ||
                                                selectedParent?.label === tab.label;

                                            return (
                                                <TouchableOpacity
                                                    key={tabKey}
                                                    style={[
                                                        styles.parentItem,
                                                        isDesktop && styles.desktopCompactItem,
                                                        isActive && styles.activeParentItem,
                                                    ]}
                                                    onPress={() => handleSelectParent(tab)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.parentText,
                                                            isDesktop && styles.desktopCompactText,
                                                            isActive && styles.activeParentText,
                                                        ]}
                                                    >
                                                        {createElement('span', null, renderFontAwesomeIcon(tab.icon), tab.label)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.inlineCenter}>
                                        <Text style={styles.emptyText}>No parent tabs found.</Text>
                                    </View>
                                )}
                            </View>

                            {/* Hamburger Menu Button */}
                            <TouchableOpacity
                                style={[styles.hamburgerButton, isDesktop && styles.desktopCompactHamburger]}
                                onPress={() => setActiveMenuType(activeMenuType === 'parent' ? null : 'parent')}
                                activeOpacity={0.7}
                                accessibilityLabel="Parent Options Menu"
                            >
                                <HamburgerIcon color="#475569" size={isDesktop ? 10 : 16} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ================= 2. CHILD TABS BOX ================= */}
                {(!isExpanded || !isDesktop) && (
                    <View style={[styles.childTabsContainer, isDesktop && styles.desktopCompactContainer, !isDesktop && styles.mobilePadding]}>
                        <Text style={styles.sectionDebugLabel}>child_tabs</Text>

                        <View style={styles.boxInnerRow}>
                            <View style={styles.tabsScrollWrapper}>
                                {loadingChildren ? (
                                    <View style={styles.inlineCenter}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={styles.loadingText}>Loading sub-tabs...</Text>
                                    </View>
                                ) : childError ? (
                                    <View style={styles.inlineCenter}>
                                        <Text style={styles.errorText}>{childError}</Text>
                                    </View>
                                ) : childTabs.length > 0 ? (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={[styles.childTabsScrollContent, isDesktop && styles.desktopScrollContent]}
                                    >
                                        {childTabs.map((tab, idx) => {
                                            const tabKey = tab.id || getFormId(tab) || `child-${idx}`;
                                            const isActive =
                                                selectedChild?.id === tab.id ||
                                                selectedChild?.label === tab.label;

                                            return (
                                                <TouchableOpacity
                                                    key={tabKey}
                                                    style={[
                                                        styles.childTabItem,
                                                        isDesktop && styles.desktopCompactItem,
                                                        isActive && styles.activeChildTabItem,
                                                    ]}
                                                    onPress={() => handleSelectChild(tab)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.childTabText,
                                                            isDesktop && styles.desktopCompactText,
                                                            isActive && styles.activeChildTabText,
                                                        ]}
                                                    >
                                                        {createElement('span', null, renderFontAwesomeIcon(tab.icon), tab.label)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.inlineCenter}>
                                        <Text style={styles.emptyText}>
                                            {selectedParent
                                                ? `No sub-tabs returned for "${selectedParent.label}"`
                                                : 'Select a parent category.'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Hamburger Menu Button */}
                            <TouchableOpacity
                                style={[styles.hamburgerButton, isDesktop && styles.desktopCompactHamburger]}
                                onPress={() => setActiveMenuType(activeMenuType === 'child' ? null : 'child')}
                                activeOpacity={0.7}
                                accessibilityLabel="Child Tabs Options Menu"
                            >
                                <HamburgerIcon color="#475569" size={isDesktop ? 10 : 16} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ================= DYNAMIC CUSTOM TABS BOXES (UNDER CHILD TABS) ================= */}
                {(!isExpanded || !isDesktop) &&
                    customTabsBoxes.map((box, boxIdx) => (
                        <View
                            key={`custom-tabs-box-${boxIdx}`}
                            style={[
                                styles.childTabsContainer,
                                isDesktop && styles.desktopCompactContainer,
                                !isDesktop && styles.mobilePadding,
                            ]}
                        >
                            <Text style={styles.sectionDebugLabel}>{box.tabBoxName}</Text>

                            <View style={styles.boxInnerRow}>
                                <View style={styles.tabsScrollWrapper}>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={[
                                            styles.childTabsScrollContent,
                                            isDesktop && styles.desktopScrollContent,
                                        ]}
                                    >
                                        {box.tabs.map((tItem, tIdx) => {
                                            const isCustomActive =
                                                activeTab?.id === tItem.tabid ||
                                                activeTab?.label === tItem.tablabel;

                                            return (
                                                <TouchableOpacity
                                                    key={`custom-tab-${tIdx}`}
                                                    style={[
                                                        styles.childTabItem,
                                                        isDesktop && styles.desktopCompactItem,
                                                        isCustomActive && styles.activeChildTabItem,
                                                    ]}
                                                    onPress={() => handleSelectCustomTab(tItem, box)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.childTabText,
                                                            isDesktop && styles.desktopCompactText,
                                                            isCustomActive && styles.activeChildTabText,
                                                        ]}
                                                    >
                                                        {createElement('span', null, renderFontAwesomeIcon(tItem.icon), tItem.tablabel)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>

                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    {/* Hamburger Menu Button for Custom Box */}
                                    <TouchableOpacity
                                        style={[styles.hamburgerButton, isDesktop && styles.desktopCompactHamburger]}
                                        onPress={() => {
                                            setActiveCustomBoxItem(box);
                                            setActiveMenuType(activeMenuType === box.tabBoxName ? null : box.tabBoxName);
                                        }}
                                        activeOpacity={0.7}
                                        accessibilityLabel={`${box.tabBoxName} Options Menu`}
                                    >
                                        <HamburgerIcon color="#475569" size={isDesktop ? 10 : 16} />
                                    </TouchableOpacity>

                                    {/* Close / Drop Button for Custom Box */}
                                    <TouchableOpacity
                                        style={[styles.hamburgerButton, isDesktop && styles.desktopCompactHamburger]}
                                        onPress={() => dropTabsBox(box.tabBoxName)}
                                        activeOpacity={0.7}
                                        accessibilityLabel={`Drop ${box.tabBoxName}`}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#DC2626' }}>×</Text>
                                    </TouchableOpacity>
                                </div>
                            </View>
                        </View>
                    ))}

                {/* ================= 3. CONFIGURATION CONTENT AREA ================= */}
                <View
                    style={[
                        styles.contentContainer,
                        isExpanded && isDesktop && styles.expandedContentContainer,
                    ]}
                >
                    <View style={styles.contentBorderCard}>
                        <View style={[styles.contentHeaderBar, isDesktop && styles.desktopCompactHeaderBar]}>
                            <Text style={styles.contentSectionDebugLabel}>
                                configuration content
                            </Text>

                            {isDesktop && (
                                <TouchableOpacity
                                    style={styles.expandButton}
                                    onPress={() => setIsExpanded(!isExpanded)}
                                    activeOpacity={0.7}
                                    accessibilityLabel={
                                        isExpanded ? 'Restore Layout Size' : 'Expand Content Box'
                                    }
                                >
                                    {isExpanded ? (
                                        <>
                                            <MinimizeIcon color="#4F46E5" size={10} />
                                            <Text style={styles.expandButtonText}>Restore</Text>
                                        </>
                                    ) : (
                                        <>
                                            <MaximizeIcon color="#475569" size={10} />
                                            <Text style={styles.expandButtonText}>Full Size</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView
                            style={styles.contentScrollView}
                            contentContainerStyle={styles.contentScrollInner}
                            showsVerticalScrollIndicator={true}
                        >
                            {children || renderTabContent()}
                        </ScrollView>
                    </View>
                </View>
            </View>

            {/* POPUP MENU OVERLAY (CENTERED) */}
            {activeMenuType && (
                <View style={styles.popupOverlay}>
                    <TouchableOpacity
                        style={styles.popupBackdrop}
                        activeOpacity={1}
                        onPress={() => setActiveMenuType(null)}
                    />
                    <View style={styles.popupMenuBox}>
                        <Text style={styles.popupMenuHeader}>Pop Up Menu</Text>
                        <TouchableOpacity
                            style={styles.popupMenuItem}
                            onPress={() => {
                                const matchedBox = customTabsBoxes.find((b) => b.tabBoxName === activeMenuType);
                                handleMenuAction('Add Child', activeMenuType, matchedBox);
                            }}
                        >
                            <Text style={styles.popupMenuItemText}>Add Child</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.popupMenuItem}
                            onPress={() => {
                                const matchedBox = customTabsBoxes.find((b) => b.tabBoxName === activeMenuType);
                                handleMenuAction('Add Tab Box', activeMenuType, matchedBox);
                            }}
                        >
                            <Text style={styles.popupMenuItemText}>Add Tab Box</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.popupMenuItem}
                            onPress={() => {
                                const matchedBox = customTabsBoxes.find((b) => b.tabBoxName === activeMenuType);
                                handleMenuAction('Drop Child', activeMenuType, matchedBox);
                            }}
                        >
                            <Text style={styles.popupMenuItemText}>Drop Child</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.popupMenuItem}
                            onPress={() => {
                                const matchedBox = customTabsBoxes.find((b) => b.tabBoxName === activeMenuType);
                                handleMenuAction('Open Children Tabs', activeMenuType, matchedBox);
                            }}
                        >
                            <Text style={styles.popupMenuItemText}>Open Children Tabs</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* FORM ASSIGNER MODAL PORTAL */}
            {isFormAssignerOpen &&
                renderPortal(
                    <View style={styles.formAssignerOverlay}>
                        <TouchableOpacity
                            style={styles.popupBackdrop}
                            activeOpacity={1}
                            onPress={() => setIsFormAssignerOpen(false)}
                        />
                        <View style={styles.formAssignerModalContainer}>
                            <FormAssigner
                                parentid={assignerParentId}
                                parentLabel={assignerParentLabel}
                                formlevel={assignerFormLevel}
                                rootMenuId={assignerRootMenuId}
                                rootMenuLabel={assignerRootMenuLabel}
                                sessionId={SESSION_ID}
                                onSaveSuccess={async () => {
                                    setIsFormAssignerOpen(false);
                                    if (menuTriggerSource === 'parent') {
                                        await fetchParentTabs();
                                    } else if (menuTriggerSource && menuTriggerSource.startsWith('child_tab_') && activeCustomBoxItem) {
                                        const parentTabId = selectedCustomTabItem?.tabid || activeCustomBoxItem.tabs[0]?.parenttab || selectedChild?.id;
                                        if (parentTabId) {
                                            const res = await getTabs({
                                                objectid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
                                                parenttabid: parentTabId,
                                                recordid: 'rec_default_01',
                                            });
                                            if (res.success && res.data) {
                                                const rawTabsData = res.data?.data || res.data?.rows || res.data;
                                                const fetchedTabs = extractTabArray(rawTabsData);
                                                if (fetchedTabs.length > 0) {
                                                    addTabsBoxUnderChildTabs({
                                                        tabBoxName: activeCustomBoxItem.tabBoxName,
                                                        parentBoxName: activeCustomBoxItem.tabBoxName,
                                                        tabs: fetchedTabs.map((t) => ({
                                                            parenttab: parentTabId,
                                                            tabid: t.id || getFormId(t),
                                                            tablabel: t.label,
                                                            formid: t.formid || t.tableName || t.id,
                                                            target_tsx: t.target_tsx || 'ObjectRecords',
                                                            icon: t.icon,
                                                            parentrecordid: 'rec_default_01',
                                                        })),
                                                    });
                                                }
                                            }
                                        }
                                    } else if (selectedParent) {
                                        await handleSelectParent(selectedParent);
                                    }
                                }}
                                onClose={() => setIsFormAssignerOpen(false)}
                            />
                        </View>
                    </View>
                )}

            {/* DELETION CLARIFICATION MODAL PORTAL */}
            {isDeleteModalOpen &&
                renderPortal(
                    <View style={styles.formAssignerOverlay}>
                        <TouchableOpacity
                            style={styles.popupBackdrop}
                            activeOpacity={1}
                            onPress={() => !deleting && setIsDeleteModalOpen(false)}
                        />
                        <View style={styles.deleteModalBox}>
                            <Text style={styles.deleteModalTitle}>Confirm Deletion</Text>
                            <Text style={styles.deleteModalText}>
                                Are you sure you want to drop "{targetTabForDelete?.label || targetTabForDelete?.tablabel || 'selected item'}"?
                            </Text>

                            <View style={styles.deleteModalButtonsRow}>
                                <TouchableOpacity
                                    style={styles.cancelDeleteButton}
                                    onPress={() => setIsDeleteModalOpen(false)}
                                    disabled={deleting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.confirmDeleteButton, deleting && styles.disabledButton]}
                                    onPress={handleDeleteConfirmation}
                                    disabled={deleting}
                                    activeOpacity={0.7}
                                >
                                    {deleting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    desktopContainer: {
        padding: COMPACT_MARGIN,
        gap: COMPACT_MARGIN,
    },
    boxInnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    tabsScrollWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    hamburgerButton: {
        width: 32,
        height: 32,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    desktopCompactHamburger: {
        width: 18,
        height: 18,
        marginLeft: COMPACT_MARGIN,
        borderRadius: 1,
        borderWidth: 0.5,
    },

    // 1. PARENT STYLES
    parentContainer: {
        minHeight: 36,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#0F172A',
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
        position: 'relative',
    },
    desktopCompactContainer: {
        minHeight: 18,
        paddingHorizontal: COMPACT_PADDING * 4,
        paddingVertical: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 2,
    },
    parentScrollContent: {
        alignItems: 'center',
        paddingVertical: 6,
        gap: 8,
    },
    desktopScrollContent: {
        paddingVertical: COMPACT_PADDING,
        gap: COMPACT_MARGIN * 2,
    },
    parentItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    desktopCompactItem: {
        paddingHorizontal: COMPACT_PADDING * 4,
        paddingVertical: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        borderRadius: 1,
        borderWidth: 0.5,
    },
    activeParentItem: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    parentText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    desktopCompactText: {
        fontSize: COMPACT_FONT_SIZE,
    },
    activeParentText: {
        color: '#FFFFFF',
    },

    // 2. CHILD TABS STYLES
    childTabsContainer: {
        minHeight: 36,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#0F172A',
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
        position: 'relative',
    },
    childTabsScrollContent: {
        alignItems: 'center',
        paddingVertical: 6,
        gap: 8,
    },
    childTabItem: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeChildTabItem: {
        backgroundColor: '#EEF2FF',
        borderColor: '#818CF8',
    },
    childTabText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748B',
    },
    activeChildTabText: {
        color: '#4F46E5',
        fontWeight: '700',
    },

    // 3. CONFIGURATION CONTENT STYLES
    contentContainer: {
        flex: 1,
        width: '100%',
        margin: 0,
        padding: 0,
    },
    expandedContentContainer: {
        flex: 1,
        height: '100%',
    },
    contentBorderCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        margin: 0,
        padding: 0,
        borderColor: '#0F172A',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    },
    contentHeaderBar: {
        height: 32,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 0,
        padding: 0,
        paddingHorizontal: 12,
    },
    desktopCompactHeaderBar: {
        height: 18,
        paddingHorizontal: COMPACT_PADDING * 4,
        margin: COMPACT_MARGIN,
    },
    contentSectionDebugLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: 'monospace',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        gap: 4,
    },
    expandButtonText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#334155',
    },
    contentScrollView: {
        flex: 1,
        width: '100%',
    },
    contentScrollInner: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },

    inlineCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    loadingText: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 8,
    },
    errorText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 11,
        color: '#94A3B8',
    },

    sectionDebugLabel: {
        position: 'absolute',
        top: 2,
        right: 36,
        fontSize: 9,
        color: '#94A3B8',
        fontFamily: 'monospace',
    },

    placeholderBox: {
        width: '100%',
        maxWidth: 720,
        padding: 0,
        margin: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        padding: 0,
        margin: 0,
        marginBottom: 4,
        textAlign: 'center',
    },
    placeholderSubtext: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
    },
    mockFormCard: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 20,
    },
    mockFormHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    mockFormDescription: {
        fontSize: 11,
        color: '#94A3B8',
        lineHeight: 16,
    },

    emptyContentBox: {
        padding: 2,
        alignItems: 'center',
    },
    emptyContentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
    },
    emptyContentSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
    },

    mobilePadding: {
        paddingHorizontal: 8,
    },

    // POPUP MENU STYLES
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
    popupMenuBox: {
        width: 220,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.2)',
        elevation: 8,
        zIndex: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    popupMenuHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        textAlign: 'center',
    },
    popupMenuItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    popupMenuItemText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '600',
    },

    // FORM ASSIGNER MODAL STYLES
    formAssignerOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw' as any,
        height: '100vh' as any,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        zIndex: 999999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formAssignerModalContainer: {
        width: '90%',
        maxWidth: 600,
        height: '80%',
        maxHeight: 560,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#0F172A',
        overflow: 'hidden',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
    },

    // DELETION CLARIFICATION MODAL STYLES
    deleteModalBox: {
        width: '90%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0F172A',
        padding: 20,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0px 10px 25px rgba(15, 23, 42, 0.25)',
    },
    deleteModalTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    deleteModalText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    deleteModalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    cancelDeleteButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
    },
    cancelDeleteButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    confirmDeleteButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 4,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmDeleteButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default Configuration;