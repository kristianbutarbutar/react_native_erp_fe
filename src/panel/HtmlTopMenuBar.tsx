'use client';

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { MenuItemDef, MenuGroupDef } from './ts/HtmlPanelTypes';

interface HtmlTopMenuBarProps {
    menus: MenuGroupDef[];
    activeMenu: string | null;
    onToggleMenu: (title: string) => void;
    onCloseMenu: () => void;
}

export const HtmlTopMenuBar: React.FC<HtmlTopMenuBarProps> = ({
    menus,
    activeMenu,
    onToggleMenu,
    onCloseMenu,
}) => {
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);

    const renderMenuItems = (items: MenuItemDef[], parentKey: string = '') => {
        return items.map((item, index) => {
            if (item.divider) {
                return <View key={`div-${parentKey}-${index}`} style={styles.dropdownDivider} />;
            }

            const itemKey = `${parentKey}-${index}-${item.label}`;
            const hasSubmenu = Boolean(item.children && item.children.length > 0);
            const isSubmenuOpen = activeSubmenuIndex === index;

            return (
                <View
                    key={itemKey}
                    style={styles.itemWrapper}
                    // @ts-ignore - web mouse events
                    onMouseEnter={() => hasSubmenu && setActiveSubmenuIndex(index)}
                >
                    <TouchableOpacity
                        style={[
                            styles.dropdownItem,
                            item.disabled && styles.dropdownItemDisabled,
                            isSubmenuOpen && styles.dropdownItemActive,
                        ]}
                        disabled={item.disabled}
                        onPress={(e) => {
                            if (hasSubmenu) {
                                e?.stopPropagation?.();
                                setActiveSubmenuIndex(isSubmenuOpen ? null : index);
                            } else if (item.action) {
                                item.action();
                                setActiveSubmenuIndex(null);
                                onCloseMenu();
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.itemLeftCol}>
                            {item.checked !== undefined && (
                                <Text style={styles.checkIcon}>{item.checked ? '✓' : ' '}</Text>
                            )}
                            {item.icon && <Text style={styles.itemIcon}>{item.icon}</Text>}
                            <Text style={[styles.itemText, item.disabled && styles.itemTextDisabled]}>
                                {item.label}
                            </Text>
                        </View>

                        <View style={styles.itemRightCol}>
                            {item.hotkey && <Text style={styles.hotkeyText}>{item.hotkey}</Text>}
                            {hasSubmenu && <Text style={styles.submenuArrow}>▶</Text>}
                        </View>
                    </TouchableOpacity>

                    {/* Submenu Flyout */}
                    {hasSubmenu && isSubmenuOpen && item.children && (
                        <View
                            style={styles.submenuDropdown}
                            // @ts-ignore
                            onMouseLeave={() => setActiveSubmenuIndex(null)}
                        >
                            {item.children.map((subItem, subIdx) => {
                                if (subItem.divider) {
                                    return <View key={`subdiv-${subIdx}`} style={styles.dropdownDivider} />;
                                }
                                return (
                                    <TouchableOpacity
                                        key={`sub-${subIdx}-${subItem.label}`}
                                        style={[styles.dropdownItem, subItem.disabled && styles.dropdownItemDisabled]}
                                        disabled={subItem.disabled}
                                        onPress={() => {
                                            if (subItem.action) {
                                                subItem.action();
                                                setActiveSubmenuIndex(null);
                                                onCloseMenu();
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.itemLeftCol}>
                                            {subItem.icon && <Text style={styles.itemIcon}>{subItem.icon}</Text>}
                                            <Text style={[styles.itemText, subItem.disabled && styles.itemTextDisabled]}>
                                                {subItem.label}
                                            </Text>
                                        </View>
                                        {subItem.hotkey && <Text style={styles.hotkeyText}>{subItem.hotkey}</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            );
        });
    };

    return (
        <View style={styles.menuBarContainer}>
            {menus.map((group) => {
                const isOpen = activeMenu === group.title;
                return (
                    <View key={group.title} style={styles.groupWrapper}>
                        <TouchableOpacity
                            style={[styles.menuTitleButton, isOpen && styles.menuTitleButtonActive]}
                            onPress={() => {
                                setActiveSubmenuIndex(null);
                                onToggleMenu(group.title);
                            }}
                            activeOpacity={0.6}
                        >
                            <Text style={[styles.menuTitleText, isOpen && styles.menuTitleTextActive]}>
                                {group.title} ▾
                            </Text>
                        </TouchableOpacity>

                        {isOpen && (
                            <View
                                style={styles.dropdownMenu}
                                // @ts-ignore
                                onMouseLeave={() => setActiveSubmenuIndex(null)}
                            >
                                {renderMenuItems(group.items, group.title)}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    menuBarContainer: {
        height: 32,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        zIndex: 50,
    },
    groupWrapper: {
        position: 'relative',
    },
    menuTitleButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    menuTitleButtonActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    menuTitleText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
    },
    menuTitleTextActive: {
        color: '#0F172A',
        fontWeight: '700',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 28,
        left: 0,
        minWidth: 200,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
        paddingVertical: 4,
        zIndex: 1000,
    },
    itemWrapper: {
        position: 'relative',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    dropdownItemActive: {
        backgroundColor: '#F1F5F9',
    },
    dropdownItemDisabled: {
        opacity: 0.4,
    },
    itemLeftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkIcon: {
        fontSize: 11,
        width: 14,
        color: '#0F172A',
        fontWeight: '800',
    },
    itemIcon: {
        fontSize: 12,
        color: '#475569',
    },
    itemText: {
        fontSize: 12,
        color: '#1E293B',
    },
    itemTextDisabled: {
        color: '#94A3B8',
    },
    itemRightCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 16,
    },
    hotkeyText: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: 'monospace',
    },
    submenuArrow: {
        fontSize: 9,
        color: '#64748B',
    },
    submenuDropdown: {
        position: 'absolute',
        top: 0,
        left: '98%',
        minWidth: 180,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
        paddingVertical: 4,
        zIndex: 1001,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
});

export default HtmlTopMenuBar;