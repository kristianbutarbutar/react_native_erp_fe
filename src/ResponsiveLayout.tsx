'use client';

import React, { useState, useEffect, useRef, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import type { MenuItem } from './types';
import { fetchAPI1, menuLoader, getTableRecords } from './apiService';
import { DEFAULT_ROW_START, DEFAULT_ROW_END, PAGE_SIZE } from './config';
import Button from './Button';
import type { ButtonConfig } from './Button';
import { renderFontAwesomeIcon } from './customer/FontAwesomeIcon';

// Imports from the ./panel folder
import NewPanel from './panel/NewPanel';
import EditPanel from './panel/EditPanel';
import DeletePanel from './panel/DeletePanel';
import ViewPanel from './panel/ViewPanel';
import HtmlPanel from './panel/HtmlPanel';
import Configuration from './panel/Configuration';
import ObjectRecords from './panel/ObjectRecords';
import ObjectPanel from './customer/ObjectPanel';
import PrintPanel from './panel/PrintPanel';
import Dashboard from './customer/Dashboard';
import ChatPanel from './customer/ChatPanel';
import LoginPanel from './customer/LoginPanel';
import AlertPanel from './customer/AlertPanel';

export interface APIPayload {
  id: string;
  sessionid: string;
}

export interface TopPageMenuItem {
  icon: string;
  label: string;
  isDisabled: boolean;
}

const ChevronUpIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('polyline', { points: '18 15 12 9 6 15' })
  );

const ChevronDownIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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

const tableStyles = `
  .custom-html-table-wrapper {
    width: 100%;
    max-height: calc(100vh - 240px);
    overflow: auto;
    margin-top: 2px;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    background-color: #ffffff;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }
  .custom-html-table-wrapper table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    color: #334155;
  }
  .custom-html-table-wrapper th {
    background-color: #F8FAFC;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 10px;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 2px solid #E2E8F0;
    border-right: 1px solid #F1F5F9;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .custom-html-table-wrapper td {
    padding: 6px 10px;
    border-bottom: 1px solid #F1F5F9;
    border-right: 1px solid #F1F5F9;
    vertical-align: middle;
    max-width: 220px;
    word-break: break-all;
    word-wrap: break-word;
    transition: background-color 0.15s ease;
    cursor: pointer;
  }
  .custom-html-table-wrapper tr:last-child td {
    border-bottom: none;
  }
  .custom-html-table-wrapper tr:nth-child(even) {
    background-color: #FAFAFA;
  }
  .custom-html-table-wrapper tr:hover td {
    background-color: #EEF2FF;
    color: #312E81;
  }
  .custom-html-table-wrapper tr.selected-row td {
    background-color: #E0E7FF;
    color: #3730A3;
    font-weight: 600;
  }
  .custom-html-table-wrapper th:last-child,
  .custom-html-table-wrapper td:last-child {
    border-right: none;
  }
`;

interface CustomAlertBoxProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onResponse?: (result: 'OK' | 'NO' | 'CLOSE') => void;
}

const CustomAlertBox: React.FC<CustomAlertBoxProps> = ({ visible, title, message, onClose, onResponse }) => {
  if (!visible || typeof window === 'undefined' || !document.body) return null;

  const handleAction = (res: 'OK' | 'NO' | 'CLOSE') => {
    if (typeof onResponse === 'function') {
      onResponse(res);
    }
    onClose();
  };

  return createElement(
    'div',
    {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      },
      onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
      onMouseUp: (e: React.MouseEvent) => e.stopPropagation(),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation();
      },
      onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
      onTouchEnd: (e: React.TouchEvent) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation();
      },
    },
    createElement(
      View,
      { style: styles.modalCard },
      // Header Section
      createElement(
        View,
        { style: styles.modalHeader },
        createElement(Text, { style: styles.modalTitle }, title),
        createElement(
          TouchableOpacity,
          {
            style: styles.closeIconButton,
            activeOpacity: 0.7,
            onPress: (e: any) => {
              if (e && e.stopPropagation) e.stopPropagation();
              if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                e.nativeEvent.stopImmediatePropagation();
              }
              handleAction('CLOSE');
            },
          },
          createElement(Text, { style: styles.closeIconText }, '✕')
        )
      ),
      // Body Message Section
      createElement(
        ScrollView,
        { style: styles.modalBodyScroll, contentContainerStyle: styles.modalBodyContent },
        createElement(Text, { style: styles.modalMessage }, message)
      ),
      // Footer Action Buttons
      createElement(
        View,
        { style: styles.modalFooter },
        createElement(
          TouchableOpacity,
          {
            style: [styles.modalButton, styles.noButton],
            activeOpacity: 0.8,
            onPress: (e: any) => {
              if (e && e.stopPropagation) e.stopPropagation();
              if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                e.nativeEvent.stopImmediatePropagation();
              }
              handleAction('NO');
            },
          },
          createElement(Text, { style: styles.noButtonText }, 'NO')
        ),
        createElement(
          TouchableOpacity,
          {
            style: [styles.modalButton, styles.okButton],
            activeOpacity: 0.8,
            onPress: (e: any) => {
              if (e && e.stopPropagation) e.stopPropagation();
              if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                e.nativeEvent.stopImmediatePropagation();
              }
              handleAction('OK');
            },
          },
          createElement(Text, { style: styles.okButtonText }, 'OK')
        )
      )
    )
  );
};

export const ResponsiveLayout: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const SESSION_ID = 'sess_12345';

  const selectedRecordForPrinting = useRef<
    Array<{ objectid: string; recordid: string; sessionid: string }>
  >([]);
  const [printBadgeCount, setPrintBadgeCount] = useState<number>(0);
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState<boolean>(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState<boolean>(false);
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState<boolean>(false);

  // AlertPanel hook and visibility states
  const [isAlertPanelVisible, setIsAlertPanelVisible] = useState<boolean>(false);

  // Custom alert interception state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const [topPageMenuOnRight] = useState<TopPageMenuItem[]>([
    { icon: 'print', label: 'Print', isDisabled: false },
    { icon: 'user', label: 'Profile', isDisabled: false },
    { icon: 'comments', label: 'Chat', isDisabled: false },
    { icon: 'sign-in', label: 'Login', isDisabled: false },
    { icon: 'envelope', label: 'Contact', isDisabled: true },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomAlertEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const msgStr = String(customEvent.detail || '');
      let title = 'Notification';
      let cleanMessage = msgStr;

      try {
        const jsonStartIndex = msgStr.indexOf('{');
        if (jsonStartIndex !== -1) {
          const parsed = JSON.parse(msgStr.substring(jsonStartIndex));
          cleanMessage = parsed.error || msgStr;
        }
      } catch (e) {
        cleanMessage = msgStr;
      }

      setCustomAlert({
        visible: true,
        title,
        message: cleanMessage,
      });
    };

    window.addEventListener('custom-app-alert', handleCustomAlertEvent as EventListener);

    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      window.dispatchEvent(new CustomEvent('custom-app-alert', { detail: message }));
    };

    return () => {
      window.removeEventListener('custom-app-alert', handleCustomAlertEvent as EventListener);
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedRecordForPrinting.current) {
        setPrintBadgeCount(selectedRecordForPrinting.current.length);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [isNewPanelOpen, setIsNewPanelOpen] = useState<boolean>(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);
  const [isDeletePanelOpen, setIsDeletePanelOpen] = useState<boolean>(false);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState<boolean>(false);

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [recordId, setRecordId] = useState<string>('');
  const [uid, setUid] = useState<string>('');

  const [topMenuData, setTopMenuData] = useState<MenuItem[]>([]);
  const [leftMenuData, setLeftMenuData] = useState<MenuItem[]>([]);
  const [footerData, setFooterData] = useState<MenuItem[]>([]);

  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [htmlTable, setHtmlTable] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');

  const [rowStart, setRowStart] = useState<number>(DEFAULT_ROW_START);
  const [rowEnd, setRowEnd] = useState<number>(DEFAULT_ROW_END);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [loadingTopMenu, setLoadingTopMenu] = useState<boolean>(true);
  const [loadingLeftMenu, setLoadingLeftMenu] = useState<boolean>(true);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [loadingFooter, setLoadingFooter] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTableRowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
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
          setSelectedRecordId(fallbackId || finalRecordId);
          setRecordId(finalRecordId);

          const allRows = document.querySelectorAll('.custom-html-table-wrapper tr');
          allRows.forEach((r) => r.classList.remove('selected-row'));
          row.classList.add('selected-row');

          setIsViewPanelOpen(true);
        }
      }
    };

    const tableWrapper = document.querySelector('.custom-html-table-wrapper');
    if (tableWrapper) {
      tableWrapper.addEventListener('click', handleTableRowClick as EventListener);
    }

    return () => {
      if (tableWrapper) {
        tableWrapper.removeEventListener('click', handleTableRowClick as EventListener);
      }
    };
  }, [htmlTable]);

  const extractArray = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.result)) return response.result;
    return [];
  };

  const fetchContentForMenu = async (
    menuItem: MenuItem,
    start: number = DEFAULT_ROW_START,
    end: number = DEFAULT_ROW_END
  ) => {
    const targetTsx = (menuItem as any)?.target_tsx?.trim();
    const pubTsx = (menuItem as any)?.pub_tsx?.trim();

    if (pubTsx || targetTsx) {
      setLoadingContent(false);
      setHtmlTable('');
      setContentType('TSX');
      return;
    }

    setLoadingContent(true);
    setSelectedRecordId('');
    setRecordId('');
    try {
      const queryPayload = {
        tableName: menuItem.formid || '',
        whereClause: [],
        row_start: start,
        row_end: end,
      };
      const response = await getTableRecords(queryPayload);

      let rawResponse = response;
      if (typeof response === 'string') {
        try {
          rawResponse = JSON.parse(response);
        } catch (e) {
          // ignore
        }
      }

      const rawContentType =
        rawResponse?.contentType ??
        rawResponse?.data?.contentType ??
        (Array.isArray(rawResponse) && rawResponse[0]?.contentType) ??
        '';

      const normalizedContentType = String(rawContentType).trim().toUpperCase();

      const tableHtml =
        rawResponse?.htmlTable ||
        rawResponse?.data?.htmlTable ||
        (Array.isArray(rawResponse) && rawResponse[0]?.htmlTable) ||
        '';

      const total =
        rawResponse?.totalRecords ??
        rawResponse?.data?.totalRecords ??
        (Array.isArray(rawResponse) && rawResponse[0]?.totalRecords) ??
        0;

      setContentType(normalizedContentType);
      setHtmlTable(tableHtml);
      setTotalRecords(Number(total) || 0);
      setRowStart(start);
      setRowEnd(end);
    } catch (err) {
      console.error('Error loading content records:', err);
      setHtmlTable('');
      setTotalRecords(0);
      setContentType('');
    } finally {
      setLoadingContent(false);
    }
  };

  const loadUid = (__uid: string) => {
    setUid(__uid);
  };

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const payload: APIPayload = { id: 'banner_box', sessionid: SESSION_ID };
        await fetchAPI1(payload);
      } catch (err) {
        console.error('Error fetching Banner:', err);
      }
    };

    const loadTopMenu = async () => {
      try {
        const response = await menuLoader(2, 'e710d283-a45f-4d6b-9c12-32b61f8c9d02');
        const dataList = extractArray(response);
        setTopMenuData(dataList);
        if (dataList.length > 0 && !selectedMenu) {
          setSelectedMenu(dataList[0]);
          fetchContentForMenu(dataList[0], DEFAULT_ROW_START, DEFAULT_ROW_END);
        }
      } catch (err) {
        console.error('Error fetching Top Menu:', err);
        setTopMenuData([]);
      } finally {
        setLoadingTopMenu(false);
      }
    };

    const loadLeftMenu = async () => {
      try {
        const response = await menuLoader(2, 'f2b7a901-c8d3-4a52-b1e4-86d91c2f3e04');
        setLeftMenuData(extractArray(response));
      } catch (err) {
        console.error('Error fetching Left Menu:', err);
        setLeftMenuData([]);
      } finally {
        setLoadingLeftMenu(false);
      }
    };

    const loadFooter = async () => {
      try {
        const response = await menuLoader(2, '741a392c-2985-4d24-a77a-3f24e853df19');
        setFooterData(extractArray(response));
      } catch (err) {
        console.error('Error fetching Footer:', err);
        setFooterData([]);
      } finally {
        setLoadingFooter(false);
      }
    };

    loadBanner();
    loadTopMenu();
    loadLeftMenu();
    loadFooter();
  }, []);

  const handleSelectMenu = (item: MenuItem) => {
    setSelectedMenu(item);
    if (!isDesktop) {
      setIsMobileMenuOpen(false);
    }

    const targetTsx = (item as any)?.target_tsx?.trim() || (item as any)?.pub_tsx?.trim() || '';
    const normalizedTarget = targetTsx.toLowerCase().replace(/(\.tsx|\.ts)$/, '');

    if (normalizedTarget === 'chatpanel' && !uid) {
      setIsAlertPanelVisible(true);
    }

    fetchContentForMenu(item, DEFAULT_ROW_START, DEFAULT_ROW_END);
  };

  const handleNavUpwards = () => {
    if (!selectedMenu || rowStart <= 1 || loadingContent) return;
    const newStart = Math.max(1, rowStart - PAGE_SIZE);
    const newEnd = newStart + PAGE_SIZE - 1;
    fetchContentForMenu(selectedMenu, newStart, newEnd);
  };

  const handleNavDownwards = () => {
    if (!selectedMenu || loadingContent) return;
    if (totalRecords > 0 && rowEnd >= totalRecords) return;
    const newStart = rowStart + PAGE_SIZE;
    const newEnd = newStart + PAGE_SIZE - 1;
    fetchContentForMenu(selectedMenu, newStart, newEnd);
  };

  const renderDynamicContent = () => {
    const targetTsx = (selectedMenu as any)?.target_tsx?.trim() || '';
    const pubTsx = (selectedMenu as any)?.pub_tsx?.trim() || '';

    const sourceString = pubTsx || targetTsx;
    const normalizedTarget = sourceString.toLowerCase().replace(/(\.tsx|\.ts)$/, '');

    if (sourceString) {
      switch (normalizedTarget) {
        case 'dashboard':
          return <Dashboard />;
        case 'chatpanel':
          if (!uid) {
            return (
              <LoginPanel
                sessionid={SESSION_ID}
                loadUid={loadUid}
                showLoginPanelOpen={showLoginPanelOpen}
                onLoginSuccess={() => setIsAlertPanelVisible(false)}
              />
            );
          }
          return <ChatPanel uid={uid} sessionid={SESSION_ID} showChatPanelOpen={showChatPanelOpen} />;
        case 'objectpanel':
          return (
            <ObjectPanel
              formid={selectedMenu?.formid || ''}
              menuid={selectedMenu?.id || ''}
              pid={selectedMenu?.pid || ''}
              sessionId={SESSION_ID}
              selectedRecordForPrinting={selectedRecordForPrinting}
            />
          );
        case 'objectrecords':
          return (
            <ObjectRecords
              formid={selectedMenu?.formid || ''}
              sessionId={SESSION_ID}
            />
          );
        case 'htmlpanel':
          return <HtmlPanel />;
        case 'configuration':
          return <Configuration />;
        case 'newpanel':
          return (
            <NewPanel
              visible={true}
              tableName={selectedMenu?.formid || selectedMenu?.id || ''}
              sessionId={SESSION_ID}
            />
          );
        case 'editpanel':
          return (
            <EditPanel
              visible={true}
              tableName={selectedMenu?.formid || selectedMenu?.id || ''}
              recordid={recordId || selectedRecordId}
              sessionId={SESSION_ID}
            />
          );
        case 'deletepanel':
          return (
            <DeletePanel
              visible={true}
              tableName={selectedMenu?.formid || selectedMenu?.id || ''}
              recordid={recordId || selectedRecordId}
              sessionId={SESSION_ID}
            />
          );
        case 'viewpanel':
          return (
            <ViewPanel
              visible={true}
              tableName={selectedMenu?.formid || selectedMenu?.id || ''}
              recordid={recordId || selectedRecordId}
              sessionId={SESSION_ID}
              selectedRecordForPrinting={selectedRecordForPrinting}
            />
          );
        default:
          return (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>Target TSX Component Not Found</Text>
              <Text style={styles.emptyStateSubtext}>
                No component matching "{sourceString}" in ./panel directory.
              </Text>
            </View>
          );
      }
    }

    if (htmlTable) {
      return createElement('div', {
        className: 'custom-html-table-wrapper',
        dangerouslySetInnerHTML: { __html: htmlTable },
      });
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>No Records Available</Text>
        <Text style={styles.emptyStateSubtext}>
          Select a category from the navigation menu to view catalog items.
        </Text>
      </View>
    );
  };

  const newButtonConfig: ButtonConfig = {
    id: 'btn_new',
    label: 'New',
    objectid: selectedMenu?.formid,
    variant: 'primary',
    action: () => setIsNewPanelOpen(true),
    style: { height: 26, paddingVertical: 0, paddingHorizontal: 8 },
  };

  const isUpwardDisabled = rowStart <= 1 || loadingContent;
  const isDownwardDisabled =
    loadingContent || (totalRecords > 0 && rowEnd >= totalRecords);

  const renderPortal = (content: React.ReactNode, zIndexVal = 2147483646, isTransparent = false) => {
    if (typeof window === 'undefined' || !document.body) return null;
    return createElement(
      'div',
      {
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: zIndexVal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isTransparent ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
          pointerEvents: isTransparent ? 'none' : 'auto',
        }
      },
      content
    );
  };

  const showChatPanelOpen = (isOpen: boolean) => {
    if (isOpen && !uid) {
      setIsAlertPanelVisible(true);
      setIsChatPanelOpen(false);
      setIsLoginPanelOpen(true);
      return;
    }
    setIsChatPanelOpen(isOpen);
  };

  const showLoginPanelOpen = (isOpen: boolean) => {
    setIsLoginPanelOpen(isOpen);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {createElement('style', null, tableStyles)}

      <View style={styles.container}>
        <View style={styles.banner}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerRightMenuContent}
          >
            {topPageMenuOnRight.map((menuItem, idx) => {
              const isPrintMenu = menuItem.label.toLowerCase() === 'print';
              const isChatMenu = menuItem.label.toLowerCase() === 'chat';
              const isLoginMenu = menuItem.label.toLowerCase() === 'login';

              return (
                <TouchableOpacity
                  key={`top-right-menu-${idx}`}
                  style={[
                    styles.bannerRightMenuItem,
                    menuItem.isDisabled && styles.bannerRightMenuItemDisabled,
                  ]}
                  disabled={menuItem.isDisabled}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isPrintMenu) {
                      setIsPrintPanelOpen(true);
                    } else if (isChatMenu) {
                      if (!uid) {
                        setIsAlertPanelVisible(true);
                        setIsLoginPanelOpen(true);
                      } else {
                        setIsChatPanelOpen(true);
                      }
                    } else if (isLoginMenu) {
                      setIsLoginPanelOpen(true);
                    } else {
                      console.log(`Clicked top right menu: ${menuItem.label}`);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.bannerRightMenuText,
                      menuItem.isDisabled && styles.bannerRightMenuTextDisabled,
                    ]}
                  >
                    {createElement(
                      'span',
                      null,
                      renderFontAwesomeIcon(menuItem.icon),
                      ` ${menuItem.label}`
                    )}
                    {isPrintMenu && printBadgeCount > 0 && (
                      <Text style={styles.printBadgeLabel}> {printBadgeCount}</Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.topMenu}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.topMenuContent,
              isDesktop && styles.topMenuContentDesktop,
            ]}
          >
            {loadingTopMenu ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              Array.isArray(topMenuData) &&
              topMenuData.map((item) => {
                const isActive = selectedMenu?.id === item.id;
                return (
                  <TouchableOpacity
                    key={`top-${item.id}`}
                    style={[styles.topMenuItem, isActive && styles.activeTopMenuItem]}
                    onPress={() => handleSelectMenu(item)}
                  >
                    <Text
                      style={[
                        styles.topMenuText,
                        isActive && styles.activeTopMenuText,
                      ]}
                    >
                      {createElement('span', null, renderFontAwesomeIcon(item.icon), item.label)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {!isDesktop && (
          <View style={styles.mobileSubBar}>
            <TouchableOpacity
              style={styles.hamburgerButton}
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Text style={styles.hamburgerIcon}>{isMobileMenuOpen ? '✕' : '☰'}</Text>
              <Text style={styles.mobileMenuLabel}>Categories & Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isDesktop && isMobileMenuOpen && (
          <View style={styles.mobileDrawer}>
            <Text style={styles.sectionHeader}>Navigation Menu</Text>
            {loadingLeftMenu ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                {Array.isArray(leftMenuData) &&
                  leftMenuData.map((item) => {
                    const isActive = selectedMenu?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={`mobile-left-${item.id}`}
                        style={[
                          styles.leftMenuItem,
                          isActive && styles.activeLeftMenuItem,
                        ]}
                        onPress={() => handleSelectMenu(item)}
                      >
                        <Text
                          style={[
                            styles.leftMenuText,
                            isActive && styles.activeLeftMenuText,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            )}
          </View>
        )}

        <View style={[styles.mainBody, !isDesktop && styles.mainBodyMobile]}>
          {isDesktop && (
            <View style={styles.leftMenu}>
              <Text style={styles.sectionHeader}>Categories</Text>
              {loadingLeftMenu ? (
                <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 12 }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {Array.isArray(leftMenuData) &&
                    leftMenuData.map((item) => {
                      const isActive = selectedMenu?.id === item.id;
                      return (
                        <TouchableOpacity
                          key={`left-${item.id}`}
                          style={[
                            styles.leftMenuItem,
                            isActive && styles.activeLeftMenuItem,
                          ]}
                          onPress={() => handleSelectMenu(item)}
                        >
                          <Text
                            style={[
                              styles.leftMenuText,
                              isActive && styles.activeLeftMenuText,
                            ]}
                          >
                            {createElement('span', null, renderFontAwesomeIcon(item.icon), item.label)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.contentHeaderContainer}>
              <Text style={styles.contentTitle}>
                {selectedMenu?.label}
              </Text>

              {!(selectedMenu as any)?.target_tsx && contentType === 'TABLE' && (
                <View style={styles.tableNavContainer}>
                  <View style={styles.actionButtonGroup}>
                    <Button config={newButtonConfig} />
                  </View>

                  <Text style={styles.tableNavInfo}>
                    Showing {rowStart} - {Math.min(rowEnd, totalRecords || rowEnd)} of {totalRecords || 'N/A'}
                  </Text>
                  <View style={styles.tableNavButtonGroup}>
                    <TouchableOpacity
                      style={[
                        styles.tableNavIconButton,
                        isUpwardDisabled && styles.tableNavIconButtonDisabled,
                      ]}
                      onPress={handleNavUpwards}
                      disabled={isUpwardDisabled}
                      accessibilityLabel="Previous Rows"
                    >
                      <ChevronUpIcon color={isUpwardDisabled ? '#94A3B8' : '#4F46E5'} size={14} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tableNavIconButton,
                        isDownwardDisabled && styles.tableNavIconButtonDisabled,
                      ]}
                      onPress={handleNavDownwards}
                      disabled={isDownwardDisabled}
                      accessibilityLabel="Next Rows"
                    >
                      <ChevronDownIcon color={isDownwardDisabled ? '#94A3B8' : '#4F46E5'} size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {loadingContent ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading content...</Text>
              </View>
            ) : (
              <View style={styles.contentDetails}>{renderDynamicContent()}</View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {loadingFooter ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : Array.isArray(footerData) && footerData.length > 0 ? (
            footerData.map((item) => {
              const targetTsx = (item as any)?.target_tsx?.trim();
              const pubTsx = (item as any)?.pub_tsx?.trim();
              const hasTsx = Boolean(targetTsx || pubTsx);
              const isActive = selectedMenu?.id === item.id;

              return (
                <TouchableOpacity
                  key={`footer-${item.id}`}
                  style={[
                    styles.footerItem,
                    isActive && styles.activeFooterItem,
                    !hasTsx && styles.footerItemDisabled,
                  ]}
                  disabled={!hasTsx}
                  onPress={() => {
                    if (hasTsx) {
                      handleSelectMenu(item);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.footerText,
                      isActive && styles.activeFooterText,
                      !hasTsx && styles.footerTextDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} E-Commerce Store. All rights reserved.
            </Text>
          )}
        </View>
      </View>

      {/* CUSTOM ALERT BOX RENDERED WITH PROPER ONRESPONSE HOOK */}
      {customAlert.visible &&
        renderPortal(
          <CustomAlertBox
            visible={customAlert.visible}
            title={customAlert.title}
            message={customAlert.message}
            onClose={() => setCustomAlert({ visible: false, title: '', message: '' })}
            onResponse={(res) => {
              setCustomAlert({ visible: false, title: '', message: '' });
            }}
          />,
          2147483647
        )}

      {/* ALERT PANEL OVERLAY */}
      <AlertPanel
        isVisible={isAlertPanelVisible}
        title="Notification"
        message="Please login first for starting chat feature."
        response={(res) => {
          setIsAlertPanelVisible(false);
        }}
      />

      {/* CHAT PANEL MODAL OVERLAY */}
      {isChatPanelOpen && uid &&
        renderPortal(
          <ChatPanel
            uid={uid}
            sessionid={SESSION_ID}
            showChatPanelOpen={showChatPanelOpen}
          />,
          2147483646
        )}

      {/* LOGIN PANEL MODAL OVERLAY */}
      {isLoginPanelOpen &&
        renderPortal(
          <LoginPanel
            sessionid={SESSION_ID}
            loadUid={loadUid}
            showLoginPanelOpen={showLoginPanelOpen}
            onLoginSuccess={() => {
              setIsLoginPanelOpen(false);
              setIsAlertPanelVisible(false);
            }}
          />,
          2147483646
        )}

      {isNewPanelOpen && (
        <NewPanel
          visible={isNewPanelOpen}
          onClose={() => {
            setIsNewPanelOpen(false);
            refreshTableData();
          }}
          title={`New Record (${selectedMenu?.label || 'Item'})`}
          tableName={selectedMenu?.formid || selectedMenu?.id || ''}
          sessionId={SESSION_ID}
        />
      )}

      {isEditPanelOpen && (
        <EditPanel
          visible={isEditPanelOpen}
          onClose={() => {
            setIsEditPanelOpen(false);
            refreshTableData();
          }}
          title={`Edit Record (${selectedMenu?.label || 'Item'})`}
          tableName={selectedMenu?.formid || selectedMenu?.id || ''}
          recordid={recordId || selectedRecordId}
          sessionId={SESSION_ID}
        />
      )}

      {isDeletePanelOpen && (
        <DeletePanel
          visible={isDeletePanelOpen}
          onClose={() => {
            setIsDeletePanelOpen(false);
            refreshTableData();
          }}
          onSuccess={() => {
            setIsDeletePanelOpen(false);
            setIsViewPanelOpen(false);
            refreshTableData();
          }}
          title={`Delete Record (${selectedMenu?.label || 'Item'})`}
          tableName={selectedMenu?.formid || selectedMenu?.id || ''}
          recordid={recordId || selectedRecordId}
          sessionId={SESSION_ID}
        />
      )}

      {isViewPanelOpen && (
        <ViewPanel
          visible={isViewPanelOpen}
          onClose={() => setIsViewPanelOpen(false)}
          onDeleteSuccess={() => {
            setIsViewPanelOpen(false);
            refreshTableData();
          }}
          onEditSuccess={refreshTableData}
          title={`View Record (${selectedMenu?.label || 'Item'})`}
          tableName={selectedMenu?.formid || selectedMenu?.id || ''}
          recordid={recordId || selectedRecordId}
          sessionId={SESSION_ID}
          selectedRecordForPrinting={selectedRecordForPrinting}
        />
      )}

      {isPrintPanelOpen &&
        renderPortal(
          <PrintPanel
            visible={isPrintPanelOpen}
            onClose={() => setIsPrintPanelOpen(false)}
            title="Batch Print Selected Records"
            selectedRecordForPrinting={selectedRecordForPrinting}
            sessionId={SESSION_ID}
          />,
          2147483646
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },
  banner: {
    minHeight: 32,
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  bannerRightMenuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    gap: 8,
  },
  bannerRightMenuItem: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerRightMenuItemDisabled: {
    opacity: 0.5,
  },
  bannerRightMenuText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  bannerRightMenuTextDisabled: {
    color: '#CBD5E1',
  },
  printBadgeLabel: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  topMenu: {
    height: 34,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  topMenuContent: {
    alignItems: 'center',
  },
  topMenuContentDesktop: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  topMenuItem: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
    marginVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
  },
  activeTopMenuItem: {
    backgroundColor: '#EEF2FF',
  },
  topMenuText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTopMenuText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  mobileSubBar: {
    height: 32,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  hamburgerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  hamburgerIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginRight: 6,
  },
  mobileMenuLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  mobileDrawer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
  },
  mainBodyMobile: {
    flex: 1,
    flexGrow: 1,
    flexDirection: 'column',
  },
  leftMenu: {
    width: 200,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  leftMenuItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 2,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  activeLeftMenuItem: {
    backgroundColor: '#4F46E5',
  },
  leftMenuText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  activeLeftMenuText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    padding: 6,
    backgroundColor: '#F8FAFC',
  },
  contentHeaderContainer: {
    marginBottom: 2,
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contentTitle: {
    fontSize: 11,
    textAlign: 'right',
    paddingLeft: 12,
    paddingBottom: 0,
    marginBottom: 0,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    // @ts-ignore
    gap: '1vw',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  tableNavInfo: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tableNavButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableNavIconButton: {
    width: 26,
    height: 26,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tableNavIconButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  contentDetails: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 11,
    color: '#64748B',
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footer: {
    minHeight: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  footerItem: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    margin: 2,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  footerItemDisabled: {
    opacity: 0.5,
  },
  activeFooterItem: {
    backgroundColor: '#EEF2FF',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footerTextDisabled: {
    color: '#CBD5E1',
  },
  activeFooterText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // @ts-ignore
    pointerEvents: 'auto',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeIconButton: {
    width: 30,
    height: 30,
    backgroundColor: '#4338CA',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBodyScroll: {
    maxHeight: 260,
  },
  modalBodyContent: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    // @ts-ignore
    wordBreak: 'break-word',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  noButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  noButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  okButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  okButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ResponsiveLayout;