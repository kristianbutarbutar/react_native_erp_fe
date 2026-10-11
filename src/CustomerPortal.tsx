// customer/CustomerPortal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    useWindowDimensions,
    Animated,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { loadMenu, showHtml } from './ts/CustomerPortal';

interface CustomerPortalProps {
    objectid?: string;
    recordid?: string;
    domain?: string;
    subdomain?: string;
    sessionid?: string;
    domainFunc: (dm: string) => void;
}

export interface LoadMenuParams {
    objectid: string;
    whereClause: Array<{ col_name: string; value: string }>;
    filterColumns: Array<string>;
    sessionid: string;
}

type ThemeMode = 'goldenYellow' | 'comfortDark' | 'whiteBlue';

interface ThemeConfig {
    name: ThemeMode;
    topBoxesBg: string;
    textColor: string;
    accentColor: string;
    cardBg: string;
}

const themes: Record<ThemeMode, ThemeConfig> = {
    goldenYellow: {
        name: 'goldenYellow',
        topBoxesBg: '#FFFFFF',
        textColor: '#5D4037',
        accentColor: '#ffb3b3',
        cardBg: '#FFFFFF',
    },
    comfortDark: {
        name: 'comfortDark',
        topBoxesBg: '#FFFFFF',
        textColor: '#1E293B',
        accentColor: '#3B82F6',
        cardBg: '#FFFFFF',
    },
    whiteBlue: {
        name: 'whiteBlue',
        topBoxesBg: '#FFFFFF',
        textColor: '#0F172A',
        accentColor: '#E11D48',
        cardBg: '#FFFFFF',
    },
};

const dimensionFaces = ['AM', 'GR', 'EA', 'AT'];

export default function CustomerPortal({
    objectid,
    recordid,
    domain = 'amgreat.id',
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

    // Top 3 Menu Data State & Selection
    const [top3MenuItems, setTop3MenuItems] = useState<any[]>([]);
    const [loadingTop3, setLoadingTop3] = useState<boolean>(false);
    const [selectedTop3Id, setSelectedTop3Id] = useState<string | null>(null);

    // Left Menu Data State & Selection
    const [leftMenuItems, setLeftMenuItems] = useState<any[]>([]);
    const [loadingLeftMenu, setLoadingLeftMenu] = useState<boolean>(false);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

    // HTML Content State via showHtml
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState<boolean>(false);

    // Scroll visibility state for Top boxes
    const [showTopBoxes, setShowTopBoxes] = useState<boolean>(true);
    const lastScrollY = useRef<number>(0);

    // Animation values for rotating box effect
    const [translateAnim] = useState(new Animated.Value(0));
    const [opacityAnim] = useState(new Animated.Value(1));

    const theme = themes[currentTheme];

    // Onload handler to fetch Top 3 menu items and set default 1st record HTML & Left Menu
    const handleLoadTop3Menu = async () => {
        try {
            setLoadingTop3(true);
            const params: LoadMenuParams = {
                objectid: '052adcee-50c0-4602-9fb7-43d080eae050',
                whereClause: [{ col_name: 'pid', value: '507e1f77-f2c2-4a72-887c-780e0d6cccc3' }],
                filterColumns: [],
                sessionid: sessionid || '',
            };

            const response = await loadMenu(params);

            let menus: any[] = [];
            if (Array.isArray(response)) {
                menus = response;
            } else if (response && Array.isArray(response.data)) {
                menus = response.data;
            } else if (response && Array.isArray(response.result)) {
                menus = response.result;
            }

            setTop3MenuItems(menus);

            // If menus are not empty, load default 1st record content and left menu
            if (menus.length > 0 && !recordid) {
                const firstRecord = menus[0];
                const menuId = firstRecord.id || firstRecord.objectid || firstRecord.value || firstRecord.pid;
                setSelectedTop3Id(menuId);

                // 1. Fetch Left Menu for 1st record
                setLoadingLeftMenu(true);
                const leftParams: LoadMenuParams = {
                    objectid: '052adcee-50c0-4602-9fb7-43d080eae050',
                    whereClause: [{ col_name: 'pid', value: menuId }],
                    filterColumns: [],
                    sessionid: sessionid || '',
                };

                const leftResponse = await loadMenu(leftParams);
                let leftMenus: any[] = [];
                if (Array.isArray(leftResponse)) {
                    leftMenus = leftResponse;
                } else if (leftResponse && Array.isArray(leftResponse.data)) {
                    leftMenus = leftResponse.data;
                } else if (leftResponse && Array.isArray(leftResponse.result)) {
                    leftMenus = leftResponse.result;
                }
                setLeftMenuItems(leftMenus);
                setLoadingLeftMenu(false);

                // 2. Fetch default HTML stream via showHtml for 1st record
                setLoadingContent(true);
                const stream = await showHtml({
                    record: firstRecord,
                    sessionId: sessionid || '',
                });

                if (stream) {
                    setHtmlContent(stream);
                }
                setLoadingContent(false);
            }
        } catch (error) {
            console.error('Failed to load Top 3 menu:', error);
            setTop3MenuItems([]);
        } finally {
            setLoadingTop3(false);
            setLoadingLeftMenu(false);
        }
    };

    // Handler when a Top 3 menu item is clicked
    const handleTop3MenuPress = async (item: any) => {
        try {
            const menuId = item.id || item.objectid || item.value || item.pid;
            setSelectedTop3Id(menuId);
            setSelectedLeftId(null);
            setLoadingLeftMenu(true);

            const params: LoadMenuParams = {
                objectid: '052adcee-50c0-4602-9fb7-43d080eae050',
                whereClause: [{ col_name: 'pid', value: menuId }],
                filterColumns: [],
                sessionid: sessionid || '',
            };

            const response = await loadMenu(params);

            let leftMenus: any[] = [];
            if (Array.isArray(response)) {
                leftMenus = response;
            } else if (response && Array.isArray(response.data)) {
                leftMenus = response.data;
            } else if (response && Array.isArray(response.result)) {
                leftMenus = response.result;
            }
            setLeftMenuItems(leftMenus);
            setLoadingLeftMenu(false);

            const targetPid = item.pid || item.id || item.objectid;
            if (targetPid && String(targetPid).trim() !== '') {
                setLoadingContent(true);
                const stream = await showHtml({
                    record: item,
                    sessionId: sessionid || '',
                });

                if (stream) {
                    setHtmlContent(stream);
                } else {
                    setHtmlContent(null);
                }
                setLoadingContent(false);
            }
        } catch (error) {
            console.error('Failed in handleTop3MenuPress:', error);
            setLeftMenuItems([]);
        } finally {
            setLoadingLeftMenu(false);
            setLoadingContent(false);
        }
    };

    // Handler when a left menu link / item is clicked
    const handleLeftMenuPress = async (linkItem: any, index: number) => {
        try {
            const linkId = linkItem.id || linkItem.pid || linkItem.objectid || `left-item-${index}`;
            setSelectedLeftId(linkId);
            setLoadingContent(true);
            const hasHtmlFile = linkItem.html_file || linkItem.record?.html_file;

            if (hasHtmlFile && String(hasHtmlFile).trim() !== '') {
                const stream = await showHtml({
                    record: linkItem,
                    sessionId: sessionid || '',
                });

                if (stream) {
                    setHtmlContent(stream);
                } else {
                    setHtmlContent(null);
                }
            } else {
                const stream = await showHtml({
                    record: { pid: linkItem.pid || linkItem.id || linkItem.objectid },
                    sessionId: sessionid || '',
                });

                if (stream) {
                    setHtmlContent(stream);
                } else {
                    setHtmlContent(null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch HTML content stream:', error);
            setHtmlContent(null);
        } finally {
            setLoadingContent(false);
        }
    };

    // Scroll handler to detect scroll direction
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (diff > 5 && currentScrollY > 20) {
            // Scrolling down -> hide top boxes
            setShowTopBoxes(false);
            setIsMobileTopMenuOpen(false);
            setIsMobileLeftMenuOpen(false);
        } else if (diff < -5 || currentScrollY <= 10) {
            // Scrolling up -> show top boxes
            setShowTopBoxes(true);
        }
        lastScrollY.current = currentScrollY;
    };

    // Trigger onload handler on mount & fetch initial content if recordid is present
    useEffect(() => {
        handleLoadTop3Menu();
        if (recordid) {
            setSelectedLeftId(recordid);
            showHtml({ record: { pid: recordid }, sessionId: sessionid })
                .then((stream) => {
                    if (stream) setHtmlContent(stream);
                })
                .catch((err) => console.error('Initial HTML load error:', err));
        }
    }, [recordid]);

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

    const handleMenuPress = (id: string) => {
        if (id === 'management') {
            domainFunc('management');
        }
        setIsMobileTopMenuOpen(false);
    };

    const topLeftMenu = [
        { id: 'flag', type: 'image', label: 'ID', uri: 'https://flagcdn.com/w20/id.png' },
        { id: 'management', type: 'text', icon: '⚙️', label: 'Management' },
        { id: 'call', type: 'text', icon: '📞', label: 'Call' },
        { id: 'chat', type: 'text', icon: '💬', label: 'Chat' },
        { id: 'me', type: 'text', icon: '👤', label: 'Me' },
        { id: 'login', type: 'text', icon: '🔑', label: 'Login' },
    ];

    const currentCode = dimensionFaces[faceIndex];

    return (
        <View style={[styles.container, { backgroundColor: theme.topBoxesBg }]}>

            {/* ================= TOP 1 BAR (Header & Brand) ================= */}
            {showTopBoxes && (
                <View style={[styles.topBox1, { backgroundColor: theme.cardBg }]}>
                    <View style={styles.top1Left}>
                        {!isMobile && (
                            <View style={styles.themeSelectorContainer}>
                                <TouchableOpacity
                                    style={[styles.circle, { backgroundColor: '#ffb3b3', borderWidth: currentTheme === 'goldenYellow' ? 2 : 0, borderColor: '#D97706' }]}
                                    onPress={() => setCurrentTheme('goldenYellow')}
                                />
                                <TouchableOpacity
                                    style={[styles.circle, { backgroundColor: '#1E293B', borderWidth: currentTheme === 'comfortDark' ? 2 : 0, borderColor: '#3B82F6' }]}
                                    onPress={() => setCurrentTheme('comfortDark')}
                                />
                                <TouchableOpacity
                                    style={[styles.circle, { backgroundColor: '#0284C7', borderWidth: currentTheme === 'whiteBlue' ? 2 : 0, borderColor: '#E11D48' }]}
                                    onPress={() => setCurrentTheme('whiteBlue')}
                                />
                            </View>
                        )}

                        {/* 4-Dimension Dynamic Box Badge */}
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
                                <Text style={[isMobile ? styles.font12 : styles.font11, styles.rotatingBoxText]}>
                                    {currentCode}
                                </Text>
                            </Animated.View>
                        </View>
                    </View>

                    {isMobile ? (
                        <TouchableOpacity
                            style={[styles.hamburgerButton, { backgroundColor: theme.accentColor + '15' }]}
                            onPress={() => setIsMobileTopMenuOpen(!isMobileTopMenuOpen)}
                        >
                            <Text style={[isMobile ? styles.font12 : styles.font11, { color: theme.accentColor, fontWeight: 'bold' }]}>
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
                                        <Text style={[styles.font11, { color: theme.textColor, fontWeight: '500' }]}>
                                            {item.icon} {item.label}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Mobile Dropdown Menu for Top 1 */}
            {isMobile && isMobileTopMenuOpen && showTopBoxes && (
                <View style={[styles.mobileDropdown, { backgroundColor: theme.cardBg }]}>
                    {topLeftMenu.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.mobileMenuItem}
                            onPress={() => handleMenuPress(item.id)}
                        >
                            {item.type === 'image' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={{ uri: item.uri }} style={styles.flagIcon} />
                                    <Text style={[styles.font12, { color: theme.textColor, marginLeft: 6 }]}>Indonesia (ID)</Text>
                                </View>
                            ) : (
                                <Text style={[styles.font12, { color: theme.textColor, fontWeight: '500' }]}>
                                    {item.icon} {item.label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ================= TOP 2 BAR (Breadcrumbs & Sub-nav) ================= */}
            {showTopBoxes && (
                <View style={[styles.topBox2, { backgroundColor: theme.topBoxesBg }]}>
                    <Text style={[styles.font12, { color: theme.textColor, opacity: 0.7, fontWeight: '500', textAlign: 'center' }]} numberOfLines={1}>
                        Elevating Your Future • Solutions & Enterprise Gateway
                    </Text>
                </View>
            )}

            {/* ================= TOP 3 BAR (Main Category Tabs) ================= */}
            {showTopBoxes && (
                <View style={[styles.topBox3, { backgroundColor: theme.cardBg }]}>
                    {isMobile ? (
                        <View style={styles.top3MobileLeftContainer}>
                            <TouchableOpacity
                                style={[styles.leftMenuHamburger, { backgroundColor: theme.accentColor + '15' }]}
                                onPress={() => setIsMobileLeftMenuOpen(!isMobileLeftMenuOpen)}
                            >
                                <Text style={[styles.font12, { color: theme.accentColor, fontWeight: 'bold' }]}>
                                    {isMobileLeftMenuOpen ? '✕ ' : '☰ '}
                                </Text>
                            </TouchableOpacity>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.top3MenuScroll}>
                                {loadingTop3 ? (
                                    <Text style={[styles.font12, { color: theme.textColor }]}>Loading categories...</Text>
                                ) : top3MenuItems.length > 0 ? (
                                    top3MenuItems.map((item, index) => {
                                        const itemId = item.id || item.objectid || item.value || item.pid;
                                        const isSelected = selectedTop3Id === itemId;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.top3MenuItem,
                                                    isSelected && { backgroundColor: theme.accentColor, borderRadius: 6 }
                                                ]}
                                                onPress={() => handleTop3MenuPress(item)}
                                            >
                                                <Text style={[
                                                    styles.font12,
                                                    { color: isSelected ? '#FFFFFF' : theme.textColor, fontWeight: isSelected ? '700' : '500' }
                                                ]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={[styles.font12, { color: theme.textColor }]}>No categories available</Text>
                                )}
                            </ScrollView>
                        </View>
                    ) : (
                        <View style={styles.topLeftBoxHeader}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.top3MenuScrollCenter}>
                                {loadingTop3 ? (
                                    <Text style={[styles.font11, { color: theme.textColor }]}>Loading categories...</Text>
                                ) : top3MenuItems.length > 0 ? (
                                    top3MenuItems.map((item, index) => {
                                        const itemId = item.id || item.objectid || item.value || item.pid;
                                        const isSelected = selectedTop3Id === itemId;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.top3MenuItem,
                                                    isSelected && { backgroundColor: theme.accentColor, borderRadius: 6 }
                                                ]}
                                                onPress={() => handleTop3MenuPress(item)}
                                            >
                                                <Text style={[
                                                    styles.font11,
                                                    { color: isSelected ? '#FFFFFF' : theme.textColor, fontWeight: isSelected ? '700' : '500' }
                                                ]}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={[styles.font11, { color: theme.textColor }]}>No categories available</Text>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}

            {/* Mobile Left Menu Dropdown */}
            {isMobile && isMobileLeftMenuOpen && showTopBoxes && (
                <View style={[styles.mobileLeftDropdown, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.font12, styles.menuHeader, { color: theme.accentColor }]}>Modules:</Text>
                    {loadingLeftMenu ? (
                        <Text style={[styles.font12, { color: theme.textColor }]}>Loading modules...</Text>
                    ) : leftMenuItems.length > 0 ? (
                        leftMenuItems.map((link, idx) => {
                            const linkId = link.id || link.pid || link.objectid || `left-item-${idx}`;
                            const isSelected = selectedLeftId === linkId;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.mobileMenuItem,
                                        isSelected && { backgroundColor: theme.accentColor + '15', borderRadius: 4, paddingLeft: 6 }
                                    ]}
                                    onPress={() => {
                                        handleLeftMenuPress(link, idx);
                                        setIsMobileLeftMenuOpen(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.font12,
                                        { color: isSelected ? theme.accentColor : theme.textColor, fontWeight: isSelected ? '700' : '500' }
                                    ]}>
                                        {link.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Text style={[styles.font12, { color: theme.textColor }]}>No modules found</Text>
                    )}
                </View>
            )}

            {/* ================= MAIN CONTAINER (Sidebar + Workspace) ================= */}
            <View style={styles.mainWrapper}>
                {!isMobile && (
                    <TouchableOpacity
                        style={[
                            styles.collapseIconContainer,
                            {
                                backgroundColor: theme.cardBg,
                                left: isLeftMenuCollapsed ? 0 : 182
                            }
                        ]}
                        onPress={() => setIsLeftMenuCollapsed(!isLeftMenuCollapsed)}
                    >
                        <Text style={[styles.font11, { color: theme.accentColor, fontWeight: 'bold', textAlign: 'center' }]}>
                            {isLeftMenuCollapsed ? '▶' : '◀'}
                        </Text>
                    </TouchableOpacity>
                )}
                <View style={styles.middleSection}>
                    {!isMobile && !isLeftMenuCollapsed && (
                        <View style={[styles.leftMenuBox, { backgroundColor: theme.cardBg, width: 190 }]}>
                            <ScrollView contentContainerStyle={styles.menuScroll} onScroll={handleScroll} scrollEventThrottle={16}>
                                <Text style={[styles.font11, styles.menuHeader, { color: theme.accentColor }]}>Modules</Text>
                                {loadingLeftMenu ? (
                                    <Text style={[styles.font11, { color: theme.textColor, opacity: 0.6 }]}>Loading modules...</Text>
                                ) : leftMenuItems.length > 0 ? (
                                    leftMenuItems.map((link, idx) => {
                                        const linkId = link.id || link.pid || link.objectid || `left-item-${idx}`;
                                        const isSelected = selectedLeftId === linkId;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[
                                                    styles.menuLink,
                                                    isSelected && { backgroundColor: theme.accentColor + '15', paddingLeft: 8, borderRadius: 4 }
                                                ]}
                                                onPress={() => handleLeftMenuPress(link, idx)}
                                            >
                                                <Text style={[
                                                    styles.font11,
                                                    { color: isSelected ? theme.accentColor : theme.textColor, fontWeight: isSelected ? '700' : '500' }
                                                ]}>
                                                    {link.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={[styles.font11, { color: theme.textColor, fontStyle: 'italic', opacity: 0.6 }]}>Select a category above</Text>
                                )}
                            </ScrollView>
                        </View>
                    )}
                    {/* Content Box Workspace with responsive padding & scroll detection */}
                    <View style={[styles.contentBox, { backgroundColor: theme.cardBg, padding: isMobile ? 2 : 7 }]}>
                        {loadingContent ? (
                            <View style={styles.loadingContainer}>
                                <Text style={[styles.font12, { color: theme.textColor, opacity: 0.6, fontStyle: 'italic' }]}>Loading secure document stream...</Text>
                            </View>
                        ) : htmlContent ? (
                            <div
                                onScroll={(e: any) => {
                                    const currentScrollY = e.target.scrollTop;
                                    const diff = currentScrollY - lastScrollY.current;
                                    if (diff > 5 && currentScrollY > 20) {
                                        setShowTopBoxes(false);
                                        setIsMobileTopMenuOpen(false);
                                        setIsMobileLeftMenuOpen(false);
                                    } else if (diff < -5 || currentScrollY <= 10) {
                                        setShowTopBoxes(true);
                                    }
                                    lastScrollY.current = currentScrollY;
                                }}
                                style={{ width: '100%', height: '100%', overflowY: 'auto', border: 'none', backgroundColor: 'transparent' }}
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                        ) : (
                            <ScrollView contentContainerStyle={styles.contentScroll} onScroll={handleScroll} scrollEventThrottle={16}></ScrollView>
                        )}
                    </View>
                </View>
            </View>

            {/* ================= BOTTOM FOOTER BAR ================= */}
            <View style={[styles.bottomMenuBox, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.font12, { color: theme.textColor, opacity: 0.7, textAlign: 'center' }]} numberOfLines={1}>
                    Quick Links | Privacy Policy | Terms of Service | Support Desk
                </Text>
            </View>

            <View style={[styles.bottomBox, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.font12, { color: theme.textColor, opacity: 0.6, textAlign: 'center' }]} numberOfLines={1}>
                    © 2026 {domain}. All rights reserved. Powered by High-Performance Enterprise Solutions.
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100vw',
        height: '100vh',
        maxWidth: '100%',
        maxHeight: '100%',
        borderWidth: 0,
        overflow: 'hidden',
    },
    font11: {
        fontSize: 11,
        fontFamily: 'System',
    },
    font12: {
        fontSize: 12,
        fontFamily: 'System',
    },
    topBox1: {
        height: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderWidth: 0,
        elevation: 1,
    },
    top1Left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    top1Right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    circle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginHorizontal: 3,
        borderWidth: 0,
    },
    dimensionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    rotatingBox: {
        width: 26,
        height: 18,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
        elevation: 2,
    },
    rotatingBoxText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 9,
        textAlign: 'center',
    },
    menuItemInline: {
        marginLeft: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flagIcon: {
        width: 16,
        height: 11,
        resizeMode: 'contain',
    },
    hamburgerButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 0,
    },
    mobileDropdown: {
        width: '100%',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 0,
    },
    mobileLeftDropdown: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 0,
    },
    mobileMenuItem: {
        paddingVertical: 6,
    },
    topBox2: {
        height: 28,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
    },
    topBox3: {
        height: 36,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
    },
    top3MobileLeftContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftMenuHamburger: {
        marginRight: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 0,
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
        marginHorizontal: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        borderWidth: 0,
    },
    mainWrapper: {
        flex: 1,
        width: '100%',
        position: 'relative',
        borderWidth: 0,
    },
    collapseIconContainer: {
        position: 'absolute',
        top: 12,
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
        paddingVertical: 12,
        borderWidth: 0,
    },
    menuScroll: {
        paddingHorizontal: 10,
    },
    menuHeader: {
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    menuLink: {
        paddingVertical: 7,
        paddingHorizontal: 6,
        marginVertical: 1,
    },
    contentBox: {
        flex: 1,
        width: '100%',
        borderRadius: 6,
        borderWidth: 0,
        margin: 6,
        elevation: 1,
        overflow: 'hidden',
    },
    workspaceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    contentScroll: {
        flexGrow: 1,
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomMenuBox: {
        height: 30,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
    },
    bottomBox: {
        height: 28,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderWidth: 0,
    },
});