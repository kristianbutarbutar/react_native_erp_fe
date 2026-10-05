import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';

interface MemberInfoProps {
  recordid: string;
  objectid: string;
  onClose?: () => void;
  onMaximize?: () => void;
}

export const MemberInfo: React.FC<MemberInfoProps> = ({
  recordid,
  objectid,
  onClose,
  onMaximize,
}: MemberInfoProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onMaximize} activeOpacity={0.7}>
          <Text style={styles.iconText}>⤢</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Member Info</Text>

        <TouchableOpacity style={styles.iconButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Top Section: Action Box & Photo Box */}
        <View style={[styles.topRow, isDesktop ? styles.rowDesktop : styles.rowMobile]}>
          
          {/* Action Box */}
          <View style={[styles.card, styles.actionBox]}>
            <Text style={styles.cardHeaderTitle}>Action Box</Text>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity style={styles.primaryActionButton} activeOpacity={0.8}>
                <Text style={styles.primaryActionText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton} activeOpacity={0.8}>
                <Text style={styles.secondaryActionText}>Permissions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Box */}
          <View style={[styles.card, styles.photoBox]}>
            <Text style={styles.cardHeaderTitle}>Photo Box</Text>
            <View style={styles.photoContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>👤</Text>
              </View>
              <Text style={styles.photoSubtext} numberOfLines={1}>ID: {recordid}</Text>
            </View>
          </View>

        </View>

        {/* Bottom Section: Personal Info Box */}
        <View style={[styles.card, styles.personalInfoBox]}>
          <Text style={styles.cardHeaderTitle}>Personal Info Box</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Record ID</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{recordid || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Object ID</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{objectid || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, styles.activeStatus]}>Active</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>2026-10-02</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      : {
          elevation: 3,
        }),
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  bodyContent: {
    padding: 12,
    gap: 12,
  },
  topRow: {
    gap: 12,
  },
  rowDesktop: {
    flexDirection: 'row',
  },
  rowMobile: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  actionBox: {
    flex: 1,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  photoBox: {
    flex: 1,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personalInfoBox: {
    minHeight: 160,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtonContainer: {
    gap: 6,
    width: '100%',
  },
  primaryActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  secondaryActionButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryActionText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 11,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarPlaceholderText: {
    fontSize: 20,
  },
  photoSubtext: {
    fontSize: 11,
    color: '#64748B',
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    flexWrap: 'wrap',
  },
  activeStatus: {
    color: '#16A34A',
  },
});

export default MemberInfo;