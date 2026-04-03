import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

// ====================
// TYPE DEFINITIONS
// ====================

export interface OfferLetterData {
    // Company Info
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    hiringManagerName: string;
    hiringManagerTitle: string;

    // Candidate Info
    candidateName: string;
    candidatePreferredName: string;
    candidateAddress: string;
    candidateEmail: string;

    // Job Details
    jobTitle: string;
    department: string;
    managerName: string;
    startDate: string;
    salary: string;
    currency: string;
    paymentFrequency: string;
    benefits: string;

    // Offer Details
    offerDate: string;
    expirationDate: string;
    notes: string;

    // Styling
    primaryColor: string;
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
    } : { r: 0.1, g: 0.4, b: 0.7 }; // Default blue
}

function drawMultilineText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number = 1.4
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
// MAIN EXPORT
// ====================

export async function generateOfferLetter(data: OfferLetterData): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Embed fonts
    const fontRegular = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

    const primary = hexToRgb(data.primaryColor);

    // ========================================
    // HEADER - Accent bar + Company Name
    // ========================================
    page.drawRectangle({
        x: 0, y: height - 10,
        width: width, height: 10,
        color: rgb(primary.r, primary.g, primary.b)
    });

    page.drawText(data.companyName.toUpperCase(), {
        x: 50, y: height - 55,
        font: fontBold, size: 22,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // Company details (left side)
    let yPos = height - 75;
    for (const line of data.companyAddress.split('\n')) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 9, color: rgb(0.4, 0.4, 0.4) });
        yPos -= 12;
    }
    page.drawText(data.companyEmail, { x: 50, y: yPos, font: fontRegular, size: 9, color: rgb(0.4, 0.4, 0.4) });
    yPos -= 12;
    page.drawText(data.companyPhone, { x: 50, y: yPos, font: fontRegular, size: 9, color: rgb(0.4, 0.4, 0.4) });

    // Date on right
    page.drawText(data.offerDate, { x: width - 150, y: height - 55, font: fontRegular, size: 10 });

    // "OFFER LETTER" title
    page.drawText('OFFER LETTER', {
        x: width - 150, y: height - 75,
        font: fontBold, size: 14,
        color: rgb(primary.r, primary.g, primary.b)
    });

    // ========================================
    // CANDIDATE ADDRESS
    // ========================================
    yPos = height - 160;
    page.drawText(data.candidateName, { x: 50, y: yPos, font: fontBold, size: 11 });
    yPos -= 14;
    for (const line of data.candidateAddress.split('\n')) {
        page.drawText(line.trim(), { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 13;
    }
    page.drawText(data.candidateEmail, { x: 50, y: yPos, font: fontRegular, size: 10, color: rgb(0.3, 0.3, 0.3) });

    // ========================================
    // SALUTATION
    // ========================================
    yPos -= 30;
    page.drawText(`Dear ${data.candidatePreferredName || data.candidateName.split(' ')[0]},`, {
        x: 50, y: yPos, font: fontBold, size: 11
    });

    // ========================================
    // BODY - Opening
    // ========================================
    yPos -= 25;
    const openingText = `${data.companyName} is pleased to offer you the position of ${data.jobTitle}${data.department ? ` in the ${data.department} department` : ''}. We were impressed with your background and skills, and we are confident that you will be a strong addition to our team.`;
    yPos = drawMultilineText(page, openingText, 50, yPos, fontRegular, 10, width - 100);

    yPos -= 10;
    page.drawText('Please find the terms and conditions of our offer below:', { x: 50, y: yPos, font: fontRegular, size: 10 });

    // ========================================
    // SECTION 1: Position and Start Date
    // ========================================
    yPos -= 25;
    page.drawText('1. Position and Start Date', { x: 50, y: yPos, font: fontBold, size: 11, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 16;
    const positionText = `You will be working as a ${data.jobTitle}, reporting to ${data.managerName}. Your expected start date will be ${data.startDate}.`;
    yPos = drawMultilineText(page, positionText, 50, yPos, fontRegular, 10, width - 100);

    // ========================================
    // SECTION 2: Compensation
    // ========================================
    yPos -= 15;
    page.drawText('2. Compensation', { x: 50, y: yPos, font: fontBold, size: 11, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 16;
    const compensationText = `Your starting base salary will be ${data.currency}${data.salary} per year, paid on a ${data.paymentFrequency} basis.`;
    yPos = drawMultilineText(page, compensationText, 50, yPos, fontRegular, 10, width - 100);

    // ========================================
    // SECTION 3: Benefits
    // ========================================
    yPos -= 15;
    page.drawText('3. Benefits', { x: 50, y: yPos, font: fontBold, size: 11, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 16;
    const benefitsText = `You will be eligible to participate in ${data.companyName}'s standard benefit plans, which include ${data.benefits}, subject to the terms and conditions of those plans.`;
    yPos = drawMultilineText(page, benefitsText, 50, yPos, fontRegular, 10, width - 100);

    // ========================================
    // SECTION 4: Employment Relationship
    // ========================================
    yPos -= 15;
    page.drawText('4. Employment Relationship', { x: 50, y: yPos, font: fontBold, size: 11, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 16;
    const employmentText = `Employment with ${data.companyName} is for no specific period of time. Your employment with the company will be "at will," meaning that either you or the company may terminate your employment at any time and for any reason, with or without cause.`;
    yPos = drawMultilineText(page, employmentText, 50, yPos, fontRegular, 10, width - 100);

    // ========================================
    // SECTION 5: Acceptance
    // ========================================
    yPos -= 15;
    page.drawText('5. Acceptance', { x: 50, y: yPos, font: fontBold, size: 11, color: rgb(primary.r, primary.g, primary.b) });
    yPos -= 16;
    const acceptanceText = `To indicate your acceptance of this offer, please sign and date this letter and return it to us by ${data.expirationDate}.`;
    yPos = drawMultilineText(page, acceptanceText, 50, yPos, fontRegular, 10, width - 100);

    // ========================================
    // CLOSING
    // ========================================
    yPos -= 20;
    const closingText = `We are excited to welcome you to ${data.companyName} and look forward to your contributions.`;
    yPos = drawMultilineText(page, closingText, 50, yPos, fontRegular, 10, width - 100);

    yPos -= 25;
    page.drawText('Sincerely,', { x: 50, y: yPos, font: fontItalic, size: 10 });

    yPos -= 35;
    page.drawText(data.hiringManagerName, { x: 50, y: yPos, font: fontBold, size: 11 });
    yPos -= 14;
    page.drawText(data.hiringManagerTitle, { x: 50, y: yPos, font: fontRegular, size: 10 });
    yPos -= 14;
    page.drawText(data.companyName, { x: 50, y: yPos, font: fontBold, size: 10, color: rgb(primary.r, primary.g, primary.b) });

    // ========================================
    // ACCEPTANCE SECTION
    // ========================================
    yPos -= 35;
    page.drawLine({ start: { x: 50, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    yPos -= 20;
    page.drawText('ACCEPTANCE OF OFFER', { x: 50, y: yPos, font: fontBold, size: 10, color: rgb(primary.r, primary.g, primary.b) });

    yPos -= 18;
    const acceptText = `I, ${data.candidateName}, accept the offer of employment with ${data.companyName} on the terms and conditions described in this letter.`;
    yPos = drawMultilineText(page, acceptText, 50, yPos, fontRegular, 10, width - 100);

    yPos -= 30;
    page.drawText('Signature: _________________________________', { x: 50, y: yPos, font: fontRegular, size: 10 });
    page.drawText('Date: _________________', { x: width - 200, y: yPos, font: fontRegular, size: 10 });

    // ========================================
    // NOTES (if provided)
    // ========================================
    if (data.notes) {
        yPos -= 30;
        page.drawText('Notes:', { x: 50, y: yPos, font: fontBold, size: 9 });
        yPos -= 12;
        drawMultilineText(page, data.notes, 50, yPos, fontItalic, 8, width - 100);
    }

    // ========================================
    // FOOTER
    // ========================================
    page.drawRectangle({
        x: 0, y: 0,
        width: width, height: 5,
        color: rgb(primary.r, primary.g, primary.b)
    });

    return Buffer.from(await pdf.save());
}
