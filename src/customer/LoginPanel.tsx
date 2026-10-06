'use client';

import React, { useState, useEffect, useRef, createElement } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    useWindowDimensions,
} from 'react-native';

export interface LoginPanelProps {
    sessionid: string;
    loadUid?: (__uid: string) => void;
    showLoginPanelOpen?: (isOpen: boolean) => void;
    onLoginSuccess?: (userData: any) => void;
    onNavigateRegister?: () => void;
}

const USERS_LIST = [
    { id: '4f82224a71503071459d1ffa1e1ea16ab11b20c17e1fb', uid: 'IF02098' },
    { id: 'ca11a7219df8bd204c6ef753836734b29f671f1aabac3', uid: 'Kristian Butar' },
    { id: '5236eb1471182df616c73c98ddfd4b8f3b95e7dc491ba', uid: 'Dorti' },
    { id: '2f5effa2c2a665b819b9d7c0e055bf7a7cd42fd6996d7', uid: 'Namaste' },
    { id: '8f3d044d8c990bd7315d76883481f1633e216c37d0ea6', uid: 'Mauliate' },
    { id: '0c85cac47ca7543dda94cb4d3deb325415e81dd8b4d9d', uid: 'Rosmawati' },
];

const MaximizeIcon = ({ color = '#4F46E5', size = 16 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '15 3 21 3 21 9' }),
        createElement('polyline', { points: '9 21 3 21 3 15' }),
        createElement('line', { x1: 21, y1: 3, x2: 14, y2: 10 }),
        createElement('line', { x1: 3, y1: 21, x2: 10, y2: 14 })
    );

const MinimizeIcon = ({ color = '#4F46E5', size = 16 }: { color?: string; size?: number }) =>
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
        createElement('polyline', { points: '4 14 10 14 10 20' }),
        createElement('polyline', { points: '20 10 14 10 14 4' }),
        createElement('line', { x1: 14, y1: 10, x2: 21, y2: 3 }),
        createElement('line', { x1: 3, y1: 21, x2: 10, y2: 14 })
    );

const CloseIcon = ({ color = '#4F46E5', size = 16 }: { color?: string; size?: number }) =>
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
        createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
        createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
    );

export const LoginPanel: React.FC<LoginPanelProps> = ({
    sessionid,
    loadUid,
    showLoginPanelOpen,
    onLoginSuccess,
    onNavigateRegister,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [isClosed, setIsClosed] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [selectedId, setSelectedId] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const panelRef = useRef<View>(null);

    // Close panel on outside click for desktop layout
    useEffect(() => {
        if (typeof window === 'undefined' || !isDesktop) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current) {
                // @ts-ignore
                const node = panelRef.current as any;
                if (node && typeof node.contains === 'function' && !node.contains(e.target as Node)) {
                    setIsClosed(true);
                    if (showLoginPanelOpen) {
                        showLoginPanelOpen(false);
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDesktop, showLoginPanelOpen]);

    const handleClose = () => {
        setIsClosed(true);
        if (showLoginPanelOpen) {
            showLoginPanelOpen(false);
        }
    };

    const handleSelectUser = (item: { id: string; uid: string }) => {
        setSelectedId(item.id);
        setUsername(item.id);
    };

    const handleLogin = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password.trim()) return;

        setIsLoading(true);
        try {

            // Load the entered username/id through the callback if provided
            if (loadUid) {
                loadUid(trimmedUsername);
            }

            if (onLoginSuccess) {
                onLoginSuccess({ username: trimmedUsername, id: selectedId });
            }

            // Automatically close the panel upon successful login trigger
            setIsClosed(true);
            if (showLoginPanelOpen) {
                showLoginPanelOpen(false);
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isClosed) {
        return null;
    }

    return (
        <View
            // @ts-ignore
            ref={panelRef}
            style={[
                styles.container,
                isDesktop ? styles.desktopSize : styles.mobileSize,
                isMaximized && styles.maximizedContainer,
            ]}
        >
            {/* Top Header Bar */}
            <View style={styles.topHeaderRow}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => setIsMaximized(!isMaximized)}
                    accessibilityLabel={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
                >
                    {isMaximized ? <MinimizeIcon color="#4F46E5" size={16} /> : <MaximizeIcon color="#4F46E5" size={16} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={handleClose}
                    accessibilityLabel="Close Panel"
                >
                    <CloseIcon color="#4F46E5" size={16} />
                </TouchableOpacity>
            </View>

            {/* Main Body Layout matching Wireframe */}
            <View style={styles.bodyContent}>
                <View style={styles.innerCard}>
                    {/* Register Option Link */}
                    <TouchableOpacity
                        style={styles.registerPromptContainer}
                        onPress={onNavigateRegister}
                    >
                        <Text style={styles.registerPromptText}>want to register ?</Text>
                    </TouchableOpacity>

                    {/* Username Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your username or ID"
                            placeholderTextColor="#9CA3AF"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Predefined Users Dropdown Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Select User Account</Text>
                        <View style={styles.dropdownContainer}>
                            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                                {USERS_LIST.map((user) => {
                                    const isSelected = selectedId === user.id;
                                    return (
                                        <TouchableOpacity
                                            key={user.id}
                                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                                            onPress={() => handleSelectUser(user)}
                                        >
                                            <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                                                {user.uid} <Text style={styles.dropdownSubText}>({user.id})</Text>
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    {/* Login Action Button */}
                    <TouchableOpacity
                        style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginBtnText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        overflow: 'hidden',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    desktopSize: {
        width: 520,
        height: 560,
    },
    mobileSize: {
        width: '100%',
        height: '100%',
    },
    maximizedContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 99999,
        borderRadius: 0,
    },
    topHeaderRow: {
        height: 48,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerIconButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
    },
    bodyContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    innerCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    registerPromptContainer: {
        alignSelf: 'flex-end',
        marginBottom: 8,
    },
    registerPromptText: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    textInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 13,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    dropdownContainer: {
        height: 90,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    dropdownScrollView: {
        flex: 1,
    },
    dropdownItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemSelected: {
        backgroundColor: '#EEF2FF',
    },
    dropdownItemText: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
    },
    dropdownItemTextSelected: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    dropdownSubText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    loginBtn: {
        backgroundColor: '#4F46E5',
        height: 42,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    loginBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default LoginPanel;