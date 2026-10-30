import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { getObjectRecords } from './../apiService';
import NewPanel from './../panel/NewPanel';
import { REVIEW_PANEL} from './../global';

export interface ReviewPanelProps {
  objectid: string;
  pid: string;
}

export interface CommentRecord {
  id: string;
  createdby?: string;
  creator?: string;
  review1?: string;
  review2?: string;
  [key: string]: any;
}

const PAGE_SIZE = 10;

// Soft color themes for parent-child relationship grouping
const DYNAMIC_THEMES = [
  { border: '#93C5FD', bg: '#EFF6FF', badge: '#1D4ED8' }, // Blue
  { border: '#A7F3D0', bg: '#ECFDF5', badge: '#047857' }, // Emerald
  { border: '#FDE68A', bg: '#FFFBEB', badge: '#B45309' }, // Amber
  { border: '#DDD6FE', bg: '#F5F3FF', badge: '#6D28D9' }, // Purple
  { border: '#FBCFE8', bg: '#FDF2F8', badge: '#BE185D' }, // Pink
  { border: '#FED7AA', bg: '#FFEDD5', badge: '#C2410C' }, // Orange
  { border: '#99F6E4', bg: '#F0FDFA', badge: '#0F766E' }, // Teal
];

// Helper to deterministically pick a dynamic color theme based on parent ID
const getDynamicTheme = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_THEMES.length;
  return DYNAMIC_THEMES[index];
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({ objectid, pid }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [childCommentsMap, setChildCommentsMap] = useState<Record<string, CommentRecord[]>>({});
  const [expandedChildMap, setExpandedChildMap] = useState<Record<string, boolean>>({});
  
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingChildren, setFetchingChildren] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // NewPanel Modal overlay states
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [modalPid, setModalPid] = useState<string>(pid);
  const [modalTitle, setModalTitle] = useState<string>('New Comment');

  useEffect(() => {
    fetchComments();
  }, [objectid, pid]);

  const fetchComments = async () => {
    if (!objectid || !pid) return;

    setLoading(true);
    setError(null);

    const payload = {
      objectid: objectid,
      whereClause: [{ col_name: 'pid', value: pid }], filterColumns:[]
    };

    try {
      const response = await getObjectRecords(payload);
      const records = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(records)) {
        setComments(records);
        // Once parent comments load, fetch child comments sequentially
        fetchChildCommentsSequentially(records);
      } else {
        setComments([]);
      }
    } catch (err: any) {
      console.error('[ReviewPanel] Error fetching review comments:', err);
      setError(err?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch child comments for each comment one by one sequentially
  const fetchChildCommentsSequentially = async (parentRecords: CommentRecord[]) => {
    if (!parentRecords || parentRecords.length === 0) return;

    setFetchingChildren(true);
    const childrenMap: Record<string, CommentRecord[]> = {};

    for (const parent of parentRecords) {
      if (!parent.id) continue;

      try {
        const childPayload = {
          objectid: REVIEW_PANEL,
          whereClause: [{ col_name: 'pid', value: parent.id }],
          filterColumns:[]
        };

        const childResponse = await getObjectRecords(childPayload);
        const childRecords = Array.isArray(childResponse) ? childResponse : childResponse?.data;

        if (Array.isArray(childRecords) && childRecords.length > 0) {
          childrenMap[parent.id] = childRecords;
          // Update state iteratively so user sees loaded children progressively
          setChildCommentsMap((prev) => ({
            ...prev,
            [parent.id]: childRecords,
          }));
        }
      } catch (childErr) {
        console.error(`[ReviewPanel] Error loading child comments for parent ${parent.id}:`, childErr);
      }
    }

    setFetchingChildren(false);
  };

  const handleToggleChildCollapse = (parentId: string) => {
    setExpandedChildMap((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const handleNewCommentPress = () => {
    setModalPid(pid);
    setModalTitle('New Comment');
    setShowNewModal(true);
  };

  const handleReplyPress = (item: CommentRecord) => {
    setModalPid(item.id);
    setModalTitle(`Reply to ${item.createdby || item.creator || 'Comment'}`);
    setShowNewModal(true);
  };

  const handleCloseModal = () => {
    setShowNewModal(false);
    fetchComments(); // Refresh comment list on modal close
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;

  return (
    <View style={styles.rootContainer}>
      {/* Top Header Action Row */}
      <View style={styles.topActionRow}>
        <TouchableOpacity style={styles.newButton} onPress={handleNewCommentPress}>
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Main Comment List Group Box */}
      <View style={styles.commentListBorderBox}>
        {/* Fieldset-style Title Label */}
        <View style={styles.borderBoxTitleBadge}>
          <Text style={styles.borderBoxTitleText}>Comment List</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchComments}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {visibleComments.map((item, index) => {
              const creatorName = item.createdby || item.creator || 'Creator Name';
              const mergedComment = [item.review1, item.review2]
                .filter((r) => r && String(r).trim() !== '')
                .join(' ');

              // Dynamic color theme shared between parent and its child comments
              const theme = getDynamicTheme(item.id || `parent-${index}`);
              const childList = childCommentsMap[item.id] || [];
              const isChildExpanded = !!expandedChildMap[item.id];

              return (
                <View key={item.id || index} style={styles.commentCardRow}>
                  <Text style={styles.creatorNameText}>{creatorName}</Text>

                  {/* Parent Comment Box with Dynamic Relationship Border & BG Color */}
                  <View
                    style={[
                      styles.commentBubbleBox,
                      { borderColor: theme.border, backgroundColor: theme.bg },
                    ]}
                  >
                    <Text style={styles.commentContentText}>
                      {mergedComment || 'comments'}
                    </Text>
                  </View>

                  {/* Actions Row (Reply & Child Expand Toggle) */}
                  <View style={styles.commentActionsRow}>
                    {childList.length > 0 && (
                      <TouchableOpacity
                        style={styles.toggleChildBtn}
                        onPress={() => handleToggleChildCollapse(item.id)}
                      >
                        <Text style={[styles.toggleChildText, { color: theme.badge }]}>
                          {isChildExpanded ? '▲ Hide Replies' : `▼ View ${childList.length} Replies`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => handleReplyPress(item)}
                    >
                      <Text style={styles.replyButtonText}>reply</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Collapsible Child Comments Container */}
                  {childList.length > 0 && isChildExpanded && (
                    <View
                      style={[
                        styles.childContainer,
                        { borderColor: theme.border, backgroundColor: theme.bg },
                      ]}
                    >
                      {childList.map((child, cIdx) => {
                        const childCreator = child.createdby || child.creator || 'Replier';
                        const childMerged = [child.review1, child.review2]
                          .filter((r) => r && String(r).trim() !== '')
                          .join(' ');

                        return (
                          <View key={child.id || `child-${cIdx}`} style={styles.childItemRow}>
                            <Text style={styles.childCreatorText}>↳ {childCreator}</Text>
                            <View style={styles.childBubbleBox}>
                              <Text style={styles.commentContentText}>
                                {childMerged || 'child comment'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.replyButton}
                              onPress={() => handleReplyPress(child)}
                            >
                              <Text style={styles.replyButtonText}>reply</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Bottom Show More Action */}
            {hasMore && (
              <View style={styles.bottomActionRow}>
                <TouchableOpacity style={styles.showMoreButton} onPress={handleShowMore}>
                  <Text style={styles.showMoreText}>show more</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Topmost Browser Modal Overlay for NewPanel */}
      <Modal
        visible={showNewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalBackdropOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View
            style={[
              styles.newPanelModalBox,
              isDesktop ? styles.desktopModalSize : styles.mobileModalSize,
            ]}
            // Prevent overlay dismissal when clicking inside the modal box
            // @ts-ignore
            onClick={(e: any) => e && typeof e.stopPropagation === 'function' && e.stopPropagation()}
          >
            <NewPanel
              tableName={REVIEW_PANEL}
              columnForLayout = {1}
              parentid={modalPid}
              title={modalTitle}
              onClose={handleCloseModal}
              onSuccess={handleCloseModal}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },

  // --- Top Action Row ---
  topActionRow: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  newButton: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  newButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },

  // --- Group Fieldset Container ---
  commentListBorderBox: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    padding: 16,
    paddingTop: 24,
    position: 'relative',
    minHeight: 180,
    backgroundColor: '#FFFFFF',
  },
  borderBoxTitleBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  borderBoxTitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },

  // --- Scroll & Loading States ---
  scrollContentContainer: {
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 8,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#000000',
  },

  // --- Comment Row & Item ---
  commentCardRow: {
    marginBottom: 4,
  },
  creatorNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
    marginLeft: 4,
  },
  commentBubbleBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  commentContentText: {
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'left',
    lineHeight: 20,
  },
  commentActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  toggleChildBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  toggleChildText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  replyButtonText: {
    fontSize: 13,
    color: '#000000',
  },

  // --- Child Comments Container ---
  childContainer: {
    marginTop: 8,
    marginLeft: 20,
    padding: 12,
    borderLeftWidth: 3,
    borderRadius: 6,
    gap: 12,
  },
  childItemRow: {
    marginBottom: 4,
  },
  childCreatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  childBubbleBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },

  // --- Bottom Action ---
  bottomActionRow: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  showMoreButton: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  showMoreText: {
    fontSize: 13,
    color: '#000000',
  },

  // --- Modal Overlay Styling ---
  modalBackdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  newPanelModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  desktopModalSize: {
    width: 1000,
    height: 400,
    maxWidth: '95%',
    maxHeight: '90%',
  },
  mobileModalSize: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
});

export default ReviewPanel;