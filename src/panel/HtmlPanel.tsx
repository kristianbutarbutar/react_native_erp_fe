// panel/HtmlPanel.tsx
'use client';

import React, { useState, useRef, useEffect, createElement } from 'react';
import { createPortal } from 'react-dom';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Switch,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import {
    DEFAULT_HTML_CONTENT,
    execEditorCommand,
    adjustSelectedTextFontSize,
    generateTableHtml,
    saveHtmlToDiskOrNetwork,
    saveToCloud,
    openHtmlFileFromDisk,
    manipulateTable,
    applyTableFormatting,
    mergeCellsRight,
    mergeCellsDown,
    splitMergedCell,
    exportDocument,
    previewHtmlInNewTab,
    readFile,
    type TableFormatStyles,
} from './ts/HtmlPanel';
import type { MenuGroupDef } from './ts/HtmlPanelTypes';
import HtmlTopMenuBar from './HtmlTopMenuBar';
import ObjectPanel from './../customer/ObjectPanel';

export interface HtmlPanelProps {
    initialContent?: string;
    sessionId?: string;
    sessionid?: string;
    record?: Record<string, any> | null;
    setSavedFileId?: (html: string) => void;
    onChange?: (html: string) => void;
    onSave?: (html: string) => void;
    onClose?: () => void;
    readOnly?: boolean;
    defaultFloating?: boolean;
}

const editorStyles = `
  .html-editor-content {
    min-height: 440px;
    height: 100%;
    padding: 24px;
    background-color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #1e293b;
    outline: none;
    overflow-y: auto;
    box-sizing: border-box;
  }
  .html-editor-content img {
    max-width: 100%;
    height: auto;
    cursor: pointer;
    transition: outline 0.15s ease;
    display: inline-block;
    vertical-align: middle;
  }
  .html-editor-content img.selected-editor-img {
    outline: 2px solid #4F46E5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
  }
  .html-editor-content table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin: 12px 0 !important;
    position: relative;
  }
  .html-editor-content th,
  .html-editor-content td {
    position: relative;
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    vertical-align: top;
    box-sizing: border-box;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    white-space: normal !important;
    cursor: cell;
  }
  .html-editor-content th {
    background-color: #f1f5f9;
    font-weight: 700;
  }
  .html-editor-content th.selected-editor-col,
  .html-editor-content td.selected-editor-col {
    background-color: #EEF2FF !important;
    outline: 2px solid #4F46E5 !important;
    outline-offset: -2px;
  }
  .table-col-resizer-right {
    position: absolute;
    top: 0;
    right: -4px;
    width: 8px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
    z-index: 10;
  }
  .table-col-resizer-left {
    position: absolute;
    top: 0;
    left: -4px;
    width: 8px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
    z-index: 10;
  }
  .table-row-resizer-bottom {
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 8px;
    cursor: row-resize;
    user-select: none;
    z-index: 10;
  }
  .table-row-resizer-top {
    position: absolute;
    top: -4px;
    left: 0;
    width: 100%;
    height: 8px;
    cursor: row-resize;
    user-select: none;
    z-index: 10;
  }
  .table-corner-resizer {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
    user-select: none;
    z-index: 15;
    background-color: transparent;
  }
  .table-col-resizer-right:hover,
  .table-col-resizer-left:hover,
  .table-row-resizer-bottom:hover,
  .table-row-resizer-top:hover,
  .table-corner-resizer:hover,
  .resizing {
    background-color: #4F46E5 !important;
    opacity: 0.8 !important;
  }
  .html-editor-content.show-visual-aids table,
  .html-editor-content.show-visual-aids td,
  .html-editor-content.show-visual-aids th {
    outline: 1px dashed #94a3b8 !important;
  }
  .html-editor-content.show-blocks p,
  .html-editor-content.show-blocks div,
  .html-editor-content.show-blocks blockquote {
    border: 1px dotted #94a3b8 !important;
    margin: 4px 0;
  }
  .html-editor-content h1 { font-size: 26px; font-weight: 800; margin: 0 0 16px 0; color: #000000; }
  .html-editor-content h2 { font-size: 20px; font-weight: 700; margin: 16px 0 12px 0; color: #0f172a; }
  .html-editor-content p { margin: 0 0 12px 0; }
  .html-editor-source-textarea {
    width: 100%;
    height: 100%;
    min-height: 440px;
    padding: 16px;
    font-family: "Courier New", Courier, monospace;
    font-size: 13px;
    line-height: 1.5;
    background-color: #0f172a;
    color: #38bdf8;
    border: none;
    outline: none;
    box-sizing: border-box;
    resize: none;
  }
`;

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
        createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
        createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
    );

const MaximizeIcon = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('path', { d: 'M15 3h6v6' }),
        createElement('path', { d: 'M9 21H3v-6' }),
        createElement('path', { d: 'M21 3l-7 7' }),
        createElement('path', { d: 'M3 21l7-7' })
    );

const MinimizeIcon = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) =>
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
        createElement('path', { d: 'M4 14h6v6' }),
        createElement('path', { d: 'M20 10h-6V4' }),
        createElement('path', { d: 'M14 10l7-7' }),
        createElement('path', { d: 'M10 14l-7 7' })
    );

export const HtmlPanel: React.FC<HtmlPanelProps> = ({
    initialContent = DEFAULT_HTML_CONTENT,
    sessionId = 'sess_12345',
    sessionid,
    record = null,
    setSavedFileId,
    onChange,
    onSave,
    onClose,
    readOnly = false,
    defaultFloating = true,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const activeSessionId = sessionId || sessionid || 'sess_12345';

    const [isFloating, setIsFloating] = useState<boolean>(defaultFloating);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [htmlContent, setHtmlContent] = useState<string>(initialContent);
    const [isSourceMode, setIsSourceMode] = useState<boolean>(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const [showCloudFilesModal, setShowCloudFilesModal] = useState<boolean>(false);
    const [showVisualAids, setShowVisualAids] = useState<boolean>(true);
    const [showBlocks, setShowBlocks] = useState<boolean>(false);
    const [showInvisibleChars, setShowInvisibleChars] = useState<boolean>(false);

    const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
    const [showImageModal, setShowImageModal] = useState<boolean>(false);
    const [imageModalWidth, setImageModalWidth] = useState<string>('300');
    const [imageModalHeight, setImageModalHeight] = useState<string>('200');
    const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
    const [imageAspectRatio, setImageAspectRatio] = useState<number>(1.5);

    const [selectedColIndices, setSelectedColIndices] = useState<number[]>([]);
    const [activeTableTotalCols, setActiveTableTotalCols] = useState<number>(3);

    const [showTableModal, setShowTableModal] = useState<boolean>(false);
    const [tableRows, setTableRows] = useState<string>('3');
    const [tableCols, setTableCols] = useState<string>('3');

    const [showTableFormatModal, setShowTableFormatModal] = useState<boolean>(false);
    const [formatScope, setFormatScope] = useState<'cell' | 'row' | 'column' | 'selected-columns' | 'table'>('cell');
    const [formatBorderWidth, setFormatBorderWidth] = useState<string>('1px');
    const [formatBorderStyle, setFormatBorderStyle] = useState<string>('solid');
    const [formatBorderColor, setFormatBorderColor] = useState<string>('#94a3b8');
    const [formatBgColor, setFormatBgColor] = useState<string>('#ffffff');
    const [formatTextColor, setFormatTextColor] = useState<string>('#1e293b');
    const [formatPadding, setFormatPadding] = useState<string>('8px 12px');
    const [formatTextAlign, setFormatTextAlign] = useState<string>('left');
    const [formatVerticalAlign, setFormatVerticalAlign] = useState<string>('top');

    const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
    const [linkInput, setLinkInput] = useState<string>('');

    const editorRef = useRef<HTMLDivElement | null>(null);
    const savedSelectionRangeRef = useRef<Range | null>(null);
    const lastActiveCellRef = useRef<HTMLElement | null>(null);

    const applyContentToEditor = (content: string) => {
        setHtmlContent(content);
        if (editorRef.current && !isSourceMode) {
            editorRef.current.innerHTML = content;
        }
        if (onChange) onChange(content);
    };

    useEffect(() => {
        if (record && record.savedname) {
            (async () => {
                try {
                    const streamText = await readFile({ record, sessionId: activeSessionId });
                    if (streamText && streamText.trim().length > 0) {
                        applyContentToEditor(streamText);
                    }
                } catch (err) {
                    console.error('Error loading file stream in HtmlPanel:', err);
                }
            })();
        }
    }, [record, activeSessionId]);

    useEffect(() => {
        if (editorRef.current && !isSourceMode) {
            if (editorRef.current.innerHTML !== htmlContent) {
                editorRef.current.innerHTML = htmlContent;
            }
        }
    }, [isSourceMode, isFloating, isMaximized]);

    useEffect(() => {
        if (!editorRef.current || isSourceMode) return;
        const editorDom = editorRef.current;

        const handleTableClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.classList.contains('table-col-resizer-right') ||
                target.classList.contains('table-row-resizer-bottom')
            ) {
                return;
            }

            const cell = target.closest('th, td') as HTMLTableCellElement | null;
            const table = cell?.closest('table');

            if (cell && table) {
                lastActiveCellRef.current = cell;
                const colIdx = cell.cellIndex;
                const totalColumns = table.rows[0]?.cells.length || 3;
                setActiveTableTotalCols(totalColumns);

                if (cell.tagName.toLowerCase() === 'th' || e.ctrlKey || e.metaKey || e.shiftKey) {
                    setSelectedColIndices((prev) => {
                        let next: number[];
                        if (e.ctrlKey || e.metaKey) {
                            next = prev.includes(colIdx) ? prev.filter((i) => i !== colIdx) : [...prev, colIdx];
                        } else if (e.shiftKey && prev.length > 0) {
                            const start = Math.min(prev[0], colIdx);
                            const end = Math.max(prev[0], colIdx);
                            next = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                        } else {
                            next = [colIdx];
                        }
                        return next;
                    });
                }
            }
        };

        editorDom.addEventListener('click', handleTableClick);
        return () => {
            editorDom.removeEventListener('click', handleTableClick);
        };
    }, [isSourceMode, htmlContent]);

    useEffect(() => {
        if (!editorRef.current || isSourceMode) return;
        const editorDom = editorRef.current;

        const allCells = editorDom.querySelectorAll('table th, table td');
        allCells.forEach((c) => c.classList.remove('selected-editor-col'));

        if (selectedColIndices.length > 0) {
            const table = lastActiveCellRef.current?.closest('table') || editorDom.querySelector('table');
            if (table) {
                Array.from(table.rows).forEach((row) => {
                    selectedColIndices.forEach((idx) => {
                        if (row.cells[idx]) {
                            row.cells[idx].classList.add('selected-editor-col');
                        }
                    });
                });
            }
        }
    }, [selectedColIndices, isSourceMode, htmlContent]);

    useEffect(() => {
        if (!editorRef.current || isSourceMode) return;
        const editor = editorRef.current;

        const attachMultiDirectionalResizers = () => {
            const tables = editor.querySelectorAll('table');
            tables.forEach((table) => {
                const rows = table.rows;
                if (!rows.length) return;

                Array.from(rows).forEach((row, rIdx) => {
                    Array.from(row.cells).forEach((cell, cIdx) => {
                        const isFirstCol = cIdx === 0;
                        const isLastCol = cIdx === row.cells.length - 1;
                        const isFirstRow = rIdx === 0;
                        const isLastRow = rIdx === rows.length - 1;

                        if (!cell.querySelector('.table-col-resizer-right')) {
                            const resizerRight = document.createElement('div');
                            resizerRight.className = 'table-col-resizer-right';
                            resizerRight.contentEditable = 'false';
                            cell.appendChild(resizerRight);

                            let startX = 0;
                            let startWidth = 0;
                            let nextCell: HTMLTableCellElement | null = null;
                            let nextStartWidth = 0;

                            const onMouseMoveRight = (e: MouseEvent) => {
                                const diffX = e.pageX - startX;
                                const newWidth = Math.max(30, startWidth + diffX);
                                cell.style.width = `${newWidth}px`;
                                cell.setAttribute('width', `${newWidth}`);

                                if (nextCell) {
                                    const newNextWidth = Math.max(30, nextStartWidth - diffX);
                                    nextCell.style.width = `${newNextWidth}px`;
                                    nextCell.setAttribute('width', `${newNextWidth}`);
                                }
                            };

                            const onMouseUpRight = () => {
                                resizerRight.classList.remove('resizing');
                                document.removeEventListener('mousemove', onMouseMoveRight);
                                document.removeEventListener('mouseup', onMouseUpRight);
                                handleContentInput();
                            };

                            resizerRight.addEventListener('mousedown', (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resizerRight.classList.add('resizing');
                                startX = e.pageX;
                                startWidth = cell.offsetWidth;
                                nextCell = (cell.nextElementSibling as HTMLTableCellElement) || null;
                                if (nextCell) {
                                    nextStartWidth = nextCell.offsetWidth;
                                }
                                document.addEventListener('mousemove', onMouseMoveRight);
                                document.addEventListener('mouseup', onMouseUpRight);
                            });
                        }

                        if (isFirstCol && !cell.querySelector('.table-col-resizer-left')) {
                            const resizerLeft = document.createElement('div');
                            resizerLeft.className = 'table-col-resizer-left';
                            resizerLeft.contentEditable = 'false';
                            cell.appendChild(resizerLeft);

                            let startX = 0;
                            let startWidth = 0;

                            const onMouseMoveLeft = (e: MouseEvent) => {
                                const diffX = startX - e.pageX;
                                const newWidth = Math.max(30, startWidth + diffX);
                                cell.style.width = `${newWidth}px`;
                                cell.setAttribute('width', `${newWidth}`);
                            };

                            const onMouseUpLeft = () => {
                                resizerLeft.classList.remove('resizing');
                                document.removeEventListener('mousemove', onMouseMoveLeft);
                                document.removeEventListener('mouseup', onMouseUpLeft);
                                handleContentInput();
                            };

                            resizerLeft.addEventListener('mousedown', (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resizerLeft.classList.add('resizing');
                                startX = e.pageX;
                                startWidth = cell.offsetWidth;
                                document.addEventListener('mousemove', onMouseMoveLeft);
                                document.addEventListener('mouseup', onMouseUpLeft);
                            });
                        }

                        if (!cell.querySelector('.table-row-resizer-bottom')) {
                            const resizerBottom = document.createElement('div');
                            resizerBottom.className = 'table-row-resizer-bottom';
                            resizerBottom.contentEditable = 'false';
                            cell.appendChild(resizerBottom);

                            let startY = 0;
                            let startHeight = 0;

                            const onMouseMoveBottom = (e: MouseEvent) => {
                                const diffY = e.pageY - startY;
                                const newHeight = Math.max(24, startHeight + diffY);
                                row.style.height = `${newHeight}px`;
                                Array.from(row.cells).forEach((c) => {
                                    c.style.height = `${newHeight}px`;
                                });
                            };

                            const onMouseUpBottom = () => {
                                resizerBottom.classList.remove('resizing');
                                document.removeEventListener('mousemove', onMouseMoveBottom);
                                document.removeEventListener('mouseup', onMouseUpBottom);
                                handleContentInput();
                            };

                            resizerBottom.addEventListener('mousedown', (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resizerBottom.classList.add('resizing');
                                startY = e.pageY;
                                startHeight = row.offsetHeight;
                                document.addEventListener('mousemove', onMouseMoveBottom);
                                document.addEventListener('mouseup', onMouseUpBottom);
                            });
                        }

                        if (isFirstRow && !cell.querySelector('.table-row-resizer-top')) {
                            const resizerTop = document.createElement('div');
                            resizerTop.className = 'table-row-resizer-top';
                            resizerTop.contentEditable = 'false';
                            cell.appendChild(resizerTop);

                            let startY = 0;
                            let startHeight = 0;

                            const onMouseMoveTop = (e: MouseEvent) => {
                                const diffY = startY - e.pageY;
                                const newHeight = Math.max(24, startHeight + diffY);
                                row.style.height = `${newHeight}px`;
                                Array.from(row.cells).forEach((c) => {
                                    c.style.height = `${newHeight}px`;
                                });
                            };

                            const onMouseUpTop = () => {
                                resizerTop.classList.remove('resizing');
                                document.removeEventListener('mousemove', onMouseMoveTop);
                                document.removeEventListener('mouseup', onMouseUpTop);
                                handleContentInput();
                            };

                            resizerTop.addEventListener('mousedown', (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                resizerTop.classList.add('resizing');
                                startY = e.pageY;
                                startHeight = row.offsetHeight;
                                document.addEventListener('mousemove', onMouseMoveTop);
                                document.addEventListener('mouseup', onMouseUpTop);
                            });
                        }

                        if (isLastRow && isLastCol && !cell.querySelector('.table-corner-resizer')) {
                            const cornerResizer = document.createElement('div');
                            cornerResizer.className = 'table-corner-resizer';
                            cornerResizer.contentEditable = 'false';
                            cell.appendChild(cornerResizer);

                            let startX = 0;
                            let startY = 0;
                            let startTableW = 0;
                            let startRowH = 0;

                            const onMouseMoveCorner = (e: MouseEvent) => {
                                const diffX = e.pageX - startX;
                                const diffY = e.pageY - startY;

                                const newTableW = Math.max(100, startTableW + diffX);
                                table.style.width = `${newTableW}px`;

                                const newRowH = Math.max(24, startRowH + diffY);
                                row.style.height = `${newRowH}px`;
                            };

                            const onMouseUpCorner = () => {
                                cornerResizer.classList.remove('resizing');
                                document.removeEventListener('mousemove', onMouseMoveCorner);
                                document.removeEventListener('mouseup', onMouseUpCorner);
                                handleContentInput();
                            };

                            cornerResizer.addEventListener('mousedown', (e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                cornerResizer.classList.add('resizing');
                                startX = e.pageX;
                                startY = e.pageY;
                                startTableW = table.offsetWidth;
                                startRowH = row.offsetHeight;
                                document.addEventListener('mousemove', onMouseMoveCorner);
                                document.addEventListener('mouseup', onMouseUpCorner);
                            });
                        }
                    });
                });
            });
        };

        attachMultiDirectionalResizers();
    }, [htmlContent, isSourceMode]);

    useEffect(() => {
        if (!editorRef.current || isSourceMode) return;
        const editorDom = editorRef.current;

        const handleEditorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'img') {
                const img = target as HTMLImageElement;
                editorDom.querySelectorAll('img').forEach((i) => i.classList.remove('selected-editor-img'));
                img.classList.add('selected-editor-img');
                setSelectedImgEl(img);

                const currentW = img.offsetWidth || img.naturalWidth || 300;
                const currentH = img.offsetHeight || img.naturalHeight || 200;
                setImageModalWidth(String(currentW));
                setImageModalHeight(String(currentH));
                setImageAspectRatio(currentW / (currentH || 1));
            } else {
                editorDom.querySelectorAll('img').forEach((i) => i.classList.remove('selected-editor-img'));
                setSelectedImgEl(null);
            }
        };

        const handleEditorDblClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'img') {
                const img = target as HTMLImageElement;
                setSelectedImgEl(img);
                const currentW = img.offsetWidth || img.naturalWidth || 300;
                const currentH = img.offsetHeight || img.naturalHeight || 200;
                setImageModalWidth(String(currentW));
                setImageModalHeight(String(currentH));
                setImageAspectRatio(currentW / (currentH || 1));
                setShowImageModal(true);
            }
        };

        editorDom.addEventListener('click', handleEditorClick);
        editorDom.addEventListener('dblclick', handleEditorDblClick);

        return () => {
            editorDom.removeEventListener('click', handleEditorClick);
            editorDom.removeEventListener('dblclick', handleEditorDblClick);
        };
    }, [isSourceMode, htmlContent]);

    const recordEditorSelection = () => {
        if (typeof window === 'undefined' || !editorRef.current) return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
            savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
            const node = sel.anchorNode;
            const cell = (node?.nodeType === 1 ? (node as HTMLElement) : node?.parentElement)?.closest('td, th, table');
            if (cell) {
                lastActiveCellRef.current = cell as HTMLElement;
            }
        }
    };

    const restoreEditorSelection = () => {
        if (typeof window === 'undefined' || !editorRef.current) return;
        const sel = window.getSelection();
        if (sel && savedSelectionRangeRef.current) {
            try {
                sel.removeAllRanges();
                sel.addRange(savedSelectionRangeRef.current);
            } catch (e) {
                // Stale range
            }
        }
    };

    const handleContentInput = () => {
        if (editorRef.current) {
            const newHtml = editorRef.current.innerHTML;
            setHtmlContent(newHtml);
            if (onChange) onChange(newHtml);
        }
    };

    const handleSourceChange = (text: string) => {
        setHtmlContent(text);
        if (onChange) onChange(text);
    };

    const insertHtmlDirectly = (htmlMarkup: string) => {
        if (isSourceMode || !editorRef.current) return;

        restoreEditorSelection();
        const selection = window.getSelection();

        let inserted = false;
        if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
            try {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = htmlMarkup;
                const frag = document.createDocumentFragment();
                let lastNode: Node | null = null;
                while (tempContainer.firstChild) {
                    lastNode = frag.appendChild(tempContainer.firstChild);
                }
                range.insertNode(frag);
                if (lastNode) {
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                inserted = true;
            } catch (err) {
                console.warn('Range insertion failed, trying execCommand:', err);
            }
        }

        if (!inserted) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlMarkup;
            while (tempDiv.firstChild) {
                editorRef.current.appendChild(tempDiv.firstChild);
            }
        }

        handleContentInput();
    };

    const runCommand = (cmd: string, val: string | undefined = undefined) => {
        setActiveMenu(null);
        if (isSourceMode) return;
        restoreEditorSelection();
        execEditorCommand(cmd, val);
        handleContentInput();
    };

    const handleAdjustFontSize = (deltaOrSize: number | string) => {
        setActiveMenu(null);
        if (isSourceMode) return;
        restoreEditorSelection();
        adjustSelectedTextFontSize(deltaOrSize);
        handleContentInput();
    };

    const handleInsertTable = () => {
        const r = parseInt(tableRows, 10) || 3;
        const c = parseInt(tableCols, 10) || 3;
        const tableMarkup = generateTableHtml(r, c, true);
        insertHtmlDirectly(tableMarkup);
        setShowTableModal(false);
    };

    const handleTableModification = (
        action:
            | 'insertRowAbove'
            | 'insertRowBelow'
            | 'deleteRow'
            | 'insertColLeft'
            | 'insertColRight'
            | 'deleteCol'
            | 'deleteTable'
    ) => {
        setActiveMenu(null);
        if (isSourceMode) return;
        const success = manipulateTable(action, lastActiveCellRef.current);
        if (success) {
            handleContentInput();
        }
    };

    const handleMergeRight = () => {
        setActiveMenu(null);
        if (isSourceMode) return;
        if (mergeCellsRight(lastActiveCellRef.current)) {
            handleContentInput();
        }
    };

    const handleMergeDown = () => {
        setActiveMenu(null);
        if (isSourceMode) return;
        if (mergeCellsDown(lastActiveCellRef.current)) {
            handleContentInput();
        }
    };

    const handleSplitCell = () => {
        setActiveMenu(null);
        if (isSourceMode) return;
        if (splitMergedCell(lastActiveCellRef.current)) {
            handleContentInput();
        }
    };

    const handleApplyTableFormatting = () => {
        const stylesToApply: TableFormatStyles = {
            scope: formatScope,
            selectedColumnIndices: selectedColIndices,
            borderWidth: formatBorderWidth,
            borderStyle: formatBorderStyle,
            borderColor: formatBorderColor,
            backgroundColor: formatBgColor,
            textColor: formatTextColor,
            padding: formatPadding,
            textAlign: formatTextAlign,
            verticalAlign: formatVerticalAlign,
        };

        const success = applyTableFormatting(stylesToApply, lastActiveCellRef.current);
        if (success) {
            handleContentInput();
        }
        setShowTableFormatModal(false);
    };

    const openFormatModalWithScope = (scope: 'cell' | 'row' | 'column' | 'selected-columns' | 'table') => {
        recordEditorSelection();
        setFormatScope(scope);

        if (lastActiveCellRef.current) {
            const computed = window.getComputedStyle(lastActiveCellRef.current);
            if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                setFormatBgColor(computed.backgroundColor);
            }
            if (computed.color) {
                setFormatTextColor(computed.color);
            }
            if (computed.textAlign) {
                setFormatTextAlign(computed.textAlign);
            }
            if (computed.padding) {
                setFormatPadding(computed.padding);
            }
        }

        setShowTableFormatModal(true);
    };

    const handleToggleColumnSelection = (colIdx: number) => {
        setSelectedColIndices((prev) =>
            prev.includes(colIdx) ? prev.filter((i) => i !== colIdx) : [...prev, colIdx]
        );
    };

    const handleSetCellAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
        recordEditorSelection();
        if (selectedColIndices.length > 0) {
            applyTableFormatting(
                { scope: 'selected-columns', selectedColumnIndices: selectedColIndices, textAlign: align },
                lastActiveCellRef.current
            );
            handleContentInput();
        } else if (lastActiveCellRef.current) {
            lastActiveCellRef.current.style.textAlign = align;
            handleContentInput();
        } else {
            runCommand(align === 'justify' ? 'justifyFull' : `justify${align.charAt(0).toUpperCase() + align.slice(1)}`);
        }
    };

    const handleInsertLink = () => {
        if (linkInput.trim()) {
            restoreEditorSelection();
            runCommand('createLink', linkInput.trim());
            setLinkInput('');
        }
        setShowLinkModal(false);
    };

    const handleApplyImageResize = () => {
        if (selectedImgEl) {
            const w = imageModalWidth.trim();
            const h = imageModalHeight.trim();

            if (w) {
                selectedImgEl.style.width = w.endsWith('%') ? w : `${parseInt(w, 10)}px`;
                selectedImgEl.setAttribute('width', parseInt(w, 10).toString());
            }
            if (h) {
                selectedImgEl.style.height = h.endsWith('%') ? h : `${parseInt(h, 10)}px`;
                selectedImgEl.setAttribute('height', parseInt(h, 10).toString());
            }

            handleContentInput();
        }
        setShowImageModal(false);
    };

    const handleQuickScaleImage = (scaleMultiplier: number) => {
        if (selectedImgEl) {
            const currentW = selectedImgEl.naturalWidth || selectedImgEl.offsetWidth || 300;
            const newW = Math.round(currentW * scaleMultiplier);
            selectedImgEl.style.width = `${newW}px`;
            selectedImgEl.style.height = 'auto';
            selectedImgEl.setAttribute('width', newW.toString());
            selectedImgEl.removeAttribute('height');
            handleContentInput();
        }
    };

    const handleSaveToCloud = async () => {
        setActiveMenu(null);
        const result = await saveToCloud({
            session: activeSessionId,
            file: htmlContent,
            fileName: (record?.file as string) || (record?.savedName as string) || 'document.html',
            mimeType: 'text/html',
        });
        if (result.success) {
            if (typeof setSavedFileId === 'function') {
                setSavedFileId(result?.data?.id || '');
            }
            ;//window.alert(JSON.stringify({ error: "Document saved to cloud successfully!" }));
        } else {
            ;// window.alert(result.error || 'Failed to save document to cloud.');
        }
    };

    const renderPortal = (content: React.ReactNode) => {
        if (typeof window === 'undefined' || !document.body) return null;
        return createPortal(content, document.body);
    };

    const menuDefinitions: MenuGroupDef[] = [
        {
            title: 'File',
            items: [
                {
                    label: 'New document',
                    icon: '📄',
                    action: () => {
                        if (confirm('Create new document? Any unsaved changes will be lost.')) {
                            applyContentToEditor('<p></p>');
                        }
                    },
                },
                {
                    label: 'Open local/network file...',
                    icon: '📂',
                    action: async () => {
                        const loaded = await openHtmlFileFromDisk();
                        if (loaded !== null && loaded !== undefined) {
                            applyContentToEditor(loaded);
                        }
                    },
                },
                {
                    label: 'Save to Local/Network folder...',
                    icon: '💾',
                    hotkey: '⌘+S',
                    action: () => saveHtmlToDiskOrNetwork(htmlContent, 'document.html'),
                },
                {
                    label: 'Save to Cloud',
                    icon: '☁️',
                    action: handleSaveToCloud,
                },
                {
                    label: 'Export Document As',
                    icon: '📤',
                    children: [
                        { label: 'Microsoft Word (.doc)', action: () => exportDocument(htmlContent, 'doc', 'document') },
                        { label: 'PDF Document (.pdf)', action: () => exportDocument(htmlContent, 'pdf', 'document') },
                        { label: 'Clean HTML (.html)', action: () => exportDocument(htmlContent, 'html', 'document') },
                        { label: 'Plain Text (.txt)', action: () => exportDocument(htmlContent, 'txt', 'document') },
                    ],
                },
                { divider: true, label: '' },
                {
                    label: 'Print',
                    icon: '🖶',
                    hotkey: '⌘+P',
                    action: () => window?.print(),
                },
            ],
        },
        {
            title: 'Edit',
            items: [
                { label: 'Undo', icon: '↶', hotkey: '⌘+Z', action: () => runCommand('undo') },
                { label: 'Redo', icon: '↷', hotkey: '⌘+Y', action: () => runCommand('redo') },
                { divider: true, label: '' },
                { label: 'Cut', icon: '✂', hotkey: '⌘+X', action: () => runCommand('cut') },
                { label: 'Copy', icon: '📋', hotkey: '⌘+C', action: () => runCommand('copy') },
                { label: 'Paste', icon: '📄', hotkey: '⌘+V', action: () => runCommand('paste') },
                { label: 'Select all', hotkey: '⌘+A', action: () => runCommand('selectAll') },
            ],
        },
        {
            title: 'Insert',
            items: [
                {
                    label: 'Media',
                    icon: '🎬',
                    action: () => {
                        const url = prompt('Enter media embed URL:');
                        if (url) insertHtmlDirectly(`<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`);
                    },
                },
                {
                    label: 'Image',
                    icon: '🖼',
                    action: () => {
                        const url = prompt('Enter Image URL:');
                        if (url) runCommand('insertImage', url);
                    },
                },
                {
                    label: 'Link',
                    icon: '🔗',
                    hotkey: '⌘+K',
                    action: () => {
                        recordEditorSelection();
                        setShowLinkModal(true);
                    },
                },
                { divider: true, label: '' },
                {
                    label: 'Special character',
                    icon: 'Ω',
                    action: () => insertHtmlDirectly('©'),
                },
                {
                    label: 'Horizontal line',
                    icon: '—',
                    action: () => runCommand('insertHorizontalRule'),
                },
                {
                    label: 'Date/time',
                    children: [
                        { label: 'Date (DD-MM-YYYY)', action: () => insertHtmlDirectly(new Date().toLocaleDateString('en-GB')) },
                        { label: 'Time (HH:MM:SS)', action: () => insertHtmlDirectly(new Date().toLocaleTimeString()) },
                    ],
                },
                {
                    label: 'Nonbreaking space',
                    action: () => insertHtmlDirectly('&nbsp;'),
                },
            ],
        },
        {
            title: 'View',
            items: [
                {
                    label: 'Show invisible characters',
                    checked: showInvisibleChars,
                    action: () => setShowInvisibleChars(!showInvisibleChars),
                },
                {
                    label: 'Show blocks',
                    checked: showBlocks,
                    action: () => setShowBlocks(!showBlocks),
                },
                {
                    label: 'Visual aids',
                    checked: showVisualAids,
                    action: () => setShowVisualAids(!showVisualAids),
                },
                { divider: true, label: '' },
                {
                    label: 'Cloud Files',
                    icon: '📁',
                    action: () => {
                        setActiveMenu(null);
                        setShowCloudFilesModal(true);
                    },
                },
                {
                    label: 'Preview in New Tab',
                    icon: '👁',
                    action: () => previewHtmlInNewTab(htmlContent),
                },
                {
                    label: 'Fullscreen / Maximize',
                    hotkey: '⌘+⇧+F',
                    action: () => {
                        setIsFloating(true);
                        setIsMaximized(!isMaximized);
                    },
                },
            ],
        },
        {
            title: 'Format',
            items: [
                { label: 'Bold', icon: 'B', hotkey: '⌘+B', action: () => runCommand('bold') },
                { label: 'Italic', icon: 'I', hotkey: '⌘+I', action: () => runCommand('italic') },
                { label: 'Underline', icon: 'U', hotkey: '⌘+U', action: () => runCommand('underline') },
                { label: 'Strikethrough', icon: 'S', action: () => runCommand('strikeThrough') },
                { label: 'Superscript', icon: 'x²', action: () => runCommand('superscript') },
                { label: 'Subscript', icon: 'x₂', action: () => runCommand('subscript') },
                { divider: true, label: '' },
                {
                    label: 'Formats',
                    children: [
                        { label: 'Paragraph', action: () => runCommand('formatBlock', '<p>') },
                        { label: 'Heading 1', action: () => runCommand('formatBlock', '<h1>') },
                        { label: 'Heading 2', action: () => runCommand('formatBlock', '<h2>') },
                        { label: 'Heading 3', action: () => runCommand('formatBlock', '<h3>') },
                        { label: 'Blockquote', action: () => runCommand('formatBlock', '<blockquote>') },
                    ],
                },
                { divider: true, label: '' },
                { label: 'Clear formatting', icon: 'Tx', action: () => runCommand('removeFormat') },
            ],
        },
        {
            title: 'Font size',
            items: [
                {
                    label: 'Increase font size',
                    icon: 'A⁺',
                    hotkey: '⌘+.',
                    action: () => handleAdjustFontSize(2),
                },
                {
                    label: 'Decrease font size',
                    icon: 'A⁻',
                    hotkey: '⌘+,',
                    action: () => handleAdjustFontSize(-2),
                },
                { divider: true, label: '' },
                { label: '8 pt (11px)', action: () => handleAdjustFontSize(11) },
                { label: '9 pt (12px)', action: () => handleAdjustFontSize(12) },
                { label: '10 pt (13px)', action: () => handleAdjustFontSize(13) },
                { label: '11 pt (15px)', action: () => handleAdjustFontSize(15) },
                { label: '12 pt (16px)', action: () => handleAdjustFontSize(16) },
                { label: '14 pt (19px)', action: () => handleAdjustFontSize(19) },
                { label: '16 pt (21px)', action: () => handleAdjustFontSize(21) },
                { label: '18 pt (24px)', action: () => handleAdjustFontSize(24) },
                { label: '24 pt (32px)', action: () => handleAdjustFontSize(32) },
                { label: '36 pt (48px)', action: () => handleAdjustFontSize(48) },
            ],
        },
        {
            title: 'Table',
            items: [
                {
                    label: 'Table',
                    icon: '⊞',
                    children: [
                        { label: '1 x 1 Table', action: () => insertHtmlDirectly(generateTableHtml(1, 1)) },
                        { label: '2 x 2 Table', action: () => insertHtmlDirectly(generateTableHtml(2, 2)) },
                        { label: '3 x 3 Table', action: () => insertHtmlDirectly(generateTableHtml(3, 3)) },
                        { label: '4 x 4 Table', action: () => insertHtmlDirectly(generateTableHtml(4, 4)) },
                        {
                            label: 'Custom Table...',
                            action: () => {
                                recordEditorSelection();
                                setShowTableModal(true);
                            },
                        },
                    ],
                },
                {
                    label: 'Select Column(s)',
                    icon: '🖱',
                    children: [
                        {
                            label: `Clear Selection (${selectedColIndices.length} selected)`,
                            action: () => setSelectedColIndices([]),
                        },
                        { divider: true, label: '' },
                        ...Array.from({ length: activeTableTotalCols }, (_, i) => ({
                            label: `Column ${i + 1}`,
                            checked: selectedColIndices.includes(i),
                            action: () => handleToggleColumnSelection(i),
                        })),
                    ],
                },
                {
                    label: 'Merge & Split',
                    icon: '🔀',
                    children: [
                        { label: 'Merge Cell Right (Colspan)', action: handleMergeRight },
                        { label: 'Merge Cell Down (Rowspan)', action: handleMergeDown },
                        { label: 'Split Merged Cell', action: handleSplitCell },
                    ],
                },
                {
                    label: 'Format',
                    icon: '🎨',
                    children: [
                        { label: 'Format Selected Cell...', action: () => openFormatModalWithScope('cell') },
                        {
                            label: `Format Selected Columns (${selectedColIndices.length || 1})...`,
                            action: () => openFormatModalWithScope('selected-columns'),
                        },
                        { label: 'Format Selected Row...', action: () => openFormatModalWithScope('row') },
                        { label: 'Format Entire Table...', action: () => openFormatModalWithScope('table') },
                    ],
                },
                {
                    label: 'Cell Content Alignment',
                    children: [
                        { label: 'Justify Left', action: () => handleSetCellAlignment('left') },
                        { label: 'Justify Center', action: () => handleSetCellAlignment('center') },
                        { label: 'Justify Right', action: () => handleSetCellAlignment('right') },
                        { label: 'Justify Evenly', action: () => handleSetCellAlignment('justify') },
                    ],
                },
                { label: 'Delete table', action: () => handleTableModification('deleteTable') },
                { divider: true, label: '' },
                {
                    label: 'Row',
                    children: [
                        { label: 'Insert row above', action: () => handleTableModification('insertRowAbove') },
                        { label: 'Insert row below', action: () => handleTableModification('insertRowBelow') },
                        { label: 'Delete row', action: () => handleTableModification('deleteRow') },
                    ],
                },
                {
                    label: 'Column',
                    children: [
                        { label: 'Insert column left', action: () => handleTableModification('insertColLeft') },
                        { label: 'Insert column right', action: () => handleTableModification('insertColRight') },
                        { label: 'Delete column', action: () => handleTableModification('deleteCol') },
                    ],
                },
            ],
        },
        {
            title: 'Tools',
            items: [
                {
                    label: 'Source code',
                    icon: '<>',
                    action: () => setIsSourceMode(!isSourceMode),
                },
            ],
        },
    ];

    const editorContentMarkup = (
        <View
            style={[
                styles.container,
                isMaximized
                    ? styles.fullScreenMaximized
                    : isFloating
                        ? isDesktop
                            ? styles.desktopFloatingModal
                            : styles.mobileFullScreen
                        : styles.dockedContainer,
            ]}
        >
            {/* 1. TOP HEADER */}
            <View style={styles.topHeaderBar}>
                <View style={styles.headerLeftGroup}>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => {
                            if (!isFloating) setIsFloating(true);
                            setIsMaximized(!isMaximized);
                        }}
                        activeOpacity={0.7}
                        accessibilityLabel={isMaximized ? 'Minimize (Restore Viewport)' : 'Maximize (Fill Viewport)'}
                    >
                        {isMaximized ? <MinimizeIcon color="#F8FAFC" size={14} /> : <MaximizeIcon color="#F8FAFC" size={14} />}
                    </TouchableOpacity>

                    <Text style={styles.topHeaderTitle}>HTML Web Editor</Text>
                    <View style={[styles.statusBadge, isFloating ? styles.badgeFloating : styles.badgeDocked]}>
                        <Text style={styles.statusBadgeText}>
                            {isMaximized ? 'Maximized (100% Viewport)' : isFloating ? 'Floating (Layer 1)' : 'Docked'}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerRightActions}>
                    <TouchableOpacity
                        style={[styles.floatToggleButton, isFloating ? styles.btnDock : styles.btnFloat]}
                        onPress={() => {
                            if (isMaximized) setIsMaximized(false);
                            setIsFloating(!isFloating);
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.floatToggleBtnIcon}>{isFloating ? '📥' : '🚀'}</Text>
                        <Text style={styles.floatToggleBtnText}>
                            {isFloating ? 'Unfloat (Dock)' : 'Float to Top'}
                        </Text>
                    </TouchableOpacity>

                    {onClose && (
                        <TouchableOpacity
                            style={styles.headerCloseBtn}
                            onPress={onClose}
                            activeOpacity={0.7}
                            accessibilityLabel="Close Editor"
                        >
                            <CloseIcon color="#FFFFFF" size={16} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <HtmlTopMenuBar
                menus={menuDefinitions}
                activeMenu={activeMenu}
                onToggleMenu={(title) => {
                    setActiveMenu((prev) => (prev === title ? null : title));
                }}
                onCloseMenu={() => setActiveMenu(null)}
            />

            {/* 2. TOOLBAR ROW 1 */}
            <View style={styles.toolbarRow}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('undo')} title="Undo">
                    <Text style={styles.toolBtnText}>↶</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('redo')} title="Redo">
                    <Text style={styles.toolBtnText}>↷</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity
                    style={[styles.toolBtn, isSourceMode && styles.toolBtnActive]}
                    onPress={() => setIsSourceMode(!isSourceMode)}
                    title="View Source Code"
                >
                    <Text style={[styles.toolBtnText, isSourceMode && styles.toolBtnTextActive]}>&lt;&gt;</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('removeFormat')} title="Clear Formatting">
                    <Text style={styles.toolBtnText}>Tx</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('bold')} title="Bold">
                    <Text style={[styles.toolBtnText, { fontWeight: '800' }]}>B</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('italic')} title="Italic">
                    <Text style={[styles.toolBtnText, { fontStyle: 'italic', fontFamily: 'serif' }]}>I</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('underline')} title="Underline">
                    <Text style={[styles.toolBtnText, { textDecorationLine: 'underline' }]}>U</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity style={styles.toolBtn} onPress={() => handleAdjustFontSize(2)} title="Increase Font Size">
                    <Text style={[styles.toolBtnText, { fontSize: 12, fontWeight: '700' }]}>A⁺</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleAdjustFontSize(-2)} title="Decrease Font Size">
                    <Text style={[styles.toolBtnText, { fontSize: 12, fontWeight: '700' }]}>A⁻</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetCellAlignment('left')} title="Align Left">
                    <Text style={styles.toolBtnText}>≡</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetCellAlignment('center')} title="Align Center">
                    <Text style={styles.toolBtnText}>≣</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetCellAlignment('right')} title="Align Right">
                    <Text style={styles.toolBtnText}>≡</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetCellAlignment('justify')} title="Justify">
                    <Text style={styles.toolBtnText}>𝌆</Text>
                </TouchableOpacity>
            </View>

            {/* 3. TOOLBAR ROW 2 */}
            <View style={styles.toolbarRow}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('insertUnorderedList')} title="Bullet List">
                    <Text style={styles.toolBtnText}>•≡</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('insertOrderedList')} title="Numbered List">
                    <Text style={styles.toolBtnText}>1.≡</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('outdent')} title="Decrease Indent">
                    <Text style={styles.toolBtnText}>⇤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => runCommand('indent')} title="Increase Indent">
                    <Text style={styles.toolBtnText}>⇥</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />

                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        recordEditorSelection();
                        setShowLinkModal(true);
                    }}
                    title="Insert Link"
                >
                    <Text style={styles.toolBtnText}>🔗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        const url = prompt('Enter Image URL:');
                        if (url) runCommand('insertImage', url);
                    }}
                    title="Insert Image"
                >
                    <Text style={styles.toolBtnText}>🖼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => window?.print()} title="Print">
                    <Text style={styles.toolBtnText}>𝖯</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => previewHtmlInNewTab(htmlContent)}
                    title="Preview in New Browser Tab"
                >
                    <Text style={styles.toolBtnText}>👁</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        const media = prompt('Enter Video Embed URL:');
                        if (media) insertHtmlDirectly(`<iframe width="560" height="315" src="${media}" frameborder="0" allowfullscreen></iframe>`);
                    }}
                    title="Insert Media"
                >
                    <Text style={styles.toolBtnText}>🎬</Text>
                </TouchableOpacity>

                {/* Selected Image Resize Quick Toolbar */}
                {selectedImgEl && (
                    <>
                        <View style={styles.toolDivider} />
                        <TouchableOpacity
                            style={[styles.toolBtn, { backgroundColor: '#EEF2FF', width: 'auto', paddingHorizontal: 6 }]}
                            onPress={() => setShowImageModal(true)}
                            title="Resize Selected Image Dimensions"
                        >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>📐 Resize Img</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.toolBtn}
                            onPress={() => handleQuickScaleImage(0.5)}
                            title="Scale Image to 50%"
                        >
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>50%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.toolBtn}
                            onPress={() => handleQuickScaleImage(1)}
                            title="Reset Image to 100%"
                        >
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>100%</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* 4. TOOLBAR ROW 3 */}
            <View style={styles.toolbarRow}>
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        const color = prompt('Enter Font Color (#4F46E5, red):', '#4F46E5');
                        if (color) runCommand('foreColor', color);
                    }}
                    title="Text Color"
                >
                    <Text style={[styles.toolBtnText, { color: '#EF4444', fontWeight: '800' }]}>A ▾</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        const bg = prompt('Enter Background Color (#fef08a, #2b78a9):', '#2b78a9');
                        if (bg) runCommand('hiliteColor', bg);
                    }}
                    title="Background Highlight"
                >
                    <View style={styles.highlightIconBox}>
                        <Text style={styles.highlightIconText}>A</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => insertHtmlDirectly('🌚 ')} title="Insert Emoticon">
                    <Text style={styles.toolBtnText}>😊</Text>
                </TouchableOpacity>
                <View style={styles.toolDivider} />
                <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => {
                        recordEditorSelection();
                        setShowTableModal(true);
                    }}
                    title="Insert Table Grid"
                >
                    <Text style={styles.toolBtnText}>⊞ ▾</Text>
                </TouchableOpacity>

                {selectedColIndices.length > 0 && (
                    <>
                        <View style={styles.toolDivider} />
                        <TouchableOpacity
                            style={[styles.toolBtn, { backgroundColor: '#EEF2FF', width: 'auto', paddingHorizontal: 8 }]}
                            onPress={() => openFormatModalWithScope('selected-columns')}
                            title="Format Selected Columns"
                        >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>
                                🎨 Format Col ({selectedColIndices.map((i) => i + 1).join(', ')})
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* 5. EDITOR WORKSPACE */}
            <View style={styles.editorArea}>
                {isSourceMode ? (
                    createElement('textarea', {
                        className: 'html-editor-source-textarea',
                        value: htmlContent,
                        onChange: (e: any) => handleSourceChange(e.target.value),
                        placeholder: 'Write or paste raw HTML code here...',
                    })
                ) : (
                    createElement('div', {
                        ref: editorRef,
                        className: `html-editor-content ${showVisualAids ? 'show-visual-aids' : ''} ${showBlocks ? 'show-blocks' : ''}`,
                        contentEditable: !readOnly,
                        onInput: handleContentInput,
                        onBlur: handleContentInput,
                        onKeyUp: recordEditorSelection,
                        onMouseUp: recordEditorSelection,
                        onClick: recordEditorSelection,
                        suppressContentEditableWarning: true,
                    })
                )}
            </View>

            {/* 6. BOTTOM STATUS BAR */}
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                    Mode: {isSourceMode ? 'HTML Source' : 'Visual WYSIWYG'} | Characters: {htmlContent.length}
                    {selectedColIndices.length > 0
                        ? ` | Selected Columns: [${selectedColIndices.map((i) => i + 1).join(', ')}]`
                        : ''}
                    {selectedImgEl ? ` | Selected Image: ${selectedImgEl.offsetWidth}x${selectedImgEl.offsetHeight}px` : ''}
                </Text>

                <View style={styles.statusActionGroup}>
                    <TouchableOpacity
                        style={styles.saveToFolderBtn}
                        onPress={() => saveHtmlToDiskOrNetwork(htmlContent, 'document.html')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.saveToFolderBtnText}>💾 Save to Folder</Text>
                    </TouchableOpacity>

                    {onSave && (
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => onSave(htmlContent)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <>
            {createElement('style', null, editorStyles)}

            {isFloating ? (
                <SafeAreaView style={[styles.topLayerOverlay, isMaximized && styles.topLayerOverlayMaximized]}>
                    {!isMaximized && isDesktop && (
                        <TouchableOpacity
                            style={styles.backdrop}
                            activeOpacity={1}
                            onPress={() => setIsFloating(false)}
                        />
                    )}
                    {editorContentMarkup}
                </SafeAreaView>
            ) : (
                <SafeAreaView style={styles.dockedWrapper}>
                    {editorContentMarkup}
                </SafeAreaView>
            )}

            {/* MODAL: CLOUD FILES OBJECTPANEL PORTAL */}
            {showCloudFilesModal &&
                renderPortal(
                    <View style={styles.cloudFilesOverlay}>
                        <View style={styles.cloudFilesContainer}>
                            <View style={styles.cloudFilesHeader}>
                                <Text style={styles.cloudFilesTitle}>Cloud Files - Document Explorer</Text>
                                <TouchableOpacity
                                    style={styles.cloudFilesCloseBtn}
                                    onPress={() => setShowCloudFilesModal(false)}
                                    activeOpacity={0.7}
                                    accessibilityLabel="Close Cloud Files Explorer"
                                >
                                    <CloseIcon color="#0F172A" size={16} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.cloudFilesContent}>
                                <ObjectPanel
                                    formid="fdeb98a5-9217-482a-9f2d-051ebe5b7c59"
                                    menuid="649d18db-e1b8-46c8-83eb-958bc531f63b"
                                    pid=""
                                    sessionId={activeSessionId}
                                    formLabel="Cloud Uploaded Documents"
                                />
                            </View>
                        </View>
                    </View>
                )}

            {/* MODAL: TABLE / CELL FORMATTING */}
            {showTableFormatModal && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { width: 400, maxHeight: 540 }]}>
                        <Text style={styles.modalTitle}>Table & Column Formatting</Text>

                        <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 400 }}>
                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Apply Scope:</Text>
                                <View style={styles.scopeButtonGroup}>
                                    {(
                                        [
                                            { id: 'cell', label: 'Cell' },
                                            {
                                                id: 'selected-columns',
                                                label: `Cols (${selectedColIndices.length ? selectedColIndices.map((i) => i + 1).join(',') : '1'})`,
                                            },
                                            { id: 'row', label: 'Row' },
                                            { id: 'table', label: 'Table' },
                                        ] as const
                                    ).map((sc) => (
                                        <TouchableOpacity
                                            key={sc.id}
                                            style={[styles.scopeBtn, formatScope === sc.id && styles.scopeBtnActive]}
                                            onPress={() => setFormatScope(sc.id)}
                                        >
                                            <Text style={[styles.scopeBtnText, formatScope === sc.id && styles.scopeBtnTextActive]}>
                                                {sc.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {formatScope === 'selected-columns' && (
                                <View style={[styles.modalInputRow, { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 6 }]}>
                                    <Text style={[styles.modalLabel, { color: '#4338CA' }]}>Select Columns:</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                        {Array.from({ length: activeTableTotalCols }, (_, i) => {
                                            const isSel = selectedColIndices.includes(i);
                                            return (
                                                <TouchableOpacity
                                                    key={`col-pill-${i}`}
                                                    style={[styles.colPill, isSel && styles.colPillActive]}
                                                    onPress={() => handleToggleColumnSelection(i)}
                                                >
                                                    <Text style={[styles.colPillText, isSel && styles.colPillTextActive]}>
                                                        Col {i + 1}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Cell Background:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <input
                                        type="color"
                                        value={formatBgColor.startsWith('#') && formatBgColor.length === 7 ? formatBgColor : '#ffffff'}
                                        onChange={(e) => setFormatBgColor(e.target.value)}
                                        style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                                    />
                                    <TextInput
                                        style={[styles.modalInput, { width: 85 }]}
                                        value={formatBgColor}
                                        onChangeText={setFormatBgColor}
                                        placeholder="#ffffff"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Text Color:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <input
                                        type="color"
                                        value={formatTextColor.startsWith('#') && formatTextColor.length === 7 ? formatTextColor : '#1e293b'}
                                        onChange={(e) => setFormatTextColor(e.target.value)}
                                        style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                                    />
                                    <TextInput
                                        style={[styles.modalInput, { width: 85 }]}
                                        value={formatTextColor}
                                        onChangeText={setFormatTextColor}
                                        placeholder="#1e293b"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Border Width:</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formatBorderWidth}
                                    onChangeText={setFormatBorderWidth}
                                    placeholder="1px"
                                />
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Border Style:</Text>
                                <select
                                    value={formatBorderStyle}
                                    onChange={(e) => setFormatBorderStyle(e.target.value)}
                                    style={{
                                        height: 32,
                                        border: '1px solid #CBD5E1',
                                        borderRadius: 4,
                                        padding: '0 8px',
                                        fontSize: 12,
                                        color: '#0F172A',
                                        backgroundColor: '#F8FAFC',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="double">Double</option>
                                    <option value="none">None</option>
                                </select>
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Border Color:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <input
                                        type="color"
                                        value={formatBorderColor.startsWith('#') && formatBorderColor.length === 7 ? formatBorderColor : '#94a3b8'}
                                        onChange={(e) => setFormatBorderColor(e.target.value)}
                                        style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                                    />
                                    <TextInput
                                        style={[styles.modalInput, { width: 85 }]}
                                        value={formatBorderColor}
                                        onChangeText={setFormatBorderColor}
                                        placeholder="#94a3b8"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Cell Padding:</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={formatPadding}
                                    onChangeText={setFormatPadding}
                                    placeholder="8px 12px"
                                />
                            </View>

                            <View style={styles.modalInputRow}>
                                <Text style={styles.modalLabel}>Align (H / V):</Text>
                                <View style={{ flexDirection: 'row', gap: 4 }}>
                                    <select
                                        value={formatTextAlign}
                                        onChange={(e) => setFormatTextAlign(e.target.value)}
                                        style={{
                                            height: 32,
                                            border: '1px solid #CBD5E1',
                                            borderRadius: 4,
                                            padding: '0 6px',
                                            fontSize: 12,
                                            color: '#0F172A',
                                            backgroundColor: '#F8FAFC',
                                            outline: 'none',
                                        }}
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                        <option value="justify">Justify</option>
                                    </select>
                                    <select
                                        value={formatVerticalAlign}
                                        onChange={(e) => setFormatVerticalAlign(e.target.value)}
                                        style={{
                                            height: 32,
                                            border: '1px solid #CBD5E1',
                                            borderRadius: 4,
                                            padding: '0 6px',
                                            fontSize: 12,
                                            color: '#0F172A',
                                            backgroundColor: '#F8FAFC',
                                            outline: 'none',
                                        }}
                                    >
                                        <option value="top">Top</option>
                                        <option value="middle">Middle</option>
                                        <option value="bottom">Bottom</option>
                                    </select>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowTableFormatModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleApplyTableFormatting}>
                                <Text style={styles.modalSubmitText}>Apply Formatting</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* MODAL: IMAGE RESIZING & DIMENSIONS */}
            {showImageModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Image Dimensions</Text>

                        <View style={styles.modalInputRow}>
                            <Text style={styles.modalLabel}>Width (px / %):</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={imageModalWidth}
                                onChangeText={(val) => {
                                    setImageModalWidth(val);
                                    if (lockAspectRatio) {
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num) && imageAspectRatio > 0) {
                                            setImageModalHeight(String(Math.round(num / imageAspectRatio)));
                                        }
                                    }
                                }}
                                placeholder="300"
                            />
                        </View>

                        <View style={styles.modalInputRow}>
                            <Text style={styles.modalLabel}>Height (px / %):</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={imageModalHeight}
                                onChangeText={(val) => {
                                    setImageModalHeight(val);
                                    if (lockAspectRatio) {
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num) && imageAspectRatio > 0) {
                                            setImageModalWidth(String(Math.round(num * imageAspectRatio)));
                                        }
                                    }
                                }}
                                placeholder="200"
                            />
                        </View>

                        <View style={[styles.modalInputRow, { marginTop: 6 }]}>
                            <Text style={styles.modalLabel}>Lock Aspect Ratio:</Text>
                            <Switch
                                value={lockAspectRatio}
                                onValueChange={setLockAspectRatio}
                                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                                thumbColor={lockAspectRatio ? '#4F46E5' : '#F1F5F9'}
                            />
                        </View>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowImageModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleApplyImageResize}>
                                <Text style={styles.modalSubmitText}>Apply Dimensions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* MODAL: CUSTOM TABLE */}
            {showTableModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Insert Custom Table</Text>
                        <View style={styles.modalInputRow}>
                            <Text style={styles.modalLabel}>Rows:</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={tableRows}
                                onChangeText={setTableRows}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.modalInputRow}>
                            <Text style={styles.modalLabel}>Columns:</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={tableCols}
                                onChangeText={setTableCols}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowTableModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleInsertTable}>
                                <Text style={styles.modalSubmitText}>Insert</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* MODAL: INSERT LINK */}
            {showLinkModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Insert Link</Text>
                        <TextInput
                            style={[styles.modalInput, { width: '100%', marginTop: 8 }]}
                            placeholder="https://example.com"
                            value={linkInput}
                            onChangeText={setLinkInput}
                            autoCapitalize="none"
                        />
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowLinkModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleInsertLink}>
                                <Text style={styles.modalSubmitText}>Insert Link</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    topLayerOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw' as any,
        height: '100vh' as any,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 99999,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    topLayerOverlayMaximized: {
        padding: 0,
        backgroundColor: '#0F172A',
    },
    backdrop: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
    },
    dockedWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 520,
        backgroundColor: '#FFFFFF',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2,
    },
    fullScreenMaximized: {
        width: '100vw' as any,
        height: '100vh' as any,
        maxWidth: '100vw' as any,
        maxHeight: '100vh' as any,
        borderRadius: 0,
        borderWidth: 0,
    },
    desktopFloatingModal: {
        width: '90%',
        maxWidth: 1080,
        height: '90%',
        maxHeight: 840,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    },
    mobileFullScreen: {
        width: '100%',
        height: '100%',
    },
    dockedContainer: {
        width: '100%',
        flex: 1,
        minHeight: 500,
    },
    topHeaderBar: {
        minHeight: 44,
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topHeaderTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: 0.3,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeFloating: {
        backgroundColor: '#4338CA',
    },
    badgeDocked: {
        backgroundColor: '#334155',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#E0E7FF',
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    floatToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        gap: 6,
    },
    btnFloat: {
        backgroundColor: '#4F46E5',
        borderColor: '#6366F1',
    },
    btnDock: {
        backgroundColor: '#0284C7',
        borderColor: '#38BDF8',
    },
    floatToggleBtnIcon: {
        fontSize: 12,
    },
    floatToggleBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarRow: {
        minHeight: 34,
        backgroundColor: '#F1F5F9',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexWrap: 'wrap',
        gap: 2,
    },
    toolBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        backgroundColor: 'transparent',
    },
    toolBtnActive: {
        backgroundColor: '#CBD5E1',
    },
    toolBtnText: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    toolBtnTextActive: {
        color: '#4F46E5',
        fontWeight: '700',
    },
    toolDivider: {
        width: 1,
        height: 18,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 4,
    },
    highlightIconBox: {
        width: 18,
        height: 18,
        backgroundColor: '#2b78a9',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    highlightIconText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    editorArea: {
        flex: 1,
        minHeight: 360,
        backgroundColor: '#FFFFFF',
    },
    statusBar: {
        height: 38,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    statusText: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: 'monospace',
    },
    statusActionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveToFolderBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
    },
    saveToFolderBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    saveBtn: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    saveBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
    },
    modalCard: {
        width: 330,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    modalInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    modalInput: {
        width: 110,
        height: 32,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 4,
        paddingHorizontal: 8,
        fontSize: 12,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    scopeButtonGroup: {
        flexDirection: 'row',
        gap: 3,
    },
    scopeBtn: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    scopeBtnActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4338CA',
    },
    scopeBtnText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    scopeBtnTextActive: {
        color: '#FFFFFF',
    },
    colPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    colPillActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4338CA',
    },
    colPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    colPillTextActive: {
        color: '#FFFFFF',
    },
    modalActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 16,
    },
    modalCancelBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    modalCancelText: {
        fontSize: 12,
        color: '#475569',
    },
    modalSubmitBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#4F46E5',
    },
    modalSubmitText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cloudFilesOverlay: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw' as any,
        height: '100vh' as any,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 9999999,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    cloudFilesContainer: {
        width: '92%',
        maxWidth: 1180,
        height: '88%',
        maxHeight: 850,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    cloudFilesHeader: {
        height: 42,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    cloudFilesTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    cloudFilesCloseBtn: {
        width: 26,
        height: 26,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cloudFilesContent: {
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
});

export default HtmlPanel;