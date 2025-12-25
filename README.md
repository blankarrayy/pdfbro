# n8n-nodes-pdfbro

This is an n8n community node. It lets you manipulate PDF files in your workflows without external dependencies or API calls.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

## Features

- **Merge PDFs**: Combine multiple PDF files into one.
- **Split Pages**: Split a PDF into individual pages.
- **Extract Text**: Extract text content from PDF files.
- **Extract Metadata**: Get title, author, page count, etc.
- **Rotate Pages**: Rotate pages by 90, 180, or 270 degrees.

## Installation

Follow the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/installation/) to install this node.

### Community Nodes (Recommended)
1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-pdfbro`.

### Manual
Running n8n with npm:
```bash
npm install n8n-nodes-pdfbro
```

## Operations

### Merge PDFs
Link multiple binary fields (up to 10+ via "Add PDF Input") to combine them into a single PDF.

### Split Pages
Split a PDF into separate pages or ranges.
**Supported Ranges:**
- `*` : Split every page into a separate file (Burst).
- `1, 3, 5` : Extract specific pages.
- `1-5` : Extract bytes 1 to 5.
- `7-` : Extract from page 7 to the end.
- `-1` : Extract the last page.

### Invoice Maker (HTML to PDF)
Convert valid HTML content into a PDF. Useful for generating invoices, reports, or simple documents.

### Extract Text
Extracts all text from the PDF.

### Extract Metadata
Gets title, author, creation date, etc.

### Rotate Pages
Rotates all pages by X degrees.

## License

MIT

## Credits & Attribution

This node powers its PDF magic using these awesome open-source libraries:

*   **[pdf-lib](https://github.com/Hopding/pdf-lib)** (MIT License) - PDF creation and modification.
*   **[pdfmake](http://pdfmake.org/)** (MIT License) - PDF generation engine.
*   **[html-to-pdfmake](https://github.com/Aymkdn/html-to-pdfmake)** (MIT License) - HTML to PDFMake conversion.
*   **[jsdom](https://github.com/jsdom/jsdom)** (MIT License) - DOM environment.
*   **[pdf-parse](https://gitlab.com/autokent/pdf-parse)** (MIT License) - PDF text extraction.

We are grateful to the maintainers of these projects!
