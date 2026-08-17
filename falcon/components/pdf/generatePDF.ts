/**
 * generatePDF — branded job card PDF using jsPDF + jspdf-autotable.
 *
 * Produces a PDF containing:
 *   - Falcon Accessories header (black + red theme)
 *   - Customer details section
 *   - Vehicle details section
 *   - Accessories table (Name, Variant, Qty, Price)
 *   - Total amount row
 *   - Signature section
 *   - Job date
 *
 * Total is the arithmetic sum of (price × quantity) for all accessories.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { JobCard, SelectedAccessory } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratePDFOptions {
  jobCard: JobCard;
  accessories: SelectedAccessory[];
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const COLOR_BLACK: [number, number, number] = [10, 10, 10];
const COLOR_RED: [number, number, number] = [229, 62, 62];
const COLOR_SURFACE: [number, number, number] = [26, 26, 26];
const COLOR_WHITE: [number, number, number] = [255, 255, 255];
const COLOR_LIGHT_GRAY: [number, number, number] = [240, 240, 240];
const COLOR_DARK_GRAY: [number, number, number] = [80, 80, 80];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateJobCardPDF({ jobCard, accessories, totalAmount }: GeneratePDFOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header ────────────────────────────────────────────────────────────────
  // Black background bar
  doc.setFillColor(...COLOR_BLACK);
  doc.rect(0, 0, pageW, 28, 'F');

  // Red accent stripe
  doc.setFillColor(...COLOR_RED);
  doc.rect(0, 28, pageW, 3, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLOR_WHITE);
  doc.text('FALCON CARX', pageW / 2, 13, { align: 'center' });

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_RED);
  doc.text('Premium Car Accessories — Chennai', pageW / 2, 19, { align: 'center' });

  // Contact details
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_WHITE);
  doc.text('LGN ROAD, Border Thottam, Padupakkam, Royapettah, Chennai 600002 | Ph: 099409 93309 | falconaccessorieschennai@gmail.com', pageW / 2, 25, { align: 'center' });

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_RED);
  doc.text('JOB CARD', pageW / 2, 38, { align: 'center' });

  y = 46;

  // ── Job Card ID + Date ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_DARK_GRAY);
  doc.text(`Job Card ID: ${jobCard.id}`, 14, y);
  doc.text(`Date: ${formatDate(jobCard.date)}`, pageW - 14, y, { align: 'right' });

  y += 8;

  // ── Customer Details ──────────────────────────────────────────────────────
  doc.setFillColor(...COLOR_SURFACE);
  doc.setTextColor(...COLOR_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.rect(14, y, pageW - 28, 7, 'F');
  doc.text('CUSTOMER DETAILS', 17, y + 5);
  y += 10;

  const customerRows: [string, string][] = [
    ['Customer Name', jobCard.customerName],
    ['Phone Number', jobCard.phoneNumber],
    ['Employee Name', jobCard.employeeName || '—'],
    ['Notes', jobCard.notes || '—'],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_BLACK);

  for (const [label, value] of customerRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_DARK_GRAY);
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_BLACK);
    doc.text(value, 60, y);
    y += 6;
  }

  y += 4;

  // ── Vehicle Details ───────────────────────────────────────────────────────
  doc.setFillColor(...COLOR_SURFACE);
  doc.setTextColor(...COLOR_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.rect(14, y, pageW - 28, 7, 'F');
  doc.text('VEHICLE DETAILS', 17, y + 5);
  y += 10;

  const vehicleRows: [string, string][] = [
    ['Vehicle Name', jobCard.vehicleName],
    ['Vehicle Number', jobCard.vehicleNumber],
    ['Job Date', formatDate(jobCard.date)],
    ['Delivery Date', formatDate(jobCard.deliveryDate)],
  ];

  for (const [label, value] of vehicleRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_DARK_GRAY);
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_BLACK);
    doc.text(value, 60, y);
    y += 6;
  }

  y += 4;

  // ── Accessories Table ─────────────────────────────────────────────────────
  const tableRows = accessories.map((a) => [
    a.name,
    a.variant || '—',
    String(a.quantity),
    formatCurrency(a.price),
    formatCurrency(a.price * a.quantity),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Accessory', 'Variant', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    foot: [
      [
        { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(totalAmount), styles: { fontStyle: 'bold', textColor: COLOR_RED } },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_BLACK,
      textColor: COLOR_WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: COLOR_LIGHT_GRAY,
      textColor: COLOR_BLACK,
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLOR_BLACK,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Signature Section ─────────────────────────────────────────────────────
  const sigY = y + 20;

  // Left — Customer signature
  doc.setDrawColor(...COLOR_DARK_GRAY);
  doc.line(14, sigY, 80, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_DARK_GRAY);
  doc.text('Customer Signature', 14, sigY + 5);

  // Right — Authorised signature
  doc.line(pageW - 80, sigY, pageW - 14, sigY);
  doc.text('Authorised Signature', pageW - 80, sigY + 5);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setFillColor(...COLOR_RED);
  doc.rect(0, footerY - 4, pageW, 18, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_WHITE);
  doc.text('Thank you for choosing Falcon Carx — Chennai', pageW / 2, footerY + 1, { align: 'center' });
  doc.setFontSize(6);
  doc.text('LGN ROAD, Border Thottam, Padupakkam, Royapettah, Chennai 600002', pageW / 2, footerY + 6, { align: 'center' });
  doc.text('Phone: 099409 93309 | Email: falconaccessorieschennai@gmail.com', pageW / 2, footerY + 10, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `JobCard_${jobCard.vehicleNumber.replace(/\s+/g, '_')}_${jobCard.id.slice(0, 6)}.pdf`;
  doc.save(filename);
}
