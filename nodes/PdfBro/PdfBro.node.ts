import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import { generateInvoice, InvoiceData, InvoiceItem } from './InvoiceTemplates';
import { generateOfferLetter, OfferLetterData } from './OfferLetterTemplates';

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
                        name: 'Extract Images',
                        value: 'extractImages',
                        description: 'Extract embedded images from PDF as PNG files',
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
                    {
                        name: 'Generate Offer Letter',
                        value: 'offerLetter',
                        description: 'Generate a PDF offer letter from a template',
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
                        operation: ['split', 'extractImages', 'extractText', 'metadata', 'rotate'],
                    },
                },
                description: 'The name of the binary field containing the PDF',
            },

            // SPLIT Operations
            {
                displayName: 'Password Protected?',
                name: 'isPasswordProtected',
                type: 'boolean',
                default: false,
                description: 'Whether the input PDF is password protected',
                displayOptions: {
                    show: {
                        operation: ['merge', 'split', 'extractImages', 'extractText', 'metadata', 'rotate'],
                    },
                },
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                displayOptions: {
                    show: {
                        isPasswordProtected: [true],
                    },
                },
                description: 'Password to unlock the PDF',
            },
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

            // EXTRACT IMAGES Operations
            {
                displayName: 'Extract Pages Range',
                name: 'extractImagesPageRange',
                type: 'string',
                default: '*',
                displayOptions: {
                    show: {
                        operation: ['extractImages'],
                    },
                },
                description: 'Pages to extract images from. Examples: "1" (1st page), "1-3" (1st to 3rd), "7-" (7th to end), "-1" (last page), "*" (all pages).',
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
            // OFFER LETTER OPERATIONS - Company Info
            // ========================================
            {
                displayName: 'Company Name',
                name: 'offerCompanyName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'Your Company Name',
                description: 'Your company or business name',
            },
            {
                displayName: 'Company Address',
                name: 'offerCompanyAddress',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '123 Business Street\nCity, State 12345\nCountry',
                description: 'Your company address',
            },
            {
                displayName: 'Company Email',
                name: 'offerCompanyEmail',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'hr@company.com',
                description: 'Company email address',
            },
            {
                displayName: 'Company Phone',
                name: 'offerCompanyPhone',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '+1 (555) 123-4567',
                description: 'Company phone number',
            },
            {
                displayName: 'Hiring Manager Name',
                name: 'offerHiringManagerName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'Jane Smith',
                description: 'Name of the hiring manager',
            },
            {
                displayName: 'Hiring Manager Title',
                name: 'offerHiringManagerTitle',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'VP of Engineering',
                description: 'Title of the hiring manager',
            },

            // ========================================
            // OFFER LETTER - Candidate Info
            // ========================================
            {
                displayName: 'Candidate Name',
                name: 'offerCandidateName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'John Doe',
                description: 'Full name of the candidate',
            },
            {
                displayName: 'Candidate Preferred Name',
                name: 'offerCandidatePreferredName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '',
                description: 'Preferred name (nickname) for salutation. Leave blank to use first name.',
            },
            {
                displayName: 'Candidate Address',
                name: 'offerCandidateAddress',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '456 Candidate Lane\nCity, State 67890',
                description: 'Candidate mailing address',
            },
            {
                displayName: 'Candidate Email',
                name: 'offerCandidateEmail',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'candidate@email.com',
                description: 'Candidate email address',
            },

            // ========================================
            // OFFER LETTER - Job Details
            // ========================================
            {
                displayName: 'Job Title',
                name: 'offerJobTitle',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'Software Engineer',
                description: 'Job title being offered',
            },
            {
                displayName: 'Department',
                name: 'offerDepartment',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'Engineering',
                description: 'Department the position is in',
            },
            {
                displayName: 'Manager Name',
                name: 'offerManagerName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'John Manager',
                description: 'Direct manager the candidate will report to',
            },
            {
                displayName: 'Start Date',
                name: 'offerStartDate',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '={{ $now.plus(30, "days").format("yyyy-MM-dd") }}',
                description: 'Expected start date',
            },
            {
                displayName: 'Salary',
                name: 'offerSalary',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '100,000',
                description: 'Annual salary amount (without currency symbol)',
            },
            {
                displayName: 'Currency Symbol',
                name: 'offerCurrency',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '$',
                description: 'Currency symbol (e.g., $, €, £, ₹)',
            },
            {
                displayName: 'Payment Frequency',
                name: 'offerPaymentFrequency',
                type: 'options',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                options: [
                    { name: 'Weekly', value: 'weekly' },
                    { name: 'Bi-weekly', value: 'bi-weekly' },
                    { name: 'Monthly', value: 'monthly' },
                ],
                default: 'bi-weekly',
                description: 'How often salary is paid',
            },
            {
                displayName: 'Benefits',
                name: 'offerBenefits',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: 'Health, Dental, Vision, and 401(k)',
                description: 'Benefits included in the offer',
            },

            // ========================================
            // OFFER LETTER - Offer Details
            // ========================================
            {
                displayName: 'Offer Date',
                name: 'offerDate',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '={{ $now.format("yyyy-MM-dd") }}',
                description: 'Date of the offer letter',
            },
            {
                displayName: 'Expiration Date',
                name: 'offerExpirationDate',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '={{ $now.plus(14, "days").format("yyyy-MM-dd") }}',
                description: 'Date by which the offer must be accepted',
            },
            {
                displayName: 'Notes',
                name: 'offerNotes',
                type: 'string',
                typeOptions: {
                    rows: 2,
                },
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '',
                description: 'Additional notes to include at the bottom',
            },
            {
                displayName: 'Primary Color',
                name: 'offerPrimaryColor',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['offerLetter'],
                    },
                },
                default: '#1a5f7a',
                description: 'Primary accent color in hex format (e.g., #1a5f7a)',
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
            // INVOICE - Quick Add Items
            // ========================================
            {
                displayName: 'Quick Add Items',
                name: 'quickItems',
                type: 'string',
                typeOptions: {
                    rows: 5,
                },
                displayOptions: {
                    show: {
                        operation: ['invoice'],
                    },
                },
                default: '1. Web Design Services (1) (500$)\n2. Logo & Branding Package (2) (1,200$)\n3. SEO Optimization (300$)',
                description: 'Quickly add items. Formats: "1. Name (qty) (price$)" or "1. Name (price$)" (qty defaults to 1). Currency must match the Currency Symbol field. Leave blank to use the Line Items table below.',
                hint: 'New: "1. Product (qty) (price$)" | Classic: "1. Product (price$)" — one item per line. Overrides Line Items table if not empty.',
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
                description: 'Add line items to the invoice. Ignored when Quick Add Items has content.',
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
        const { PDFDocument, degrees } = require('@yongseok_choi/pdf-lib');

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
                                let isPasswordProtected = false;
                                let password = '';
                                try {
                                    isPasswordProtected = this.getNodeParameter('isPasswordProtected', i, false) as boolean;
                                    if (isPasswordProtected) {
                                        password = this.getNodeParameter('password', i, '') as string;
                                    }
                                } catch (e) {}

                                const validBuffer = await this.helpers.getBinaryDataBuffer(i, propName);
                                const pdf = await PDFDocument.load(validBuffer, isPasswordProtected && password ? { password, ignoreEncryption: true } : { ignoreEncryption: true });
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
                let isPasswordProtected = false;
                let password = '';
                try {
                    isPasswordProtected = this.getNodeParameter('isPasswordProtected', i, false) as boolean;
                    if (isPasswordProtected) {
                        password = this.getNodeParameter('password', i, '') as string;
                    }
                } catch (e) {}

                if (operation === 'split') {

                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const rangeStr = this.getNodeParameter('splitRange', i) as string;

                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer, isPasswordProtected && password ? { password, ignoreEncryption: true } : { ignoreEncryption: true });
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

                } else if (operation === 'extractImages') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const rangeStr = this.getNodeParameter('extractImagesPageRange', i) as string;

                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    
                    const { getDocumentProxy, extractImages } = require('unpdf');
                    const sharp = require('sharp');
                    
                    const pdfData = new Uint8Array(validBuffer);
                    const pdfProxy = await getDocumentProxy(pdfData, isPasswordProtected && password ? { password } : {});
                    
                    const totalPages = pdfProxy.numPages;
                    const indicesToProcess = parseRange(rangeStr, totalPages);
                    
                    let imageCounter = 0;
                    for (const pageIndex of indicesToProcess) {
                        const pageNumber = pageIndex + 1;
                        const imagesData = await extractImages(pdfProxy, pageNumber);
                        
                        for (const imgData of imagesData) {
                            imageCounter++;
                            const pngBuffer = await sharp(imgData.data, {
                                raw: {
                                    width: imgData.width,
                                    height: imgData.height,
                                    channels: imgData.channels as 1 | 3 | 4,
                                }
                            }).png().toBuffer();
                            
                            returnData.push({
                                json: {
                                    ...items[i].json,
                                    extractedImage: true,
                                    pageNumber: pageNumber,
                                    imageIndex: imageCounter,
                                    width: imgData.width,
                                    height: imgData.height,
                                    channels: imgData.channels
                                },
                                binary: {
                                    data: await this.helpers.prepareBinaryData(pngBuffer, `page_${pageNumber}_image_${imageCounter}.png`, 'image/png'),
                                },
                            });
                        }
                    }
                    
                    if (imageCounter === 0) {
                        returnData.push({
                            json: { ...items[i].json, extractedImage: false, message: 'No images found on selected pages' }
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

                    // ---- Quick Add Items parser ----
                    const quickItemsRaw = (this.getNodeParameter('quickItems', i) as string || '').trim();

                    // Known currency symbols for detection (ordered longest-first to avoid partial matches)
                    const knownSymbols = ['Fr.', 'kr.', 'kr', 'Rp', 'RM', 'S/', 'lei', 'zł', '₫', '₩', '₪', '₺', '₽', '₹', '¥', '€', '£', '$'];

                    /**
                     * Given the raw string inside a parenthesis group, try to extract a price + currency symbol.
                     * Returns { unitPrice, detectedSymbol } or null if it doesn't look like a price.
                     */
                    function extractPriceGroup(raw: string): { unitPrice: number; detectedSymbol: string } | null {
                        let detectedSymbol = '';
                        let numericStr = raw.trim();

                        for (const sym of knownSymbols) {
                            if (numericStr.startsWith(sym)) {
                                detectedSymbol = sym;
                                numericStr = numericStr.slice(sym.length).trim();
                                break;
                            }
                            if (numericStr.endsWith(sym)) {
                                detectedSymbol = sym;
                                numericStr = numericStr.slice(0, numericStr.length - sym.length).trim();
                                break;
                            }
                        }

                        // Remove thousands separators then parse
                        const cleanedNum = numericStr
                            .replace(/,(?=\d{3}(?:[^\d]|$))/g, '')
                            .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '');
                        const unitPrice = parseFloat(cleanedNum);
                        if (isNaN(unitPrice)) return null;

                        return { unitPrice, detectedSymbol };
                    }

                    /**
                     * Parse a single item line. Supported formats:
                     *   "1. Product A (2) (100$)"      ← qty=2,  price=100
                     *   "1. Product A (100$)"           ← qty=1,  price=100
                     *   "2. Logo (1,200€)"              ← qty=1,  price=1200
                     *   "3. Consulting ($300)"          ← qty=1,  price=300
                     * Returns { description, quantity, unitPrice, detectedSymbol } or null.
                     */
                    function parseQuickItemLine(line: string): { description: string; quantity: number; unitPrice: number; detectedSymbol: string } | null {
                        // Strip optional leading numbering: "1." "2)" "- " etc.
                        const stripped = line.replace(/^[\d]+[.):\-]\s*/, '').trim();

                        // --- Try TWO-paren format: "Description (qty) (price)" ---
                        const twoParenMatch = stripped.match(/^(.+?)\s*\(([^)]+)\)\s*\(([^)]+)\)\s*$/);
                        if (twoParenMatch) {
                            const description = twoParenMatch[1].trim();
                            const firstGroup  = twoParenMatch[2].trim();
                            const secondGroup = twoParenMatch[3].trim();

                            // First group must be a plain integer/decimal (the quantity)
                            const qty = parseFloat(firstGroup.replace(/,/g, ''));
                            const priceResult = extractPriceGroup(secondGroup);

                            if (!isNaN(qty) && qty > 0 && priceResult && description !== '') {
                                return {
                                    description,
                                    quantity: Math.max(1, Math.round(qty)),
                                    unitPrice: priceResult.unitPrice,
                                    detectedSymbol: priceResult.detectedSymbol,
                                };
                            }
                        }

                        // --- Fall back to ONE-paren format: "Description (price)" ---
                        const oneParenMatch = stripped.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
                        if (oneParenMatch) {
                            const description = oneParenMatch[1].trim();
                            const priceResult = extractPriceGroup(oneParenMatch[2].trim());

                            if (priceResult && description !== '') {
                                return {
                                    description,
                                    quantity: 1,
                                    unitPrice: priceResult.unitPrice,
                                    detectedSymbol: priceResult.detectedSymbol,
                                };
                            }
                        }

                        return null;
                    }

                    let invoiceItems: InvoiceItem[] = [];

                    if (quickItemsRaw !== '') {
                        // Normalize: flatten all whitespace/newlines to spaces, then re-split
                        // at item boundaries so "1. X(10$) 2. Y(20$)" works just like two separate lines.
                        const flatText = quickItemsRaw.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
                        // Inject a newline before each "N." / "N)" that comes after a closing paren
                        const normalizedText = flatText.replace(/\)\s+(?=\d+\s*[.):\-])/g, ')\n');
                        const lines = normalizedText.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');

                        const parsedLines: Array<{ description: string; quantity: number; unitPrice: number; detectedSymbol: string }> = [];

                        for (const line of lines) {
                            const parsed = parseQuickItemLine(line);
                            if (parsed) {
                                parsedLines.push(parsed);
                            }
                        }

                        if (parsedLines.length === 0) {
                            throw new Error('Quick Add Items: Could not parse any items. Use format: "1. Product Name (100$)"');
                        }

                        // Validate: all detected symbols must be the same
                        const symbolsUsed = parsedLines.map(p => p.detectedSymbol).filter(s => s !== '');
                        const uniqueSymbols = [...new Set(symbolsUsed)];
                        if (uniqueSymbols.length > 1) {
                            throw new Error(
                                `Quick Add Items: All items must use the same currency. Found mixed currencies: ${uniqueSymbols.join(', ')}. Please use a single currency across all items.`
                            );
                        }

                        // Validate: if a symbol was detected, it must match the currency field
                        if (uniqueSymbols.length === 1 && uniqueSymbols[0] !== currency) {
                            throw new Error(
                                `Quick Add Items: Currency mismatch. Items use "${uniqueSymbols[0]}" but the Currency Symbol field is set to "${currency}". Please align them.`
                            );
                        }

                        invoiceItems = parsedLines.map(p => ({
                            description: p.description,
                            quantity: p.quantity,
                            unitPrice: p.unitPrice,
                        }));

                    } else {
                        // Fall back to the fixedCollection line items
                        // @ts-ignore
                        const lineItemsRaw = this.getNodeParameter('lineItems', i)?.items as Array<{
                            description: string;
                            quantity: number;
                            unitPrice: number;
                        }> || [];

                        invoiceItems = lineItemsRaw.map(item => ({
                            description: item.description || 'Item',
                            quantity: item.quantity || 1,
                            unitPrice: item.unitPrice || 0,
                        }));
                    }

                    // If still no items, add a placeholder
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
                    const pdf = await PDFDocument.load(validBuffer, isPasswordProtected && password ? { password, ignoreEncryption: true } : { ignoreEncryption: true });
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
                    
                    let parseInput: any = validBuffer;
                    if (isPasswordProtected && password) {
                        parseInput = { data: validBuffer, password: password };
                    }
                    
                    const data = await pdfParse(parseInput);

                    returnData.push({
                        json: {
                            ...items[i].json,
                            text: data.text,
                            numpages: data.numpages,
                            info: data.info,
                        },
                        binary: items[i].binary,
                    });
                } else if (operation === 'offerLetter') {
                    const offerData: OfferLetterData = {
                        // Company Info
                        companyName: this.getNodeParameter('offerCompanyName', i) as string,
                        companyAddress: this.getNodeParameter('offerCompanyAddress', i) as string,
                        companyEmail: this.getNodeParameter('offerCompanyEmail', i) as string,
                        companyPhone: this.getNodeParameter('offerCompanyPhone', i) as string,
                        hiringManagerName: this.getNodeParameter('offerHiringManagerName', i) as string,
                        hiringManagerTitle: this.getNodeParameter('offerHiringManagerTitle', i) as string,

                        // Candidate Info
                        candidateName: this.getNodeParameter('offerCandidateName', i) as string,
                        candidatePreferredName: this.getNodeParameter('offerCandidatePreferredName', i) as string,
                        candidateAddress: this.getNodeParameter('offerCandidateAddress', i) as string,
                        candidateEmail: this.getNodeParameter('offerCandidateEmail', i) as string,

                        // Job Details
                        jobTitle: this.getNodeParameter('offerJobTitle', i) as string,
                        department: this.getNodeParameter('offerDepartment', i) as string,
                        managerName: this.getNodeParameter('offerManagerName', i) as string,
                        startDate: this.getNodeParameter('offerStartDate', i) as string,
                        salary: this.getNodeParameter('offerSalary', i) as string,
                        currency: this.getNodeParameter('offerCurrency', i) as string,
                        paymentFrequency: this.getNodeParameter('offerPaymentFrequency', i) as string,
                        benefits: this.getNodeParameter('offerBenefits', i) as string,

                        // Offer Details
                        offerDate: this.getNodeParameter('offerDate', i) as string,
                        expirationDate: this.getNodeParameter('offerExpirationDate', i) as string,
                        notes: this.getNodeParameter('offerNotes', i) as string,

                        // Styling
                        primaryColor: this.getNodeParameter('offerPrimaryColor', i) as string,
                    };

                    const pdfBuffer = await generateOfferLetter(offerData);

                    returnData.push({
                        json: {
                            success: true,
                            candidateName: offerData.candidateName,
                            jobTitle: offerData.jobTitle,
                        },
                        binary: {
                            data: await this.helpers.prepareBinaryData(pdfBuffer, 'offer_letter.pdf', 'application/pdf'),
                        },
                    });
                } else if (operation === 'metadata') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer, isPasswordProtected && password ? { password, ignoreEncryption: true } : { ignoreEncryption: true });

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
