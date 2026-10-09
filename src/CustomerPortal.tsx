import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { loadMenu } from './ts/CustomerPortal'; // Import the loadMenu function and types

interface CustomerPortalProps {
    objectid?: string;
    recordid?: string;
    domain?: string;
    subdomain?: string;
    sessionid?: string;
    domainFunc: (dm: string) => void;
}

type ThemeMode = 'goldenYellow' | 'comfortDark' | 'whiteBlue';

interface ThemeConfig {
    name: ThemeMode;
    topBoxesBg: string;
    textColor: string;
    accentColor: string;
}

const themes: Record<ThemeMode, ThemeConfig> = {
    goldenYellow: {
        name: 'goldenYellow',
        topBoxesBg: '#FFF8E7', // Soft warm golden cream
        textColor: '#5D4037',
        accentColor: '#D9A74A',
    },
    comfortDark: {
        name: 'comfortDark',
        topBoxesBg: '#363434', // Updated black theme hex #363434
        textColor: '#FFFFFF',  // Pure white text for dark theme
        accentColor: '#3B82F6',
    },
    whiteBlue: {
        name: 'whiteBlue',
        topBoxesBg: '#F0F4F8', // Soft white-blue degradation
        textColor: '#334155',
        accentColor: '#0284C7',
    },
};

// 4-dimension box rotating faces sequence
const dimensionFaces = ['AM', 'GR', 'EA', 'AT'];

export default function CustomerPortal({
    objectid,
    recordid,
    domain = 'example.com',
    subdomain = 'portal',
    sessionid,
    domainFunc,
}: CustomerPortalProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    // State
    const [currentTheme, setCurrentTheme] = useState<ThemeMode>('whiteBlue');
    const [isLeftMenuCollapsed, setIsLeftMenuCollapsed] = useState<boolean>(false);
    const [isMobileTopMenuOpen, setIsMobileTopMenuOpen] = useState<boolean>(false);
    const [isMobileLeftMenuOpen, setIsMobileLeftMenuOpen] = useState<boolean>(false);
    const [faceIndex, setFaceIndex] = useState<number>(0);

    // Top 3 Menu Data State
    const [top3MenuItems, setTop3MenuItems] = useState<any[]>([]);
    const [loadingTop3, setLoadingTop3] = useState<boolean>(false);

    // Animation values for rotating box effect
    const [translateAnim] = useState(new Animated.Value(0));
    const [opacityAnim] = useState(new Animated.Value(1));

    const theme = themes[currentTheme];

    // Onload handler to fetch Top 3 menu items via loadMenu
    const handleLoadTop3Menu = async () => {
        try {
            setLoadingTop3(true);
            const params = {
                objectid: '052adcee-50c0-4602-9fb7-43d080eae050',
                domain: 'header3', sessionid:"sessionid"
            };

            const response = await loadMenu(params );
            
            // Assuming response is an array or contains an array of items with a 'label' property
            if (Array.isArray(response)) {
                setTop3MenuItems(response);
            } else if (response && Array.isArray(response.data)) {
                setTop3MenuItems(response.data);
            } else if (response && Array.isArray(response.result)) {
                setTop3MenuItems(response.result);
            } else {
                setTop3MenuItems([]);
            }
        } catch (error) {
            console.error('Failed to load Top 3 menu:', error);
            setTop3MenuItems([]);
        } finally {
            setLoadingTop3(false);
        }
    };

    // Trigger onload handler on mount
    useEffect(() => {
        handleLoadTop3Menu();
    }, []);

    // 4-dimension box rotation interval effect
    useEffect(() => {
        const interval = setInterval(() => {
            Animated.parallel([
                Animated.timing(translateAnim, {
                    toValue: -12,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setFaceIndex((prev) => (prev + 1) % dimensionFaces.length);
                translateAnim.setValue(12);

                Animated.parallel([
                    Animated.timing(translateAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [translateAnim, opacityAnim]);

    // Handler for top menu item clicks
    const handleMenuPress = (id: string) => {
        if (id === 'management') {
            domainFunc('management');
        }
        setIsMobileTopMenuOpen(false);
    };

    // Top Left Menu Hook items
    const topLeftMenu = [
        { id: 'flag', type: 'image', label: 'ID', uri: 'https://flagcdn.com/w20/id.png' },
        { id: 'management', type: 'text', icon: '⚙️', label: 'Management' },
        { id: 'call', type: 'text', icon: '📞', label: 'Call' },
        { id: 'chat', type: 'text', icon: '💬', label: 'Chat' },
        { id: 'me', type: 'text', icon: '👤', label: 'Me' },
        { id: 'login', type: 'text', icon: '🔑', label: 'Login' },
    ];

    const navigationLinks = ['Dashboard', 'Profile', 'Settings', 'Reports', 'Support'];
    const currentCode = dimensionFaces[faceIndex];

    return (
        <View style={[styles.container, { backgroundColor: theme.topBoxesBg }]}>

            {/* ================= TOP 1 BOX ================= */}
            <View style={[styles.topBox1, { backgroundColor: theme.topBoxesBg }]}>
                <View style={styles.top1Left}>
                    {!isMobile && (
                        <>
                            <Text style={[styles.font11, { color: theme.textColor, marginRight: 6 }]}></Text>
                            <TouchableOpacity
                                style={[styles.circle, { backgroundColor: '#FFF8E7', borderWidth: currentTheme === 'goldenYellow' ? 2 : 1, borderColor: '#D9A74A' }]}
                                onPress={() => setCurrentTheme('goldenYellow')}
                            />
                            <TouchableOpacity
                                style={[styles.circle, { backgroundColor: '#363434', borderWidth: currentTheme === 'comfortDark' ? 2 : 1, borderColor: '#3B82F6' }]}
                                onPress={() => setCurrentTheme('comfortDark')}
                            />
                            <TouchableOpacity
                                style={[styles.circle, { backgroundColor: '#F0F4F8', borderWidth: currentTheme === 'whiteBlue' ? 2 : 1, borderColor: '#0284C7' }]}
                                onPress={() => setCurrentTheme('whiteBlue')}
                            />
                        </>
                    )}

                    {/* 4-Dimension Rotating Box Carousel */}
                    <View style={styles.dimensionWrapper}>
                        <Animated.View
                            style={[
                                styles.rotatingBox,
                                {
                                    backgroundColor: theme.accentColor,
                                    opacity: opacityAnim,
                                    transform: [{ translateY: translateAnim }]
                                }
                            ]}
                        >
                            <Text style={[styles.font11, styles.rotatingBoxText]}>
                                {currentCode}
                            </Text>
                        </Animated.View>
                        <Text style={[styles.font11, { color: theme.textColor, marginLeft: 6, fontWeight: '600' }]} numberOfLines={1}>
                        </Text>
                    </View>
                </View>

                {isMobile ? (
                    <TouchableOpacity
                        style={styles.hamburgerButton}
                        onPress={() => setIsMobileTopMenuOpen(!isMobileTopMenuOpen)}
                    >
                        <Text style={[styles.font11, { color: theme.textColor, fontWeight: 'bold' }]}>
                            {isMobileTopMenuOpen ? '✕ Menu' : '☰ Menu'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.top1Right}>
                        {topLeftMenu.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItemInline}
                                onPress={() => handleMenuPress(item.id)}
                            >
                                {item.type === 'image' ? (
                                    <Image source={{ uri: item.uri }} style={styles.flagIcon} />
                                ) : (
                                    <Text style={[styles.font11, { color: theme.textColor }]}>
                                        {item.icon} {item.label}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Mobile Dropdown Menu for Top 1 Box */}
            {isMobile && isMobileTopMenuOpen && (
                <View style={[styles.mobileDropdown, { backgroundColor: theme.topBoxesBg }]}>
                    {topLeftMenu.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.mobileMenuItem}
                            onPress={() => handleMenuPress(item.id)}
                        >
                            {item.type === 'image' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={{ uri: item.uri }} style={styles.flagIcon} />
                                    <Text style={[styles.font11, { color: theme.textColor, marginLeft: 6 }]}>Indonesia (ID)</Text>
                                </View>
                            ) : (
                                <Text style={[styles.font11, { color: theme.textColor }]}>
                                    {item.icon} {item.label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ================= TOP 2 BOX ================= */}
            <View style={[styles.topBox2, { backgroundColor: theme.topBoxesBg }]}>
                <Text style={[styles.font11, { color: theme.textColor, textAlign: 'center' }]} numberOfLines={1}>
                    Top 2 Box — Navigation & Breadcrumbs
                </Text>
            </View>

            {/* ================= TOP 3 BOX (Displays loaded menu labels) ================= */}
            <View style={[styles.topBox3, { backgroundColor: theme.topBoxesBg }]}>
                {isMobile ? (
                    <View style={styles.top3MobileLeftContainer}>
                        <TouchableOpacity
                            style={styles.leftMenuHamburger}
                            onPress={() => setIsMobileLeftMenuOpen(!isMobileLeftMenuOpen)}
                        >
                            <Text style={[styles.font11, { color: theme.accentColor, fontWeight: 'bold' }]}>
                                {isMobileLeftMenuOpen ? '✕ Nav' : '☰ Nav'}
                            </Text>
                        </TouchableOpacity>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.top3MenuScroll}>
                            {loadingTop3 ? (
                                <Text style={[styles.font11, { color: theme.textColor }]}>Loading...</Text>
                            ) : top3MenuItems.length > 0 ? (
                                top3MenuItems.map((item, index) => (
                                    <TouchableOpacity key={index} style={styles.top3MenuItem}>
                                        <Text style={[styles.font11, { color: theme.textColor }]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.font11, { color: theme.textColor }]}>Top 3 Box — Status & Notifications</Text>
                            )}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={styles.topLeftBoxHeader}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.top3MenuScrollCenter}>
                            {loadingTop3 ? (
                                <Text style={[styles.font11, { color: theme.textColor }]}>Loading menu...</Text>
                            ) : top3MenuItems.length > 0 ? (
                                top3MenuItems.map((item, index) => (
                                    <TouchableOpacity key={index} style={styles.top3MenuItem}>
                                        <Text style={[styles.font11, { color: theme.textColor, fontWeight: '500' }]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.font11, { color: theme.textColor }]}>Top 3 Box — Status & Notifications</Text>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Mobile Left Menu Dropdown */}
            {isMobile && isMobileLeftMenuOpen && (
                <View style={[styles.mobileLeftDropdown, { backgroundColor: theme.topBoxesBg }]}>
                    <Text style={[styles.font11, styles.menuHeader, { color: theme.accentColor }]}>Navigation</Text>
                    {navigationLinks.map((link, idx) => (
                        <TouchableOpacity key={idx} style={styles.mobileMenuItem} onPress={() => setIsMobileLeftMenuOpen(false)}>
                            <Text style={[styles.font11, { color: theme.textColor }]}>{link}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ================= MAIN CONTAINER WITH COLLAPSE ICON ================= */}
            <View style={styles.mainWrapper}>
                {!isMobile && (
                    <TouchableOpacity
                        style={[
                            styles.collapseIconContainer,
                            {
                                backgroundColor: theme.topBoxesBg,
                                left: isLeftMenuCollapsed ? 0 : 172
                            }
                        ]}
                        onPress={() => setIsLeftMenuCollapsed(!isLeftMenuCollapsed)}
                    >
                        <Text style={[styles.font11, { color: theme.accentColor, fontWeight: 'bold', textAlign: 'center' }]}>
                            {isLeftMenuCollapsed ? '▶' : '◀'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* ================= MIDDLE SECTION (Left Menu + Content) ================= */}
                <View style={styles.middleSection}>
                    {!isMobile && !isLeftMenuCollapsed && (
                        <View style={[styles.leftMenuBox, { backgroundColor: theme.topBoxesBg, width: 180 }]}>
                            <ScrollView contentContainerStyle={styles.menuScroll}>
                                <Text style={[styles.font11, styles.menuHeader, { color: theme.accentColor }]}>Navigation</Text>
                                {navigationLinks.map((link, idx) => (
                                    <TouchableOpacity key={idx} style={styles.menuLink}>
                                        <Text style={[styles.font11, { color: theme.textColor }]}>{link}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Content Box */}
                    <View style={[styles.contentBox, { backgroundColor: '#FFFFFF' }]}>
                        <ScrollView contentContainerStyle={styles.contentScroll}>
                            <Text style={[styles.font11, { color: '#1E293B', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }]}>
                                Content Box Workspace
                            </Text>
                            <Text style={[styles.font11, { color: '#475569', lineHeight: 16 }]}>
                                Welcome to the Customer Portal for {subdomain}.{domain}. Top 3 menu loaded successfully with object ID 052adcee-50c0-4602-9fb7-43d080eae050 and domain header3.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </View>

            {/* ================= BOTTOM MENU BOX ================= */}
            <View style={[styles.bottomMenuBox, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.font11, { color: '#334155', textAlign: 'center' }]} numberOfLines={1}>
                    Bottom Menu Box — Quick Links | Privacy | Terms
                </Text>
            </View>

            {/* ================= BOTTOM BOX ================= */}
            <View style={[styles.bottomBox, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.font11, { color: '#334155', textAlign: 'center' }]} numberOfLines={1}>
                    © 2026 {domain}. All rights reserved.
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderWidth: 0,
    },
    font11: {
        fontSize: 11,
        fontFamily: 'System',
    },
    topBox1: {
        height: 36,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        borderWidth: 0,
        borderBottomWidth: 0,
    },
    top1Left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        overflow: 'hidden',
    },
    top1Right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginHorizontal: 2,
        borderWidth: 0,
    },
    dimensionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 6,
        flex: 1,
        overflow: 'hidden',
    },
    rotatingBox: {
        width: 24,
        height: 18,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    rotatingBoxText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
        textAlign: 'center',
    },
    menuItemInline: {
        marginLeft: 10,
        height: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flagIcon: {
        width: 16,
        height: 11,
        resizeMode: 'contain',
    },
    hamburgerButton: {
        padding: 4,
    },
    mobileDropdown: {
        width: '100%',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 0,
    },
    mobileLeftDropdown: {
        width: '100%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 0,
    },
    mobileMenuItem: {
        paddingVertical: 4,
    },
    topBox2: {
        height: 30,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
        borderBottomWidth: 0,
    },
    topBox3: {
        height: 28,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
        borderBottomWidth: 0,
    },
    top3MobileLeftContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftMenuHamburger: {
        marginRight: 8,
        padding: 2,
    },
    topLeftBoxHeader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    top3MenuScroll: {
        alignItems: 'center',
    },
    top3MenuScrollCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    top3MenuItem: {
        marginHorizontal: 8,
        paddingVertical: 2,
    },
    mainWrapper: {
        flex: 1,
        width: '100%',
        position: 'relative',
        borderWidth: 0,
    },
    collapseIconContainer: {
        position: 'absolute',
        top: 10,
        width: 20,
        height: 20,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        elevation: 4,
        borderWidth: 0,
    },
    middleSection: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        borderWidth: 0,
    },
    leftMenuBox: {
        paddingVertical: 8,
        borderWidth: 0,
        borderRightWidth: 0,
    },
    menuScroll: {
        paddingHorizontal: 8,
    },
    menuHeader: {
        fontWeight: 'bold',
        marginBottom: 6,
    },
    menuLink: {
        paddingVertical: 6,
    },
    contentBox: {
        flex: 1,
        width: '100%',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderLeftWidth: 0,
    },
    contentScroll: {
        flexGrow: 1,
    },
    bottomMenuBox: {
        height: 28,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderTopWidth: 0,
    },
    bottomBox: {
        height: 28,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderTopWidth: 0,
    },
});