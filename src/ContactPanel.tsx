// customer/ContactPanel.tsx

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Linking,
    useWindowDimensions,
} from 'react-native';

interface ContactPanelProps {
    email?: string;
    phone?: string;
    address?: string;
    onClose?: () => void;
}

export default function ContactPanel({
    email = 'kristian.butarbutar@gmail.com',
    phone = '+62 811-8801-XXXX',
    address = 'Jakarta, Indonesia, 13910',
    onClose,
}: ContactPanelProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [isMaximized, setIsMaximized] = useState<boolean>(false);

    const handleEmailPress = () => {
        Linking.openURL(`mailto:${email}`);
    };

    const handleWhatsAppPress = () => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        Linking.openURL(`https://wa.me/${cleanPhone}`);
    };

    return (
        <View style={styles.outerContainer}>
            <View
                style={[
                    styles.card,
                    isMobile ? styles.mobileCard : isMaximized ? styles.maximizedCard : styles.desktopCard,
                ]}
            >
                {/* Top Control Bar: Outward Expand/Maximize Icon on Left, Close (X) on Right */}
                <View style={styles.topControlBar}>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setIsMaximized(!isMaximized)}
                        activeOpacity={0.7}
                        accessibilityLabel={isMaximized ? "Restore Window" : "Maximize Window"}
                    >
                        <Text style={styles.headerIconSymbol}>{isMaximized ? '⤡' : '⤢'}</Text>
                    </TouchableOpacity>

                    {onClose && (
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                            accessibilityLabel="Close Panel"
                        >
                            <Text style={styles.headerIconSymbol}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Header Section */}
                    <Text style={styles.title}>Get in Touch</Text>
                    <Text style={styles.subtitle}>
                        Feel free to get in touch through any of the channels below. I am usually responsive within 24 hours.
                    </Text>

                    {/* Contact Channels List */}
                    <View style={styles.listContainer}>
                        
                        {/* Email Row */}
                        <TouchableOpacity style={styles.rowItem} onPress={handleEmailPress} activeOpacity={0.7}>
                            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={styles.iconSymbol}>✉️</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.label}>EMAIL ME</Text>
                                <Text style={styles.value}>{email}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* WhatsApp Row */}
                        <TouchableOpacity style={styles.rowItem} onPress={handleWhatsAppPress} activeOpacity={0.7}>
                            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={styles.iconSymbol}>💬</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.label}>WHATSAPP</Text>
                                <Text style={styles.value}>{phone}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Address Row */}
                        <View style={styles.rowItem}>
                            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={styles.iconSymbol}>📍</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.label}>MAILING ADDRESS</Text>
                                <Text style={styles.value}>{address}</Text>
                            </View>
                        </View>

                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Footer / Connect Directly Actions */}
                    <View style={styles.footerSection}>
                        <Text style={styles.footerTitle}>CONNECT DIRECTLY</Text>
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.actionButtonDark} onPress={handleEmailPress} activeOpacity={0.8}>
                                <Text style={styles.actionButtonIcon}>✉️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButtonDark} onPress={handleWhatsAppPress} activeOpacity={0.8}>
                                <Text style={styles.actionButtonIcon}>💬</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        overflow: 'hidden',
    },
    desktopCard: {
        width: '100%',
        maxWidth: 540,
        maxHeight: '82%',
    },
    maximizedCard: {
        width: '92%',
        height: '90%',
        maxWidth: 960,
    },
    mobileCard: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        borderWidth: 0,
    },
    topControlBar: {
        height: 44,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerIconButton: {
        width: 32,
        height: 32,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    headerIconSymbol: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 28,
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 6,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 20,
        fontFamily: 'System',
    },
    listContainer: {
        marginBottom: 16,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    iconSymbol: {
        fontSize: 18,
    },
    textGroup: {
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 2,
        fontFamily: 'System',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        fontFamily: 'System',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 14,
    },
    footerSection: {
        marginTop: 2,
    },
    footerTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 10,
        fontFamily: 'System',
    },
    actionButtonsRow: {
        flexDirection: 'row',
    },
    actionButtonDark: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    actionButtonIcon: {
        fontSize: 16,
    },
});