import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { getObjectRecords, trackView, showForm } from './../apiService';
import ProductDetail from './ProductDetail';
import { TRACK_VIEW_LOVE_OBJECT_ID, TRACK_VIEW_SHARE_OBJECT_ID, CHART_OBJECT_ID } from './../global';
import { clientInfo, loadCookies } from './ts/public';

//const CHART_OBJECT_ID = 'd62c95b6-669a-422b-b9ba-a73a2b9fbc82';

const productPanelAnimationStyles = `
  @keyframes iconBlinkAnim {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(1.22);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .hover-blink-active {
    animation: iconBlinkAnim 1s infinite ease-in-out !important;
  }
`;

export interface ProductItem {
  id: string;
  pid?: string;
  category?: string;
  name_1?: string;
  name_2?: string;
  price?: number | string;
  sold_qty?: number;
  love_qty?: number;
  share_qty?: number;
  file?: string;
  [key: string]: any;
}

export interface ProductPanelProps {
  sessionid?: string;
  category?: string;
  subcategory?: string;
  shareObjectId?: string;
  loveObjectId?: string;
  desktopProductsPerLine?: number;
  mobileProductsPerLine?: number;
  onDetailPress?: (item: ProductItem) => void;
  onOrderPress?: (item: ProductItem) => void;
  onChartPress?: () => void;
}

const ProductPhotoBox: React.FC<{
  item: ProductItem;
  sessionid?: string;
  shareObjectId?: string;
  loveObjectId?: string;
}> = ({ item, sessionid, shareObjectId = TRACK_VIEW_SHARE_OBJECT_ID, loveObjectId = TRACK_VIEW_LOVE_OBJECT_ID }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [boxWidth, setBoxWidth] = useState<number>(0);

  const [loveQty, setLoveQty] = useState<number>(item.love_qty ?? 0);
  const [shareQty, setShareQty] = useState<number>(item.share_qty ?? 0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const containerRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setLoveQty(item.love_qty ?? 0);
  }, [item.love_qty]);

  useEffect(() => {
    setShareQty(item.share_qty ?? 0);
  }, [item.share_qty]);

  useEffect(() => {
    if (hasFetched || !item.file) return;

    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              fetchPhotos();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    } else {
      fetchPhotos();
    }
  }, [item.file, hasFetched]);

  const fetchPhotos = async () => {
    const fileGroupId = item.file;
    if (hasFetched || !fileGroupId) return;

    setLoadingPhotos(true);
    setHasFetched(true);

    try {
      const response = await getObjectRecords({
        objectid: 'UPLOADED_FILES_FORM_ID',
        whereClause: [{ col_name: 'pid', value: fileGroupId }],
        filterColumns: ['id', 'savedname'],
      });

      const rawList = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(rawList) && rawList.length > 0) {
        const urls = rawList
          .map((fileObj: any) => {
            const fileName = fileObj.savedname || (typeof fileObj === 'string' ? fileObj : null);
            if (!fileName) return null;

            const cleanFileName = String(fileName).trim();
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            return `${origin}/api/read?fileName=${encodeURIComponent(cleanFileName)}`;
          })
          .filter(Boolean) as string[];

        setPhotos(urls);
      }
    } catch (err) {
      console.error(`[ProductPanel] Error loading photos for product ${item.id}:`, err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleLoveClick = async () => {
    try {
      const schemaResult = await showForm({ objectid: loveObjectId, src: "https://amgreat.id" });

      const response = await trackView({
        objectid: loveObjectId,
        target: '1',
        operator: '+',
        recordid: item.id,
        value: '',
        sessionid: schemaResult.sessionToken ? schemaResult.sessionToken : "",
      });

      if (response && response.success) {
        setLoveQty((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error tracking love click:', err);
    }
  };

  const handleShareClick = async () => {
    try {
      const schemaResult = await showForm({ objectid: loveObjectId, src: "https://amgreat.id" });

      const response = await trackView({
        objectid: shareObjectId,
        target: '2',
        operator: '+',
        recordid: item.id,
        value: '',
        sessionid: schemaResult.sessionToken ? schemaResult.sessionToken : "",
      });

      if (response && response.success) {
        setShareQty((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error tracking share click:', err);
    }
  };

  const handleLayout = (e: any) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setBoxWidth(width);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width || boxWidth;
    if (viewWidth > 0) {
      const newIndex = Math.round(contentOffsetX / viewWidth);
      setActiveIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < photos.length && boxWidth > 0) {
      setActiveIndex(index);
      scrollViewRef.current?.scrollTo({ x: index * boxWidth, animated: true });
    }
  };

  return (
    <div
      style={{ width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <View ref={containerRef} style={styles.photoContainer} onLayout={handleLayout}>
        <View style={styles.photoTopOverlay}>
          <View />
          <View style={styles.actionsRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleLoveClick}>
              <Text style={styles.iconQtyText}>{loveQty}</Text>
              <div className={isHovered ? 'hover-blink-active' : ''} style={{ display: 'inline-block' }}>
                <Text style={styles.actionIcon}>❤️</Text>
              </div>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShareClick}>
              <Text style={styles.iconQtyText}>{shareQty}</Text>
              <div className={isHovered ? 'hover-blink-active' : ''} style={{ display: 'inline-block' }}>
                <Text style={styles.actionIcon}>🔗</Text>
              </div>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.photoPlaceholder}>
          {loadingPhotos ? (
            <View style={styles.loadingPhotoContainer}>
              <ActivityIndicator size="large" color="#4A6984" />
            </View>
          ) : photos.length > 0 ? (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.carouselScrollView}
            >
              {photos.map((photoUrl, pIdx) => (
                <Image
                  key={`photo-${pIdx}`}
                  source={{ uri: photoUrl }}
                  style={[styles.productImg, { width: boxWidth || 250 }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.photoPlaceholderText}>product photo</Text>
          )}
        </View>

        {photos.length > 1 && (
          <View style={styles.carouselArrowsOverlay}>
            <TouchableOpacity
              style={[styles.arrowBtn, activeIndex === 0 && styles.disabledArrow]}
              onPress={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.arrowBtn, activeIndex === photos.length - 1 && styles.disabledArrow]}
              onPress={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === photos.length - 1}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.paginationDots}>
          {photos.length > 0 ? (
            <Text style={styles.dotsText}>
              {photos.map((_, idx) => (idx === activeIndex ? '●' : '○')).join('')}
            </Text>
          ) : (
            <Text style={styles.dotsText}>○○○○○</Text>
          )}
        </View>
      </View>
    </div>
  );
};

export const ProductPanel: React.FC<ProductPanelProps> = ({
  sessionid,
  category,
  subcategory,
  shareObjectId,
  loveObjectId,
  desktopProductsPerLine = 3,
  mobileProductsPerLine = 1,
  onDetailPress,
  onOrderPress,
  onChartPress,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ref flag to ensure loadCookies executes ONLY ONCE
  const cookiesLoadedRef = useRef<boolean>(false);

  // Chart badge state
  const [chartCount, setChartCount] = useState<number>(0);

  // Modal / Detail state
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Centered Alert Modal State
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const itemsPerLine = isDesktop ? desktopProductsPerLine : mobileProductsPerLine;
  const gridGap = 12;
  const computedCardWidth = `calc((100% - ${gridGap * (itemsPerLine - 1)}px) / ${itemsPerLine})`;

  useEffect(() => {
    // Guard against double execution
    if (!cookiesLoadedRef.current) {
      cookiesLoadedRef.current = true;
      initCookies();
    }
    loadProducts();
    updateChartCount();
  }, [category, subcategory]);

  const initCookies = async () => {
    try {
      await loadCookies();
    } catch (err: any) {
      console.error('[ProductPanel] Error loading cookies:', err);
      showAlert('Notice', err?.message || 'Cookie initialization required.');
    }
  };

  const showAlert = (title: string, message: string) => {
    setAlertState({
      visible: true,
      title,
      message,
    });
  };

  const updateChartCount = async () => {
    try {
      const client = await clientInfo();
      const payload = {
        objectid: CHART_OBJECT_ID,
        whereClause: [{ col_name: 'createdby', value: client }],
        filterColumns: ['id'],
        sessionid,
      };

      const response = await getObjectRecords(payload);
      const records = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(records)) {
        setChartCount(records.length);
      } else {
        setChartCount(0);
      }
    } catch (err) {
      console.error('[ProductPanel] Error updating chart count:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    const whereClause: Array<{ column: string; operator: string; value: any }> = [];

    if (category) {
      whereClause.push({ column: 'category', operator: '=', value: category });
    }
    if (subcategory) {
      whereClause.push({ column: 'subcategory', operator: '=', value: subcategory });
    }

    const payload = {
      objectid: TRACK_VIEW_LOVE_OBJECT_ID,
      whereClause,
      filterColumns: [],
      sessionid,
    };

    try {
      const response = await getObjectRecords(payload);
      if (response && response.data) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching product records:', err);
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (item: ProductItem) => {
    setSelectedProduct(item);
    setIsDetailOpen(true);
    if (onDetailPress) onDetailPress(item);
  };

  const handleOpenOrder = (item: ProductItem) => {
    setSelectedProduct(item);
    setIsDetailOpen(true);
    if (onOrderPress) onOrderPress(item);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProduct(null);
    if(onChartPress){
        onChartPress();
    }
  };

  const formatCategory = (categoryRaw?: string) => {
    if (!categoryRaw || categoryRaw.trim() === '') return null;
    const closeBracketIndex = categoryRaw.indexOf(']');
    if (closeBracketIndex !== -1) {
      return categoryRaw.substring(closeBracketIndex + 1).trim();
    }
    return categoryRaw;
  };

  const formatSellerName = (sellerRaw?: string) => {
    if (!sellerRaw || sellerRaw.trim() === '') return null;
    const closeBracketIndex = sellerRaw.indexOf(']');
    if (closeBracketIndex !== -1) {
      return sellerRaw.substring(closeBracketIndex + 1).trim();
    }
    return sellerRaw;
  };

  const formatPrice = (priceVal?: number | string) => {
    if (priceVal === undefined || priceVal === null || priceVal === '') {
      return 'Price';
    }

    let valStr = typeof priceVal === 'number' ? `$${priceVal.toLocaleString()}` : String(priceVal);

    if (valStr.includes('$')) {
      valStr = valStr.replace(/\$/g, 'IDR ').trim();
    } else if (!valStr.includes('IDR')) {
      valStr = `IDR ${valStr}`;
    }

    return valStr;
  };

  const extractMerchantId = (rawPid?: string) => {
    if (!rawPid || rawPid.trim() === '') return '';
    const match = rawPid.match(/\[(.*?)\]/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return rawPid.trim();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A6984" />
        <Text style={styles.loadingText}>Loading Products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      {React.createElement('style', null, productPanelAnimationStyles)}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.gridContainer, { gap: gridGap }]}>
          {products.map((item, index) => {
            const categoryDisplay = formatCategory(item.category);
            const sellerDisplay = formatSellerName(item.pid);

            return (
              <View
                key={item.id || index}
                style={[
                  styles.card,
                  { width: computedCardWidth as any }
                ]}
              >
                <View style={styles.relativeBox}>
                  <ProductPhotoBox
                    item={item}
                    sessionid={sessionid}
                    shareObjectId={shareObjectId}
                    loveObjectId={loveObjectId}
                  />

                  {categoryDisplay && (
                    <View style={styles.categoryBadgeOverlay}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {categoryDisplay}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <View style={styles.rowLine1}>
                    <View style={styles.name1Container}>
                      <Text style={styles.name1Text} numberOfLines={1}>
                        {item.name_1 || 'Product Name line 1'}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText} numberOfLines={1}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowLine2}>
                    <Text style={styles.name2Text} numberOfLines={1}>
                      {item.name_2 || 'Product Name line 2'}
                    </Text>
                  </View>

                  <View style={styles.rowRatingSold}>
                    <Text style={styles.starText}>☆☆☆☆☆</Text>
                    <View style={styles.actionButtonsGroup}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenDetail(item)}
                      >
                        <Text style={styles.actionBtnText}>Detail</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenOrder(item)}
                      >
                        <Text style={styles.actionBtnText}>Order</Text>
                      </TouchableOpacity>
                      <View style={styles.soldBadge}>
                        <Text style={styles.soldText}>
                          Sold {item.sold_qty ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {sellerDisplay && (
                    <View style={styles.rowSeller}>
                      <Text style={styles.sellerText} numberOfLines={1}>
                        {sellerDisplay}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ProductDetail Overlay Modal */}
      <Modal
        visible={isDetailOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseDetail}
      >
        <View style={styles.modalOverlay}>
          <ProductDetail
            recordid={selectedProduct?.id}
            objectid="ad1bb5f179b7a0f8"
            merchantid={extractMerchantId(selectedProduct?.pid)}
            sessionid={sessionid}
            onClose={handleCloseDetail}
          />
        </View>
      </Modal>

      {/* Professional Centered Cookie/Alert Modal Overlay */}
      {alertState.visible && (
        <View style={styles.centerAlertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertState.title}</Text>
            <Text style={styles.alertMessage}>{alertState.message}</Text>
            <TouchableOpacity
              style={styles.alertOkBtn}
              onPress={() => setAlertState((prev) => ({ ...prev, visible: false }))}
              activeOpacity={0.8}
            >
              <Text style={styles.alertOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chartIconBtn: {
    position: 'relative',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartIconText: {
    fontSize: 22,
  },
  chartBadgeCircle: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  chartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 14,
    color: '#D9534F',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A6984',
    borderRadius: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
    padding: 8,
    gap: 8,
    marginBottom: 4,
    boxSizing: 'border-box' as any,
  },
  relativeBox: {
    position: 'relative',
    width: '100%',
  },

  photoContainer: {
    aspectRatio: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    maxWidth: '60%',
  },
  photoTopOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },
  actionsRight: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    gap: 3,
  },
  iconQtyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  actionIcon: {
    fontSize: 11,
  },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselScrollView: {
    width: '100%',
    height: '100%',
  },
  productImg: {
    height: '100%',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
  },
  carouselArrowsOverlay: {
    position: 'absolute',
    top: '45%',
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 6,
  },
  arrowBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledArrow: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: -2,
  },
  paginationDots: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    marginBottom: 2,
  },
  dotsText: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#000000',
  },

  infoContainer: {
    gap: 6,
  },
  rowLine1: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  name1Container: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 2,
  },
  name1Text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  priceContainer: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 2,
    alignItems: 'center',
    minWidth: 80,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  rowLine2: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 2,
  },
  name2Text: {
    fontSize: 11,
    color: '#333333',
  },
  rowRatingSold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  starText: {
    fontSize: 13,
    letterSpacing: 1,
    color: '#000000',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },
  soldBadge: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },
  rowSeller: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 2,
  },
  sellerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },

  // Centered Professional Alert Box
  centerAlertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 100000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  alertOkBtn: {
    width: '100%',
    backgroundColor: '#1E293B',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  alertOkBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ProductPanel;