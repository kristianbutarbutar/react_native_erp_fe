'use client';

import React, { useEffect, useState, createElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { dropObjectItem } from './ts/DeletePanel';

export interface DeletePanelProps {
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: () => void; // Triggered on successful deletion to refresh layout & close panels
  title?: string;
  tableName?: string;
  recordid?: string;
  sessionId?: string;
  children?: React.ReactNode;
}

const CloseIcon = ({ color = '#475569', size = 20 }: { color?: string; size?: number }) =>
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
    createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  );

const WarningIcon = ({ color = '#DC2626', size = 44 }: { color?: string; size?: number }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('path', {
      d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    }),
    createElement('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
    createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
  );

export const DeletePanel: React.FC<DeletePanelProps> = ({
  visible = true,
  onClose,
  onSuccess,
  title = 'Delete Record Confirmation',
  tableName = '',
  recordid = '',
  sessionId = '',
  children,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose && !deleting) {
        onClose();
      }
    };
    if (visible && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, onClose, deleting]);

  // Reset alert states on open
  useEffect(() => {
    if (visible) {
      setErrorMessage('');
      setSuccessMessage('');
      setDeleting(false);
    }
  }, [visible, tableName, recordid]);

  const handleDeleteConfirm = async () => {
    if (deleting) return;

    const trimmedTableName = tableName?.trim();
    const trimmedRecordId = String(recordid || '').trim();

    if (!trimmedTableName || !trimmedRecordId) {
      setErrorMessage('Missing table name or record ID.');
      return;
    }

    setDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const result = await dropObjectItem({
      tableName: trimmedTableName,
      recordid: trimmedRecordId,
      sessionid: sessionId || '',
    });

    setDeleting(false);

    if (result.success) {
      setSuccessMessage('Record deleted successfully!');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(); // Close ViewPanel & DeletePanel, and refresh table records
        } else if (onClose) {
          onClose();
        }
      }, 600);
    } else {
      setErrorMessage(result.error || 'Failed to delete record.');
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      {isDesktop && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={deleting ? undefined : onClose}
        />
      )}

      <View
        style={[
          styles.container,
          isDesktop ? styles.desktopModal : styles.mobileFullScreen,
        ]}
      >
        {/* ROW 1: HEADER */}
        <View style={styles.topMenuRow}>
          <Text style={styles.titleText}>{title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={deleting}
            accessibilityLabel="Close Panel"
          >
            <CloseIcon color="#475569" size={20} />
          </TouchableOpacity>
        </View>

        {/* ROW 2: CONTENT AREA */}
        <View style={styles.contentRow}>
          {children || (
            <View style={styles.centerContainer}>
              <View style={styles.warningIconWrapper}>
                <WarningIcon color="#DC2626" size={44} />
              </View>

              <Text style={styles.confirmHeader}>Are you sure you want to delete?</Text>
              <Text style={styles.confirmSubtext}>
                This action cannot be undone. The record will be permanently removed from table{' '}
                <Text style={styles.highlightText}>"{tableName || 'N/A'}"</Text>.
              </Text>

              {errorMessage ? (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={styles.successAlert}>
                  <Text style={styles.successAlertText}>{successMessage}</Text>
                </View>
              ) : null}

              <View style={styles.infoCard}>
                <Text style={styles.infoText}>Table Name: {tableName || 'N/A'}</Text>
                <Text style={styles.infoText}>Record ID: {recordid || 'N/A'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ROW 3: ACTION CONTROLS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelActionButton}
            onPress={onClose}
            disabled={deleting}
          >
            <Text style={styles.cancelActionText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteActionButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteActionText}>Confirm Delete</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ROW 4: FOOTER */}
        <View style={styles.footerRow}>
          <Text style={styles.subtleText}>
            Table: {tableName || 'N/A'} | Record ID: {recordid || 'N/A'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 1200, // Elevated above ViewPanel
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopModal: {
    width: '90%',
    maxWidth: 520,
    height: 'auto',
    maxHeight: 480,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 10px 25px rgba(15, 23, 42, 0.15)',
    elevation: 10,
  },
  mobileFullScreen: {
    width: '100%',
    height: '100%',
  },
  topMenuRow: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  highlightText: {
    fontWeight: '700',
    color: '#334155',
  },
  errorAlert: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  successAlert: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  successAlertText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  actionRow: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  cancelActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deleteActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerRow: {
    minHeight: 28,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  subtleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default DeletePanel;