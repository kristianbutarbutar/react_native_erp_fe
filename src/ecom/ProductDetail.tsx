// customer/ProductDetail.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { getObjectRecords } from './../apiService';
import ReviewPanel from './ReviewPanel';
import OrderStage from './OrderStage';
import { REVIEW_PANEL, EC_HTML_CONTENT } from './../global';

export interface ProductDetailProps {
  merchantid?: string;
  objectid?: string;
  recordid?: string;
  sessionid?: string;
  themeColor?: string;
  onClose?: () => void;
  onExpandToggle?: () => void;
  onOrderPress?: (recordid?: string) => void;
}

interface ColumnAttr {
  col_name: string;
  html_type?: string;
  label?: string;
  [key: string]: any;
}

interface FetchState {
  data: Record<string, any> | null;
  columns: ColumnAttr[];
  loading: boolean;
  error: string | null;
}

const EXCLUDED_COLUMNS = ['id', 'pid', 'delflag', 'file', 'stock', 'stocks'];

export const ProductDetail: React.FC<ProductDetailProps> = ({
  merchantid = '',
  objectid = '',
  recordid = '',
  sessionid = '',
  themeColor = '#F5F2EB',
  onClose,
  onExpandToggle,
  onOrderPress,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isProductDetailOpen, setIsProductDetailOpen] = useState<boolean>(true);
  const [isMerchantInfoOpen, setIsMerchantInfoOpen] = useState<boolean>(true);
  const [isReviewInfoOpen, setIsReviewInfoOpen] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showOrderStage, setShowOrderStage] = useState<boolean>(false);

  const [productState, setProductState] = useState<FetchState>({
    data: null,
    columns: [],
    loading: false,
    error: null,
  });

  const [productCategory, setProductCategory] = useState<string>('');

  const [merchantState, setMerchantState] = useState<FetchState>({
    data: null,
    columns: [],
    loading: false,
    error: null,
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [photoBoxWidth, setPhotoBoxWidth] = useState<number>(0);

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingHtml, setLoadingHtml] = useState<boolean>(false);

  const photoScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDataSequentially();
  }, [objectid, recordid, merchantid]);

  useEffect(() => {
    const fileGroupId = productState.data?.file;
    if (fileGroupId) {
      fetchPhotos(fileGroupId);
    }
    if (recordid) {
      fetchProductSpecificationHtml(recordid);
    }
  }, [productState.data?.file, recordid]);

  const extractAndFormatCategory = (record: Record<string, any>) => {
    for (const [key, val] of Object.entries(record)) {
      if (key.toLowerCase().includes('category') && val) {
        const valStr = String(val);
        const closeBracketIndex = valStr.indexOf(']');
        if (closeBracketIndex !== -1) {
          return valStr.substring(closeBracketIndex + 1).trim();
        }
        return valStr.trim();
      }
    }
    return '';
  };

  const loadDataSequentially = async () => {
    if (objectid && recordid) {
      setProductState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const productPayload = {
          objectid,
          whereClause: [{ col_name: 'id', value: recordid }],
          filterColumns: [],
          sessionid,
        };

        const response = await getObjectRecords(productPayload);
        const recordList = Array.isArray(response) ? response : response?.data;
        const columnsList = response?.columns?.columns || [];
        const record = Array.isArray(recordList) && recordList.length > 0 ? recordList[0] : null;

        if (record) {
          setProductCategory(extractAndFormatCategory(record));
        }

        setProductState({
          data: record,
          columns: columnsList,
          loading: false,
          error: record ? null : 'No product details found.',
        });
      } catch (err: any) {
        console.error('[ProductDetail] Error fetching product info : ', err);
        setProductState({
          data: null,
          columns: [],
          loading: false,
          error: err?.message || 'Failed to load product details.',
        });
      }
    }

    if (merchantid) {
      setMerchantState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const merchantPayload = {
          objectid: 'f004-merc',
          whereClause: [{ col_name: 'id', value: merchantid }],
          filterColumns: [],
          sessionid,
        };

        const response = await getObjectRecords(merchantPayload);
        const recordList = Array.isArray(response) ? response : response?.data;
        const columnsList = response?.columns?.columns || [];
        const record = Array.isArray(recordList) && recordList.length > 0 ? recordList[0] : null;

        setMerchantState({
          data: record,
          columns: columnsList,
          loading: false,
          error: record ? null : 'No merchant information found.',
        });
      } catch (err: any) {
        console.error('[ProductDetail] Error fetching merchant info:', err);
        setMerchantState({
          data: null,
          columns: [],
          loading: false,
          error: err?.message || 'Failed to load merchant info.',
        });
      }
    }
  };

  const fetchProductSpecificationHtml = async (prodId: string) => {
    if (!prodId) return;

    setLoadingHtml(true);
    setHtmlContent(null);

    try {
      const specResponse = await getObjectRecords({
        objectid: EC_HTML_CONTENT,
        whereClause: [{ col_name: 'pid', value: prodId }],
        filterColumns: ['content'],
        sessionid,
      });

      const specList = Array.isArray(specResponse) ? specResponse : specResponse?.data;
      const firstSpec = Array.isArray(specList) && specList.length > 0 ? specList[0] : null;

      if (firstSpec && firstSpec.content) {
        const contentFileGroupId = firstSpec.content;

        const fileResponse = await getObjectRecords({
          objectid: 'UPLOADED_FILES_FORM_ID',
          whereClause: [{ col_name: 'pid', value: contentFileGroupId }],
          filterColumns: ['id', 'savedname'],
          sessionid,
        });

        const fileList = Array.isArray(fileResponse) ? fileResponse : fileResponse?.data;
        const firstFile = Array.isArray(fileList) && fileList.length > 0 ? fileList[0] : null;

        if (firstFile) {
          const fileName = firstFile.savedname || (typeof firstFile === 'string' ? firstFile : null);
          if (fileName) {
            const cleanFileName = String(fileName).trim();
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const fileUrl = `${origin}/api/read?fileName=${encodeURIComponent(cleanFileName)}`;

            const htmlTextResponse = await fetch(fileUrl);
            if (htmlTextResponse.ok) {
              const textData = await htmlTextResponse.text();
              setHtmlContent(textData);
            }
          }
        }
      }
    } catch (err) {
      console.error('[ProductDetail] Error fetching HTML spec content:', err);
    } finally {
      setLoadingHtml(false);
    }
  };

  const fetchPhotos = async (fileGroupId: string) => {
    if (!fileGroupId) return;

    setLoadingPhotos(true);
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
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error('[ProductDetail] Error loading photos:', err);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handlePhotoLayout = (e: any) => {
    const { width: layoutWidth } = e.nativeEvent.layout;
    if (layoutWidth > 0) {
      setPhotoBoxWidth(layoutWidth);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width || photoBoxWidth;
    if (viewWidth > 0) {
      const newIndex = Math.round(contentOffsetX / viewWidth);
      setActiveIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < photos.length && photoBoxWidth > 0) {
      setActiveIndex(index);
      photoScrollViewRef.current?.scrollTo({ x: index * photoBoxWidth, animated: true });
    }
  };

  const toggleExpand = () => {
    setIsFullScreen(!isFullScreen);
    if (onExpandToggle) onExpandToggle();
  };

  const handleOrderClick = () => {
    setShowOrderStage(true);
    if (onOrderPress) {
      onOrderPress(recordid);
    }
  };

  const unifiedStockValue = productState.data?.stock_qty ?? productState.data?.stock ?? productState.data?.stocks ?? 0;

  const formatFieldValue = (keyName: string, val: any) => {
    if (val === undefined || val === null) return '';
    let valStr = String(val);

    const keyLower = keyName.toLowerCase();

    if (keyLower.includes('category')) {
      const closeBracketIndex = valStr.indexOf(']');
      if (closeBracketIndex !== -1) {
        valStr = valStr.substring(closeBracketIndex + 1).trim();
      }
    }

    const isPriceKey = keyLower.includes('price');
    if (isPriceKey || valStr.includes('$')) {
      valStr = valStr.replace(/\$/g, 'IDR ');
      if (!valStr.includes('IDR')) {
        valStr = `IDR ${valStr}`;
      }
    }

    return valStr;
  };

  const getTopHeaderTitle = () => {
    if (!productState.data) return '';

    const pData = productState.data;
    const namePart = pData.name || pData.name_1 || pData.title || '';
    const priceRaw = pData.price;
    const priceFormatted = priceRaw !== undefined && priceRaw !== null ? formatFieldValue('price', priceRaw) : '';

    let fullTitle = namePart;
    if (priceFormatted) {
      fullTitle = `${namePart} - ${priceFormatted}`;
    }

    fullTitle = fullTitle.trim();

    if (fullTitle.length > 100) {
      return fullTitle.substring(0, 100) + '...';
    }

    return fullTitle;
  };

  const renderRecordFields = (data: Record<string, any> | null, columns: ColumnAttr[]) => {
    if (!data) return null;

    const itemWidthStyle = { width: isDesktop ? ('48.5%' as any) : ('100%' as any) };
    const renderedContent = [];

    if (columns && columns.length > 0) {
      const filteredCols = columns.filter(
        (col) => !EXCLUDED_COLUMNS.includes(col.col_name.toLowerCase())
      );

      filteredCols.forEach((col, idx) => {
        const fieldName = col.col_name;
        const fieldValue = data[fieldName];
        if (fieldValue === undefined || fieldValue === null) return;

        renderedContent.push(
          <View key={`col-${idx}-${fieldName}`} style={[styles.fieldBlock, itemWidthStyle]}>
            <Text style={styles.fieldLabel}>{col.label || fieldName}</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValueText}>
                {formatFieldValue(fieldName, fieldValue)}
              </Text>
            </View>
          </View>
        );
      });
    } else {
      const filteredEntries = Object.entries(data).filter(
        ([key]) => !EXCLUDED_COLUMNS.includes(key.toLowerCase())
      );

      filteredEntries.forEach(([key, val], idx) => {
        if (val === undefined || val === null) return;
        renderedContent.push(
          <View key={`raw-${idx}-${key}`} style={[styles.fieldBlock, itemWidthStyle]}>
            <Text style={styles.fieldLabel}>{key}</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValueText}>{formatFieldValue(key, val)}</Text>
            </View>
          </View>
        );
      });
    }

    renderedContent.push(
      <View key="sync-stock-qty" style={[styles.fieldBlock, itemWidthStyle]}>
        <Text style={styles.fieldLabel}>Stock Qty</Text>
        <View style={styles.fieldValueContainer}>
          <Text style={styles.fieldValueText}>{String(unifiedStockValue)}</Text>
        </View>
      </View>
    );

    renderedContent.push(
      <View key="sync-stocks" style={[styles.fieldBlock, itemWidthStyle]}>
        <Text style={styles.fieldLabel}>Stocks</Text>
        <View style={styles.fieldValueContainer}>
          <Text style={styles.fieldValueText}>{String(unifiedStockValue)}</Text>
        </View>
      </View>
    );

    return <View style={styles.fieldsGrid}>{renderedContent}</View>;
  };

  const renderHtmlSpec = (rawHtml: string) => {
    if (Platform.OS === 'web') {
      return (
        <div
          style={{ width: '100%', wordBreak: 'break-word', overflowX: 'auto' }}
          dangerouslySetInnerHTML={{ __html: rawHtml }}
        />
      );
    }

    return <Text style={styles.specHtmlText}>{rawHtml}</Text>;
  };

  const containerHeight = isDesktop ? 480 : 260;

  return (
    <View
      style={[
        styles.outerContainer,
        { backgroundColor: themeColor },
        isDesktop && styles.desktopFullBrowser,
        isFullScreen && styles.fullScreenContainer,
      ]}
    >
      {/* Top Header Control */}
      <View style={[styles.topHeaderControl, { backgroundColor: '#FFFFFF' }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={toggleExpand}>
          <Text style={styles.headerIconText}>{isFullScreen ? '⤓' : '⤢'}</Text>
        </TouchableOpacity>

        <View style={styles.topHeaderTitleContainer}>
          <Text style={styles.topHeaderTitleText} numberOfLines={1}>
            {getTopHeaderTitle()}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn} onPress={onClose}>
          <Text style={styles.headerIconText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}>
          {/* Top Section Card */}
          <View style={[styles.topSectionCard, { backgroundColor: '#FFFFFF' }]}>
            {isDesktop && (
              <View style={styles.desktopStatsContainer}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    Sold: {productState.data?.sold_qty ?? productState.data?.sold ?? 0}
                  </Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    Stocks: {String(unifiedStockValue)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.centerPhotoWrapper} onLayout={handlePhotoLayout}>
              {/* Full-bleed photo placeholder covering container */}
              <View
                style={[
                  styles.photoPlaceholder,
                  { height: containerHeight, backgroundColor: '#FFFFFF' }
                ]}
              >
                {loadingPhotos ? (
                  <ActivityIndicator size="small" color="#4A6984" />
                ) : photos.length > 0 ? (
                  <ScrollView
                    ref={photoScrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={[styles.carouselScrollView, { height: containerHeight }]}
                  >
                    {photos.map((photoUrl, pIdx) => (
                      <View
                        key={`product-detail-photo-${pIdx}`}
                        style={[styles.imageSlideWrapper, { width: photoBoxWidth || (isDesktop ? 480 : 300), height: containerHeight }]}
                      >
                        <Image
                          source={{ uri: photoUrl }}
                          style={[styles.productImg, { width: photoBoxWidth || (isDesktop ? 480 : 300), height: containerHeight }]}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.photoPlaceholderText}>Product Photo</Text>
                )}
              </View>

              {/* Embedded Category Badge on top left of product photos */}
              {productCategory ? (
                <View style={styles.categoryBadgeOverlay}>
                  <Text style={styles.categoryBadgeText}>{productCategory}</Text>
                </View>
              ) : null}

              {/* Top Right Actions Overlay (Love & Share) */}
              <View style={styles.photoTopOverlay}>
                <View />
                <View style={styles.actionsRight}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconQtyText}>{productState.data?.love_qty ?? 0}</Text>
                    <Text style={styles.actionIcon}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconQtyText}>{productState.data?.share_qty ?? 0}</Text>
                    <Text style={styles.actionIcon}>🔗</Text>
                  </TouchableOpacity>
                </View>
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
                    style={[
                      styles.arrowBtn,
                      activeIndex === photos.length - 1 && styles.disabledArrow,
                    ]}
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
          </View>

          {/* Fieldset Cards */}
          <View style={[styles.fieldsetCard, { backgroundColor: '#FFFFFF' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fieldsetHeader}
              onPress={() => setIsProductDetailOpen(!isProductDetailOpen)}
            >
              <Text style={styles.fieldsetLegendText}>Product Detail</Text>
              <Text style={styles.collapseArrow}>{isProductDetailOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isProductDetailOpen && (
              <View style={styles.productDetailBody}>
                {isDesktop && (
                  <TouchableOpacity
                    style={styles.desktopOrderBtn}
                    onPress={handleOrderClick}
                  >
                    <Text style={styles.orderBtnText}>Order</Text>
                  </TouchableOpacity>
                )}

                {!isDesktop && (
                  <View style={styles.mobileActionBar}>
                    <View style={styles.statBadge}>
                      <Text style={styles.statBadgeText}>
                        Sold: {productState.data?.sold_qty ?? productState.data?.sold ?? 0}
                      </Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Text style={styles.statBadgeText}>
                        Stocks: {String(unifiedStockValue)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.mobileOrderBtn}
                      onPress={handleOrderClick}
                    >
                      <Text style={styles.orderBtnText}>Order</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.contentInnerBox}>
                  {productState.loading ? (
                    <ActivityIndicator size="small" color="#4A6984" />
                  ) : productState.error ? (
                    <Text style={styles.errorText}>{productState.error}</Text>
                  ) : productState.data ? (
                    <View style={styles.productDetailContentWrapper}>
                      {renderRecordFields(productState.data, productState.columns)}

                      {loadingHtml ? (
                        <View style={styles.specLoadingContainer}>
                          <ActivityIndicator size="small" color="#4A6984" />
                          <Text style={styles.specLoadingText}>
                            Loading product specification...
                          </Text>
                        </View>
                      ) : htmlContent ? (
                        <View style={styles.specContainer}>
                          <Text
                            style={[
                              styles.fieldLabel,
                              {
                                color: '#000000',
                                fontSize: isDesktop ? 11 : 14,
                              },
                            ]}
                          >
                            Product Specification
                          </Text>
                          <View style={styles.specHtmlBox}>
                            {renderHtmlSpec(htmlContent)}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.contentText}>Product Detail</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Merchant Info Fieldset */}
          <View style={[styles.fieldsetCard, { backgroundColor: '#FFFFFF' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fieldsetHeader}
              onPress={() => setIsMerchantInfoOpen(!isMerchantInfoOpen)}
            >
              <Text style={styles.fieldsetLegendText}>Merchant Info</Text>
              <Text style={styles.collapseArrow}>{isMerchantInfoOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isMerchantInfoOpen && (
              <View style={styles.fieldsetBody}>
                <View style={styles.contentInnerBox}>
                  {merchantState.loading ? (
                    <ActivityIndicator size="small" color="#4A6984" />
                  ) : merchantState.error ? (
                    <Text style={styles.errorText}>{merchantState.error}</Text>
                  ) : merchantState.data ? (
                    renderRecordFields(merchantState.data, merchantState.columns)
                  ) : (
                    <Text style={styles.contentText}>Merchant Info</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Review Info Fieldset */}
          <View style={[styles.fieldsetCard, { backgroundColor: '#FFFFFF' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fieldsetHeader}
              onPress={() => setIsReviewInfoOpen(!isReviewInfoOpen)}
            >
              <Text style={styles.fieldsetLegendText}>Review Info</Text>
              <Text style={styles.collapseArrow}>{isReviewInfoOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isReviewInfoOpen && (
              <View style={styles.fieldsetBody}>
                <View style={styles.reviewPanelWrapper}>
                  <ReviewPanel
                    objectid={REVIEW_PANEL}
                    pid={recordid}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Recommendations Fieldset */}
          <View style={[styles.fieldsetCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.fieldsetHeader}>
              <Text style={styles.fieldsetLegendText}>Other Products Recomendation</Text>
            </View>
            <View style={styles.fieldsetBody}>
              <View style={[styles.contentInnerBox, styles.recommendationBox]}>
                <Text style={styles.contentText}>Other Products</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {showOrderStage && (
        <View style={styles.orderStageOverlay}>
          <View style={[styles.orderStageContainer, isDesktop && styles.desktopOrderStageContainer]}>
            <OrderStage
              product={productState.data || { id: recordid }}
              sessionid={sessionid}
              onClose={() => setShowOrderStage(false)}
              onSaveToChartSuccess={() => {
                setShowOrderStage(false);
                if (onClose) {
                  onClose();
                }
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  desktopFullBrowser: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 0,
  },
  fullScreenContainer: {
    width: '100%',
    height: '100%',
  },
  topHeaderControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  topHeaderTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerIconBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F8FAFC',
  },
  headerIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 16,
  },
  mainWrapper: {
    width: '100%',
    gap: 12,
  },
  desktopMainWrapper: {
    maxWidth: 1000,
    alignSelf: 'center',
  },
  topSectionCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  centerPhotoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 540,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    maxWidth: '60%',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
  },
  photoTopOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    zIndex: 20,
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
    width: '100%',
    maxWidth: '100%',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  carouselScrollView: {
    width: '100%',
  },
  imageSlideWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImg: {
    width: '100%',
  },
  photoPlaceholderText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  carouselArrowsOverlay: {
    position: 'absolute',
    top: '46%',
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 15,
  },
  arrowBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledArrow: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: -2,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  dotsText: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#000000',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  desktopStatsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  statBadge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },
  mobileActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
    width: '100%',
  },
  mobileOrderBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldsetCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 8,
    position: 'relative',
  },
  fieldsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    marginTop: -11,
    marginLeft: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    zIndex: 2,
  },
  fieldsetLegendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  collapseArrow: {
    fontSize: 9,
    marginLeft: 6,
    color: '#64748B',
  },
  productDetailBody: {
    padding: 12,
    paddingTop: 22,
    position: 'relative',
    minHeight: 110,
  },
  desktopOrderBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  orderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  fieldsetBody: {
    padding: 12,
    paddingTop: 16,
    gap: 8,
  },
  reviewPanelWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  contentInnerBox: {
    minHeight: 90,
    justifyContent: 'center',
    padding: 2,
    width: '100%',
  },
  recommendationBox: {
    minHeight: 120,
  },
  contentText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#D9534F',
    textAlign: 'center',
  },
  fieldsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldBlock: {
    gap: 2,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  fieldValueContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldValueText: {
    fontSize: 12,
    color: '#0F172A',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  productDetailContentWrapper: {
    width: '100%',
    gap: 12,
  },
  specLoadingContainer: {
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  specLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  specContainer: {
    width: '100%',
    marginTop: 10,
    gap: 3,
  },
  specHtmlBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FAFAFA',
    width: '100%',
    minHeight: 70,
    overflow: 'hidden',
  },
  specHtmlText: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
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
});

export default ProductDetail;