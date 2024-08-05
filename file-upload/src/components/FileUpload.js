// src/components/FileUpload.js
import React, { useState } from 'react';
import Papa from 'papaparse';
import { PDFDocument } from 'pdf-lib';


const FileUpload = () => {
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const contents = e.target.result;
      console.log('File contents:', contents);

      try {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          Papa.parse(contents, {
            complete: (result) => {
              console.log('Parsed CSV:', result.data);
              setFileData({ type: 'csv', data: result.data });
            },
            error: (err) => {
              setError('Error parsing CSV');
              console.error('CSV parse error:', err);
            }
          });
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
          setFileData({ type: 'text', data: contents });
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const pdfDoc = await PDFDocument.load(contents);
          const pages = pdfDoc.getPages();
          const textContents = await Promise.all(pages.map(async (page) => {
            const { items } = await page.getTextContent();
            return items.map(item => item.str).join(' ');
          }));
          const fullText = textContents.join('\n');
          console.log('Extracted PDF text:', fullText);
          setFileData({ type: 'pdf', data: fullText });
        } else {
          setError('Unsupported file type');
        }
        setError(null);
      } catch (err) {
        setError('Error reading file');
        console.error('File read error:', err);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      console.error('File read error:', reader.error);
    };

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const renderFileData = () => {
    if (!fileData) return null;

    if (fileData.type === 'csv') {
      return (
        <table>
          <thead>
            <tr>
              {fileData.data[0].map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fileData.data.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (fileData.type === 'text' || fileData.type === 'pdf') {
      return (
        <pre>
          {fileData.data}
        </pre>
      );
    }

    return null;
  };

  return (
    <div className="file-upload-container">
      <input type="file" onChange={handleFileUpload} />
      {error && <div className="error-message">{error}</div>}
      {fileData && (
        <div className="file-contents">
          <h3>File Contents:</h3>
          {renderFileData()}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
