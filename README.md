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
Merges all input items containing PDF binary data into a single output item with the merged PDF.

### Split Pages
Splits a PDF into multiple items, one per page.

### Extract Text
Extracts all text from the PDF and adds it to the JSON output.

### Extract Metadata
Adds PDF metadata (Title, Author, Creation Date, etc.) to the JSON output.

### Rotate Pages
Rotates all pages in the PDF by the specified degrees (default 90).

## License

MIT
