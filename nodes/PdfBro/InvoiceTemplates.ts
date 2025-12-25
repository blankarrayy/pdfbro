import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';

// ====================
// TYPE DEFINITIONS
// ====================

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface InvoiceData {
    // Template Selection
    template: 'modern' | 'corporate' | 'creative' | 'classic' | 'startup';

    // Company Info
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;

    // Client Info
    clientName: string;
    clientAddress: string;
    clientEmail: string;

    // Invoice Details
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;

    // Line Items
    items: InvoiceItem[];

    // Tax
    taxRate: number; // percentage, e.g., 10 for 10%

    // Styling
    primaryColor: string; // hex color
    secondaryColor: string; // hex color

    // Footer
    notes: string;
    terms: string;
    paymentInstructions: string;
}

// ====================
// UTILITY FUNCTIONS
// ====================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

function drawMultilineText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number = 1.2
): number {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, size);

        if (width > maxWidth && line) {
            page.drawText(line, { x, y: currentY, font, size });
            currentY -= size * lineHeight;
            line = word;
        } else {
            line = testLine;
        }
    }

    if (line) {
        page.drawText(line, { x, y: currentY, font, size });
        currentY -= size * lineHeight;
    }

    return currentY;
}

// ====================
// TEMPLATE RENDERERS
// ====================

async function renderModernMinimal(pdf: PDFDocument, data: InvoiceData): Promise<void> {
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const primary = hexToRgb(data.primaryColor);
    const secondary = hexToRgb(data.secondaryColor);

    // Accent bar at top
    page.drawRectangle({
        x: 0, y: height - 8,
        width: width, height: 8,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Company name
    page.drawText(data.companyName, {
        x: 50, y: height - 60,
        font: fontBold, size: 24,
        color: rgb(0.1, 0.1, 0.1)
    });

    // INVOICE title
    page.drawText('INVOICE', {
        x: width - 150, y: height - 60,
        font: fontBold, size: 24,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Company details (left)
    let yPos = height - 90;
    for (const line of data.companyAddress.split('\n')) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
        yPos -= 14;
    }
    page.drawText(data.companyEmail, { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
    yPos -= 14;
    page.drawText(data.companyPhone, { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });

    // Invoice details (right)
    yPos = height - 90;
    page.drawText(`Invoice #: ${data.invoiceNumber}`, { x: width - 200, y: yPos, font: fontRegular, size: 10 });
    yPos -= 14;
    page.drawText(`Date: ${data.invoiceDate}`, { x: width - 200, y: yPos, font: fontRegular, size: 10 });
    yPos -= 14;
    page.drawText(`Due: ${data.dueDate}`, { x: width - 200, y: yPos, font: fontRegular, size: 10 });

    // Bill To section
    yPos = height - 200;
    page.drawText('BILL TO', { x: 50, y: yPos, font: fontBold, size: 10, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 18;
    page.drawText(data.clientName, { x: 50, y: yPos, font: fontBold, size: 12 });
    yPos -= 16;
    for (const line of data.clientAddress.split('\n')) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
        yPos -= 14;
    }
    page.drawText(data.clientEmail, { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });

    // Table header
    yPos = height - 320;
    page.drawRectangle({ x: 50, y: yPos - 5, width: width - 100, height: 25, color: rgb(secondary.r, secondary.g, secondary.b) });
    page.drawText('Description', { x: 60, y: yPos, font: fontBold, size: 10 });
    page.drawText('Qty', { x: 320, y: yPos, font: fontBold, size: 10 });
    page.drawText('Price', { x: 380, y: yPos, font: fontBold, size: 10 });
    page.drawText('Total', { x: 480, y: yPos, font: fontBold, size: 10 });

    // Table rows
    yPos -= 35;
    let subtotal = 0;
    for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;

        page.drawText(item.description.substring(0, 40), { x: 60, y: yPos, font: fontRegular, size: 10 });
        page.drawText(item.quantity.toString(), { x: 320, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${item.unitPrice.toFixed(2)}`, { x: 380, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${itemTotal.toFixed(2)}`, { x: 480, y: yPos, font: fontRegular, size: 10 });

        yPos -= 25;

        // Draw separator line
        page.drawLine({ start: { x: 50, y: yPos + 10 }, end: { x: width - 50, y: yPos + 10 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    }

    // Totals
    yPos -= 20;
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    page.drawText('Subtotal:', { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${subtotal.toFixed(2)}`, { x: 480, y: yPos, font: fontRegular, size: 10 });
    yPos -= 18;
    page.drawText(`Tax (${data.taxRate}%):`, { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${tax.toFixed(2)}`, { x: 480, y: yPos, font: fontRegular, size: 10 });
    yPos -= 22;
    page.drawRectangle({ x: 370, y: yPos - 5, width: 175, height: 25, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText('TOTAL:', { x: 380, y: yPos, font: fontBold, size: 12, color: rgb(1, 1, 1) });
    page.drawText(`${data.currency}${total.toFixed(2)}`, { x: 480, y: yPos, font: fontBold, size: 12, color: rgb(1, 1, 1) });

    // Footer
    yPos = 120;
    if (data.notes) {
        page.drawText('Notes:', { x: 50, y: yPos, font: fontBold, size: 9 });
        yPos -= 14;
        yPos = drawMultilineText(page, data.notes, 50, yPos, fontRegular, 9, 250);
    }

    if (data.paymentInstructions) {
        page.drawText('Payment Instructions:', { x: 320, y: 120, font: fontBold, size: 9 });
        drawMultilineText(page, data.paymentInstructions, 320, 106, fontRegular, 9, 220);
    }

    // Terms at bottom
    if (data.terms) {
        page.drawText(data.terms.substring(0, 100), { x: 50, y: 40, font: fontRegular, size: 8, color: rgb(0.5, 0.5, 0.5) });
    }
}

async function renderCorporateProfessional(pdf: PDFDocument, data: InvoiceData): Promise<void> {
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontRegular = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

    const primary = hexToRgb(data.primaryColor);

    // Header background
    page.drawRectangle({
        x: 0, y: height - 120,
        width: width, height: 120,
        color: rgb(0.95, 0.95, 0.95)
    });

    // Company name
    page.drawText(data.companyName.toUpperCase(), {
        x: 50, y: height - 50,
        font: fontBold, size: 22,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Company details under name
    let yPos = height - 75;
    const companyLines = data.companyAddress.split('\n');
    for (const line of companyLines) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 9 });
        yPos -= 12;
    }
    page.drawText(`${data.companyEmail} | ${data.companyPhone}`, { x: 50, y: yPos, font: fontRegular, size: 9 });

    // Invoice box on right
    page.drawRectangle({
        x: width - 200, y: height - 110,
        width: 150, height: 80,
        borderColor: rgb(primary.r, primary.g, primary.b),
        borderWidth: 2
    });
    page.drawText('INVOICE', { x: width - 175, y: height - 55, font: fontBold, size: 16, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText(`#${data.invoiceNumber}`, { x: width - 175, y: height - 75, font: fontRegular, size: 12 });
    page.drawText(`Date: ${data.invoiceDate}`, { x: width - 175, y: height - 92, font: fontRegular, size: 9 });
    page.drawText(`Due: ${data.dueDate}`, { x: width - 175, y: height - 105, font: fontRegular, size: 9 });

    // Bill To
    yPos = height - 170;
    page.drawText('Bill To:', { x: 50, y: yPos, font: fontBold, size: 11 });
    yPos -= 18;
    page.drawText(data.clientName, { x: 50, y: yPos, font: fontBold, size: 11 });
    yPos -= 15;
    for (const line of data.clientAddress.split('\n')) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 10 });
        yPos -= 13;
    }
    page.drawText(data.clientEmail, { x: 50, y: yPos, font: fontRegular, size: 10 });

    // Table
    yPos = height - 300;

    // Table header with background
    page.drawRectangle({ x: 50, y: yPos - 5, width: width - 100, height: 22, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText('Description', { x: 60, y: yPos, font: fontBold, size: 10, color: rgb(1, 1, 1) });
    page.drawText('Qty', { x: 320, y: yPos, font: fontBold, size: 10, color: rgb(1, 1, 1) });
    page.drawText('Rate', { x: 380, y: yPos, font: fontBold, size: 10, color: rgb(1, 1, 1) });
    page.drawText('Amount', { x: 470, y: yPos, font: fontBold, size: 10, color: rgb(1, 1, 1) });

    // Table rows with alternating colors
    yPos -= 30;
    let subtotal = 0;
    let rowIndex = 0;
    for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;

        if (rowIndex % 2 === 0) {
            page.drawRectangle({ x: 50, y: yPos - 5, width: width - 100, height: 22, color: rgb(0.97, 0.97, 0.97) });
        }

        page.drawText(item.description.substring(0, 35), { x: 60, y: yPos, font: fontRegular, size: 10 });
        page.drawText(item.quantity.toString(), { x: 330, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${item.unitPrice.toFixed(2)}`, { x: 380, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${itemTotal.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });

        yPos -= 25;
        rowIndex++;
    }

    // Double line before totals
    page.drawLine({ start: { x: 350, y: yPos + 10 }, end: { x: width - 50, y: yPos + 10 }, thickness: 1 });
    page.drawLine({ start: { x: 350, y: yPos + 7 }, end: { x: width - 50, y: yPos + 7 }, thickness: 1 });

    // Totals
    yPos -= 15;
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    page.drawText('Subtotal:', { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${subtotal.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 18;
    page.drawText(`Tax (${data.taxRate}%):`, { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${tax.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 20;
    page.drawLine({ start: { x: 370, y: yPos + 8 }, end: { x: width - 50, y: yPos + 8 }, thickness: 1 });
    page.drawText('TOTAL DUE:', { x: 380, y: yPos - 5, font: fontBold, size: 12 });
    page.drawText(`${data.currency}${total.toFixed(2)}`, { x: 470, y: yPos - 5, font: fontBold, size: 12 });

    // Footer sections
    yPos = 140;

    // Notes
    if (data.notes) {
        page.drawText('Notes', { x: 50, y: yPos, font: fontBold, size: 10 });
        yPos -= 14;
        drawMultilineText(page, data.notes, 50, yPos, fontRegular, 9, 220);
    }

    // Payment info
    if (data.paymentInstructions) {
        page.drawText('Payment Information', { x: 300, y: 140, font: fontBold, size: 10 });
        drawMultilineText(page, data.paymentInstructions, 300, 126, fontRegular, 9, 240);
    }

    // Terms
    if (data.terms) {
        page.drawLine({ start: { x: 50, y: 55 }, end: { x: width - 50, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(`Terms: ${data.terms.substring(0, 90)}`, { x: 50, y: 40, font: fontRegular, size: 8, color: rgb(0.5, 0.5, 0.5) });
    }
}

async function renderCreativeBold(pdf: PDFDocument, data: InvoiceData): Promise<void> {
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const primary = hexToRgb(data.primaryColor);
    const secondary = hexToRgb(data.secondaryColor);

    // Gradient-like header (simulate with multiple rectangles)
    for (let i = 0; i < 20; i++) {
        const ratio = i / 20;
        page.drawRectangle({
            x: 0, y: height - 160 + (i * 8),
            width: width, height: 8,
            color: rgb(
                primary.r + (secondary.r - primary.r) * ratio,
                primary.g + (secondary.g - primary.g) * ratio,
                primary.b + (secondary.b - primary.b) * ratio
            )
        });
    }

    // Company name in white
    page.drawText(data.companyName.toUpperCase(), {
        x: 50, y: height - 60,
        font: fontBold, size: 28,
        color: rgb(1, 1, 1)
    });

    // Invoice label
    page.drawText('INVOICE', {
        x: width - 150, y: height - 55,
        font: fontBold, size: 20,
        color: rgb(1, 1, 1)
    });
    page.drawText(`#${data.invoiceNumber}`, {
        x: width - 150, y: height - 78,
        font: fontRegular, size: 14,
        color: rgb(1, 1, 1)
    });

    // Company info below header
    let yPos = height - 185;
    page.drawText(data.companyAddress.replace(/\n/g, ' • '), { x: 50, y: yPos, font: fontRegular, size: 9, color: rgb(0.4, 0.4, 0.4) });
    yPos -= 14;
    page.drawText(`${data.companyEmail} • ${data.companyPhone}`, { x: 50, y: yPos, font: fontRegular, size: 9, color: rgb(0.4, 0.4, 0.4) });

    // Dates on right
    page.drawText(`Date: ${data.invoiceDate}`, { x: width - 150, y: height - 185, font: fontRegular, size: 10 });
    page.drawText(`Due: ${data.dueDate}`, { x: width - 150, y: height - 199, font: fontRegular, size: 10 });

    // Client section with colored accent
    yPos = height - 250;
    page.drawRectangle({ x: 50, y: yPos - 60, width: 5, height: 70, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText('BILLED TO', { x: 65, y: yPos, font: fontBold, size: 10, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 18;
    page.drawText(data.clientName, { x: 65, y: yPos, font: fontBold, size: 14 });
    yPos -= 18;
    for (const line of data.clientAddress.split('\n')) {
        page.drawText(line.trim(), { x: 65, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
        yPos -= 14;
    }
    page.drawText(data.clientEmail, { x: 65, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });

    // Table
    yPos = height - 380;

    // Header row
    page.drawText('ITEM', { x: 50, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('QTY', { x: 300, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('RATE', { x: 370, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('AMOUNT', { x: 470, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });

    yPos -= 8;
    page.drawLine({ start: { x: 50, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 2, color: rgb(primary.r, primary.g, primary.b) });

    // Items
    yPos -= 25;
    let subtotal = 0;
    for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;

        page.drawText(item.description.substring(0, 35), { x: 50, y: yPos, font: fontRegular, size: 11 });
        page.drawText(item.quantity.toString(), { x: 310, y: yPos, font: fontRegular, size: 11 });
        page.drawText(`${data.currency}${item.unitPrice.toFixed(2)}`, { x: 370, y: yPos, font: fontRegular, size: 11 });
        page.drawText(`${data.currency}${itemTotal.toFixed(2)}`, { x: 470, y: yPos, font: fontBold, size: 11 });

        yPos -= 30;
        page.drawLine({ start: { x: 50, y: yPos + 12 }, end: { x: width - 50, y: yPos + 12 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    }

    // Totals section
    yPos -= 20;
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    page.drawText('Subtotal', { x: 370, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${subtotal.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 18;
    page.drawText(`Tax (${data.taxRate}%)`, { x: 370, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${tax.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 25;

    // Total box
    page.drawRectangle({ x: 360, y: yPos - 10, width: 185, height: 35, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText('TOTAL', { x: 375, y: yPos, font: fontBold, size: 14, color: rgb(1, 1, 1) });
    page.drawText(`${data.currency}${total.toFixed(2)}`, { x: 460, y: yPos, font: fontBold, size: 14, color: rgb(1, 1, 1) });

    // Footer
    yPos = 120;
    if (data.notes || data.paymentInstructions) {
        page.drawLine({ start: { x: 50, y: yPos + 20 }, end: { x: width - 50, y: yPos + 20 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    }

    if (data.notes) {
        page.drawText('NOTES', { x: 50, y: yPos, font: fontBold, size: 9, color: rgb(primary.r, primary.g, primary.b) });
        drawMultilineText(page, data.notes, 50, yPos - 14, fontRegular, 9, 220);
    }

    if (data.paymentInstructions) {
        page.drawText('PAYMENT', { x: 300, y: yPos, font: fontBold, size: 9, color: rgb(primary.r, primary.g, primary.b) });
        drawMultilineText(page, data.paymentInstructions, 300, yPos - 14, fontRegular, 9, 240);
    }

    // Terms at bottom
    if (data.terms) {
        page.drawText(data.terms.substring(0, 100), { x: 50, y: 35, font: fontRegular, size: 8, color: rgb(0.6, 0.6, 0.6) });
    }
}

async function renderClassicElegant(pdf: PDFDocument, data: InvoiceData): Promise<void> {
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontRegular = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

    const primary = hexToRgb(data.primaryColor);

    // Elegant border
    page.drawRectangle({
        x: 30, y: 30,
        width: width - 60, height: height - 60,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1
    });
    page.drawRectangle({
        x: 35, y: 35,
        width: width - 70, height: height - 70,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.5
    });

    // Company name centered
    const companyWidth = fontBold.widthOfTextAtSize(data.companyName, 26);
    page.drawText(data.companyName, {
        x: (width - companyWidth) / 2, y: height - 80,
        font: fontBold, size: 26,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Decorative line under company name
    page.drawLine({
        start: { x: width / 2 - 80, y: height - 95 },
        end: { x: width / 2 + 80, y: height - 95 },
        thickness: 1,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Company details centered
    let yPos = height - 115;
    const addressLine = data.companyAddress.replace(/\n/g, ', ');
    const addrWidth = fontRegular.widthOfTextAtSize(addressLine, 10);
    page.drawText(addressLine, { x: (width - addrWidth) / 2, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
    yPos -= 14;
    const contactLine = `${data.companyEmail} | ${data.companyPhone}`;
    const contactWidth = fontRegular.widthOfTextAtSize(contactLine, 10);
    page.drawText(contactLine, { x: (width - contactWidth) / 2, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });

    // INVOICE title
    yPos = height - 170;
    const invoiceTitle = 'I N V O I C E';
    const titleWidth = fontBold.widthOfTextAtSize(invoiceTitle, 18);
    page.drawText(invoiceTitle, { x: (width - titleWidth) / 2, y: yPos, font: fontBold, size: 18 });

    // Invoice details
    yPos -= 35;
    page.drawText(`Invoice Number: ${data.invoiceNumber}`, { x: 60, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`Invoice Date: ${data.invoiceDate}`, { x: width - 200, y: yPos, font: fontRegular, size: 10 });
    yPos -= 16;
    page.drawText(`Due Date: ${data.dueDate}`, { x: width - 200, y: yPos, font: fontRegular, size: 10 });

    // Bill To
    yPos = height - 260;
    page.drawText('Bill To:', { x: 60, y: yPos, font: fontItalic, size: 11 });
    yPos -= 18;
    page.drawText(data.clientName, { x: 60, y: yPos, font: fontBold, size: 12 });
    yPos -= 16;
    for (const line of data.clientAddress.split('\n')) {
        page.drawText(line.trim(), { x: 60, y: yPos, font: fontRegular, size: 10 });
        yPos -= 14;
    }
    page.drawText(data.clientEmail, { x: 60, y: yPos, font: fontRegular, size: 10 });

    // Table
    yPos = height - 380;

    // Table border
    const tableTop = yPos + 15;
    const tableHeight = 30 + (data.items.length * 28) + 80;
    page.drawRectangle({
        x: 55, y: tableTop - tableHeight,
        width: width - 110, height: tableHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5
    });

    // Header
    page.drawLine({ start: { x: 55, y: yPos - 8 }, end: { x: width - 55, y: yPos - 8 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Description', { x: 65, y: yPos, font: fontBold, size: 10 });
    page.drawText('Quantity', { x: 300, y: yPos, font: fontBold, size: 10 });
    page.drawText('Price', { x: 380, y: yPos, font: fontBold, size: 10 });
    page.drawText('Amount', { x: 470, y: yPos, font: fontBold, size: 10 });

    // Items
    yPos -= 28;
    let subtotal = 0;
    for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;

        page.drawText(item.description.substring(0, 35), { x: 65, y: yPos, font: fontRegular, size: 10 });
        page.drawText(item.quantity.toString(), { x: 315, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${item.unitPrice.toFixed(2)}`, { x: 380, y: yPos, font: fontRegular, size: 10 });
        page.drawText(`${data.currency}${itemTotal.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });

        yPos -= 28;
    }

    // Totals
    page.drawLine({ start: { x: 350, y: yPos + 15 }, end: { x: width - 55, y: yPos + 15 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });

    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    page.drawText('Subtotal:', { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${subtotal.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 18;
    page.drawText(`Tax (${data.taxRate}%):`, { x: 380, y: yPos, font: fontRegular, size: 10 });
    page.drawText(`${data.currency}${tax.toFixed(2)}`, { x: 470, y: yPos, font: fontRegular, size: 10 });
    yPos -= 22;
    page.drawLine({ start: { x: 370, y: yPos + 10 }, end: { x: width - 55, y: yPos + 10 }, thickness: 1 });
    page.drawText('Total Due:', { x: 380, y: yPos - 5, font: fontBold, size: 12 });
    page.drawText(`${data.currency}${total.toFixed(2)}`, { x: 465, y: yPos - 5, font: fontBold, size: 12 });

    // Footer
    yPos = 150;

    if (data.notes) {
        page.drawText('Notes:', { x: 60, y: yPos, font: fontItalic, size: 10 });
        drawMultilineText(page, data.notes, 60, yPos - 14, fontRegular, 9, 220);
    }

    if (data.paymentInstructions) {
        page.drawText('Payment Instructions:', { x: 300, y: yPos, font: fontItalic, size: 10 });
        drawMultilineText(page, data.paymentInstructions, 300, yPos - 14, fontRegular, 9, 230);
    }

    // Terms
    if (data.terms) {
        page.drawText(data.terms.substring(0, 90), { x: 60, y: 55, font: fontItalic, size: 8, color: rgb(0.5, 0.5, 0.5) });
    }

    // Thank you
    const thankYou = 'Thank you for your business';
    const tyWidth = fontItalic.widthOfTextAtSize(thankYou, 10);
    page.drawText(thankYou, { x: (width - tyWidth) / 2, y: 40, font: fontItalic, size: 10, color: rgb(primary.r, primary.g, primary.b) });
}

async function renderTechStartup(pdf: PDFDocument, data: InvoiceData): Promise<void> {
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const primary = hexToRgb(data.primaryColor);
    const secondary = hexToRgb(data.secondaryColor);

    // Dark sidebar
    page.drawRectangle({
        x: 0, y: 0,
        width: 180, height: height,
        color: rgb(0.12, 0.12, 0.15)
    });

    // Company name in sidebar
    page.drawText(data.companyName, {
        x: 20, y: height - 50,
        font: fontBold, size: 18,
        color: rgb(1, 1, 1)
    });

    // Company details in sidebar
    let yPos = height - 80;
    for (const line of data.companyAddress.split('\n')) {
        page.drawText(line.trim(), { x: 20, y: yPos, font: fontRegular, size: 8, color: rgb(0.6, 0.6, 0.6) });
        yPos -= 12;
    }
    page.drawText(data.companyEmail, { x: 20, y: yPos, font: fontRegular, size: 8, color: rgb(0.6, 0.6, 0.6) });
    yPos -= 12;
    page.drawText(data.companyPhone, { x: 20, y: yPos, font: fontRegular, size: 8, color: rgb(0.6, 0.6, 0.6) });

    // Accent line
    yPos -= 25;
    page.drawRectangle({ x: 20, y: yPos, width: 140, height: 3, color: rgb(primary.r, primary.g, primary.b) });

    // Payment info in sidebar
    if (data.paymentInstructions) {
        yPos -= 30;
        page.drawText('PAYMENT', { x: 20, y: yPos, font: fontBold, size: 9, color: rgb(primary.r, primary.g, primary.b) });
        yPos -= 16;
        const paymentLines = data.paymentInstructions.split(' ');
        let payLine = '';
        for (const word of paymentLines) {
            if (fontRegular.widthOfTextAtSize(payLine + ' ' + word, 8) > 140) {
                page.drawText(payLine, { x: 20, y: yPos, font: fontRegular, size: 8, color: rgb(0.7, 0.7, 0.7) });
                yPos -= 11;
                payLine = word;
            } else {
                payLine = payLine ? payLine + ' ' + word : word;
            }
        }
        if (payLine) {
            page.drawText(payLine, { x: 20, y: yPos, font: fontRegular, size: 8, color: rgb(0.7, 0.7, 0.7) });
        }
    }

    // Main content area
    const contentX = 200;

    // Invoice header
    page.drawText('INVOICE', {
        x: contentX, y: height - 50,
        font: fontBold, size: 32,
        color: rgb(0.15, 0.15, 0.15)
    });

    // Invoice details
    yPos = height - 90;
    page.drawText(`#${data.invoiceNumber}`, { x: contentX, y: yPos, font: fontBold, size: 14, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText(`Issued: ${data.invoiceDate}`, { x: width - 150, y: yPos, font: fontRegular, size: 10 });
    yPos -= 16;
    page.drawText(`Due: ${data.dueDate}`, { x: width - 150, y: yPos, font: fontRegular, size: 10, color: rgb(0.8, 0.2, 0.2) });

    // Client section
    yPos = height - 150;
    page.drawRectangle({ x: contentX, y: yPos - 70, width: width - contentX - 50, height: 80, color: rgb(0.97, 0.97, 0.97) });
    page.drawText('BILL TO', { x: contentX + 15, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    yPos -= 18;
    page.drawText(data.clientName, { x: contentX + 15, y: yPos, font: fontBold, size: 13 });
    yPos -= 16;
    for (const line of data.clientAddress.split('\n')) {
        page.drawText(line.trim(), { x: contentX + 15, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });
        yPos -= 13;
    }
    page.drawText(data.clientEmail, { x: contentX + 15, y: yPos, font: fontRegular, size: 10, color: rgb(0.4, 0.4, 0.4) });

    // Items table
    yPos = height - 280;

    // Table header
    page.drawText('SERVICE', { x: contentX, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('QTY', { x: 380, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('RATE', { x: 430, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('TOTAL', { x: 500, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });

    yPos -= 10;
    page.drawLine({ start: { x: contentX, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 2, color: rgb(primary.r, primary.g, primary.b) });

    // Items
    yPos -= 25;
    let subtotal = 0;
    for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;

        page.drawText(item.description.substring(0, 25), { x: contentX, y: yPos, font: fontRegular, size: 11 });
        page.drawText(item.quantity.toString(), { x: 390, y: yPos, font: fontRegular, size: 11 });
        page.drawText(`${data.currency}${item.unitPrice.toFixed(2)}`, { x: 430, y: yPos, font: fontRegular, size: 11 });
        page.drawText(`${data.currency}${itemTotal.toFixed(2)}`, { x: 500, y: yPos, font: fontBold, size: 11 });

        yPos -= 28;
        page.drawLine({ start: { x: contentX, y: yPos + 12 }, end: { x: width - 50, y: yPos + 12 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    }

    // Totals
    yPos -= 15;
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;

    page.drawText('Subtotal', { x: 420, y: yPos, font: fontRegular, size: 10, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(`${data.currency}${subtotal.toFixed(2)}`, { x: 500, y: yPos, font: fontRegular, size: 10 });
    yPos -= 18;
    page.drawText(`Tax ${data.taxRate}%`, { x: 420, y: yPos, font: fontRegular, size: 10, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(`${data.currency}${tax.toFixed(2)}`, { x: 500, y: yPos, font: fontRegular, size: 10 });

    // Total box
    yPos -= 30;
    page.drawRectangle({ x: 400, y: yPos - 10, width: 145, height: 40, color: rgb(primary.r, primary.g, primary.b) });
    page.drawText('TOTAL', { x: 415, y: yPos + 5, font: fontBold, size: 10, color: rgb(1, 1, 1) });
    page.drawText(`${data.currency}${total.toFixed(2)}`, { x: 480, y: yPos + 5, font: fontBold, size: 16, color: rgb(1, 1, 1) });

    // Notes
    if (data.notes) {
        yPos = 120;
        page.drawText('NOTES', { x: contentX, y: yPos, font: fontBold, size: 9, color: rgb(0.5, 0.5, 0.5) });
        drawMultilineText(page, data.notes, contentX, yPos - 14, fontRegular, 9, 340);
    }

    // Terms at very bottom of sidebar
    if (data.terms) {
        page.drawText(data.terms.substring(0, 60), { x: 20, y: 40, font: fontRegular, size: 7, color: rgb(0.4, 0.4, 0.4) });
    }
}

// ====================
// MAIN EXPORT
// ====================

export async function generateInvoice(data: InvoiceData): Promise<Buffer> {
    const pdf = await PDFDocument.create();

    switch (data.template) {
        case 'modern':
            await renderModernMinimal(pdf, data);
            break;
        case 'corporate':
            await renderCorporateProfessional(pdf, data);
            break;
        case 'creative':
            await renderCreativeBold(pdf, data);
            break;
        case 'classic':
            await renderClassicElegant(pdf, data);
            break;
        case 'startup':
            await renderTechStartup(pdf, data);
            break;
        default:
            await renderModernMinimal(pdf, data);
    }

    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
}
