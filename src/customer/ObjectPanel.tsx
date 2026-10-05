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
import { tableRecords } from './../panel/ts/ObjectRecords';
import { getParentTab, openChildrenTabs } from './ts/ObjectPanel';
import ViewPanel from './../panel/ViewPanel';
import { NewPanel } from './../panel/NewPanel';
import SearchPanel from './../panel/SearchPanel';
import { DeletePanel } from './../panel/DeletePanel';
import { EditPanel } from './../panel/EditPanel';
import ViewRecordAsHeader from './ViewRecordAsHeader';
import { renderFontAwesomeIcon } from './FontAwesomeIcon';

const PAGE_SIZE = 10;
const DEFAULT_SESSION_ID = 'sess_12345';

// CONFIGURABLE SPACING & TYPOGRAPHY CONSTANTS FOR DESKTOP VIEWPORTS
const COMPACT_FONT_SIZE = '11px';
const COMPACT_PADDING = '2px';
const COMPACT_MARGIN = '2px';

export interface ObjectPanelProps {
    formid?: string;
    formLabel?: string;
    sessionId?: string;
    menuid?: string;
    pid?: string;
    tableInit?: Number;
    actionContent?: React.ReactNode;
    navigationContent?: React.ReactNode;
    recordsContent?: React.ReactNode;
    onFilterPress?: () => void;
    selectedRecordForPrinting?: React.MutableRefObject<
        Array<{ objectid: string; recordid: string; sessionid: string }>
    >;
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

// Eye / View Icon
const EyeIcon = ({ color = '#4F46E5', size = 12 }: { color?: string; size?: number }) =>
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
        createElement('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
        createElement('circle', { cx: '12', cy: '12', r: '3' })
    );

// Chevron Down Icon (Expanded)
const ChevronDownIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '6 9 12 15 18 9' })
    );

// Chevron Right Icon (Collapsed)
const ChevronRightIcon = ({ color = '#475569', size = 12 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '9 18 15 12 9 6' })
    );

const tableStyles = `
  .object-panel-table-container {
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

  .object-panel-table-container::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .object-panel-table-container::-webkit-scrollbar-track {
    background: #F1F5F9;
  }
  .object-panel-table-container::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 2px;
  }
  .object-panel-table-container::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }

  .object-panel-table-container table {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: ${COMPACT_FONT_SIZE};
    color: #334155;
    margin: ${COMPACT_MARGIN};
  }

  .object-panel-table-container tr {
    margin: ${COMPACT_MARGIN};
    padding: ${COMPACT_PADDING};
  }

  .object-panel-table-container th {
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

  .object-panel-table-container td {
    padding: ${COMPACT_PADDING};
    margin: ${COMPACT_MARGIN};
    border-bottom: 1px solid #F1F5F9;
    border-right: 1px solid #F1F5F9;
    vertical-align: middle;
    white-space: nowrap;
    cursor: pointer;
  }

  .object-panel-table-container tr:nth-child(even) {
    background-color: #FAFAFA;
  }

  .object-panel-table-container tr:hover td {
    background-color: #EEF2FF;
    color: #312E81;
  }

  .object-panel-table-container tr.selected-row td {
    background-color: #E0E7FF;
    color: #3730A3;
    font-weight: 600;
  }
`;

function sanitizeHtmlTable(html: string): string {
    if (!html || typeof html !== 'string') return '';

    return html.replace(/(<td\b[^>]*>)([\s\S]*?)(<\/td>)/gi, (match, openTag, cellContent, closeTag) => {
        if (cellContent.includes('<input') || cellContent.includes('<select')) {
            return match;
        }

        const trimmed = cellContent.trim();
        if (trimmed.startsWith('[')) {
            const bracketMatch = trimmed.match(/^\[(.*?)\]\s*(.*)$/);
            if (bracketMatch) {
                const textOnly = bracketMatch[2] && bracketMatch[2].trim().length > 0 ? bracketMatch[2].trim() : bracketMatch[1];
                return `${openTag}${textOnly}${closeTag}`;
            }
        }

        return match;
    });
}

export const ObjectPanel: React.FC<ObjectPanelProps> = ({
    formid = '',
    formLabel = 'Form Label',
    sessionId = DEFAULT_SESSION_ID,
    menuid = 'rec_default_01',
    pid = 'ROOT',
    actionContent,
    navigationContent,
    recordsContent,
    onFilterPress,
    selectedRecordForPrinting,
    children,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const uniqueBoxName = 'child-action-box';

    const [currentFormId, setCurrentFormId] = useState<string>(formid);
    const [rowStart, setRowStart] = useState<number>(1);
    const [rowEnd, setRowEnd] = useState<number>(PAGE_SIZE);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [htmlTable, setHtmlTable] = useState<string>('');
    const [searchSelections, setSearchSelections] = useState<any | null>(null);
    const [tableInitiate, setTableInitiate] = useState(formid);

    // Action Box Tabs State
    const [actionTabs, setActionTabs] = useState<any[]>([]);
    const [activeActionTab, setActiveActionTab] = useState<any | null>(null);
    const [loadingTabs, setLoadingTabs] = useState<boolean>(false);

    // Dynamic Action Boxes State
    const [dynamicActionBoxes, setDynamicActionBoxes] = useState<
        Array<{
            key: string;
            boxName: string;
            level: any;
            tabs: any[];
            parentrecordid: string;
            parentobjectid: string;
        }>
    >([]);


    // Modal & Selection States
    const [isViewPanelOpen, setIsViewPanelOpen] = useState<boolean>(false);
    const [viewPanelFormId, setViewPanelFormId] = useState<string>('');
    const [viewPanelTitle, setViewPanelTitle] = useState<string>('');
    const [isNewPanelOpen, setIsNewPanelOpen] = useState<boolean>(false);
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState<boolean>(false);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);
    const [isDeletePanelOpen, setIsDeletePanelOpen] = useState<boolean>(false);
    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [modalKey, setModalKey] = useState<number>(0);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [pageParentId, setPageParentId] = useState<string>('');
    const [headerParentRecordId, setHeaderParentRecordId] = useState<string>('');
    const [headerParentObjectid, setHeaderParentObjectid] = useState<string>('');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

    const searchSelectionsFunction = (search:any) => {
        setSearchSelections(search);
    };

    const extractTabArray = (response: any): any[] => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.result)) return response.result;
        if (Array.isArray(response.rows)) return response.rows;
        return [];
    };

    const fetchRecords = async (targetFormId: string, pidParam: string, start: number, end: number) => {
        if (!targetFormId || targetFormId.trim() === '') {
            setHtmlTable('');
            setTotalRecords(0);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const whereClause = pidParam || pidParam === '' ? [{ col_name: 'pid', value: pidParam }] : [];
            const queryPayload = {
                tableName: targetFormId.trim(),
                whereClause: whereClause,
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

            const rawTableHtml =
                rawResponse?.htmlTable ||
                rawResponse?.data?.htmlTable ||
                (Array.isArray(rawResponse) && rawResponse[0]?.htmlTable) ||
                '';

            const total =
                rawResponse?.totalRecords ??
                rawResponse?.data?.totalRecords ??
                (Array.isArray(rawResponse) && rawResponse[0]?.totalRecords) ??
                0;

            setHtmlTable(sanitizeHtmlTable(rawTableHtml));
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

    const fetchActionTabs = async () => {
        setLoadingTabs(true);
        try {
            const __payload = {
                objectid: formid,
                recordid: menuid,
                parenttabid: pid,
                sessionId,
            };
            console.log( " before get parent tab: > ", JSON.stringify(__payload) );

            const res = await getParentTab(__payload);

            console.log( " after get parent tab: > res > ", JSON.stringify(res) );

            if (res.success && res.data) {
                const rawData = res.data?.data || res.data;
                const fetchedTabs = extractTabArray(rawData);
                setActionTabs(fetchedTabs);

                if (fetchedTabs.length > 0) {
                    const firstTab = fetchedTabs[0];
                    setActiveActionTab(firstTab);
                    const tabFormId = firstTab.formid || firstTab.tableName || formid;
                    setCurrentFormId(tabFormId);
                    fetchRecords(tabFormId, pageParentId, 1, PAGE_SIZE);
                } else {
                    setCurrentFormId(formid);
                    fetchRecords(formid, pageParentId, 1, PAGE_SIZE);
                }
            } else {
                setCurrentFormId(formid);
                fetchRecords(formid, pageParentId, 1, PAGE_SIZE);
            }
        } catch (err) {
            console.error('Error in fetchActionTabs:', err);
            setCurrentFormId(formid);
            fetchRecords(formid, pageParentId, 1, PAGE_SIZE);
        } finally {
            setLoadingTabs(false);
        }
    };

    useEffect(() => {
        fetchActionTabs();

        if (formid !== tableInitiate) {
            (async () => {
                setHtmlTable('');
                setPageParentId('');
                setHeaderParentRecordId('');
                setHeaderParentObjectid('');
                await fetchRecords(formid, '', 1, PAGE_SIZE);
            })();

            setTableInitiate(formid);
            dropActionBoxesFromLevel(0);
        }
    }, [formid, menuid, pid, sessionId]);

    const addOrUpdateDynamicActionBox = ({
        boxName,
        level,
        tabs,
        parentrecordid,
        parentobjectid,
    }: {
        boxName: string;
        level: number;
        tabs: any[];
        parentrecordid: string;
        parentobjectid: string;
    }) => {
        const uniqueKey = `${boxName}-${level}`;
        setDynamicActionBoxes((prev) => {
            const filtered = prev.filter((b) => b.level < level);
            return [
                ...filtered,
                {
                    key: uniqueKey,
                    boxName,
                    level,
                    tabs,
                    parentrecordid,
                    parentobjectid,
                },
            ];
        });
    };

    const dropActionBoxesFromLevel = (targetLevel: number) => {
        setDynamicActionBoxes((prev) => prev.filter((b) => b.level < targetLevel));
        if (targetLevel === 0) {
            setHeaderParentRecordId('');
            setHeaderParentObjectid('');
        }
    };

    const handleTabPress = (tab: any, boxKey: string, parentrecordid: string, parentobjectid: string) => {
        setActiveActionTab(tab);
        setPageParentId(parentrecordid);

        const tabFormId = tab.formid;
        setCurrentFormId(tabFormId);

        if (tab.level !== undefined) {
            dropActionBoxesFromLevel(tab.level + 1);
        }

        if (parentrecordid && parentrecordid.trim() !== '' && parentobjectid && parentobjectid !== null) {
            setHeaderParentRecordId(parentrecordid);
            setHeaderParentObjectid(parentobjectid);
        } else {
            setHeaderParentRecordId('');
            setHeaderParentObjectid('');
        }

        fetchRecords(tabFormId, parentrecordid, 1, PAGE_SIZE);
    };

    const handleRecordClickForChildren = async (recordId: string) => {
        const currentTabId = activeActionTab?.id;
        const currentLevel = (activeActionTab?.level || 1) + 1;
        const currentParentObj = activeActionTab?.formid || currentFormId;

        try {
            const res = await openChildrenTabs({
                parenttabid: currentTabId,
                level: currentLevel,
                recordid: recordId,
                sessionId,
            });

            dropActionBoxesFromLevel(currentLevel);

            if (res.success && res.data) {
                const rawData = res.data?.data || res.data?.rows || res.data;
                const childTabs = extractTabArray(rawData);
                if (childTabs.length > 0) {
                    addOrUpdateDynamicActionBox({
                        boxName: uniqueBoxName,
                        level: currentLevel,
                        tabs: childTabs,
                        parentrecordid: recordId,
                        parentobjectid: currentParentObj,
                    });

                    setHeaderParentRecordId(recordId);
                    setHeaderParentObjectid(currentParentObj);

                    setActiveActionTab(childTabs[0]);
                    const childFormId = childTabs[0].formid || currentFormId;
                    setCurrentFormId(childFormId);
                    setPageParentId(recordId);
                    fetchRecords(childFormId, recordId, 1, PAGE_SIZE);
                }
            }
        } catch (err) {
            console.error('Error in handleRecordClickForChildren:', err);
        }
    };

    const handleSearchResult = (searchResponse: any) => {
        let rawResponse = searchResponse;
        if (typeof searchResponse === 'string') {
            try {
                rawResponse = JSON.parse(searchResponse);
            } catch (e) {
                // ignore parsing error
            }
        }

        const rawTableHtml =
            rawResponse?.htmlTable ||
            rawResponse?.data?.htmlTable ||
            (Array.isArray(rawResponse) && rawResponse[0]?.htmlTable) ||
            '';

        const total =
            rawResponse?.totalRecords ??
            rawResponse?.data?.totalRecords ??
            (Array.isArray(rawResponse) && rawResponse[0]?.totalRecords) ??
            0;

        setHtmlTable(sanitizeHtmlTable(rawTableHtml));
        setTotalRecords(Number(total) || 0);
        setRowStart(1);
        setRowEnd(PAGE_SIZE);
        setIsSearchPanelOpen(false);
    };

    const handleTableContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (!target) return;
        if (target.tagName === 'TH' || target.closest('th')) return;

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
                const container = e.currentTarget as HTMLElement;
                const allRows = container.querySelectorAll('tr');
                allRows.forEach((r) => r.classList.remove('selected-row'));
                row.classList.add('selected-row');

                setSelectedRecordId(finalRecordId);
                setViewPanelFormId(currentFormId);
                setViewPanelTitle(formLabel);
                setModalKey((prev) => prev + 1);

                setIsViewPanelOpen(true);
                handleRecordClickForChildren(finalRecordId);
            }
        }
    };

    const handleViewParentRecord = () => {
        if (!headerParentRecordId || !headerParentObjectid) return;
        setSelectedRecordId(headerParentRecordId);
        setViewPanelFormId(headerParentObjectid);
        setViewPanelTitle(`Parent: ${headerParentObjectid}`);
        setModalKey((prev) => prev + 1);
        setIsViewPanelOpen(true);
    };

    const handleCloseViewPanel = () => {
        setIsViewPanelOpen(false);
        setSelectedRecordId('');
    };

    const handleNavBackward = () => {
        if (rowStart <= 1 || loading) return;
        const newStart = Math.max(1, rowStart - PAGE_SIZE);
        const newEnd = newStart + PAGE_SIZE - 1;
        fetchRecords(currentFormId, pageParentId, newStart, newEnd);
    };

    const handleNavForward = () => {
        if (loading) return;
        if (totalRecords > 0 && rowEnd >= totalRecords) return;
        const newStart = rowStart + PAGE_SIZE;
        const newEnd = newStart + PAGE_SIZE - 1;
        fetchRecords(currentFormId, pageParentId, newStart, newEnd);
    };

    const isBackwardDisabled = rowStart <= 1 || loading;
    const isForwardDisabled =
        loading || (totalRecords > 0 && rowEnd >= totalRecords) || totalRecords === 0;

    const currentCountDisplay =
        totalRecords > 0 ? Math.min(rowEnd, totalRecords) : 0;

    const renderPortal = (content: React.ReactNode, zIndexVal = 99999999) => {
        if (typeof window === 'undefined' || !document.body) return null;
        return createPortal(
            <View style={[styles.topStackOverlay, { zIndex: zIndexVal }]}>{content}</View>,
            document.body
        );
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
                    {headerParentRecordId !== '' && headerParentObjectid !== '' && (
                        <View style={[styles.headerRecordContainer, isDesktop && styles.desktopHeaderRecordContainer]}>
                            <View style={styles.headerRecordBar}>
                                <TouchableOpacity
                                    style={styles.headerRecordLeftGroup}
                                    onPress={() => setIsHeaderCollapsed((prev) => !prev)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.headerRecordTitleBadge}>
                                        <View style={styles.headerRecordBadgeDot} />
                                        <Text style={styles.headerRecordBadgeText}>PARENT RECORD CONTEXT</Text>
                                        <Text style={styles.headerRecordMetaText}>
                                            ({headerParentObjectid} - {headerParentRecordId})
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.headerRecordRightGroup}>
                                    <TouchableOpacity
                                        style={[styles.headerViewRecordBtn, isDesktop && styles.desktopCompactHeaderViewBtn]}
                                        onPress={handleViewParentRecord}
                                        activeOpacity={0.7}
                                        accessibilityLabel="View Parent Record Details"
                                    >
                                        <EyeIcon color="#4F46E5" size={isDesktop ? 10 : 12} />
                                        <Text style={[styles.headerViewRecordBtnText, isDesktop && styles.desktopCompactText]}>
                                            View
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.collapseToggleBtn}
                                        onPress={() => setIsHeaderCollapsed((prev) => !prev)}
                                        activeOpacity={0.7}
                                        accessibilityLabel={isHeaderCollapsed ? 'Expand Parent Record' : 'Collapse Parent Record'}
                                    >
                                        {isHeaderCollapsed ? (
                                            <ChevronRightIcon color="#475569" size={isDesktop ? 11 : 13} />
                                        ) : (
                                            <ChevronDownIcon color="#475569" size={isDesktop ? 11 : 13} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {!isHeaderCollapsed && (
                                <View style={styles.headerRecordBody}>
                                    <ViewRecordAsHeader
                                        objectid={headerParentObjectid}
                                        id={headerParentRecordId}
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    <Text
                        style={[
                            styles.formLabelTitle,
                            isDesktop && styles.desktopCompactText,
                            !isDesktop && styles.formLabelTitleMobile,
                        ]}
                    >
                        Selected Form {formLabel} {currentFormId ? `(${currentFormId})` : ''}
                    </Text>

                    <View
                        style={[
                            styles.borderBox,
                            isDesktop ? styles.actionBoxDesktop : styles.actionBoxMobile,
                        ]}
                    >
                        {actionContent ? (
                            actionContent
                        ) : loadingTabs ? (
                            <View style={styles.inlineCenter}>
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text style={[styles.loadingText, isDesktop && styles.desktopCompactText]}>Loading tabs...</Text>
                            </View>
                        ) : actionTabs.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.actionTabsScrollContent}
                            >
                                {actionTabs.map((tab, idx) => {
                                    const tabKey = tab.id || tab.tabid || `action-tab-${idx}`;
                                    const isTabActive = activeActionTab?.id === tab.id || activeActionTab?.label === tab.label;

                                    return (
                                        <TouchableOpacity
                                            key={tabKey}
                                            style={[
                                                styles.actionTabItem,
                                                isDesktop && styles.desktopCompactActionTabItem,
                                                isTabActive && styles.activeActionTabItem,
                                            ]}
                                            onPress={() => handleTabPress(tab, '', '', '')}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.actionTabText,
                                                    isDesktop && styles.desktopCompactText,
                                                    isTabActive && styles.activeActionTabText,
                                                ]}
                                            >
                                                {createElement('span', null, renderFontAwesomeIcon(tab.icon), tab.label)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <Text style={[styles.actionText, isDesktop && styles.desktopCompactText]}>Action</Text>
                        )}
                    </View>

                    {dynamicActionBoxes.map((box) => (
                        <View
                            key={box.key}
                            style={[
                                styles.borderBox,
                                isDesktop ? styles.actionBoxDesktop : styles.actionBoxMobile,
                            ]}
                        >
                            {box.tabs.length > 0 ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.actionTabsScrollContent}
                                >
                                    {box.tabs.map((tab, idx) => {
                                        const tabKey = tab.id || tab.tabid || `dynamic-tab-${idx}`;
                                        const isTabActive = activeActionTab?.id === tab.id || activeActionTab?.label === tab.label;

                                        return (
                                            <TouchableOpacity
                                                key={tabKey}
                                                style={[
                                                    styles.actionTabItem,
                                                    isDesktop && styles.desktopCompactActionTabItem,
                                                    isTabActive && styles.activeActionTabItem,
                                                ]}
                                                onPress={() => handleTabPress(tab, box.key, box.parentrecordid, box.parentobjectid)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.actionTabText,
                                                        isDesktop && styles.desktopCompactText,
                                                        isTabActive && styles.activeActionTabText,
                                                    ]}
                                                >
                                                    {tab.label || 'Tab'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <Text style={[styles.actionText, isDesktop && styles.desktopCompactText]}>Dynamic Action Sub-box</Text>
                            )}
                        </View>
                    ))}

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

                                    <View style={styles.iconDivider} />

                                    <TouchableOpacity
                                        style={[styles.navIconButton, isDesktop && styles.desktopCompactNavButton]}
                                        onPress={() => {
                                            if (onFilterPress) {
                                                onFilterPress();
                                            }
                                            setIsSearchPanelOpen(true);
                                        }}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Filter Records"
                                    >
                                        <FilterIcon color="#000000" size={isDesktop ? 10 : 11} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.navIconButton, isDesktop && styles.desktopCompactNavButton]}
                                        onPress={() => setIsNewPanelOpen(true)}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Create New Record"
                                    >
                                        <PlusIcon color="#000000" size={isDesktop ? 10 : 12} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

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
                                <Text style={[styles.loadingText, isDesktop && styles.desktopCompactText]}>Loading records...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.centerContainer}>
                                <Text style={[styles.errorText, isDesktop && styles.desktopCompactText]}>{error}</Text>
                            </View>
                        ) : htmlTable ? (
                            createElement('div', {
                                className: 'object-panel-table-container',
                                onClick: handleTableContainerClick,
                                dangerouslySetInnerHTML: { __html: htmlTable },
                            })
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={[styles.emptyText, isDesktop && styles.desktopCompactText]}>
                                    {currentFormId ? ' ' : 'No form ID provided.'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {isViewPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <ViewPanel
                            key={`viewpanel-${selectedRecordId}-${modalKey}`}
                            visible={isViewPanelOpen}
                            onClose={handleCloseViewPanel}
                            onDeleteClick={() => {
                                setIsDeletePanelOpen(true);
                            }}
                            onEditClick={() => {
                                setIsEditPanelOpen(true);
                            }}
                            onDeleteSuccess={() => {
                                handleCloseViewPanel();
                                fetchRecords(currentFormId, pageParentId, rowStart, rowEnd);
                            }}
                            onEditSuccess={() => {
                                fetchRecords(currentFormId, pageParentId, rowStart, rowEnd);
                            }}
                            title={viewPanelTitle || formLabel}
                            tableName={viewPanelFormId || currentFormId}
                            recordid={selectedRecordId}
                            sessionId={sessionId}
                            selectedRecordForPrinting={selectedRecordForPrinting}
                        />
                    </View>,
                    9999999
                )}

            {isEditPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <EditPanel
                            key={`editpanel-${selectedRecordId}-${modalKey}`}
                            visible={isEditPanelOpen}
                            onClose={() => setIsEditPanelOpen(false)}
                            onSuccess={() => {
                                setIsEditPanelOpen(false);
                                fetchRecords(currentFormId, pageParentId, rowStart, rowEnd);
                            }}
                            title={`Edit ${viewPanelTitle || formLabel}`}
                            tableName={viewPanelFormId || currentFormId}
                            recordid={selectedRecordId}
                            sessionId={sessionId}
                            parentid={pageParentId}
                        />
                    </View>,
                    99999999
                )}

            {isDeletePanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <DeletePanel
                            visible={isDeletePanelOpen}
                            tableName={viewPanelFormId || currentFormId}
                            recordid={selectedRecordId}
                            sessionId={sessionId}
                            onClose={() => setIsDeletePanelOpen(false)}
                            onSuccess={() => {
                                setIsDeletePanelOpen(false);
                                handleCloseViewPanel();
                                fetchRecords(currentFormId, pageParentId, rowStart, rowEnd);
                            }}
                        />
                    </View>,
                    99999999
                )}

            {isNewPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <NewPanel
                            visible={isNewPanelOpen}
                            onClose={() => setIsNewPanelOpen(false)}
                            onSuccess={() => {
                                setIsNewPanelOpen(false);
                                fetchRecords(currentFormId, pageParentId, rowStart, rowEnd);
                            }}
                            title={`New ${formLabel}`}
                            tableName={currentFormId}
                            sessionId={sessionId}
                            parentid={pageParentId}
                        />
                    </View>,
                    
                )}

            {isSearchPanelOpen &&
                renderPortal(
                    <View style={styles.topStackOverlay}>
                        <SearchPanel
                            visible={isSearchPanelOpen}
                            objectid={currentFormId}
                            sessionid={sessionId}
                            title={`Search ${formLabel}`}
                            onClose={() => setIsSearchPanelOpen(false)}
                            onSearch={handleSearchResult}
                            searchSelectionsFunction = {searchSelectionsFunction}
                            searchSelection = {searchSelections}
                        />
                    </View>,
                    99999999
                )}
        </SafeAreaView>
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
        padding: COMPACT_PADDING,
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
        gap: COMPACT_MARGIN,
    },
    headerRecordContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 6,
        padding: 6,
        marginVertical: 4,
        boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    },
    desktopHeaderRecordContainer: {
        padding: 4,
        marginVertical: COMPACT_MARGIN,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#94A3B8',
    },
    headerRecordBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    headerRecordLeftGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRecordRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerRecordTitleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#EEF2FF',
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: '#C7D2FE',
    },
    headerRecordBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4F46E5',
    },
    headerRecordBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#3730A3',
        letterSpacing: 0.5,
    },
    headerRecordMetaText: {
        fontSize: 9,
        fontWeight: '500',
        color: '#64748B',
        fontFamily: 'monospace',
    },
    headerViewRecordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: '#EEF2FF',
        borderWidth: 0.5,
        borderColor: '#C7D2FE',
    },
    desktopCompactHeaderViewBtn: {
        paddingHorizontal: 6,
        paddingVertical: COMPACT_PADDING,
        borderRadius: 2,
    },
    headerViewRecordBtnText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4F46E5',
    },
    collapseToggleBtn: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        backgroundColor: '#F1F5F9',
        borderWidth: 0.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRecordBody: {
        marginTop: 4,
    },
    formLabelTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: COMPACT_MARGIN,
    },
    formLabelTitleMobile: {
        fontSize: 12,
    },
    desktopCompactText: {
        fontSize: COMPACT_FONT_SIZE,
    },
    borderBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#0F172A',
        borderRadius: 2,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box' as any,
    },
    actionBoxDesktop: {
        minHeight: 22,
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
    },
    navigationBoxDesktop: {
        minHeight: 24,
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
    },
    recordsBoxDesktop: {
        // @ts-ignore
        height: '50vh',
        minHeight: 220,
        padding: COMPACT_PADDING,
        margin: COMPACT_MARGIN,
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
    actionText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#0F172A',
    },
    actionTabsScrollContent: {
        alignItems: 'center',
        gap: 4,
    },
    actionTabItem: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    desktopCompactActionTabItem: {
        paddingHorizontal: 6,
        paddingVertical: COMPACT_PADDING,
        borderRadius: 1,
        borderWidth: 0.5,
    },
    activeActionTabItem: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    actionTabText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    activeActionTabText: {
        color: '#FFFFFF',
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
        fontSize: 10,
        fontWeight: '700',
        color: '#000000',
        minWidth: 36,
        textAlign: 'center',
        fontFamily: 'monospace',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 2,
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
        marginLeft: 6,
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

export default ObjectPanel;