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

  /* ── GSTIN Header Bar ── */
  doc.setFillColor(30, 58, 95); // primary navy
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${user.gstNo || 'N/A'}`, margin, 8);

  /* ── Company Header with red accent ── */
  doc.setFillColor(220, 60, 40); // invoice accent red
  doc.rect(0, 12, 60, 25, 'F');

  // Orange gradient stripe
  doc.setFillColor(230, 130, 50);
  doc.rect(60, 12, pageWidth - 60, 3, 'F');

  // Company Name
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(user.shopName || 'Company Name', 65, 25);

  // Company Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`${user.address || ''}, ${user.city || ''}, ${user.district || ''}`, 65, 31);
  doc.text(`${user.state || ''} | Mobile: ${user.mobile || ''}`, 65, 35);

  // "Invoice" label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 60, 40);
  doc.text('Invoice', 65, 43);

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
    `₹${item.rate.toFixed(2)}`,
    `₹${item.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: yPos,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30 },
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
  doc.text(`₹${bill.subTotal.toFixed(2)}`, pageWidth - margin - 5, totY, { align: 'right' });

  totY += 7;
  // CGST
  doc.setFont('helvetica', 'bold');
  doc.text(`CGST ${bill.cgstPercent}%`, totalsX, totY);
  doc.setFont('helvetica', 'normal');
  doc.text(`₹${bill.cgstAmount.toFixed(2)}`, pageWidth - margin - 5, totY, { align: 'right' });

  totY += 7;
  // SGST
  doc.setFont('helvetica', 'bold');
  doc.text(`SGST ${bill.sgstPercent}%`, totalsX, totY);
  doc.setFont('helvetica', 'normal');
  doc.text(`₹${bill.sgstAmount.toFixed(2)}`, pageWidth - margin - 5, totY, { align: 'right' });

  totY += 8;
  // Grand Total with accent background
  doc.setFillColor(220, 60, 40);
  doc.rect(totalsX - 5, totY - 5, 80, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total ₹', totalsX, totY);
  doc.text(`₹${bill.grandTotal.toFixed(2)}`, pageWidth - margin - 5, totY, { align: 'right' });

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
