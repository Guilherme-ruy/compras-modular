import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnDef, ExportPurchase } from '../types';
import { PurchaseStatusLabels } from '../../../constants/purchases';
import { ApprovalActionLabels } from '../types';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

function getCellValue(
  purchase: ExportPurchase,
  item: ExportPurchase['items'][0] | null,
  approval: ExportPurchase['approvals'][0] | null,
  colId: string,
): string {
  switch (colId) {
    case 'number':           return `#${String(purchase.number).padStart(5, '0')}`;
    case 'createdAt':        return fmtDate(purchase.createdAt);
    case 'status':           return PurchaseStatusLabels[purchase.status] ?? purchase.status;
    case 'requester':        return purchase.requester?.name ?? '';
    case 'department':       return purchase.department?.name ?? '';
    case 'supplier':         return purchase.supplier?.companyName ?? '';
    case 'supplierDocument': return purchase.supplier?.document ?? '';
    case 'totalAmount':      return fmtCurrency.format(Number(purchase.totalAmount));
    case 'notes':            return (purchase.metadata as Record<string, string>)?.notes ?? '';
    case 'itemDescription':  return item?.description ?? '';
    case 'itemQuantity':     return item ? String(item.quantity) : '';
    case 'itemUnitPrice':    return item ? fmtCurrency.format(Number(item.unitPrice)) : '';
    case 'itemSubtotal':     return item ? fmtCurrency.format(Number(item.unitPrice) * item.quantity) : '';
    case 'itemCategory':     return item?.category?.name ?? '';
    case 'itemLink':         return item?.link ?? '';
    case 'approvalAction':   return approval ? (ApprovalActionLabels[approval.action] ?? approval.action) : '';
    case 'approvalActor':    return approval?.actor?.name ?? '';
    case 'approvalComments': return approval?.comments ?? '';
    case 'approvalDate':     return approval ? fmtDate(approval.actedAt) : '';
    default:                 return '';
  }
}

function getAggregatedApprovalValue(
  approvals: ExportPurchase['approvals'],
  colId: string,
): string {
  return approvals.map((a) => getCellValue({} as ExportPurchase, null, a, colId)).join('; ');
}

export function generateRows(
  purchases: ExportPurchase[],
  selectedCols: ColumnDef[],
): string[][] {
  const hasItems     = selectedCols.some((c) => c.section === 'items');
  const hasApprovals = selectedCols.some((c) => c.section === 'approvals');
  const rows: string[][] = [];

  for (const p of purchases) {
    if (hasItems) {
      const itemList = p.items.length > 0 ? p.items : [null];
      for (const item of itemList) {
        const row = selectedCols.map((col) => {
          if (col.section === 'approvals') return getAggregatedApprovalValue(p.approvals, col.id);
          return getCellValue(p, item, null, col.id);
        });
        rows.push(row);
      }
    } else if (hasApprovals) {
      const approvalList = p.approvals.length > 0 ? p.approvals : [null];
      for (const approval of approvalList) {
        const row = selectedCols.map((col) => getCellValue(p, null, approval, col.id));
        rows.push(row);
      }
    } else {
      const row = selectedCols.map((col) => getCellValue(p, null, null, col.id));
      rows.push(row);
    }
  }

  return rows;
}

export function exportCsv(
  purchases: ExportPurchase[],
  selectedCols: ColumnDef[],
  filename = 'relatorio-compras',
) {
  const headers = selectedCols.map((c) => c.label);
  const rows    = generateRows(purchases, selectedCols);
  const csvRows = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  const bom  = '﻿';
  const blob = new Blob([bom + csvRows], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportXlsx(
  purchases: ExportPurchase[],
  selectedCols: ColumnDef[],
  filename = 'relatorio-compras',
) {
  const headers = selectedCols.map((c) => c.label);
  const rows    = generateRows(purchases, selectedCols);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto column width
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPdf(
  purchases: ExportPurchase[],
  selectedCols: ColumnDef[],
  filename = 'relatorio-compras',
) {
  const headers = selectedCols.map((c) => c.label);
  const rows    = generateRows(purchases, selectedCols);

  const orientation = selectedCols.length > 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Relatório de Pedidos de Compra', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head:   [headers],
    body:   rows,
    styles:     { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
