'use client';

import React, { createElement } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';

export interface AlertPanelProps {
    isVisible: boolean;
    title: string;
    message: string;
    response: (result: 'OK' | 'NO' | 'CLOSE') => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
    isVisible,
    title,
    message,
    response,
}) => {
    if (!isVisible || typeof window === 'undefined' || !document.body) return null;

    return createElement(
        'div',
        {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483647,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(4px)',
            },
            onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
            onMouseUp: (e: React.MouseEvent) => e.stopPropagation(),
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
            },
            onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
            onTouchEnd: (e: React.TouchEvent) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
            },
        },
        createElement(
            View,
            { style: styles.modalCard },
            // Header Section
            createElement(
                View,
                { style: styles.modalHeader },
                createElement(Text, { style: styles.modalTitle }, title),
                createElement(
                    TouchableOpacity,
                    {
                        style: styles.closeIconButton,
                        activeOpacity: 0.7,
                        onPress: (e: any) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                                e.nativeEvent.stopImmediatePropagation();
                            }
                            response('CLOSE');
                        },
                    },
                    createElement(Text, { style: styles.closeIconText }, '✕')
                )
            ),
            // Body Message Section
            createElement(
                ScrollView,
                { style: styles.modalBodyScroll, contentContainerStyle: styles.modalBodyContent },
                createElement(Text, { style: styles.modalMessage }, message)
            ),
            // Footer Action Buttons
            createElement(
                View,
                { style: styles.modalFooter },
                createElement(
                    TouchableOpacity,
                    {
                        style: [styles.modalButton, styles.noButton],
                        activeOpacity: 0.8,
                        onPress: (e: any) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                                e.nativeEvent.stopImmediatePropagation();
                            }
                            response('NO');
                        },
                    },
                    createElement(Text, { style: styles.noButtonText }, 'NO')
                ),
                createElement(
                    TouchableOpacity,
                    {
                        style: [styles.modalButton, styles.okButton],
                        activeOpacity: 0.8,
                        onPress: (e: any) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            if (e?.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                                e.nativeEvent.stopImmediatePropagation();
                            }
                            response('OK');
                        },
                    },
                    createElement(Text, { style: styles.okButtonText }, 'OK')
                )
            )
        )
    );
};

const styles = StyleSheet.create({
    modalCard: {
        width: '90%',
        maxWidth: 520,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        // @ts-ignore
        pointerEvents: 'auto',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeIconButton: {
        width: 30,
        height: 30,
        backgroundColor: '#4338CA',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIconText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    modalBodyScroll: {
        maxHeight: 260,
    },
    modalBodyContent: {
        paddingHorizontal: 24,
        paddingVertical: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#334155',
        textAlign: 'center',
        lineHeight: 22,
        // @ts-ignore
        wordBreak: 'break-word',
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    noButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    noButtonText: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
    okButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    okButtonText: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default AlertPanel;