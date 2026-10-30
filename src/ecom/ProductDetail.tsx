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

const EXCLUDED_COLUMNS = ['id', 'pid', 'delflag', 'file'];

export const ProductDetail: React.FC<ProductDetailProps> = ({
  merchantid = '',
  objectid = '',
  recordid = '',
  sessionid = '',
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

        setProductState({
          data: record,
          columns: columnsList,
          loading: false,
          error: record ? null : 'No product details found.',
        });
      } catch (err: any) {
        console.error('[ProductDetail] Error fetching product info:', err);
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

    if (columns && columns.length > 0) {
      const filteredCols = columns.filter(
        (col) => !EXCLUDED_COLUMNS.includes(col.col_name.toLowerCase())
      );

      return (
        <View style={styles.fieldsGrid}>
          {filteredCols.map((col, idx) => {
            const fieldName = col.col_name;
            const fieldValue = data[fieldName];
            if (fieldValue === undefined || fieldValue === null) return null;

            return (
              <View key={`col-${idx}-${fieldName}`} style={[styles.fieldBlock, itemWidthStyle]}>
                <Text style={styles.fieldLabel}>{col.label || fieldName}</Text>
                <View style={styles.fieldValueContainer}>
                  <Text style={styles.fieldValueText}>
                    {formatFieldValue(fieldName, fieldValue)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    const filteredEntries = Object.entries(data).filter(
      ([key]) => !EXCLUDED_COLUMNS.includes(key.toLowerCase())
    );

    return (
      <View style={styles.fieldsGrid}>
        {filteredEntries.map(([key, val], idx) => {
          if (val === undefined || val === null) return null;
          return (
            <View key={`raw-${idx}-${key}`} style={[styles.fieldBlock, itemWidthStyle]}>
              <Text style={styles.fieldLabel}>{key}</Text>
              <View style={styles.fieldValueContainer}>
                <Text style={styles.fieldValueText}>{formatFieldValue(key, val)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
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

  return (
    <View
      style={[
        styles.outerContainer,
        isDesktop && styles.desktopFullBrowser,
        isFullScreen && styles.fullScreenContainer,
      ]}
    >
      <View style={styles.topHeaderControl}>
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
          <View style={styles.topSectionCard}>
            {isDesktop && (
              <View style={styles.desktopStatsContainer}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    Sold: {productState.data?.sold_qty ?? productState.data?.sold ?? 0}
                  </Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    Stocks: {productState.data?.stock ?? productState.data?.stocks ?? 0}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.centerPhotoWrapper}>
              <View style={styles.photoPlaceholder} onLayout={handlePhotoLayout}>
                {loadingPhotos ? (
                  <ActivityIndicator size="large" color="#4A6984" />
                ) : photos.length > 0 ? (
                  <ScrollView
                    ref={photoScrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={styles.carouselScrollView}
                  >
                    {photos.map((photoUrl, pIdx) => (
                      <View
                        key={`product-detail-photo-${pIdx}`}
                        style={[styles.imageSlideWrapper, { width: photoBoxWidth || 480 }]}
                      >
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.productImg}
                          resizeMode="contain"
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.photoPlaceholderText}>Product Photo</Text>
                )}

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
              </View>

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

          <View style={styles.fieldsetCard}>
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
                        Stocks: {productState.data?.stock ?? productState.data?.stocks ?? 0}
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
                          <Text style={styles.fieldLabel}>Product Specification</Text>
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

          <View style={styles.fieldsetCard}>
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

          <View style={styles.fieldsetCard}>
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

          <View style={styles.fieldsetCard}>
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

      {/* Cascading Closure integration for OrderStage */}
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
                  onClose(); // Closes ProductDetail upon successful chart save
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
    backgroundColor: '#FAFAFA',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  topHeaderTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerIconBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  headerIconText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  mainWrapper: {
    width: '100%',
    gap: 16,
  },
  desktopMainWrapper: {
    maxWidth: 1000,
    alignSelf: 'center',
  },
  topSectionCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  centerPhotoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
  },
  photoPlaceholder: {
    width: 480,
    height: 480,
    maxWidth: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative',
  },
  carouselScrollView: {
    width: '100%',
    height: '100%',
  },
  imageSlideWrapper: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    fontSize: 16,
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
    zIndex: 6,
  },
  arrowBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    width: 36,
    height: 36,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: -2,
  },
  paginationDots: {
    marginTop: 12,
    alignItems: 'center',
  },
  dotsText: {
    fontSize: 15,
    letterSpacing: 4,
    color: '#94A3B8',
  },
  desktopStatsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  statBadge: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  mobileActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  mobileOrderBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldsetCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    position: 'relative',
  },
  fieldsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    marginTop: -12,
    marginLeft: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    zIndex: 2,
  },
  fieldsetLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  collapseArrow: {
    fontSize: 10,
    marginLeft: 8,
    color: '#64748B',
  },
  productDetailBody: {
    padding: 16,
    paddingTop: 28,
    position: 'relative',
    minHeight: 140,
  },
  desktopOrderBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  orderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  fieldsetBody: {
    padding: 16,
    paddingTop: 20,
    gap: 10,
  },
  reviewPanelWrapper: {
    width: '100%',
  },
  contentInnerBox: {
    minHeight: 110,
    justifyContent: 'center',
    padding: 4,
    width: '100%',
  },
  recommendationBox: {
    minHeight: 150,
  },
  contentText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#D9534F',
    textAlign: 'center',
  },
  fieldsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldBlock: {
    gap: 4,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  fieldValueContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldValueText: {
    fontSize: 13,
    color: '#0F172A',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  productDetailContentWrapper: {
    width: '100%',
    gap: 16,
  },
  specLoadingContainer: {
    marginTop: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  specLoadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  specContainer: {
    width: '100%',
    marginTop: 12,
    gap: 4,
  },
  specHtmlBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#FAFAFA',
    width: '100%',
    minHeight: 80,
    overflow: 'hidden',
  },
  specHtmlText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
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