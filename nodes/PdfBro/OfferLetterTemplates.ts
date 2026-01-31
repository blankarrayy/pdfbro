import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';

export interface OfferLetterData {
    // Dynamic data for placeholders
    [key: string]: any;
}

export const DEFAULT_OFFER_LETTER_TEMPLATE = `**[company_info.name]**
[company_info.address.street]
[company_info.address.city], [company_info.address.state], [company_info.address.zip_code]
[date]

**[personal_info.full_name]**
[personal_info.address.street]
[personal_info.address.city], [personal_info.address.state], [personal_info.address.zip_code]

**Dear [personal_info.preferred_name],**

**[company_info.name]** is pleased to offer you the position of **[job_details.title]**. We were impressed with your background and skills, and we are confident that you will be a strong addition to our team.

Please find the terms and conditions of our offer below:

**1. Position and Start Date**
You will be working as a **[job_details.title]**, reporting to **[job_details.manager_name]**. Your expected start date will be **[job_details.start_date]**.

**2. Compensation**
Your starting base salary will be **[job_details.salary]** per year, paid on a **[job_details.payment_frequency]** basis.

**3. Benefits**
You will be eligible to participate in **[company_info.name]**'s standard benefit plans, which include **[job_details.benefits]**, subject to the terms and conditions of those plans.

**4. Employment Relationship**
Employment with **[company_info.name]** is for no specific period of time. Your employment with the company will be "at will," meaning that either you or the company may terminate your employment at any time and for any reason, with or without cause.

**5. Acceptance**
To indicate your acceptance of this offer, please sign and date this letter and return it to us by **[job_details.offer_expiration_date]**.

We are excited to welcome you to **[company_info.name]** and look forward to your contributions.

Sincerely,

[company_info.hiring_manager_name]
[company_info.hiring_manager_title]
**[company_info.name]**

---

**Acceptance of Offer**

I, **[personal_info.full_name]**, accept the offer of employment with **[company_info.name]** on the terms and conditions described in this letter.

Signature: ___________________________

Date: ___________________________`;

function getValueByPath(obj: any, path: string): string {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export async function generateOfferLetter(
    template: string,
    data: OfferLetterData
): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Embed fonts
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 11;
    const lineHeight = 1.4;
    const margin = 50;
    const maxWidth = width - (margin * 2);

    // 1. Process placehodlers
    let processedText = template;
    // Regex to match [path.to.value]
    const placeholderRegex = /\[([\w\._-]+)\]/g;
    processedText = processedText.replace(placeholderRegex, (match, path) => {
        const value = getValueByPath(data, path);
        return value !== undefined && value !== null ? String(value) : match;
    });

    // 2. Render text
    const lines = processedText.split('\n');
    let yPos = height - margin;

    const printLine = (textLine: string, isBold: boolean = false) => {
        const font = isBold ? fontBold : fontRegular;
        const words = textLine.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);

            if (width > maxWidth) {
                page.drawText(currentLine, {
                    x: margin,
                    y: yPos,
                    font,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                });
                yPos -= (fontSize * lineHeight);
                currentLine = word;

                if (yPos < margin) {
                    page = pdf.addPage([595, 842]);
                    yPos = height - margin;
                }
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            page.drawText(currentLine, {
                x: margin,
                y: yPos,
                font,
                size: fontSize,
                color: rgb(0, 0, 0),
            });
            yPos -= (fontSize * lineHeight);
            if (yPos < margin) {
                page = pdf.addPage([595, 842]);
                yPos = height - margin;
            }
        }
    };

    for (const line of lines) {
        // FALLBACK: Just strip ** and print.
        // We look for **text** pattern
        const cleanLine = line.replace(/\*\*/g, '');
        printLine(cleanLine, line.trim().startsWith('**') && line.trim().endsWith('**'));
    }

    return Buffer.from(await pdf.save());
}
