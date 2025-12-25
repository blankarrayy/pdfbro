import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import { generateInvoice, InvoiceData, InvoiceItem } from './InvoiceTemplates';

export class PdfBro implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'PdfBro',
        name: 'pdfBro',
        icon: 'file:pdfBro.svg',
        group: ['transform'],
        version: 1,
        description: 'The ultimate PDF utility (powered by pdf-lib & pdf-parse)',
        defaults: {
            name: 'PdfBro',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Merge PDFs',
                        value: 'merge',
                        description: 'Merge multiple binary fields into a single PDF',
                    },
                    {
                        name: 'Split Pages',
                        value: 'split',
                        description: 'Split a PDF into separate pages or ranges',
                    },
                    {
                        name: 'Generate Invoice',
                        value: 'invoice',
                        description: 'Create professional PDF invoices from 5 customizable templates',
                    },
                    {
                        name: 'Extract Text',
                        value: 'extractText',
                        description: 'Extract text content from PDF',
                    },
                    {
                        name: 'Extract Metadata',
                        value: 'metadata',
                        description: 'Get PDF metadata (title, author, pages)',
                    },
                    {
                        name: 'Rotate Pages',
                        value: 'rotate',
                        description: 'Rotate all pages in a PDF',
                    },
                ],
                default: 'merge',
            },

            // MERGE Operations: Multiple Inputs
            {
                displayName: 'Input PDF Files',
                name: 'inputBinaries',
                placeholder: 'Add PDF Input',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                displayOptions: {
                    show: {
                        operation: ['merge'],
                    },
                },
                default: {},
                options: [
                    {
                        name: 'files',
                        displayName: 'Files',
                        values: [
                            {
                                displayName: 'Binary Property',
                                name: 'binaryPropertyName',
                                type: 'string',
                                default: 'data',
                                description: 'Name of the binary property containing the PDF to merge',
                            },
                        ],
                    },
                ],
            },

            // Common input for single-file operations
            {
                displayName: 'Input Binary Field',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['split', 'extractText', 'metadata', 'rotate'],
                    },
                },
                description: 'The name of the binary field containing the PDF',
            },

            // SPLIT Operations
            {
                displayName: 'Split Range',
                name: 'splitRange',
                type: 'string',
                default: '*',
                displayOptions: {
                    show: {
                        operation: ['split'],
                    },
                },
                description: 'Pages to extract. Examples: "1" (1st page), "1-3" (1st to 3rd), "7-" (7th to end), "-1" (last page), "*" (all pages separately).',
            },

            // ========================================
            // INVOICE OPERATIONS - Template Selection
            // ========================================
            {
                displayName: 'Template',
                name: 'invoiceTemplate',
                type: 'options',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                options: [
                    {
                        name: 'Modern Minimal',
                        value: 'modern',
                        description: 'Clean lines, lots of whitespace, accent color bar - great for tech companies and freelancers',
                    },
                    {
                        name: 'Corporate Professional',
                        value: 'corporate',
                        description: 'Formal layout with header box, gray tones - ideal for enterprises and consultants',
                    },
                    {
                        name: 'Creative Bold',
                        value: 'creative',
                        description: 'Gradient header, unique typography - perfect for agencies and designers',
                    },
                    {
                        name: 'Classic Elegant',
                        value: 'classic',
                        description: 'Traditional invoice look with elegant borders - suited for law firms and accounting',
                    },
                    {
                        name: 'Tech Startup',
                        value: 'startup',
                        description: 'Dark sidebar, modern layout, vibrant accents - made for SaaS and startups',
                    },
                ],
                default: 'modern',
                description: 'Choose an invoice template style',
            },

            // ========================================
            // INVOICE - Company Information
            // ========================================
            {
                displayName: 'Company Name',
                name: 'companyName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'Your Company Name',
                description: 'Your company or business name',
            },
            {
                displayName: 'Company Address',
                name: 'companyAddress',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '123 Business Street\nCity, State 12345\nCountry',
                description: 'Your company address (use new lines to separate)',
            },
            {
                displayName: 'Company Email',
                name: 'companyEmail',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'billing@company.com',
                description: 'Your company email address',
            },
            {
                displayName: 'Company Phone',
                name: 'companyPhone',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '+1 (555) 123-4567',
                description: 'Your company phone number',
            },

            // ========================================
            // INVOICE - Client Information
            // ========================================
            {
                displayName: 'Client Name',
                name: 'clientName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'Client Name',
                description: 'The name of the client or company being billed',
            },
            {
                displayName: 'Client Address',
                name: 'clientAddress',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '456 Client Avenue\nCity, State 67890',
                description: 'Client address (use new lines to separate)',
            },
            {
                displayName: 'Client Email',
                name: 'clientEmail',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'client@example.com',
                description: 'Client email address',
            },

            // ========================================
            // INVOICE - Invoice Details
            // ========================================
            {
                displayName: 'Invoice Number',
                name: 'invoiceNumber',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'INV-001',
                description: 'Unique invoice identifier',
            },
            {
                displayName: 'Invoice Date',
                name: 'invoiceDate',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '={{ $now.format("yyyy-MM-dd") }}',
                description: 'Invoice issue date',
            },
            {
                displayName: 'Due Date',
                name: 'dueDate',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '={{ $now.plus(30, "days").format("yyyy-MM-dd") }}',
                description: 'Payment due date',
            },
            {
                displayName: 'Currency Symbol',
                name: 'currency',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '$',
                description: 'Currency symbol to display (e.g., $, €, £, ₹)',
            },

            // ========================================
            // INVOICE - Line Items
            // ========================================
            {
                displayName: 'Line Items',
                name: 'lineItems',
                placeholder: 'Add Item',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: {},
                options: [
                    {
                        name: 'items',
                        displayName: 'Items',
                        values: [
                            {
                                displayName: 'Description',
                                name: 'description',
                                type: 'string',
                                default: 'Service or Product',
                                description: 'Description of the item or service',
                            },
                            {
                                displayName: 'Quantity',
                                name: 'quantity',
                                type: 'number',
                                default: 1,
                                description: 'Number of units',
                            },
                            {
                                displayName: 'Unit Price',
                                name: 'unitPrice',
                                type: 'number',
                                default: 100,
                                description: 'Price per unit',
                            },
                        ],
                    },
                ],
                description: 'Add line items to the invoice',
            },

            // ========================================
            // INVOICE - Tax
            // ========================================
            {
                displayName: 'Tax Rate (%)',
                name: 'taxRate',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 0,
                description: 'Tax percentage to apply (e.g., 10 for 10%)',
            },

            // ========================================
            // INVOICE - Styling
            // ========================================
            {
                displayName: 'Primary Color',
                name: 'primaryColor',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '#2563eb',
                description: 'Primary accent color in hex format (e.g., #2563eb)',
            },
            {
                displayName: 'Secondary Color',
                name: 'secondaryColor',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '#f1f5f9',
                description: 'Secondary color for backgrounds in hex format',
            },

            // ========================================
            // INVOICE - Footer Content
            // ========================================
            {
                displayName: 'Notes',
                name: 'notes',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '',
                description: 'Additional notes to display on the invoice',
            },
            {
                displayName: 'Terms & Conditions',
                name: 'terms',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: 'Payment is due within 30 days.',
                description: 'Terms and conditions text',
            },
            {
                displayName: 'Payment Instructions',
                name: 'paymentInstructions',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '',
                description: 'Bank details or payment instructions',
            },

            // ROTATE Operations
            {
                displayName: 'Rotation Degrees',
                name: 'rotationDegrees',
                type: 'number',
                default: 90,
                displayOptions: {
                    show: {
                        operation: ['rotate'],
                    },
                },
                description: 'Clockwise rotation (e.g. 90, 180, 270)',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0) as string;

        // Dynamic imports to prevent load-time crashes
        const { PDFDocument, degrees } = require('pdf-lib');

        // --- Helper: Parse Split Range ---
        const parseRange = (rangeStr: string, totalPages: number): number[] => {
            if (rangeStr === '*') {
                // Return all page indexes
                return Array.from({ length: totalPages }, (_, i) => i);
            }

            const pages = new Set<number>();
            const parts = rangeStr.split(',').map(p => p.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    let [startStr, endStr] = part.split('-');

                    // Handle "7-" (7 to end)
                    if (startStr && !endStr) {
                        let start = parseInt(startStr);
                        if (start < 0) start = totalPages + start + 1; // 1-based logic to index
                        for (let i = start; i <= totalPages; i++) {
                            pages.add(i - 1);
                        }
                        continue;
                    }

                    let start = parseInt(startStr);
                    let end = parseInt(endStr);

                    // Handle negative numbers (from end)
                    if (start < 0) start = totalPages + start + 1;
                    if (end < 0) end = totalPages + end + 1;

                    // Clamp
                    start = Math.max(1, start);
                    end = Math.min(totalPages, end);

                    for (let i = start; i <= end; i++) {
                        pages.add(i - 1);
                    }
                } else {
                    let page = parseInt(part);
                    if (page < 0) page = totalPages + page + 1;
                    if (page >= 1 && page <= totalPages) {
                        pages.add(page - 1);
                    }
                }
            }
            return Array.from(pages).sort((a, b) => a - b);
        };

        // Handle merge operation separately - it needs all items at once
        if (operation === 'merge') {
            try {
                const mergedPdf = await PDFDocument.create();
                // Get fixed collection from first item
                // @ts-ignore
                const binaries = this.getNodeParameter('inputBinaries', 0)?.files as Array<{ binaryPropertyName: string }> || [];

                // Build a set of property names to look for
                const targetPropertyNames = new Set<string>();
                if (binaries.length > 0) {
                    for (const entry of binaries) {
                        targetPropertyNames.add(entry.binaryPropertyName);
                    }
                }

                // Track which PDFs we've already added to avoid duplicates
                // Key format: "itemIndex:propertyName"
                const processedBinaries = new Set<string>();
                let pdfCount = 0;

                // Collect all PDFs from all input items
                for (let i = 0; i < items.length; i++) {
                    const itemBinary = items[i].binary;
                    if (!itemBinary) continue;

                    // Determine which properties to check in this item
                    const propsToCheck = targetPropertyNames.size > 0
                        ? Object.keys(itemBinary).filter(prop => targetPropertyNames.has(prop))
                        : Object.keys(itemBinary);

                    for (const propName of propsToCheck) {
                        // Skip if we've already processed this binary
                        const key = `${i}:${propName}`;
                        if (processedBinaries.has(key)) continue;
                        processedBinaries.add(key);

                        if (itemBinary[propName]) {
                            try {
                                const validBuffer = await this.helpers.getBinaryDataBuffer(i, propName);
                                const pdf = await PDFDocument.load(validBuffer);
                                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                                copiedPages.forEach((page: any) => mergedPdf.addPage(page));
                                pdfCount++;
                            } catch (e) {
                                // Skip invalid PDFs silently
                            }
                        }
                    }
                }

                if (pdfCount === 0) {
                    throw new Error('No valid PDF files found in input items. Make sure the binary property names match the configured inputs.');
                }

                const mergedPdfBuffer = await mergedPdf.save();
                returnData.push({
                    json: { success: true, pageCount: mergedPdf.getPageCount(), mergedFiles: pdfCount },
                    binary: {
                        data: await this.helpers.prepareBinaryData(Buffer.from(mergedPdfBuffer), 'merged.pdf', 'application/pdf'),
                    },
                });

                return [returnData];
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message } });
                    return [returnData];
                }
                throw error;
            }
        }

        // Handle other operations per-item
        for (let i = 0; i < items.length; i++) {
            try {
                if (operation === 'split') {

                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const rangeStr = this.getNodeParameter('splitRange', i) as string;

                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer);
                    const totalPages = pdf.getPageCount();

                    // Parse logic
                    let indicesToKeep = parseRange(rangeStr, totalPages);

                    if (rangeStr === '*') {
                        // Burst mode: return separate items
                        for (const pageIndex of indicesToKeep) {
                            const newPdf = await PDFDocument.create();
                            const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex]);
                            newPdf.addPage(copiedPage);
                            const newPdfBuffer = await newPdf.save();

                            returnData.push({
                                json: { ...items[i].json, pageNumber: pageIndex + 1, totalPages },
                                binary: {
                                    data: await this.helpers.prepareBinaryData(Buffer.from(newPdfBuffer), `page_${pageIndex + 1}.pdf`, 'application/pdf'),
                                },
                            });
                        }
                    } else {
                        // Range mode: return single PDF with selected pages
                        const newPdf = await PDFDocument.create();
                        const copiedPages = await newPdf.copyPages(pdf, indicesToKeep);
                        copiedPages.forEach((p: any) => newPdf.addPage(p));

                        const newPdfBuffer = await newPdf.save();
                        returnData.push({
                            json: { ...items[i].json, extractedPages: indicesToKeep.map(p => p + 1).join(', ') },
                            binary: {
                                data: await this.helpers.prepareBinaryData(Buffer.from(newPdfBuffer), 'extracted.pdf', 'application/pdf'),
                            },
                        });
                    }

                } else if (operation === 'invoice') {
                    // Get all invoice parameters
                    const template = this.getNodeParameter('invoiceTemplate', i) as InvoiceData['template'];
                    const companyName = this.getNodeParameter('companyName', i) as string;
                    const companyAddress = this.getNodeParameter('companyAddress', i) as string;
                    const companyEmail = this.getNodeParameter('companyEmail', i) as string;
                    const companyPhone = this.getNodeParameter('companyPhone', i) as string;
                    const clientName = this.getNodeParameter('clientName', i) as string;
                    const clientAddress = this.getNodeParameter('clientAddress', i) as string;
                    const clientEmail = this.getNodeParameter('clientEmail', i) as string;
                    const invoiceNumber = this.getNodeParameter('invoiceNumber', i) as string;
                    const invoiceDate = this.getNodeParameter('invoiceDate', i) as string;
                    const dueDate = this.getNodeParameter('dueDate', i) as string;
                    const currency = this.getNodeParameter('currency', i) as string;
                    const taxRate = this.getNodeParameter('taxRate', i) as number;
                    const primaryColor = this.getNodeParameter('primaryColor', i) as string;
                    const secondaryColor = this.getNodeParameter('secondaryColor', i) as string;
                    const notes = this.getNodeParameter('notes', i) as string;
                    const terms = this.getNodeParameter('terms', i) as string;
                    const paymentInstructions = this.getNodeParameter('paymentInstructions', i) as string;

                    // Get line items
                    // @ts-ignore
                    const lineItemsRaw = this.getNodeParameter('lineItems', i)?.items as Array<{
                        description: string;
                        quantity: number;
                        unitPrice: number;
                    }> || [];

                    const invoiceItems: InvoiceItem[] = lineItemsRaw.map(item => ({
                        description: item.description || 'Item',
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                    }));

                    // If no items provided, add a placeholder
                    if (invoiceItems.length === 0) {
                        invoiceItems.push({
                            description: 'Service/Product',
                            quantity: 1,
                            unitPrice: 100,
                        });
                    }

                    // Build invoice data
                    const invoiceData: InvoiceData = {
                        template,
                        companyName,
                        companyAddress,
                        companyEmail,
                        companyPhone,
                        clientName,
                        clientAddress,
                        clientEmail,
                        invoiceNumber,
                        invoiceDate,
                        dueDate,
                        currency,
                        items: invoiceItems,
                        taxRate,
                        primaryColor,
                        secondaryColor,
                        notes,
                        terms,
                        paymentInstructions,
                    };

                    // Generate invoice PDF
                    const pdfBuffer = await generateInvoice(invoiceData);

                    // Calculate totals for JSON output
                    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                    const tax = subtotal * (taxRate / 100);
                    const total = subtotal + tax;

                    returnData.push({
                        json: {
                            success: true,
                            template,
                            invoiceNumber,
                            invoiceDate,
                            dueDate,
                            itemCount: invoiceItems.length,
                            subtotal: subtotal.toFixed(2),
                            tax: tax.toFixed(2),
                            total: total.toFixed(2),
                        },
                        binary: {
                            data: await this.helpers.prepareBinaryData(pdfBuffer, `invoice_${invoiceNumber}.pdf`, 'application/pdf'),
                        },
                    });

                } else if (operation === 'rotate') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const degreesVal = this.getNodeParameter('rotationDegrees', i) as number;

                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer);
                    const pages = pdf.getPages();

                    pages.forEach((page: any) => {
                        const currentRotation = page.getRotation().angle;
                        page.setRotation(degrees(currentRotation + degreesVal));
                    });

                    const rotatedPdfBuffer = await pdf.save();
                    returnData.push({
                        json: items[i].json,
                        binary: {
                            [binaryPropertyName]: await this.helpers.prepareBinaryData(Buffer.from(rotatedPdfBuffer), 'rotated.pdf', 'application/pdf'),
                        },
                    });

                } else if (operation === 'extractText') {
                    // Lazy load pdf-parse
                    const pdfParse = require('pdf-parse');

                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const data = await pdfParse(validBuffer);

                    returnData.push({
                        json: {
                            ...items[i].json,
                            text: data.text,
                            numpages: data.numpages,
                            info: data.info,
                        },
                        binary: items[i].binary,
                    });
                } else if (operation === 'metadata') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer);

                    returnData.push({
                        json: {
                            ...items[i].json,
                            title: pdf.getTitle(),
                            author: pdf.getAuthor(),
                            subject: pdf.getSubject(),
                            creator: pdf.getCreator(),
                            producer: pdf.getProducer(),
                            keywords: pdf.getKeywords(),
                            pageCount: pdf.getPageCount(),
                            creationDate: pdf.getCreationDate(),
                            modificationDate: pdf.getModificationDate(),
                        },
                        binary: items[i].binary,
                    });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message } });
                    continue;
                }
                throw error;
            }
        }

        return [returnData];
    }
}
