'use client';

import React, { useState, useEffect, createElement, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { getObjectRecords } from './../apiService';
import { callChat } from './ts/ChatPanel.ts';
import { doUpload } from './ts/ObjectFile.ts';
import { FilesExplorerPanel } from './FilesExplorerPanel';
import NewPanel from './../panel/NewPanel';
import MemberInfo from './MemberInfo';
import { VoiceCallManager } from './VoiceCallManager';

export interface ChatPanelProps {
  sessionid: string;
  uid: string;
  showChatPanelOpen?: (isOpen: boolean) => void;
  activeToUID?: string;
  setActiveToUID?: (uid: string) => void;
}

const CALL_EXPIRY_MINUTES = 4;

const MinimizeIcon = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) =>
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

const MaximizeIcon = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) =>
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

const CloseIcon = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) =>
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

const HamburgerIcon = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) =>
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
    createElement('line', { x1: '3', y1: '12', x2: '21', y2: '12' }),
    createElement('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
    createElement('line', { x1: '3', y1: '18', x2: '21', y2: '18' })
  );

const CallIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' })
  );

const MuteIcon = ({ color = '#333333', size = 18, muted = false }: { color?: string; size?: number; muted?: boolean }) =>
  createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: muted ? '#EF4444' : color,
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    createElement('path', { d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' }),
    createElement('path', { d: 'M19 10v1a7 7 0 0 1-14 0v-1' }),
    createElement('line', { x1: '12', y1: '19', x2: '12', y2: '23' }),
    createElement('line', { x1: '8', y1: '23', x2: '16', y2: '23' }),
    muted ? createElement('line', { x1: '1', y1: '1', x2: '23', y2: '23' }) : null
  );

const EndCallIcon = ({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M10.68 13.31a16 16 0 0 0 3.41 3.41l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11l-1.27 1.27z' }),
    createElement('line', { x1: '23', y1: '1', x2: '1', y2: '23' })
  );

const UsersIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
    createElement('circle', { cx: '9', cy: '7', r: '4' }),
    createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
    createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
  );

const PlusIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
    createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
  );

const EmoticonIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('circle', { cx: '12', cy: '12', r: '10' }),
    createElement('path', { d: 'M8 14s1.5 2 4 2 4-2 4-2' }),
    createElement('line', { x1: '9', y1: '9', x2: '9.01', y2: '9' }),
    createElement('line', { x1: '15', y1: '9', x2: '15.01', y2: '9' })
  );

const FileUploadIcon = ({ color = '#4F46E5', size = 14 }: { color?: string; size?: number }) =>
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
    createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    createElement('polyline', { points: '17 8 12 3 7 8' }),
    createElement('line', { x1: '12', y1: '3', x2: '12', y2: '15' })
  );

const EMOTICONS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
  '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐',
  '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '🔥', '❤', '💯', '✨'
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionid, uid, showChatPanelOpen }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isMemberBoxCollapsed, setIsMemberBoxCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false); // Hamburger menu toggle state for mobile view
  const [messageText, setMessageText] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [activeToUID, setActiveToUID] = useState<string>('');
  const [activeToUIDName, setActiveToUIDName] = useState<string>('');
  const [activeUID, setActiveUID] = useState<string>('');
  const [nameUID, setNameUID] = useState<string>('');
  const [, setLastReadMsgSeqNo] = useState<number>(0);

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; member: any | null }>({
    visible: false,
    x: 0,
    y: 0,
    member: null,
  });
  const selectedMemberRef = useRef<any | null>(null);
  const [showMemberInfoModal, setShowMemberInfoModal] = useState<boolean>(false);
  const [selectedMemberInfo, setSelectedMemberInfo] = useState<any | null>(null);
  const [isMemberInfoMaximized, setIsMemberInfoMaximized] = useState<boolean>(false);

  const [showVoiceCallPopup, setShowVoiceCallPopup] = useState<boolean>(false);
  const [isCallingWaiting, setIsCallingWaiting] = useState<boolean>(false);
  const [isIncomingCall, setIsIncomingCall] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>('Idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const voiceManagerRef = useRef<VoiceCallManager | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isModalMaximized, setIsModalMaximized] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const [showFilesExplorer, setShowFilesExplorer] = useState<boolean>(false);
  const [selectedFileValue, setSelectedFileValue] = useState<any>(null);
  const tableName = '';

  const [showNewPanel, setShowNewPanel] = useState<boolean>(false);

  const panelRef = useRef<View>(null);
  const newPanelRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const [connectWS, setConnectWS] = useState<boolean>(false);

  const messageSeqCounterRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<any>(null);
  const reconnectTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  const focusInput = () => {
    if (textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  };

  const fetchMemberRecords = async (__payload: any) => {
    try {
      const response = await getObjectRecords(__payload);
      return response;
    } catch (error) {
      console.error('Failed to load member records:', error);
    }
  };

  const refreshMembers = async () => {
    if (!uid || !sessionid) return;

    const __payload = {
      objectid: 'PORTAL_USER_FORM_ID',
      sessionid: sessionid,
      whereClause: [{ col_name: 'pid', value: uid }],
    };

    const resp = await fetchMemberRecords(__payload);

    if (resp && resp.data) {
      const fetchedData = Array.isArray(resp.data) ? resp.data : [resp.data];
      setMembers(fetchedData);
    }
  };

  useEffect(() => {
    setActiveUID(uid);
    refreshMembers();

    (async () => {
      const __payload = {
        objectid: 'PORTAL_USER_FORM_ID',
        sessionid: sessionid,
        whereClause: [{ col_name: 'id', value: uid }],
        filterColumns: ['uid'],
      };

      const resp = await fetchMemberRecords(__payload);

      if (resp && resp.data) {
        const fetchedData = Array.isArray(resp.data) ? resp.data : [resp.data];
        if (fetchedData && fetchedData[0]) {
          setNameUID(fetchedData[0].uid);
        }
      }
    })();
  }, [uid, sessionid]);

  const connectWebSocket = () => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    const ws = new WebSocket(`ws://localhost:3004?uid=${uid}`);
    wsRef.current = ws;

    ws.onopen = () => {
      isConnectingRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && activeToUID) {
          const messagePayload = {
            action: 'read_message',
            uid: uid,
            touid: [activeToUID],
            fromseqno: String(messageSeqCounterRef.current),
          };

          ws.send(JSON.stringify(messagePayload));
        }
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData && parsedData.node && Array.isArray(parsedData.node)) {
          let _lastMessage: any = {};

          parsedData.node.forEach((__msg: any) => {
            const isFromCurrentUser = __msg.uid === uid || __msg.uid === nameUID || __msg.sender === 'You';

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + Math.random(),
                sender: __msg.uid || 'Server',
                text: __msg.message,
                timestamp: parsedData.timestamp || __msg.timestamp || new Date().toISOString(),
                isUser: isFromCurrentUser,
              },
            ]);

            if (__msg.seqno && messageSeqCounterRef.current < Number(__msg.seqno)) {
              messageSeqCounterRef.current = Number(__msg.seqno);
              setLastReadMsgSeqNo(Number(__msg.seqno));
              _lastMessage = __msg;
            }
          });

          scrollToBottom();

          const isCallMsg = _lastMessage.text && _lastMessage.text.includes('call:<<<<<<Calling>>>>>>');

          if (isCallMsg && _lastMessage.timestamp) {
            const msgTime = new Date(_lastMessage.timestamp).getTime();
            const deviceTime = Date.now();
            const diffMinutes = (deviceTime - msgTime) / (1000 * 60);

            if (diffMinutes <= CALL_EXPIRY_MINUTES) {
              handleReceiveCallPopup();
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse incoming WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      isConnectingRef.current = false;
      if (ws.readyState !== WebSocket.CLOSED) {
        console.error('WebSocket error:', error);
      }
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          setConnectWS((prev) => !prev);
        }, 3000);
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [uid, connectWS]);

  const __sendMessage = async (__msg: string) => {
    const timestamp = new Date().toISOString();

    try {
      const __payload = {
        action: 'write_message',
        uid: activeUID || uid,
        touid: [activeToUID],
        message: __msg,
        timestamp: timestamp,
      };

      const res = await callChat(__payload);

      if (res && res.success) {
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleOpenCallPopup = () => {
    if (!activeToUID) {
      alert('Please select a member to call.');
      return;
    }

    if (voiceManagerRef.current && isCallingWaiting) {
      return;
    }

    if (voiceManagerRef.current) {
      voiceManagerRef.current.disconnect?.();
      voiceManagerRef.current = null;
    }

    setIsIncomingCall(false);
    setShowVoiceCallPopup(true);
    setIsCallingWaiting(true);
    setCallStatus('Connecting to server...');

    __sendMessage("call:<<<<<<Calling>>>>>>");

    const manager = new VoiceCallManager();
    voiceManagerRef.current = manager;

    manager.connect(uid || activeUID, activeToUID, (status) => {
      setCallStatus(status);
      if (status.includes('Connected')) {
        setIsCallingWaiting(false);
      }
    });
  };

  const handleReceiveCallPopup = () => {
    if (showVoiceCallPopup) return;

    setIsIncomingCall(true);
    setShowVoiceCallPopup(true);
    setIsCallingWaiting(false);
    setCallStatus('Incoming voice call...');
  };

  const handleAcceptCall = () => {
    if (!activeToUID) return;

    setIsCallingWaiting(true);
    setCallStatus('Connecting to voice room...');

    const manager = new VoiceCallManager();
    voiceManagerRef.current = manager;

    manager.connect(uid || activeUID, activeToUID, (status) => {
      setCallStatus(status);
      if (status.includes('Connected')) {
        setIsCallingWaiting(false);
        setIsIncomingCall(false);
      }
    });
  };

  const handleCloseCall = () => {
    if (showVoiceCallPopup) {
      __sendMessage("call:<<<<<<End>>>>>>");
    }

    if (voiceManagerRef.current) {
      voiceManagerRef.current.disconnect();
      voiceManagerRef.current = null;
    }

    setShowVoiceCallPopup(false);
    setIsCallingWaiting(false);
    setIsIncomingCall(false);
    setCallStatus('Idle');
    setIsMuted(false);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (voiceManagerRef.current) {
      voiceManagerRef.current.setMuted(nextMuted);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !isDesktop) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current) {
        const node = panelRef.current as any;
        if (node && typeof node.contains === 'function' && !node.contains(e.target as Node)) {
          setIsClosed(true);
          if (showChatPanelOpen) {
            showChatPanelOpen(false);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktop, showChatPanelOpen]);

  const handleClose = () => {
    setIsClosed(true);
    if (showChatPanelOpen) {
      showChatPanelOpen(false);
    }
  };

  const handleMemberPress = (member: any) => {
    const selectedUID = member.id || member.uid;
    const selectedUIDName = member.uid || member.name || member.id;
    setActiveToUID(selectedUID);
    setActiveToUIDName(selectedUIDName);
    setMessages([]);
    messageSeqCounterRef.current = 0;
    setLastReadMsgSeqNo(0);
    setIsMobileMenuOpen(false); // Close mobile drawer upon selecting a member
    focusInput();
  };

  const handleMemberContextMenu = (e: React.MouseEvent, member: any) => {
    e.preventDefault();
    e.stopPropagation();
    selectedMemberRef.current = member;
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      member: member,
    });
  };

  const handleMenuAction = (action: string) => {
    const memberToProcess = contextMenu.member || selectedMemberRef.current;
    
    setContextMenu({ visible: false, x: 0, y: 0, member: null });

    if (!memberToProcess) return;

    if (action === 'Personal Info') {
      setSelectedMemberInfo(memberToProcess);
      setShowMemberInfoModal(true);
    } else if (action === 'Delete member') {
      const memberName = memberToProcess.uid || memberToProcess.name || memberToProcess.id;
      if (confirm(`Are you sure you want to delete member ${memberName}?`)) {
        setMembers((prev) => prev.filter((m) => (m.id || m.uid) !== (memberToProcess.id || memberToProcess.uid)));
        if (activeToUID === (memberToProcess.id || memberToProcess.uid)) {
          setActiveToUID('');
          setActiveToUIDName('');
        }
      }
    } else if (action === 'Block member') {
      const memberName = memberToProcess.uid || memberToProcess.name || memberToProcess.id;
      alert(`Member ${memberName} has been blocked.`);
    }
  };

  const handleAddMemberPress = () => {
    if (activeUID !== '' && uid !== '') {
      setShowNewPanel(true);
    }
  };

  const handleSendMessage = async () => {
    const currentMessage = messageText.trim();
    if (!currentMessage || !activeToUID) return;

    await __sendMessage(currentMessage);
    setMessageText('');
    scrollToBottom();
    focusInput();
  };

  const handleSelectEmoji = (emoji: string) => {
    const start = cursorPosition;
    const updatedText = messageText.slice(0, start) + emoji + messageText.slice(start);
    setMessageText(updatedText);
    setCursorPosition(start + emoji.length);
    setShowEmojiPicker(false);
    focusInput();
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      const formattedFiles = filesArray.map((file) => ({
        name: file.name,
        type: file.type,
        originFile: file,
        fullpath: (file as any).webkitRelativePath || file.name,
      }));
      setSelectedFiles((prev) => [...prev, ...formattedFiles]);
    }
  };

  const handleUploadFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const respond = await doUpload({
        files: selectedFiles,
        sessionid: sessionid || '',
      });

      if (respond && respond.data?.id) {
        __sendMessage("file:<<<<<<" + respond.data.id + ">>>>>>");
        scrollToBottom();
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
      setShowFileUploadModal(false);
      setSelectedFiles([]);
    }
  };

  const handleOpenFileExplorer = (fileId: any) => {
    if (fileId != null) {
      setSelectedFileValue(fileId);
      setShowFilesExplorer(true);
    }
  };

  if (isClosed) {
    return null;
  }

  return (
    <View
      ref={panelRef}
      style={[
        styles.container,
        isDesktop ? styles.desktopSize : styles.mobileSize,
        isMaximized && styles.maximizedContainer,
      ]}
    >
      {typeof window !== 'undefined' && (
        <input
          type="file"
          ref={hiddenFileInputRef}
          style={{ display: 'none' }}
          multiple
          onChange={handleFileChange}
        />
      )}

      {isUploading && (
        <View style={styles.uploadProgressOverlay}>
          <View style={styles.uploadProgressBox}>
            <ActivityIndicator size="large" color="#4338CA" />
            <Text style={styles.uploadProgressText}>Uploading files, please wait...</Text>
          </View>
        </View>
      )}

      {/* Top Header Bar */}
      <View style={styles.topHeaderRow}>
        <View style={styles.headerLeftActions}>
          {!isDesktop && (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <HamburgerIcon color="#FFFFFF" size={16} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <MinimizeIcon color="#FFFFFF" size={16} /> : <MaximizeIcon color="#FFFFFF" size={16} />}
          </TouchableOpacity>
        </View>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Interactive Chat {activeToUIDName ? `(${activeToUIDName})` : ''}
        </Text>
        <TouchableOpacity style={styles.headerIconButton} onPress={handleClose}>
          <CloseIcon color="#FFFFFF" size={16} />
        </TouchableOpacity>
      </View>

      {/* User Box */}
      <View style={styles.userBox}>
        <Text style={styles.boxText}>User Box (User ID: {nameUID || uid})</Text>
      </View>

      {/* Middle Body: Member Box + Chat Box */}
      <View style={[styles.middleBody, !isDesktop && styles.middleBodyMobile]}>
        {/* Mobile Hamburger Drawer Overlay */}
        {!isDesktop && isMobileMenuOpen && (
          <View style={styles.mobileMenuBackdrop}>
            <TouchableOpacity
              style={styles.mobileMenuDismissArea}
              activeOpacity={1}
              onPress={() => setIsMobileMenuOpen(false)}
            />
            <View style={styles.mobileMenuDrawer}>
              <View style={styles.memberBoxHeaderRow}>
                <View style={styles.memberHeaderLeft}>
                  <Text style={styles.boxLabel}>Member Box</Text>
                </View>
                <View style={styles.memberHeaderActions}>
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={handleAddMemberPress}
                  >
                    <PlusIcon color="#4338CA" size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.collapseBtn}
                    onPress={() => setIsMobileMenuOpen(false)}
                  >
                    <CloseIcon color="#4338CA" size={14} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {members.length > 0 ? (
                  members.map((member, index) => {
                    const memberUID = member.uid || member.name || member.id;
                    const memberId = member.id || member.uid;
                    const isSelected = activeToUID === memberId;
                    const initialLetter = memberUID ? memberUID.charAt(0).toUpperCase() : 'U';

                    return (
                      <div
                        key={memberId || index}
                        onContextMenu={(e) => handleMemberContextMenu(e, member)}
                        style={{ width: '100%' }}
                      >
                        <TouchableOpacity
                          style={[styles.memberItemButton, isSelected && styles.memberItemActive]}
                          onPress={() => handleMemberPress(member)}
                        >
                          <View style={styles.memberItemContent}>
                            <View style={styles.memberAvatarCircle}>
                              <Text style={styles.memberAvatarText}>{initialLetter}</Text>
                            </View>
                            <Text style={[styles.itemText, isSelected && styles.itemTextActive]} numberOfLines={1}>
                              {memberUID}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ width: '100%' }}>
                    <View style={styles.memberItemContent}>
                      <View style={styles.memberAvatarCircle}>
                        <Text style={styles.memberAvatarText}>U</Text>
                      </View>
                      <Text style={styles.itemText}>User: {uid}</Text>
                    </View>
                  </div>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Desktop Member Box (always visible on desktop) */}
        {isDesktop && (
          <View style={[styles.memberBox, isMemberBoxCollapsed && styles.memberBoxCollapsed]}>
            <View style={styles.memberBoxHeaderRow}>
              {!isMemberBoxCollapsed && (
                <View style={styles.memberHeaderLeft}>
                  <Text style={styles.boxLabel}>Member Box</Text>
                </View>
              )}
              <View style={styles.memberHeaderActions}>
                {!isMemberBoxCollapsed && (
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={handleAddMemberPress}
                  >
                    <PlusIcon color="#4338CA" size={14} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.collapseBtn}
                  onPress={() => setIsMemberBoxCollapsed(!isMemberBoxCollapsed)}
                >
                  <UsersIcon color="#4338CA" size={14} />
                  <Text style={styles.collapseBtnText}>{isMemberBoxCollapsed ? '›' : '‹'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!isMemberBoxCollapsed && (
              <ScrollView>
                {members.length > 0 ? (
                  members.map((member, index) => {
                    const memberUID = member.uid || member.name || member.id;
                    const memberId = member.id || member.uid;
                    const isSelected = activeToUID === memberId;
                    const initialLetter = memberUID ? memberUID.charAt(0).toUpperCase() : 'U';

                    return (
                      <div
                        key={memberId || index}
                        onContextMenu={(e) => handleMemberContextMenu(e, member)}
                        style={{ width: '100%' }}
                      >
                        <TouchableOpacity
                          style={[styles.memberItemButton, isSelected && styles.memberItemActive]}
                          onPress={() => handleMemberPress(member)}
                        >
                          <View style={styles.memberItemContent}>
                            <View style={styles.memberAvatarCircle}>
                              <Text style={styles.memberAvatarText}>{initialLetter}</Text>
                            </View>
                            <Text style={[styles.itemText, isSelected && styles.itemTextActive]} numberOfLines={1}>
                              {memberUID}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ width: '100%' }}>
                    <View style={styles.memberItemContent}>
                      <View style={styles.memberAvatarCircle}>
                        <Text style={styles.memberAvatarText}>U</Text>
                      </View>
                      <Text style={styles.itemText}>User: {uid}</Text>
                    </View>
                  </div>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Chat Box */}
        <View style={styles.chatBox}>
          <Text style={styles.boxLabel}>Chat Box {activeToUIDName ? `- [From: ${activeToUIDName}]` : ''}</Text>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={scrollToBottom}
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyChatText}>
                {activeToUID ? 'No messages yet. Start conversation...' : 'Select a member to start chatting...'}
              </Text>
            ) : (
              messages.map((msg, idx) => {
                const matchFile = msg.text ? msg.text.match(/file:<<<<<<([A-Za-z0-9]+)>>>>>>/) : null;
                const __ufid = matchFile ? matchFile[1] : null;

                const isCallMsg = msg.text && msg.text.includes('call:<<<<<<Calling>>>>>>');
                const isEndCallMsg = msg.text && msg.text.includes('call:<<<<<<End>>>>>>');
                let callDisplayLabel = '';
                let isWithinExpiry = false;

                if (isCallMsg && msg.timestamp) {
                  const msgTime = new Date(msg.timestamp).getTime();
                  const deviceTime = Date.now();
                  const diffMinutes = (deviceTime - msgTime) / (1000 * 60);

                  if (diffMinutes <= CALL_EXPIRY_MINUTES) {
                    callDisplayLabel = 'Calling is coming';
                    isWithinExpiry = true;
                  } else {
                    callDisplayLabel = 'Calling was coming';
                  }
                }

                return (
                  <View
                    key={msg.id || idx}
                    style={[styles.messageRow, msg.isUser ? styles.messageRowRight : styles.messageRowLeft]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        msg.isUser ? styles.messageBubbleUser : styles.messageBubbleMember,
                      ]}
                    >
                      <Text style={[styles.msgText, msg.isUser ? styles.msgTextUser : styles.msgTextMember]}>
                        {!msg.isUser && <Text style={styles.msgSender}>{msg.sender}: </Text>}
                        {isEndCallMsg ? (
                          <Text style={styles.callExpiredText}>Call Ended</Text>
                        ) : isCallMsg ? (
                          isWithinExpiry ? (
                            <Text
                              style={styles.callLinkTextBold}
                              onPress={handleOpenCallPopup}
                            >
                              {callDisplayLabel} (Click to Answer)
                            </Text>
                          ) : (
                            <Text style={styles.callExpiredText}>{callDisplayLabel}</Text>
                          )
                        ) : __ufid ? (
                          <>
                            {msg.text.replace(matchFile[0], '').trim()}
                            {' '}
                            <Text
                              style={styles.fileLinkTextBold}
                              onPress={() => handleOpenFileExplorer(__ufid)}
                            >
                              files
                            </Text>
                          </>
                        ) : (
                          msg.text
                        )}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Context Menu */}
      {contextMenu.visible && (
        <View style={styles.contextMenuOverlay}>
          <TouchableOpacity
            style={styles.contextMenuBackdrop}
            activeOpacity={1}
            onPress={() => setContextMenu({ visible: false, x: 0, y: 0, member: null })}
          >
            <View style={[styles.contextMenuBox, { top: Math.min(contextMenu.y, 400), left: Math.min(contextMenu.x, 250) }]}>
              <View style={styles.contextMenuHeader}>
                <Text style={styles.contextMenuHeaderTitle}>
                  Options: {contextMenu.member?.uid || contextMenu.member?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={(e: any) => {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  handleMenuAction('Personal Info');
                }}
              >
                <Text style={styles.contextMenuText}>Personal Info</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={(e: any) => {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  handleMenuAction('Delete member');
                }}
              >
                <Text style={styles.contextMenuText}>Delete member</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contextMenuItem, styles.contextMenuDangerItem]}
                onPress={(e: any) => {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  handleMenuAction('Block member');
                }}
              >
                <Text style={styles.contextMenuDangerText}>Block member</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* MemberInfo Modal */}
      {showMemberInfoModal && selectedMemberInfo && typeof window !== 'undefined' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMemberInfoMaximized ? 0 : 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMemberInfoModal(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: isMemberInfoMaximized ? '100%' : 600,
              height: isMemberInfoMaximized ? '100%' : 'auto',
              maxHeight: isMemberInfoMaximized ? '100%' : '90%',
              backgroundColor: '#FFFFFF',
              borderRadius: isMemberInfoMaximized ? 0 : 8,
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MemberInfo
              recordid={selectedMemberInfo.id || selectedMemberInfo.uid}
              objectid={selectedMemberInfo.objectid || 'PORTAL_USER_FORM_ID'}
              onClose={() => setShowMemberInfoModal(false)}
              onMaximize={() => setIsMemberInfoMaximized(!isMemberInfoMaximized)}
            />
          </div>
        </div>
      )}

      {/* Toolbar Line */}
      <View style={styles.toolbarLine}>
        <TouchableOpacity
          style={styles.emoticonButton}
          onPress={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowFileUploadModal(false);
          }}
        >
          <EmoticonIcon size={14} color="#4338CA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fileUploadToolbarButton}
          onPress={() => {
            setShowFileUploadModal(!showFileUploadModal);
            setShowEmojiPicker(false);
          }}
        >
          <FileUploadIcon size={14} color="#4338CA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callToolbarButton}
          onPress={handleOpenCallPopup}
        >
          <CallIcon size={14} color="#4338CA" />
        </TouchableOpacity>
      </View>

      {/* Voice Call Popup */}
      {showVoiceCallPopup && (
        <View style={styles.voiceCallPopupOverlay}>
          <View style={styles.voiceCallPopupBox}>
            <Text style={styles.voicePopupTitle}>
              {isIncomingCall ? 'Incoming Voice Call' : 'Voice Call'}
            </Text>
            <Text style={styles.voicePopupTarget}>With: {activeToUIDName || activeToUID}</Text>

            {isIncomingCall ? (
              <View style={{ alignItems: 'center', marginBottom: 16, gap: 8 }}>
                <Text style={styles.voicePopupStatus}>{callStatus}</Text>
                <View style={styles.voicePopupActionsRow}>
                  <TouchableOpacity
                    style={[styles.voiceActionButton, { backgroundColor: '#10B981', borderColor: '#059669' }]}
                    onPress={handleAcceptCall}
                  >
                    <Text style={[styles.voiceActionText, { color: '#FFFFFF' }]}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.voiceActionButton, styles.endCallActionButton]}
                    onPress={handleCloseCall}
                  >
                    <Text style={[styles.voiceActionText, { color: '#FFFFFF' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : isCallingWaiting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ActivityIndicator size="small" color="#4338CA" />
                <Text style={styles.voicePopupStatus}>{callStatus}</Text>
              </div>
            ) : (
              <>
                <Text style={[styles.voicePopupStatus, { color: '#10B981', marginBottom: 16 }]}>
                  {callStatus}
                </Text>
                <View style={styles.voicePopupActionsRow}>
                  <TouchableOpacity
                    style={[styles.voiceActionButton, isMuted && styles.mutedActionButton]}
                    onPress={handleToggleMute}
                  >
                    <MuteIcon size={20} muted={isMuted} />
                    <Text style={styles.voiceActionText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.voiceActionButton, styles.endCallActionButton]}
                    onPress={handleCloseCall}
                  >
                    <EndCallIcon size={20} color="#FFFFFF" />
                    <Text style={[styles.voiceActionText, { color: '#FFFFFF' }]}>End Call</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Emoticon Picker */}
      {showEmojiPicker && (
        <View style={styles.emojiPopupContainer}>
          <View style={styles.emojiPopupHeader}>
            <Text style={styles.boxLabel}>Select Emoticon</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.emojiCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.emojiGrid}>
            {EMOTICONS.map((emoji, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.emojiItem}
                onPress={() => handleSelectEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* File Upload Modal */}
      {showFileUploadModal && (
        <View style={[styles.fileModalOverlay, isModalMaximized && styles.fileModalMaximizedOverlay]}>
          <View style={[styles.fileModalBox, isModalMaximized && styles.fileModalMaximizedBox]}>
            <View style={styles.fileModalHeaderBar}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setIsModalMaximized(!isModalMaximized)}
              >
                {isModalMaximized ? <MinimizeIcon color="#FFFFFF" size={16} /> : <MaximizeIcon color="#FFFFFF" size={16} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowFileUploadModal(false)}
              >
                <CloseIcon color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.fileModalBody}>
              <View style={styles.fileSelectRow}>
                <Text style={styles.fileLabelText}>Select Local Files:</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => hiddenFileInputRef.current?.click()}
                >
                  <Text style={styles.browseButtonText}>...</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fileListSection}>
                <Text style={styles.fileLabelText}>Selected Files:</Text>
                <ScrollView style={styles.selectedFilesContainer}>
                  {selectedFiles.length === 0 ? (
                    <Text style={styles.noFilesText}>No files selected yet.</Text>
                  ) : (
                    selectedFiles.map((fileItem, index) => (
                      <View key={index} style={styles.fileRowItem}>
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          • {fileItem.fullpath} ({(fileItem.originFile.size / 1024).toFixed(1)} KB)
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Text style={styles.removeFileText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.uploadActionBtn, selectedFiles.length === 0 && styles.sendBtnDisabled]}
                onPress={handleUploadFiles}
                disabled={selectedFiles.length === 0}
              >
                <Text style={styles.uploadActionBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showFilesExplorer && (
        <FilesExplorerPanel
          visible={showFilesExplorer}
          tableName={tableName}
          sessionId={sessionid}
          fileValue={selectedFileValue}
          onClose={() => setShowFilesExplorer(false)}
        />
      )}

      {/* Write Box */}
      <View style={styles.writeBox}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          placeholder={activeToUID ? `Type message to ${activeToUIDName}...` : 'Select a member first...'}
          value={messageText}
          onChangeText={setMessageText}
          onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
          onSubmitEditing={handleSendMessage}
          editable={!!activeToUID}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !activeToUID && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={!activeToUID}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Action Box */}
      <View style={styles.actionBox}>
        <Text style={styles.boxText}>Action Box (Session: {sessionid})</Text>
      </View>

      {showNewPanel && typeof window !== 'undefined' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewPanel(false);
            }
          }}
        >
          <div
            ref={newPanelRef}
            style={{
              width: '100%',
              maxWidth: 500,
              maxHeight: '90%',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
          >
            <NewPanel
              tableName="d2693847-b291-415c-b683-d66c2acaf3f6"
              parentid={uid}
              sessionId={sessionid}
              onClose={() => {
                setShowNewPanel(false);
                refreshMembers();
              }}
              onSuccess={() => {
                setShowNewPanel(false);
                refreshMembers();
              }}
            />
          </div>
        </div>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 8,
    gap: 8,
    alignSelf: 'center',
    margin: 0,
  },
  desktopSize: {
    width: '65%',
    height: '80%',
    maxHeight: 700,
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
    margin: 0,
    borderRadius: 0,
  },
  uploadProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 10,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  uploadProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  topHeaderRow: {
    height: 38,
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  userBox: {
    height: 42,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  middleBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  middleBodyMobile: {
    flexDirection: 'column',
  },
  mobileMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    flexDirection: 'row',
  },
  mobileMenuDismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mobileMenuDrawer: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000000',
    padding: 8,
    height: '100%',
    zIndex: 100,
  },
  memberBox: {
    width: 180,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  memberBoxCollapsed: {
    width: 48,
    padding: 4,
    alignItems: 'center',
  },
  memberBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberHeaderLeft: {
    flex: 1,
  },
  memberHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    justifyContent: 'center',
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  collapseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  memberItemButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginVertical: 1,
  },
  memberItemActive: {
    backgroundColor: '#EEF2FF',
  },
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberAvatarCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4338CA',
    lineHeight: 10,
  },
  chatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  toolbarLine: {
    height: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  emoticonButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 4,
    top: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileUploadToolbarButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 28,
    top: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  callToolbarButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 52,
    top: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceCallPopupOverlay: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    right: '25%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 20,
    zIndex: 99999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  voiceCallPopupBox: {
    width: '100%',
    alignItems: 'center',
  },
  voicePopupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  voicePopupStatus: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  voicePopupTarget: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  voicePopupActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  voiceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  mutedActionButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  endCallActionButton: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  voiceActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  emojiPopupContainer: {
    position: 'absolute',
    bottom: 54,
    left: 8,
    width: 220,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    padding: 6,
    zIndex: 9999,
  },
  emojiPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 2,
  },
  emojiCloseText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
  },
  emojiItem: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  emojiText: {
    fontSize: 16,
  },
  fileModalOverlay: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileModalMaximizedOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fileModalBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  fileModalMaximizedBox: {
    borderRadius: 0,
  },
  fileModalHeaderBar: {
    height: 38,
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  fileModalBody: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  fileSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fileLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  browseButton: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    letterSpacing: 2,
  },
  fileListSection: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#F8FAFC',
    marginVertical: 8,
  },
  selectedFilesContainer: {
    flex: 1,
    marginTop: 4,
  },
  noFilesText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  fileRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fileNameText: {
    fontSize: 11,
    color: '#1E293B',
    flex: 1,
  },
  removeFileText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
    paddingHorizontal: 4,
  },
  uploadActionBtn: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  uploadActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  fileLinkTextBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4338CA',
    textDecorationLine: 'underline',
  },
  callLinkTextBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10B981',
    textDecorationLine: 'underline',
  },
  callExpiredText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  writeBox: {
    height: 42,
    borderWidth: 1,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  actionBox: {
    height: 42,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxText: {
    fontSize: 12,
    color: '#000000',
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  itemText: {
    fontSize: 11,
    color: '#333333',
    flex: 1,
  },
  itemTextActive: {
    fontWeight: '700',
    color: '#4338CA',
  },
  emptyChatText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  chatContent: {
    gap: 6,
    paddingVertical: 4,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  messageBubbleMember: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageBubbleUser: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  msgSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  msgText: {
    fontSize: 11,
  },
  msgTextMember: {
    color: '#1E293B',
  },
  msgTextUser: {
    color: '#312E81',
  },
  textInput: {
    flex: 1,
    height: 32,
    fontSize: 11,
    color: '#000000',
    paddingHorizontal: 4,
  },
  sendBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  contextMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999999,
  },
  contextMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  contextMenuBox: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 6,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  contextMenuHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  contextMenuHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  contextMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginVertical: 1,
  },
  contextMenuText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  contextMenuDangerItem: {
    backgroundColor: '#FEF2F2',
  },
  contextMenuDangerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default ChatPanel;