import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { PDFDocument, degrees } from 'pdf-lib';
// @ts-ignore
import pdfParse from 'pdf-parse';

export class PdfBro implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'PdfBro',
        name: 'pdfBro',
        icon: 'file:pdfUtils.svg',
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
                        description: 'Merge multiple PDF items into a single PDF',
                    },
                    {
                        name: 'Split Pages',
                        value: 'split',
                        description: 'Split a PDF into separate pages',
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
            {
                displayName: 'Input Binary Field',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                required: true,
                description: 'The name of the binary field containing the PDF',
            },
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
        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;

        if (operation === 'merge') {
            // Merge all inputs into one PDF
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < items.length; i++) {
                try {
                    const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
                    const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const pdf = await PDFDocument.load(validBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } catch (error) {
                    if (this.continueOnFail()) {
                        continue;
                    }
                    throw error;
                }
            }

            const mergedPdfBuffer = await mergedPdf.save();
            returnData.push({
                json: { success: true, pageCount: mergedPdf.getPageCount() },
                binary: {
                    [binaryPropertyName]: await this.helpers.prepareBinaryData(Buffer.from(mergedPdfBuffer), 'merged.pdf', 'application/pdf'),
                },
            });

        } else if (operation === 'split') {
            // Split each input PDF into single pages
            for (let i = 0; i < items.length; i++) {
                const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                const pdf = await PDFDocument.load(validBuffer);
                const numberOfPages = pdf.getPageCount();

                for (let j = 0; j < numberOfPages; j++) {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdf, [j]);
                    newPdf.addPage(copiedPage);
                    const newPdfBuffer = await newPdf.save();

                    returnData.push({
                        json: { ...items[i].json, pageNumber: j + 1, totalPages: numberOfPages },
                        binary: {
                            [binaryPropertyName]: await this.helpers.prepareBinaryData(Buffer.from(newPdfBuffer), `page_${j + 1}.pdf`, 'application/pdf'),
                        },
                    });
                }
            }

        } else if (operation === 'rotate') {
            const degreesVal = this.getNodeParameter('rotationDegrees', 0) as number;

            for (let i = 0; i < items.length; i++) {
                const validBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                const pdf = await PDFDocument.load(validBuffer);
                const pages = pdf.getPages();

                pages.forEach(page => {
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
            }

        } else if (operation === 'extractText') {
            for (let i = 0; i < items.length; i++) {
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
            }
        } else if (operation === 'metadata') {
            for (let i = 0; i < items.length; i++) {
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
        }

        return [returnData];
    }
}
