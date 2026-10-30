import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ProductPanel from './ecom/ProductPanel';
import { getObjectRecords } from './apiService';
import { CHART_OBJECT_ID } from './global';
import { getCookies, formatIDRCurrency } from './ecom/ts/public';
import { dropItem } from './panel/ts/Derado';
import OrderStage from './ecom/OrderStage'; // <-- Imported OrderStage component

// --- Color Palette Constants (60-30-10 Rule) ---
const PALETTE = {
  blue: '#4A6984',
  beige: '#F5F2EB',
  sage: '#8F9E8B',
  white: '#FFFFFF',
  textDark: '#1A232A',
  textLight: '#F5F2EB',
};

interface EcommercePanelProps {
  subdomain?: string;
  domain?: string;
  domainFunc: (dm: string) => void;
}

interface CartRecord {
  id?: string;
  pid?: string;
  order_qty?: number | string;
  total_price?: number | string;
  [key: string]: any;
}

export const EcommercePanel: React.FC<EcommercePanelProps> = ({ domainFunc, subdomain, domain }) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Active palette background state
  const [themeColor, setThemeColor] = useState<string>(PALETTE.beige);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Cart count & records state
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartRecords, setCartRecords] = useState<CartRecord[]>([]);
  const [isCartPopupOpen, setIsCartPopupOpen] = useState<boolean>(false);
  const [loadingCart, setLoadingCart] = useState<boolean>(false);

  // Deletion Confirmation Modal State
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<CartRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // OrderStage Edit Cart State
  const [cartOrderRecord, setCartOrderRecord] = useState<CartRecord | null>(null);
  const [loadingEditRecord, setLoadingEditRecord] = useState<boolean>(false);

  // Dynamic contrast colors depending on selected theme
  const isDarkTheme = themeColor === PALETTE.blue;
  const textColor = isDarkTheme ? PALETTE.textLight : PALETTE.textDark;

  // Fetch cart records on load and when popup toggles / panel refreshes
  const fetchCartRecords = useCallback(async () => {
    setLoadingCart(true);
    try {
      const cookies = getCookies({ attribute: ['public-client'] });
      const publicClient = cookies['public-client'] || cookies['__public_client'] || '';

      if (!publicClient) {
        setCartRecords([]);
        setCartCount(0);
        setLoadingCart(false);
        return;
      }

      const response = await getObjectRecords({
        objectid: CHART_OBJECT_ID,
        whereClause: [{ col_name: 'createdby', value: publicClient }],
        filterColumns: [],
      });

      const records = Array.isArray(response) ? response : response?.data;
      if (Array.isArray(records)) {
        setCartRecords(records);
        setCartCount(records.length);
      }
    } catch (err) {
      console.error('[EcommercePanel] Error fetching chart records:', err);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    fetchCartRecords();
  }, [fetchCartRecords]);

  const handleCartClick = () => {
    const nextState = !isCartPopupOpen;
    setIsCartPopupOpen(nextState);
    if (nextState) {
      fetchCartRecords(); // Refresh data on open
    }
  };

  // Helper to parse "[product_id] Product Name" -> returns "Product Name"
  const parseProductName = (rawPid: string = ''): string => {
    if (!rawPid) return 'Unknown Product';
    const match = rawPid.match(/\]\s*(.*)$/);
    return match && match[1] ? match[1].trim() : rawPid.replace(/^\[.*?\]/, '').trim();
  };

  // Handle Pencil Icon Click: Fetch single order record and open OrderStage
  const handleEditRecord = async (record: CartRecord) => {
    if (!record?.id) return;

    setLoadingEditRecord(true);
    try {
      const response = await getObjectRecords({
        objectid: CHART_OBJECT_ID,
        whereClause: [{ col_name: 'id', value: record.id }],
        filterColumns: [],
      });

      const recordList = Array.isArray(response) ? response : response?.data;
      const __record = Array.isArray(recordList) && recordList.length > 0 ? recordList[0] : null;

      if (__record) {
        setCartOrderRecord(__record);
        setIsCartPopupOpen(false); // Close cart pop-up when editing
      } else {
        console.error('[EcommercePanel] Record not found for editing.');
      }
    } catch (err) {
      console.error('[EcommercePanel] Error fetching single chart record for edit:', err);
    } finally {
      setLoadingEditRecord(false);
    }
  };

  // Trigger Deletion Modal Prompt
  const handleDeleteRecord = (record: CartRecord) => {
    if (!record?.id) return;
    setDeleteTargetRecord(record);
  };

  // Execute Confirmed Deletion via dropItem
  const confirmDeleteRecord = async () => {
    if (!deleteTargetRecord?.id) return;

    setIsDeleting(true);
    try {
      const response = await dropItem({
        tableName: CHART_OBJECT_ID,
        recordid: deleteTargetRecord.id,
      });

      const isSuccess = response && (response.success === true);

      if (isSuccess) {
        setDeleteTargetRecord(null);
        await fetchCartRecords();
      } else {
        console.error('[EcommercePanel] Failed to delete chart record:', response?.message);
      }
    } catch (err) {
      console.error('[EcommercePanel] Error executing dropItem:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColor }]}>
      {/* Top 1 Box Header */}
      <View style={[styles.top1Box, { backgroundColor: themeColor }]}>
        <View style={styles.top1BoxLeft}>
          <View style={styles.colorPaletteGroup}>
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.blue },
                themeColor === PALETTE.blue && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.blue)}
              accessibilityLabel="Set theme to Slate Blue"
            />
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.beige },
                themeColor === PALETTE.beige && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.beige)}
              accessibilityLabel="Set theme to Warm Beige"
            />
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.sage },
                themeColor === PALETTE.sage && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.sage)}
              accessibilityLabel="Set theme to Sage Green"
            />
          </View>

          <View style={styles.headerVideoContainer}>
            {Platform.OS === 'web' ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  height: '18px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  background: 'transparent',
                }}
              >
                <source src="brand_logo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Text style={[styles.logoFallbackText, { color: textColor }]}>BRAND</Text>
            )}
          </View>
        </View>

        <View style={styles.top1BoxRight}>
          <View style={styles.flagContainer}>
            <View style={styles.flagRed} />
            <View style={styles.flagWhite} />
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => domainFunc('customer portal')}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Portal</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => domainFunc('management')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Demo</Text>}
          </TouchableOpacity>

          {/* Cart Menu Link & Interactive Pop-up Anchor */}
          <View style={styles.cartAnchorWrapper}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCartClick}>
              <View style={styles.cartIconWrapper}>
                <Text style={styles.menuIcon}>🛒</Text>
                {cartCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </View>
              {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Cart</Text>}
            </TouchableOpacity>

            {/* Cart Pop-Up Box */}
            {isCartPopupOpen && (
              <View
                style={[
                  styles.cartPopupBox,
                  isDesktop ? styles.desktopCartPopup : styles.mobileCartPopup,
                  { maxHeight: isDesktop ? height * 0.5 : '100%' },
                ]}
              >
                <View style={styles.cartPopupHeader}>
                  <Text style={styles.cartPopupTitle}>My Chart Items</Text>
                  <TouchableOpacity onPress={() => setIsCartPopupOpen(false)}>
                    <Text style={styles.cartCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {loadingCart ? (
                  <View style={styles.cartLoadingContainer}>
                    <Text style={styles.cartLoadingText}>Loading chart...</Text>
                  </View>
                ) : cartRecords.length === 0 ? (
                  <View style={styles.cartEmptyContainer}>
                    <Text style={styles.cartEmptyText}>Your chart is empty.</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.cartScrollArea}
                    contentContainerStyle={styles.cartScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    {cartRecords.map((rec, idx) => (
                      <View key={`cart-item-${rec.id || idx}`} style={styles.cartItemRow}>
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemName} numberOfLines={2}>
                            {parseProductName(rec.pid)}
                          </Text>
                          <View style={styles.cartItemSubRow}>
                            <Text style={styles.cartItemQty}>Qty: {rec.order_qty ?? 1}</Text>
                            <Text style={styles.cartItemPrice}>
                              {formatIDRCurrency(rec.total_price)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cartItemActions}>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleEditRecord(rec)}
                            accessibilityLabel="Edit record"
                            disabled={loadingEditRecord}
                          >
                            <Text style={styles.actionIconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleDeleteRecord(rec)}
                            accessibilityLabel="Delete record"
                          >
                            <Text style={styles.actionIconText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👤</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Me</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💬</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Chat</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 2 Box Banner */}
      <View style={[styles.top2Box, { backgroundColor: themeColor }]}>
        <Text style={[styles.top2BoxText, { color: textColor }]} numberOfLines={1}>
          🎨 60-30-10 Palette Ratio: Dynamic Global Color Selection
        </Text>
      </View>

      {/* Main Content Area */}
      <View style={[styles.mainBody, !isDesktop && styles.mainBodyMobile]}>
        {isDesktop && <View style={[styles.contentBoxLeft, { backgroundColor: PALETTE.white }]} />}

        <View style={[styles.contentBox, !isDesktop && styles.fullWidth, { backgroundColor: PALETTE.white }]}>
          {/* Passed fetchCartRecords down as onChartPress to ProductPanel */}
          <ProductPanel onChartPress={fetchCartRecords} />
        </View>

        {isDesktop && <View style={[styles.contentBoxRight, { backgroundColor: PALETTE.white }]} />}
      </View>

      {/* Footer Box */}
      <View style={[styles.footer, { backgroundColor: themeColor }]}>
        <Text style={[styles.footerText, { color: textColor }]} numberOfLines={1}>
          © 2026 amgreat.id
        </Text>
      </View>

      {/* OrderStage Modal Overlay for Editing Cart Record */}
      {cartOrderRecord && (
        <View style={styles.modalOverlay}>
          <View style={[styles.orderStageContainer, isDesktop && styles.desktopOrderStageContainer]}>
            <OrderStage
              cartOrder={cartOrderRecord}
              onClose={() => {
                setCartOrderRecord(null);
                fetchCartRecords(); // Refresh cart upon closing editor
              }}
            />
          </View>
        </View>
      )}

      {/* Professional Centered Deletion Confirmation Modal Overlay */}
      {deleteTargetRecord && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete <Text style={styles.modalHighlightText}>"{parseProductName(deleteTargetRecord.pid)}"</Text> from your chart?
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setDeleteTargetRecord(null)}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={confirmDeleteRecord}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    width: '100%',
    padding: 6,
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  top1Box: {
    height: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 0,
    zIndex: 100,
  },
  top1BoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPaletteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorBtnActive: {
    transform: [{ scale: 1.25 }],
  },
  headerVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  top1BoxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagContainer: {
    width: 18,
    height: 12,
    overflow: 'hidden',
  },
  flagRed: {
    flex: 1,
    backgroundColor: '#FF0000',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuIcon: {
    fontSize: 12,
  },
  menuText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cartAnchorWrapper: {
    position: 'relative',
  },
  cartIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // --- Cart Pop-up Box Styles ---
  cartPopupBox: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  desktopCartPopup: {
    width: 320,
  },
  mobileCartPopup: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    borderRadius: 0,
  },
  cartPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  cartPopupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  cartLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cartLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  cartEmptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  cartEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cartScrollArea: {
    flex: 1,
  },
  cartScrollContent: {
    padding: 8,
    gap: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  cartItemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemQty: {
    fontSize: 11,
    color: '#64748B',
  },
  cartItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionIconText: {
    fontSize: 11,
  },

  // --- OrderStage Overlay Styles ---
  orderStageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  orderStageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  desktopOrderStageContainer: {
    width: 600,
    height: 600,
    maxHeight: '90%',
    maxWidth: '90%',
  },

  // --- Professional Deletion Modal Styles ---
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalHighlightText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalConfirmBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  top2Box: {
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  top2BoxText: {
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  mainBodyMobile: {
    flexDirection: 'column',
  },
  contentBoxLeft: {
    flex: 1,
    borderRadius: 6,
  },
  contentBox: {
    flex: 3,
    borderRadius: 6,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  contentBoxRight: {
    flex: 1,
    borderRadius: 6,
  },
  fullWidth: {
    width: '100%',
    flex: 1,
  },
  footer: {
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 11,
  },
});

export default EcommercePanel;