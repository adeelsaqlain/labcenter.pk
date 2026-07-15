const PDFDocument = require('pdfkit');
const { generateQRBuffer } = require('../../utils/qrcode.helper');

function addWatermark(doc, text = 'CONFIDENTIAL') {
  doc.save();
  doc.opacity(0.06);
  doc.fontSize(72);
  doc.rotate(45, { origin: [300, 400] });
  doc.fill('#888888').text(text, 100, 300, {
    width: 500,
    align: 'center'
  });
  doc.restore();
}

function drawHeader(doc, settings) {
  if (settings.logoPath) {
    // In a real app, ensure this path is absolute or resolved properly
    try {
        doc.image(settings.logoPath, 40, 30, { width: 80 });
    } catch(e) {
        console.error("Logo not found or invalid format", e);
    }
  }

  doc.fontSize(18).font('Helvetica-Bold')
     .text(settings.labName || 'Lab Diagnostic Center', 130, 35);
  doc.fontSize(9).font('Helvetica')
     .text(settings.address || '', 130, 58)
     .text(`Phone: ${settings.phone || ''} | Email: ${settings.email || ''}`, 130, 70);

  doc.moveTo(40, 95).lineTo(555, 95).stroke('#333333');
  doc.moveDown(1);
}

function drawPatientInfo(doc, patient) {
  doc.fontSize(10).font('Helvetica-Bold').text('Patient Information', 40, 110);
  doc.fontSize(9).font('Helvetica');
  doc.text(`Name: ${patient.name}`, 40, 125);
  doc.text(`Age/Sex: ${patient.age_years} / ${patient.gender}`, 40, 140);
  doc.text(`Patient ID: ${patient.patient_code}`, 300, 125);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 300, 140);
  doc.moveDown(2);
}

function drawResultsTable(doc, results) {
  const tableTop = doc.y + 10;
  const colWidths = { test: 180, result: 100, unit: 70, range: 100, status: 65 };
  const startX = 40;
  let y = tableTop;

  // Header row
  doc.font('Helvetica-Bold').fontSize(9);
  doc.fillColor('#FFFFFF');
  doc.rect(startX, y, 515, 20).fill('#2c3e50');
  doc.fill('#FFFFFF')
     .text('Test Name', startX + 5, y + 5, { width: colWidths.test })
     .text('Result', startX + colWidths.test + 5, y + 5, { width: colWidths.result })
     .text('Unit', startX + 280, y + 5, { width: colWidths.unit })
     .text('Ref. Range', startX + 350, y + 5, { width: colWidths.range })
     .text('Status', startX + 455, y + 5, { width: colWidths.status });

  y += 20;
  doc.font('Helvetica').fontSize(9);

  results.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? '#f8f9fa' : '#FFFFFF';
    doc.rect(startX, y, 515, 18).fill(bgColor);

    doc.fillColor('#333333')
       .text(row.parameter_name || row.test_name, startX + 5, y + 4, { width: colWidths.test });

    const isAbnormal = row.status === 'Abnormal' || row.status === 'Critical';
    doc.fillColor(isAbnormal ? '#e74c3c' : '#333333')
       .font(isAbnormal ? 'Helvetica-Bold' : 'Helvetica')
       .text(row.value, startX + colWidths.test + 5, y + 4, { width: colWidths.result });

    doc.fillColor('#333333').font('Helvetica')
       .text(row.unit || '', startX + 280, y + 4, { width: colWidths.unit })
       .text(row.reference_range || '', startX + 350, y + 4, { width: colWidths.range })
       .text(row.status || 'Normal', startX + 455, y + 4, { width: colWidths.status });

    y += 18;
    
    if (y > 720) {
      doc.addPage();
      y = 40;
    }
  });
}

async function drawQRCode(doc, verificationUrl) {
  const qrBuffer = await generateQRBuffer(verificationUrl, { width: 100 });

  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica')
     .text('Scan to verify this report:', 40);
  
  doc.image(qrBuffer, 40, doc.y, { width: 80, height: 80 });
  doc.moveDown(6);
  doc.fontSize(7).fillColor('#666666')
     .text(verificationUrl, 40);
}

function drawFooter(doc, settings) {
  const pageHeight = doc.page.height;
  doc.fontSize(8).font('Helvetica').fillColor('#888888');
  doc.text(settings.footer_text || 'This is an electronically generated report.', 40, pageHeight - 50, { align: 'center', width: 515 });
}

/**
 * Generates and streams PDF to the response object.
 */
async function generateLabReport(res, reportData, branchSettings) {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 40,
    bufferPages: true
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="report-${reportData.reportCode}.pdf"`);
  doc.pipe(res);

  doc.on('pageAdded', () => addWatermark(doc, branchSettings.watermark_text));
  addWatermark(doc, branchSettings.watermark_text);

  drawHeader(doc, branchSettings);
  drawPatientInfo(doc, reportData.patient);
  drawResultsTable(doc, reportData.results);
  
  if (reportData.verificationUrl) {
    await drawQRCode(doc, reportData.verificationUrl);
  }

  drawFooter(doc, branchSettings);

  doc.end();
}

module.exports = {
  generateLabReport
};
