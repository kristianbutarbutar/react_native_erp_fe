import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { savePublicData, clientInfo } from './ts/public';
import { CHART_OBJECT_ID } from './../global';
import { formatIDRCurrency,CurrencySanitizer,FinancialCalculator } from './ts/public';

export interface ProductRecord {
    id?: string;
    name?: string;
    title?: string;
    price?: number | string;
    stock_qty?: number | string;
    stock?: number | string;
    [key: string]: any;
}

export interface OrderStageProps {
    product?: ProductRecord;
    sessionid?: string;
    cartOrder?: any; // <--- Cart record object containing id, pid, order_qty, total_price, etc.
    onClose?: () => void;
    onExpandToggle?: () => void;
    onSaveToChart?: (orderData: Record<string, any>) => void;
    onSaveToChartSuccess?: () => void; // Cascaded success handler
    onSaveOrder?: (orderData: Record<string, any>) => void;
}

export const OrderStage: React.FC<OrderStageProps> = ({
    product = {},
    cartOrder,
    sessionid = '',
    onClose,
    onExpandToggle,
    onSaveToChart,
    onSaveToChartSuccess,
    onSaveOrder,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // --- Check if cartOrder is valid ---
    const isEditingCart = Boolean(
        cartOrder &&
        typeof cartOrder === 'object' &&
        cartOrder.id &&
        cartOrder.pid
    );

    // --- PARSING LOGIC: Extract effectivePid and clean productName from "[product_id]product name" ---
    const rawPidString = isEditingCart ? String(cartOrder.pid || '') : '';
    
    const extractedPid = useMemo(() => {
        if (!isEditingCart) return product?.id || '';
        const bracketMatch = rawPidString.match(/^\[(.*?)\]/);
        return bracketMatch && bracketMatch[1] ? bracketMatch[1].trim() : rawPidString;
    }, [isEditingCart, rawPidString, product?.id]);

    const extractedProductName = useMemo(() => {
        if (!isEditingCart) {
            return product?.name || product?.title || product?.name_1 || '';
        }
        // Remove bracketed prefix e.g. "[PROD-01] Wireless Mouse" -> "Wireless Mouse"
        const nameMatch = rawPidString.match(/\]\s*(.*)$/);
        if (nameMatch && nameMatch[1]) {
            return nameMatch[1].trim();
        }
        return rawPidString.replace(/^\[.*?\]/, '').trim() || rawPidString;
    }, [isEditingCart, rawPidString, product]);

    const effectivePid = extractedPid;
    const effectiveProductName = extractedProductName;

    const unitPrice = useMemo(() => {
        if (isEditingCart && cartOrder.total_price && cartOrder.order_qty) {
            const parsedQty = parseInt(String(cartOrder.order_qty)) || 1;
            const parsedTotal = FinancialCalculator.divideLocalizedNumber(CurrencySanitizer.excludeIDR(formatIDRCurrency(cartOrder.total_price)),parsedQty) || 0;
            return parsedTotal;
        }
        if (!product?.price) return 0;
        const rawPrice = String(product.price);
        const numericStr = rawPrice.replace(/[^0-9.]/g, '');
        return parseFloat(numericStr) || 0;
    }, [product?.price, cartOrder, isEditingCart]);

    const maxStock = useMemo(() => {
        const stockVal = product?.stock_qty ?? product?.stock ?? 0;
        return parseInt(String(stockVal), 10) || 0;
    }, [product?.stock_qty, product?.stock]);

    // Initialize quantity from cartOrder if available, otherwise default to '1'
    const [qty, setQty] = useState<string>(() => {
        if (isEditingCart && cartOrder?.order_qty !== undefined) {
            return String(cartOrder.order_qty);
        }
        return '1';
    });

    const [qtyError, setQtyError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [addressLine1, setAddressLine1] = useState<string>(cartOrder?.deliveryAddress?.line1 || cartOrder?.addressLine1 || '');
    const [addressLine2, setAddressLine2] = useState<string>(cartOrder?.deliveryAddress?.line2 || cartOrder?.addressLine2 || '');
    const [city, setCity] = useState<string>(cartOrder?.deliveryAddress?.city || cartOrder?.city || '');
    const [postalCode, setPostalCode] = useState<string>(cartOrder?.deliveryAddress?.postalCode || cartOrder?.postalCode || '');
    const [phoneNo, setPhoneNo] = useState<string>(cartOrder?.phoneNo || '');

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
    });

    // Hydrate state when cartOrder updates asynchronously
    useEffect(() => {
        if (isEditingCart) {
            if (cartOrder.order_qty !== undefined) {
                setQty(String(cartOrder.order_qty));
            }
            if (cartOrder.phoneNo) setPhoneNo(cartOrder.phoneNo);
            if (cartOrder.city) setCity(cartOrder.city);
            if (cartOrder.postalCode) setPostalCode(cartOrder.postalCode);//formatIDRCurrency
        }
    }, [cartOrder, isEditingCart]);

    useEffect(() => {
        validateQuantity(qty);
    }, [maxStock]);

    const validateQuantity = (val: string): number => {
        const parsedQty = parseInt(val, 10);

        if (isNaN(parsedQty) || parsedQty < 1) {
            setQtyError('Min quantity is 1');
            return 1;
        } else if (maxStock > 0 && parsedQty > maxStock) {
            setQtyError(`Exceeds stock (${maxStock})`);
            return maxStock;
        } else {
            setQtyError(null);
            return parsedQty;
        }
    };

    const handleQtyChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9]/g, '');
        setQty(cleanedText);
        validateQuantity(cleanedText);
    };

    const numericQty = parseInt(qty, 10) || 0;
    const totalPrice = Number(numericQty) * Number(unitPrice);

    const formatCurrency = (val: number) => {
        return `IDR ${val.toLocaleString('id-ID')}`;
    };

    const getFormData = () => ({
        cartRecordId: isEditingCart ? cartOrder.id : undefined,
        productId: effectivePid,
        productName: effectiveProductName,
        qty: numericQty,
        unitPrice,
        totalPrice,
        deliveryAddress: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            postalCode,
        },
        phoneNo,
        sessionid,
    });

    const handleSaveToChartClick = () => {
        if (qtyError || numericQty < 1) {
            showAlert('Validation Error', 'Please specify a valid quantity.');
            return;
        }

        setAlertConfig({
            visible: true,
            title: 'Confirm Save',
            message: isEditingCart ? 'Are you sure you want to update this chart item?' : 'Are you sure you want to add this item to your chart?',
            showCancel: true,
            onConfirm: executeSaveToChart,
        });
    };

    const executeSaveToChart = async () => {
        setLoading(true);
        try {
            // Include record id if updating an existing cart item
            const screenAttributes: Array<{ col_name: string; value: any }> = [
                { col_name: 'order_qty', value: qty },
                { col_name: 'pid', value: effectivePid },
                { col_name: 'total_price', value: totalPrice },
                { col_name: 'createdby', value: clientInfo() },
            ];

            if (isEditingCart && cartOrder?.id) {
                screenAttributes.push({ col_name: 'id', value: cartOrder.id });
            }

            const __response = await savePublicData({
                objectid: CHART_OBJECT_ID,
                screenAttributes,
            });

            const isSuccess =
                __response &&
                (__response.success === 'true' || __response.success === true);

            if (isSuccess) {
                if (onSaveToChart) {
                    onSaveToChart(getFormData());
                }

                const successMsg = isEditingCart ? 'Cart item updated successfully.' : 'Product has been add to chart.';
                showAlert('Success', successMsg, () => {
                    if (onSaveToChartSuccess) {
                        onSaveToChartSuccess(); // Trigger parent cascading close & refresh
                    }
                    if (onClose) {
                        onClose();
                    }
                });
            } else {
                showAlert(
                    'Error',
                    __response?.message || 'Failed to save item to chart.'
                );
            }
        } catch (error: any) {
            console.error('[OrderStage] Error saving to chart:', error);
            showAlert('Error', error?.message || 'Failed to save item to chart.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOrderClick = () => {
        if (qtyError || numericQty < 1) {
            showAlert('Validation Error', 'Please specify a valid quantity.');
            return;
        }
        if (!addressLine1.trim() || !city.trim() || !phoneNo.trim()) {
            showAlert('Required Fields', 'Please fill in Delivery Address (Line 1, City) and Phone No.');
            return;
        }
        const data = getFormData();
        if (onSaveOrder) {
            onSaveOrder(data);
        } else {
            showAlert('Success', 'Order created successfully!');
        }
    };

    const showAlert = (title: string, message: string, onConfirmAction?: () => void) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            showCancel: false,
            onConfirm: onConfirmAction,
        });
    };

    const closeAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const formFieldsContent = (
        <View style={[styles.formGroup, isDesktop && styles.desktopFormGroup]}>
            <View style={styles.fieldBlock}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                    style={[styles.input, styles.readOnlyInput]}
                    value={effectiveProductName}
                    editable={false}
                    placeholder="Product Name"
                />
            </View>

            <View style={[styles.rowGrid, !isDesktop && styles.mobileRowGrid]}>
                <View style={[styles.fieldBlock, { flex: isDesktop ? 1 : undefined, width: isDesktop ? undefined : '100%' }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput
                        style={[styles.input, qtyError ? styles.inputError : null]}
                        value={qty}
                        onChangeText={handleQtyChange}
                        keyboardType="numeric"
                        placeholder="1"
                    />
                    {qtyError && <Text style={styles.errorText}>{qtyError}</Text>}
                </View>

                <View style={[styles.fieldBlock, { flex: isDesktop ? 2.5 : undefined, width: isDesktop ? undefined : '100%' }]}>
                    <Text style={styles.label}>Price</Text>
                    <TextInput
                        style={[styles.input, styles.readOnlyInput]}
                        value={formatCurrency(Number(unitPrice))}
                        editable={false}
                    />
                </View>
            </View>

            <View style={styles.fieldBlock}>
                <Text style={styles.label}>Total Price</Text>
                <View style={isDesktop ? styles.totalPriceWrapperDesktop : styles.totalPriceWrapperMobile}>
                    <TextInput
                        style={[styles.input, styles.totalPriceInput]}
                        value={(formatCurrency(totalPrice))}
                        editable={false}
                    />
                </View>
            </View>

            <View style={styles.fieldBlock}>
                <Text style={styles.label}>Delivery Address</Text>
                <View style={[styles.addressStack, isDesktop && styles.desktopAddressGrid]}>
                    <TextInput
                        style={[styles.input, isDesktop && styles.halfWidthInput]}
                        value={addressLine1}
                        onChangeText={setAddressLine1}
                        placeholder="Line 1"
                    />
                    <TextInput
                        style={[styles.input, isDesktop && styles.halfWidthInput]}
                        value={addressLine2}
                        onChangeText={setAddressLine2}
                        placeholder="Line 2"
                    />
                    <TextInput
                        style={[styles.input, isDesktop && styles.halfWidthInput]}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                    />
                    <TextInput
                        style={[styles.input, isDesktop && styles.halfWidthInput]}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        placeholder="Postal Code"
                    />
                </View>
            </View>

            <View style={styles.fieldBlock}>
                <Text style={styles.label}>Phone No</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNo}
                    onChangeText={setPhoneNo}
                    placeholder="Phone No"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={[styles.buttonRow, !isDesktop && styles.mobileButtonRow]}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn, !isDesktop && styles.mobileFullBtn]}
                    onPress={handleSaveToChartClick}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#1E293B" />
                    ) : (
                        <Text style={styles.secondaryBtnText}>
                            {isEditingCart ? 'Update Chart' : 'Save to Chart'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn, !isDesktop && styles.mobileFullBtn]}
                    onPress={handleSaveOrderClick}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    <Text style={styles.primaryBtnText}>Pay</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.cardContainer}>
            <View style={styles.topControlBar}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={onExpandToggle}
                    activeOpacity={0.7}
                >
                    <Text style={styles.iconBtnText}>⤢</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <Text style={styles.iconBtnText}>✕</Text>
                </TouchableOpacity>
            </View>

            {isDesktop ? (
                <View style={styles.desktopContainer}>
                    {formFieldsContent}
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollBody}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {formFieldsContent}
                </ScrollView>
            )}

            {alertConfig.visible && (
                <View style={styles.topModalOverlay}>
                    <View style={styles.modalAlertBox}>
                        <Text style={styles.modalTitle}>{alertConfig.title}</Text>
                        <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                        <View style={styles.modalButtonRow}>
                            {alertConfig.showCancel && (
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalCancelBtn]}
                                    onPress={closeAlert}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalConfirmBtn]}
                                onPress={() => {
                                    const confirmCb = alertConfig.onConfirm;
                                    closeAlert();
                                    if (confirmCb) {
                                        confirmCb();
                                    }
                                }}
                            >
                                <Text style={styles.modalConfirmText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    },
    topControlBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconBtn: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F8FAFC',
    },
    iconBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    desktopContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    scrollBody: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 28,
    },
    formGroup: {
        width: '100%',
        gap: 12,
    },
    desktopFormGroup: {
        flex: 1,
        justifyContent: 'space-between',
        gap: 0,
    },
    fieldBlock: {
        gap: 4,
        width: '100%',
    },
    rowGrid: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    mobileRowGrid: {
        flexDirection: 'column',
        gap: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 13,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        minHeight: 36,
    },
    readOnlyInput: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        color: '#475569',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: 11,
        color: '#EF4444',
        marginTop: 2,
    },
    totalPriceWrapperDesktop: {
        width: '50%',
    },
    totalPriceWrapperMobile: {
        width: '100%',
    },
    totalPriceInput: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        fontWeight: '700',
        color: '#0F172A',
    },
    addressStack: {
        gap: 8,
    },
    desktopAddressGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    halfWidthInput: {
        width: '48.5%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
        paddingTop: 4,
    },
    mobileButtonRow: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        marginTop: 16,
    },
    actionBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 8,
        minWidth: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mobileFullBtn: {
        width: '100%',
    },
    secondaryBtn: {
        borderColor: '#334155',
        backgroundColor: '#FFFFFF',
    },
    secondaryBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    primaryBtn: {
        borderColor: '#1E293B',
        backgroundColor: '#1E293B',
    },
    primaryBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    topModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 99999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalAlertBox: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 13,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelBtn: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    modalCancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    modalConfirmBtn: {
        backgroundColor: '#1E293B',
    },
    modalConfirmText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default OrderStage;