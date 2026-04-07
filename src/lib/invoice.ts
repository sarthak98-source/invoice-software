/**
 * Invoice PDF Generator — creates a professional invoice matching the provided template
 * Uses jsPDF + jspdf-autotable
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords } from './number-to-words';
import type { Bill, User } from './store';

export function generateInvoicePDF(bill: Bill, user: User): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const formatCurrency = (value: number) => `Rs. ${value.toFixed(2)}`;

  /* ── Header ── */
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(user.shopName || 'Company Name', margin, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user.address || ''}`, margin, 22);
  doc.text(`${user.city || ''}${user.city && user.district ? ', ' : ''}${user.district || ''}`, margin, 26);
  doc.text(`${user.state || ''}${user.state && user.mobile ? ' | ' : ''}Mobile: ${user.mobile || ''}`, margin, 30);
  doc.text(`GSTIN: ${user.gstNo || 'N/A'}`, margin, 34);

  // "Invoice" label and reference
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill No.', pageWidth - margin, 28, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${bill.billNo}`, pageWidth - margin - 10, 28, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Date', pageWidth - margin, 34, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(bill.date).toLocaleDateString('en-IN'), pageWidth - margin - 10, 34, { align: 'right' });

  let yPos = 50;

  /* ── Bill No and Date ── */
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(`Bill No.`, margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bill.billNo}`, margin + 20, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(bill.date).toLocaleDateString('en-IN'), pageWidth - 60 + 15, yPos);

  yPos += 10;

  /* ── Customer Details ── */
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Name', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.line(margin + 18, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(bill.customerName || '-', margin + 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Address', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.line(margin + 22, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(bill.customerAddress || '-', margin + 24, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Phone No.', margin + 80, yPos);
  doc.setFont('helvetica', 'normal');
  doc.line(margin + 105, yPos + 1, pageWidth - margin, yPos + 1);
  doc.text(bill.customerPhone || '-', margin + 107, yPos);

  yPos += 10;

  /* ── Items Table ── */
  const tableHeaders = [['SL.NO.', 'DESCRIPTION', 'HSN', 'QTY', 'RATE', 'AMOUNT']];
  const tableData = bill.items.map((item, idx) => [
    String(idx + 1),
    item.name,
    item.hsn || '-',
    `${item.quantity} ${item.unit}`,
    formatCurrency(item.rate),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: yPos,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 9,
      textColor: [50, 50, 50],
      overflow: 'linebreak',
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 70, halign: 'left' },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 36 },
    },
    theme: 'grid',
  });

  /* ── Totals Section ── */
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  let totY = finalY;

  const totalsX = pageWidth - margin - 75;

  // Sub Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Sub Total', totalsX, totY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(bill.subTotal), pageWidth - margin - 5, totY, { align: 'right' });

  totY += 7;
  // CGST
  doc.setFont('helvetica', 'bold');
  doc.text(`CGST ${bill.cgstPercent}%`, totalsX, totY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(bill.cgstAmount), pageWidth - margin - 5, totY, { align: 'right' });

  totY += 7;
  // SGST
  doc.setFont('helvetica', 'bold');
  doc.text(`SGST ${bill.sgstPercent}%`, totalsX, totY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(bill.sgstAmount), pageWidth - margin - 5, totY, { align: 'right' });

  totY += 8;
  // Grand Total
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(totalsX - 5, totY - 3, pageWidth - margin, totY - 3);
  doc.setTextColor(30, 58, 95);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', totalsX, totY);
  doc.text(formatCurrency(bill.grandTotal), pageWidth - margin - 5, totY, { align: 'right' });

  totY += 12;

  /* ── GSTIN + Amount in words ── */
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${user.gstNo || 'N/A'}`, margin, totY);

  totY += 7;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text(`Rupees in words: ${numberToWords(bill.grandTotal)}`, margin, totY);

  /* ── Signature ── */
  totY += 15;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 58, 95);
  doc.text('Signature', pageWidth - margin - 5, totY, { align: 'right' });
  doc.line(pageWidth - margin - 50, totY - 5, pageWidth - margin, totY - 5);

  /* ── Footer ── */
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by BillCraft — Made with ❤ by Shela Gang', pageWidth / 2, 290, { align: 'center' });

  /* Save */
  doc.save(`Invoice_${bill.billNo}_${new Date(bill.date).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
}
