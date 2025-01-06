const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
}); 

app.post('/generate-mawb', async (req, res) => {
    try {
        const {
            awbNumber,
            shipperName,
            consigneeName,
            carrierCode,
            grossWeight,
            dimensions,
            departure,
            destination,
            handlingInformation,
            prepaid,
            totalChargesCarrier,
            date,
            place,
            signature
        } = req.body;

        // Load the PDF template
        const templatePath = path.join(__dirname, 'templates', '427506089-Modelo-Air-way-Bill.pdf');
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Get the first page
        const page = pdfDoc.getPages()[0];

        // Embed fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

       // Helper function for text drawing with more precise control
const drawText = (text, x, y, options = {}) => {
    const {
        font = helveticaFont,
        size = 10,
        color = rgb(0, 0, 0),
        align = 'left'
    } = options;

    page.drawText(text.toString(), {
        x,
        y,
        size,
        font,
        color,
        align
    });
};

// AWB Numbers
drawText('176-73317996', 85, 820, { size: 14, font: helveticaBold });
drawText('176-73317996', 485, 820, { size: 14, font: helveticaBold });

// Shipper Section
drawText('SAUDI ARABIAN OIL COMPANY ( ARAMCO )', 45, 760, { size: 9 });
drawText('MATERIAL SUPPORT SECTION', 45, 750, { size: 9 });
drawText('AVIATION DEPARTMENT', 45, 740, { size: 9 });
drawText('SAUDI ARABIA', 45, 730, { size: 9 });
drawText('PHONE : +966138775333', 45, 720, { size: 9 });

// Consignee Section
drawText('DEXTRANS WORLDWIDE KOREA CO., LTD.', 45, 670, { size: 9 });
drawText('RM 2201, 90, CENTUMJUNGANG-RO,', 45, 660, { size: 9 });
drawText('HAEUNDAE-GU, BUSAN, 48059, KOREA', 45, 650, { size: 9 });
drawText('TEL: +827088311566, BRN: 6728602689', 45, 640, { size: 9 });
drawText('EMAIL: GWEN.CHO@DEXTRANSGROUP.COM', 45, 630, { size: 9 });

// Carrier and Route Information
drawText('EK', 180, 580, { size: 10 });
drawText('DMM – SAUDI ARABIA', 45, 520, { size: 9 });
drawText('ICN – SOUTH KOREA', 45, 480, { size: 9 });

// Weight and Dimensions
drawText('10', 45, 400, { size: 10 });
drawText('7171.00', 90, 400, { size: 10 });
drawText('120 X 120 X 107 @ 10', 380, 400, { size: 9 });

// Handling Information
drawText('DANGEROUS GOODS AS PER ASSOCIATED', 45, 340, { size: 8 });
drawText("SHIPPER'S DECLARATION", 45, 330, { size: 8 });

// Charges
drawText('40000.00', 45, 280, { size: 10 });
drawText('40000.00', 320, 280, { size: 10 });

// Bottom Section
drawText('03/11/2024', 45, 120, { size: 9 });
drawText('DMM', 200, 120, { size: 9 });
drawText('SMSA EXPRESS TRANSPORTATION CO., LTD', 320, 120, { size: 8 });

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join(__dirname, 'generated', `MAWB_${Date.now()}.pdf`);
        
        // Ensure the generated directory exists
        if (!fs.existsSync(path.join(__dirname, 'generated'))) {
            fs.mkdirSync(path.join(__dirname, 'generated'));
        }

        // Write the PDF file
        fs.writeFileSync(outputPath, pdfBytes);

        // Send the PDF as a download
        res.download(outputPath, `MAWB_176-73317996.pdf`, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
            // Clean up: delete the file after download
            fs.unlinkSync(outputPath);
        });

    } catch (error) {
        console.error('Error generating MAWB:', error);
        res.status(500).send('Error generating MAWB');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});