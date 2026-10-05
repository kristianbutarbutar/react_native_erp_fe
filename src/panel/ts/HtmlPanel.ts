// panel/ts/HtmlPanel.ts

import { doUpload, type DoUploadResult } from './../../customer/ts/ObjectFile';
import {DOMAIN_UPLOAD_WEB} from '../../global';

export interface TableFormatStyles {
  scope: 'cell' | 'row' | 'column' | 'selected-columns' | 'table';
  selectedColumnIndices?: number[];
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  textAlign?: string;
  verticalAlign?: string;
}

export interface SaveToCloudParams {
  session: string;
  file: string;
  fileName?: string;
  mimeType?: string;
  [key: string]: any;
}

export interface ReadFileParams {
  record?: Record<string, any> | null;
  sessionId?: string;
  [key: string]: any;
}

export const DEFAULT_HTML_CONTENT = `
<h1>Executive Project Overview</h1>
<p>Welcome to the rich-text administrative editor. You can compose documents, modify tables, embed media, and format text content seamlessly.</p>
<h2>Key Deliverables</h2>
<ul>
  <li>Standardized multi-directional table cell resizing.</li>
  <li>Custom cell formatting and column alignment.</li>
  <li>Local and network document storage.</li>
</ul>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Phase</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Task</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Phase 1</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Architecture &amp; Scaffolding</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Completed</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Phase 2</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">UI Engine &amp; CRUD Integration</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">In Progress</td>
    </tr>
  </tbody>
</table>
<p></p>
`;

/**
 * Reads file stream/binary contents from the server API using an HTTP GET request
 * with query parameters for `fileName` and `sessionid`.
 * 
 * @param params - Object containing record and sessionId
 * @returns Promise resolving to the file text stream response.
 */
export async function readFile(params: ReadFileParams): Promise<string | null> {
  try {
    const { record, sessionId } = params;
    if (!record || !record.savedname) return null;

    const fileName = encodeURIComponent(String(record.savedname).trim());
    const sessionid = encodeURIComponent(String(sessionId || 'sess_12345').trim());

    const url = `${DOMAIN_UPLOAD_WEB()}/api/read?fileName=${fileName}&sessionid=${sessionid}`; //`http://localhost:3002/api/read?fileName=${fileName}&sessionid=${sessionid}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to read file stream via GET: ${response.statusText}`);
    }

    const fileText = await response.text();
    return fileText;
  } catch (err: any) {
    console.error('Error in readFile (GET):', err);
    return null;
  }
}

/**
 * Saves HTML document content to the cloud by wrapping the input parameters and calling doUpload.
 */
export async function saveToCloud(params: SaveToCloudParams): Promise<DoUploadResult> {
  try {
    const { session, file, fileName = 'document.html', mimeType = 'text/html' } = params;

    const blob = new Blob([file], { type: `${mimeType};charset=utf-8` });
    const htmlFile = new File([blob], fileName, { type: mimeType });

    const uploadPayload = {
      sessionId: session,
      files: [
        {
          name: fileName,
          type: mimeType,
          originFile: htmlFile,
        },
      ],
      htmleditor: 'htmleditor',
    };

    const response = await doUpload(uploadPayload);
    return response;
  } catch (err: any) {
    console.error('Error in saveToCloud:', err);
    return {
      success: false,
      error: err?.message || 'Failed to save document to cloud',
    };
  }
}

export function execEditorCommand(command: string, value: string | undefined = undefined): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return document.execCommand(command, false, value);
  } catch (err) {
    console.error(`Error executing command '${command}':`, err);
    return false;
  }
}

export function adjustSelectedTextFontSize(deltaOrSize: number | string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();

  const span = document.createElement('span');
  if (typeof deltaOrSize === 'number') {
    const parentEl =
      range.commonAncestorContainer.nodeType === 1
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;

    const baseSize = parentEl ? parseFloat(window.getComputedStyle(parentEl).fontSize) || 15 : 15;
    const targetSize = Math.max(8, baseSize + deltaOrSize);
    span.style.fontSize = `${targetSize}px`;
  } else {
    span.style.fontSize = deltaOrSize.endsWith('px') || deltaOrSize.endsWith('pt') ? deltaOrSize : `${deltaOrSize}px`;
  }

  span.appendChild(selectedContent);
  range.insertNode(span);

  range.setStartAfter(span);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function generateTableHtml(rows: number = 3, cols: number = 3, includeHeader: boolean = true): string {
  const safeRows = Math.max(1, rows);
  const safeCols = Math.max(1, cols);

  let html = '<table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin: 12px 0;">\n';

  if (includeHeader) {
    html += '  <thead>\n    <tr>\n';
    for (let c = 1; c <= safeCols; c++) {
      html += `      <th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left;">Header ${c}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';
  }

  html += '  <tbody>\n';
  for (let r = 1; r <= safeRows; r++) {
    html += '    <tr>\n';
    for (let c = 1; c <= safeCols; c++) {
      html += `      <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Row ${r}, Col ${c}</td>\n`;
    }
    html += '    </tr>\n';
  }
  html += '  </tbody>\n</table>\n<p></p>\n';

  return html;
}

export function saveHtmlToDiskOrNetwork(htmlContent: string, defaultFilename: string = 'document.html'): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = defaultFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

export async function openHtmlFileFromDisk(): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm,.txt';

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        resolve((event.target?.result as string) || '');
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };

    input.click();
  });
}

export function manipulateTable(
  action:
    | 'insertRowAbove'
    | 'insertRowBelow'
    | 'deleteRow'
    | 'insertColLeft'
    | 'insertColRight'
    | 'deleteCol'
    | 'deleteTable',
  activeCell: HTMLElement | null
): boolean {
  if (!activeCell) return false;

  const cell = activeCell.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.closest('tr') as HTMLTableRowElement | null;
  const table = row?.closest('table') as HTMLTableElement | null;

  if (!cell || !row || !table) return false;

  const cellIndex = cell.cellIndex;
  const rowIndex = row.rowIndex;

  switch (action) {
    case 'insertRowAbove': {
      const newRow = table.insertRow(rowIndex);
      const colCount = row.cells.length;
      for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(i);
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #cbd5e1';
        newCell.style.padding = '8px 12px';
      }
      return true;
    }

    case 'insertRowBelow': {
      const newRow = table.insertRow(rowIndex + 1);
      const colCount = row.cells.length;
      for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(i);
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #cbd5e1';
        newCell.style.padding = '8px 12px';
      }
      return true;
    }

    case 'deleteRow': {
      table.deleteRow(rowIndex);
      if (table.rows.length === 0) {
        table.remove();
      }
      return true;
    }

    case 'insertColLeft': {
      Array.from(table.rows).forEach((r) => {
        const isHeader = r.parentElement?.tagName.toLowerCase() === 'thead';
        const newCell = isHeader ? document.createElement('th') : document.createElement('td');
        newCell.innerHTML = isHeader ? 'New Header' : '&nbsp;';
        newCell.style.border = '1px solid #cbd5e1';
        newCell.style.padding = '8px 12px';
        if (isHeader) newCell.style.backgroundColor = '#f1f5f9';

        const refCell = r.cells[cellIndex];
        if (refCell) {
          r.insertBefore(newCell, refCell);
        } else {
          r.appendChild(newCell);
        }
      });
      return true;
    }

    case 'insertColRight': {
      Array.from(table.rows).forEach((r) => {
        const isHeader = r.parentElement?.tagName.toLowerCase() === 'thead';
        const newCell = isHeader ? document.createElement('th') : document.createElement('td');
        newCell.innerHTML = isHeader ? 'New Header' : '&nbsp;';
        newCell.style.border = '1px solid #cbd5e1';
        newCell.style.padding = '8px 12px';
        if (isHeader) newCell.style.backgroundColor = '#f1f5f9';

        const refCell = r.cells[cellIndex + 1];
        if (refCell) {
          r.insertBefore(newCell, refCell);
        } else {
          r.appendChild(newCell);
        }
      });
      return true;
    }

    case 'deleteCol': {
      Array.from(table.rows).forEach((r) => {
        if (r.cells[cellIndex]) {
          r.deleteCell(cellIndex);
        }
      });
      if (table.rows[0]?.cells.length === 0) {
        table.remove();
      }
      return true;
    }

    case 'deleteTable': {
      table.remove();
      return true;
    }

    default:
      return false;
  }
}

export function mergeCellsRight(activeCell: HTMLElement | null): boolean {
  if (!activeCell) return false;
  const cell = activeCell.closest('td, th') as HTMLTableCellElement | null;
  if (!cell) return false;

  const nextCell = cell.nextElementSibling as HTMLTableCellElement | null;
  if (!nextCell) return false;

  const currentColspan = cell.colSpan || 1;
  const nextColspan = nextCell.colSpan || 1;

  cell.colSpan = currentColspan + nextColspan;
  if (nextCell.innerHTML.trim() && nextCell.innerHTML !== '&nbsp;') {
    cell.innerHTML += ` ${nextCell.innerHTML}`;
  }

  nextCell.remove();
  return true;
}

export function mergeCellsDown(activeCell: HTMLElement | null): boolean {
  if (!activeCell) return false;
  const cell = activeCell.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.closest('tr') as HTMLTableRowElement | null;
  const table = row?.closest('table') as HTMLTableElement | null;

  if (!cell || !row || !table) return false;

  const targetRowIndex = row.rowIndex + (cell.rowSpan || 1);
  const targetRow = table.rows[targetRowIndex];
  if (!targetRow) return false;

  const targetCell = targetRow.cells[cell.cellIndex];
  if (!targetCell) return false;

  const currentRowspan = cell.rowSpan || 1;
  const nextRowspan = targetCell.rowSpan || 1;

  cell.rowSpan = currentRowspan + nextRowspan;
  if (targetCell.innerHTML.trim() && targetCell.innerHTML !== '&nbsp;') {
    cell.innerHTML += `<br/>${targetCell.innerHTML}`;
  }

  targetCell.remove();
  return true;
}

export function splitMergedCell(activeCell: HTMLElement | null): boolean {
  if (!activeCell) return false;
  const cell = activeCell.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.closest('tr') as HTMLTableRowElement | null;

  if (!cell || !row) return false;

  if ((cell.colSpan || 1) <= 1 && (cell.rowSpan || 1) <= 1) return false;

  const originalColspan = cell.colSpan || 1;
  cell.colSpan = 1;
  cell.rowSpan = 1;

  for (let i = 1; i < originalColspan; i++) {
    const newCell = document.createElement(cell.tagName.toLowerCase()) as HTMLTableCellElement;
    newCell.innerHTML = '&nbsp;';
    newCell.style.border = cell.style.border || '1px solid #cbd5e1';
    newCell.style.padding = cell.style.padding || '8px 12px';
    cell.after(newCell);
  }

  return true;
}

export function applyTableFormatting(formatStyles: TableFormatStyles, activeCell: HTMLElement | null): boolean {
  if (!activeCell) return false;

  const cell = activeCell.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.closest('tr') as HTMLTableRowElement | null;
  const table = row?.closest('table') as HTMLTableElement | null;

  if (!cell || !row || !table) return false;

  const applyStyleToElement = (el: HTMLElement) => {
    if (formatStyles.backgroundColor !== undefined) el.style.backgroundColor = formatStyles.backgroundColor;
    if (formatStyles.textColor !== undefined) el.style.color = formatStyles.textColor;
    if (formatStyles.textAlign !== undefined) el.style.textAlign = formatStyles.textAlign;
    if (formatStyles.verticalAlign !== undefined) el.style.verticalAlign = formatStyles.verticalAlign;
    if (formatStyles.padding !== undefined) el.style.padding = formatStyles.padding;

    if (formatStyles.borderWidth || formatStyles.borderStyle || formatStyles.borderColor) {
      const bw = formatStyles.borderWidth || '1px';
      const bs = formatStyles.borderStyle || 'solid';
      const bc = formatStyles.borderColor || '#cbd5e1';
      el.style.border = `${bw} ${bs} ${bc}`;
    }
  };

  switch (formatStyles.scope) {
    case 'cell':
      applyStyleToElement(cell);
      return true;

    case 'row':
      Array.from(row.cells).forEach((c) => applyStyleToElement(c));
      return true;

    case 'column': {
      const targetColIdx = cell.cellIndex;
      Array.from(table.rows).forEach((r) => {
        if (r.cells[targetColIdx]) {
          applyStyleToElement(r.cells[targetColIdx]);
        }
      });
      return true;
    }

    case 'selected-columns': {
      const colIndices = formatStyles.selectedColumnIndices?.length
        ? formatStyles.selectedColumnIndices
        : [cell.cellIndex];

      Array.from(table.rows).forEach((r) => {
        colIndices.forEach((cIdx) => {
          if (r.cells[cIdx]) {
            applyStyleToElement(r.cells[cIdx]);
          }
        });
      });
      return true;
    }

    case 'table':
      Array.from(table.rows).forEach((r) => {
        Array.from(r.cells).forEach((c) => applyStyleToElement(c));
      });
      return true;

    default:
      return false;
  }
}

export function exportDocument(
  htmlContent: string,
  format: 'doc' | 'pdf' | 'html' | 'txt',
  filename: string = 'document'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (format === 'pdf') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
              th { background-color: #f1f5f9; }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
    return;
  }

  let mimeType = 'text/html;charset=utf-8';
  let fileExtension = format;
  let fileData = htmlContent;

  if (format === 'doc') {
    mimeType = 'application/msword;charset=utf-8';
    fileData = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${filename}</title></head>
        <body>${htmlContent}</body>
      </html>
    `;
  } else if (format === 'txt') {
    mimeType = 'text/plain;charset=utf-8';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    fileData = tempDiv.innerText || tempDiv.textContent || '';
  }

  const blob = new Blob([fileData], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${filename}.${fileExtension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export function previewHtmlInNewTab(htmlContent: string): void {
  if (typeof window === 'undefined') return;

  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>HTML Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              max-width: 900px;
              margin: 0 auto;
              line-height: 1.6;
            }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            th { background-color: #f1f5f9; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    previewWindow.document.close();
  }
}