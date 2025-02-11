const { Address, Shipment } = require('../models/Shipment');
const AWB = require("../models/AwbNumb")
const Airline=require("../models/Airlines")
const fs = require('fs');
const puppeteer = require('puppeteer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');
const pdf = require('html-pdf');
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const handlebars = require('handlebars');

module.exports = {
    getAwbPage: async (req, res) => {
        try {
            // Fetch saved addresses for populating address book
            const savedAddresses = await Address.find().sort({ createdAt: -1 });
            res.render("admin/awbCreate", { savedAddresses });
        } catch (error) {
            console.error('Error fetching saved addresses:', error);
            res.render("admin/awbCreate", { error: 'Failed to load saved addresses' });
        }
    },

    // Get saved addresses for address book search
    getSavedAddresses: async (req, res) => {
        try {
            console.log("res")
            const { search } = req.query;
            console.log(search)
            
            if (!search || search.trim().length < 2) {
                return res.json({ success: true, addresses: [] });
            }
    
            const searchRegex = new RegExp(search.trim(), 'i');
            
            const query = {
                $or: [
                    { contactName: searchRegex },
                    { company: searchRegex },
                    { phoneNumber: searchRegex },
                    { email: searchRegex },
                    { addressLine1: searchRegex },
                    { city: searchRegex },
                    { country: searchRegex },
                    { postalCode: searchRegex }
                ]
            };
    
            const addresses = await Address.find(query)
                .sort({ createdAt: -1 })
                .limit(10)
                .select('-__v'); // Exclude version key
    
            res.json({ 
                success: true, 
                addresses,
                count: addresses.length
            });
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch addresses',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Required modules



    createAwb: async (req, res) => {
      try {
        // 1. Generate unique AWB number
        const awbNumber = 'AWB' + Date.now() + Math.floor(Math.random() * 1000);
    
        // 2. Extract data from request body
        const {
          senderContact, senderCompany, senderPhone, senderEmail,
          senderCountry, senderAddress1, senderAddress2, senderAddress3,
          senderPostal, senderCity, senderIsResidential, saveSenderAddress,
          receiverContact, receiverCompany, receiverPhone, receiverEmail,
          receiverCountry, receiverAddress1, receiverAddress2, receiverAddress3,
          receiverPostal, receiverCity, receiverIsResidential, saveReceiverAddress,
          shipmentDate,
          packages // Array of package objects
        } = req.body;
    
        // 3. Calculate totals
        const totalPackages = packages.length;
        const totalWeight = packages.reduce((sum, pkg) => sum + parseFloat(pkg.weight), 0);
    
        // 4. Generate barcode (Base64 image)
        const barcodeBuffer = await new Promise((resolve, reject) => {
          bwipjs.toBuffer({
            bcid: 'code128',
            text: awbNumber,
            scale: 2,
            height: 10,
            includetext: true,
            textxalign: 'center',
            backgroundcolor: 'FFFFFF',
            padding: 5
          }, (err, png) => {
            if (err) reject(err);
            else resolve(png);
          });
        });
        const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;
    
        // 5. Generate QR code (Base64 image)
        const qrCodeBase64 = await QRCode.toDataURL(awbNumber, {
          width: 100,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
    
        // 6. Prepare data for the PDF template
        const templateData = {
          date: new Date().toLocaleDateString(),
          priority: 'PRIORITY',
          orderId: awbNumber,
          trackingNumber: awbNumber,
          barcode: barcodeBase64,
          qrCode: qrCodeBase64,
          sender: {
            company: senderCompany,
            contact: senderContact,
            address: `${senderAddress1}${senderAddress2 ? '\n' + senderAddress2 : ''}`,
            city: senderCity,
            postal: senderPostal,
            phone: senderPhone
          },
          receiver: {
            company: receiverCompany,
            contact: receiverContact,
            address: `${receiverAddress1}${receiverAddress2 ? '\n' + receiverAddress2 : ''}`,
            city: receiverCity,
            postal: receiverPostal,
            phone: receiverPhone
          },
          shipment: {
            weight: `${totalWeight} KG`,
            pieces: `${totalPackages}/${totalPackages}`,
            service: 'EXPRESS'
          }
        };
    
        // 7. Optionally save addresses
        let senderSavedAddress;
        if (saveSenderAddress) {
          const senderAddress = new Address({
            contactName: senderContact,
            company: senderCompany,
            phoneNumber: senderPhone,
            email: senderEmail,
            country: senderCountry,
            addressLine1: senderAddress1,
            addressLine2: senderAddress2,
            addressLine3: senderAddress3,
            postalCode: senderPostal,
            city: senderCity,
            isResidential: senderIsResidential
          });
          senderSavedAddress = await senderAddress.save();
        }
        let receiverSavedAddress;
        if (saveReceiverAddress) {
          const receiverAddress = new Address({
            contactName: receiverContact,
            company: receiverCompany,
            phoneNumber: receiverPhone,
            email: receiverEmail,
            country: receiverCountry,
            addressLine1: receiverAddress1,
            addressLine2: receiverAddress2,
            addressLine3: receiverAddress3,
            postalCode: receiverPostal,
            city: receiverCity,
            isResidential: receiverIsResidential
          });
          receiverSavedAddress = await receiverAddress.save();
        }
    
        // 8. Create shipment record
        const shipment = new Shipment({
          awbNumber,
          shipmentDate,
          sender: {
            addressDetails: {
              contactName: senderContact,
              company: senderCompany,
              phoneNumber: senderPhone,
              email: senderEmail,
              country: senderCountry,
              addressLine1: senderAddress1,
              addressLine2: senderAddress2,
              addressLine3: senderAddress3,
              postalCode: senderPostal,
              city: senderCity,
              isResidential: senderIsResidential
            },
            savedAddress: senderSavedAddress ? senderSavedAddress._id : null
          },
          receiver: {
            addressDetails: {
              contactName: receiverContact,
              company: receiverCompany,
              phoneNumber: receiverPhone,
              email: receiverEmail,
              country: receiverCountry,
              addressLine1: receiverAddress1,
              addressLine2: receiverAddress2,
              addressLine3: receiverAddress3,
              postalCode: receiverPostal,
              city: receiverCity,
              isResidential: receiverIsResidential
            },
            savedAddress: receiverSavedAddress ? receiverSavedAddress._id : null
          },
          packages,
          totalPackages,
          totalWeight,
          timeline: [{
            location: senderCity,
            status: 'Created',
            description: 'Shipment created and AWB generated',
            updatedBy: 'System'
          }]
        });
        await shipment.save();
    
        // 9. Compile the Handlebars template and generate HTML
        const templatePath = './views/admin/bill.hbs';
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found at: ${templatePath}`);
        }
        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = handlebars.compile(templateHtml);
        const htmlContent = compiledTemplate(templateData);
        console.log('Generated HTML:', htmlContent); // Debug log
    
        // 10. Launch Puppeteer to generate the PDF synchronously
        const browser = await puppeteer.launch({
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        // Minimal wait: 300ms (adjust if needed)
        await new Promise(resolve => setTimeout(resolve, 300));
        // Optionally wait for fonts (if necessary):
        // await page.evaluate(() => document.fonts.ready);
    
        // Force PDF to exactly 4in x 6in on one page.
        const pdfBuffer = await page.pdf({
          width: '4in',
          height: '6in',
          printBackground: true,
          margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
          // If content slightly overflows, try a scale less than 1 (e.g., 0.95).
          scale: 0.95
        });
        await browser.close();
    
        // 11. Send the PDF in the HTTP response so the download starts immediately.
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=shipping_label_${awbNumber}.pdf`,
          'Content-Length': pdfBuffer.length,
          'Access-Control-Expose-Headers': 'X-AWB-Number, Content-Disposition',
          'X-AWB-Number': awbNumber
        });
        return res.end(pdfBuffer);
    
      } catch (error) {
        console.error('Error creating shipment:', error);
        return res.status(500).json({
          success: false,
          error: error.message || 'Failed to create shipment'
        });
      }
    }
    
    
    ,
    downloadPdf: (req, res) => {
      const pdfFile = req.params.pdfFile;
      const filePath = path.join(__dirname, '../public/labels', pdfFile);
      if (fs.existsSync(filePath)) {
        res.download(filePath, pdfFile);
      } else {
        res.status(404).send('PDF not ready yet, please try again later.');
      }
    },



    // Display tracking search page
    getTrackingPage: async (req, res) => {
      try {
         
        const recentSearches = await Shipment.find()
          .sort({ updatedAt: -1 })
          .limit(3)
          .select('awbNumber');
          
        res.render('admin/track', { recentSearches }); // Changed from 'tracking/index' to 'admin/track'
      } catch (error) {
        console.error('Error loading tracking page:', error);
        res.render('admin/track', { error: 'Failed to load tracking page' }); // Changed here too
      }
    },
  
    // Track shipment by AWB
    trackShipment: async (req, res) => {
     
      try {
        const { awbNumber } = req.body; 
       
        const shipment = await Shipment.findOne({ awbNumber })
          .populate('sender.savedAddress')
          .populate('receiver.savedAddress');
          const recentSearches = await Shipment.find()
          .sort({ updatedAt: -1 })
          .limit(3)
          .select('awbNumber');
        if (!shipment) {
          return res.render('admin/track', { recentSearches,
            error: 'Shipment not found',
            searchedAwb: awbNumber 
          });
        }
  
        // Calculate timeline progress
        const statusOrder = [
          'Created', 'Pickup Scheduled', 'Picked Up', 
          'In Transit', 'Out for Delivery', 'Delivered'
        ];
        const currentStatusIndex = statusOrder.indexOf(shipment.status);
        const progress = ((currentStatusIndex) / (statusOrder.length - 1)) * 100;
        const { format } = require('date-fns');
        const formattedDate = shipment.expectedArrivalDate 
          ? format(new Date(shipment.expectedArrivalDate), 'yyyy-MM-dd')
          : null;

        
console.log(shipment.timeline); // Check if this outputs the expected array

        
        res.render('admin/track', {
          shipment,
          progress,
          statusOrder,
          currentStatusIndex,
          formattedDate,
          recentSearches
        });
  
      } catch (error) {
        console.error('Error tracking shipment:', error);
        res.render('admin/track', {  // Changed from 'tracking/index' to 'admin/track'
          error: 'Failed to track shipment',
          searchedAwb: req.params.awbNumber ,
          recentSearches
        });
      }
    
  },

 getMawb : async (req, res) => {
    try {
        // Fetch all airlines with their prefixes
        const airlines = await Airline.find({}, { airlineName: 1, prefix: 1, _id: 0 });

        // Fetch unused AWB numbers
        const awbNumbers = await AWB.find({ isUsed: false, awbType: 'master' }, { awbNumber: 1, prefix: 1, _id: 0 });

        res.render("admin/mawb", { airlines, awbNumbers });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render("admin/mawb", { error: 'Failed to load data' });
    }
},
  

generatemawb:async (req, res) => {
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
            signature,
            frieght,
            iataCode,
            routingTO1,
            ICN,
            SAR,
            PP,
            COLUMN1,
            COLUMN2,
            NVD,
            NCV,
            kiloGram,
            RATECHARGE,
            consolidated,
            totalQTY,
            QTY
        } = req.body;
        if (
            !awbNumber || !shipperName || !consigneeName || !carrierCode || 
            !grossWeight || !dimensions || !departure || !destination || 
            !handlingInformation || !prepaid || !totalChargesCarrier || 
            !date || !place || !signature || !frieght
        ) {
            return res.status(400).send('Missing required fields');
        }
        // Path to the template PDF
        const templatePath = path.join(global.appRoot, 'controller', 'templates', 'MAWB_Template.pdf');

        const result = await AWB.findOneAndUpdate(
            { awbNumber }, // Find the record by awbNumber
            { $set: { used: true } }, // Set `used` to true
            { new: true } // Return the updated document
        );
        
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        console.log('Current working directory:', process.cwd());
        console.log('Template path:', templatePath);
        
        // Embed a font
        const customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


        const fontSize = 8;
        const maxWidth = 250; // Adjust based on your PDF template's field width

        // Sanitize text input
        const sanitizeText = (text) => text.replace(/[\r\n]+/g, ' '); // Replace newlines with spaces

        // Word wrapping function
        const wrapText = (text, font, size, maxWidth) => {
            const sanitizedText = sanitizeText(text);
            const words = sanitizedText.split(' ');
            let lines = [];
            let currentLine = '';

            words.forEach((word) => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const textWidth = font.widthOfTextAtSize(testLine, size);

                if (textWidth > maxWidth) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines;
        };

        // Function to draw text with word wrapping
        const drawText = (text, x, y) => {
            const lines = wrapText(text, customFont, fontSize, maxWidth);
            lines.forEach((line, index) => {
                firstPage.drawText(line, {
                    x,
                    y: y - index * 10, // Adjust Y position for each line
                    size: fontSize,
                    font: customFont,
                    color: rgb(0, 0, 0),
                });
            });
        };

        // Draw content
        drawText(shipperName, 63, 740); // Shipper Address
        drawText(consigneeName, 63, 670); // Consignee Address
        drawText(`${signature}`, 64, 605);
// Carrier and Transport Details
drawText(`${awbNumber}`, 63, 780);
drawText(`${awbNumber}`, 500, 780);
drawText( `${iataCode}`, 63, 560);
drawText(`${carrierCode}`, 90, 515, { size: 8 }); // Aligned with DXB
drawText(`${routingTO1}`, 65, 515, { size: 8 }); // Adjusted to fit inside the 'To' box
drawText(`${carrierCode}`,250 , 515); // Carrier Code
drawText(`${ICN}`, 218, 515); 
drawText(`${SAR}`, 320, 513); // Currency
drawText(`${PP}`, 348, 513); // Payment method
drawText(`${COLUMN1}`, 365, 513); // Column 1
drawText(`${COLUMN2}`, 380, 513); // Column 2
drawText(`${NVD}`, 450, 513); // Column 1
drawText(`${NCV}`, 532, 513); 

// Airport of Destination Box
drawText(`${destination}`, 65, 490);

// Handling Information
drawText(`${handlingInformation}`, 65, 460);

// Reference Number (using departure value)
drawText(`${departure}`, 65, 535);

// Cargo Details
// Cargo Details with numbers replaced by their names
drawText(`${QTY}`, 65, 400, { size: 9 }); // Replaces '10' with 'ten'
drawText(`${totalQTY}`, 65, 252, { size: 9 }); // Replaces '10' with 'ten'
drawText(`${kiloGram}`, 138, 252, { size: 9 }); // Replaces "K G" with "kilogram"

drawText(`${grossWeight}`, 90, 400, { size: 9 });
drawText(`${grossWeight}`, 218, 400, { size: 9 });
drawText(`${grossWeight}`, 90, 252, { size: 9 });
drawText(`${RATECHARGE}`, 280, 400, { size: 9 }); // Replaces '5.57' with a variable 
drawText(`${prepaid}`, 348, 400, { size: 9 });
drawText(`${consolidated}`, 450, 400, { size: 9 }); // Replaces 'CONSOLIDATED' with a variable
drawText(`${awbNumber}`, 393, 35);
drawText(`${dimensions}`, 450, 380, { size: 9 });
drawText(`${kiloGram}`, 138, 400, { size: 9 });
drawText(`${totalChargesCarrier}`, 348, 252, { size: 9 });
// Additional Information
drawText(`${frieght}`, 320, 605);
drawText(`${carrierCode}`, 320, 730);
// drawText('ORIGINAL 3 (FOR SHIPPER)', 90, 185, { size: 9 });

// Bottom Section
drawText(`${date}`, 271, 65, { size: 8 });
drawText(`${place}`, 393, 65, { size: 8 });
drawText(`${signature}`, 322, 113, { size: 9 });
drawText(`${signature}`, 415, 65, { size: 8 });

// Charges
drawText(`${prepaid}`, 65, 223, { size: 9 });
drawText(`${totalChargesCarrier}`, 65, 127, { size: 9 });
        // Serialize the updated PDF to bytes
        const pdfBytes = await pdfDoc.save();

        // Define the output path
        const outputPath = path.join(__dirname, 'generated', `MAWB_${Date.now()}.pdf`);

        // Ensure the directory exists
        if (!fs.existsSync(path.join(__dirname, 'generated'))) {
            fs.mkdirSync(path.join(__dirname, 'generated'));
        }

        // Write the updated PDF to a file
        fs.writeFile(outputPath, pdfBytes, (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return res.status(500).send('Error generating MAWB PDF');
            }

            // Send the PDF as a downloadable file
            res.download(outputPath, `MAWB_${awbNumber}.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    return res.status(500).send('Error downloading file');
                }

                // Uncomment to delete the file after successful download
                // fs.unlinkSync(outputPath);
            });
        });

    } catch (error) {
        console.error('Error generating MAWB:', error);
        res.status(500).send('Error generating MAWB');
    }
},
getHawb :async (req, res) => {
    try {
      // Fetch unused and master AWB numbers
      const awbNumbers = await AWB.find({ used: false, awbType: 'master' }, { awbNumber: 1, _id: 0 });
  
      res.render("admin/hawb", { awbNumbers });
    } catch (error) {
      console.error('Error fetching AWB numbers:', error);
      res.render("admin/mawb", { error: 'Failed to load AWB numbers' });
    }
  },
  

generateHawb:async (req, res) => {
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
            signature,
            frieght,
            iataCode,
            routingTO1,
            ICN,
            SAR,
            PP,
            COLUMN1,
            COLUMN2,
            NVD,
            NCV,
            kiloGram,
            RATECHARGE,
            consolidated,
            totalQTY,
            QTY
        } = req.body;
        if (
            !awbNumber || !shipperName || !consigneeName || !carrierCode || 
            !grossWeight || !dimensions || !departure || !destination || 
            !handlingInformation || !prepaid || !totalChargesCarrier || 
            !date || !place || !signature || !frieght
        ) {
            return res.status(400).send('Missing required fields');
        }
        // Path to the template PDF
        const templatePath = path.join(global.appRoot, 'controller', 'templates', 'MAWB_Template.pdf');

        const result = await AWB.findOneAndUpdate(
            { awbNumber }, // Find the record by awbNumber
            { $set: { used: true } }, // Set `used` to true
            { new: true } // Return the updated document
        );
        
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        console.log('Current working directory:', process.cwd());
        console.log('Template path:', templatePath);
        
        // Embed a font
        const customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


        const fontSize = 8;
        const maxWidth = 250; // Adjust based on your PDF template's field width

        // Sanitize text input
        const sanitizeText = (text) => text.replace(/[\r\n]+/g, ' '); // Replace newlines with spaces

        // Word wrapping function
        const wrapText = (text, font, size, maxWidth) => {
            const sanitizedText = sanitizeText(text);
            const words = sanitizedText.split(' ');
            let lines = [];
            let currentLine = '';

            words.forEach((word) => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const textWidth = font.widthOfTextAtSize(testLine, size);

                if (textWidth > maxWidth) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines;
        };

        // Function to draw text with word wrapping
        const drawText = (text, x, y) => {
            const lines = wrapText(text, customFont, fontSize, maxWidth);
            lines.forEach((line, index) => {
                firstPage.drawText(line, {
                    x,
                    y: y - index * 10, // Adjust Y position for each line
                    size: fontSize,
                    font: customFont,
                    color: rgb(0, 0, 0),
                });
            });
        };

        // Draw content
        drawText(shipperName, 63, 740); // Shipper Address
        drawText(consigneeName, 63, 670); // Consignee Address
        drawText(`${signature}`, 64, 605);
// Carrier and Transport Details
drawText(`${awbNumber}`, 63, 780);
drawText(`${awbNumber}`, 500, 780);
drawText( `${iataCode}`, 63, 560);
drawText(`${carrierCode}`, 90, 515, { size: 8 }); // Aligned with DXB
drawText(`${routingTO1}`, 65, 515, { size: 8 }); // Adjusted to fit inside the 'To' box
drawText(`${carrierCode}`,250 , 515); // Carrier Code
drawText(`${ICN}`, 218, 515); 
drawText(`${SAR}`, 320, 513); // Currency
drawText(`${PP}`, 348, 513); // Payment method
drawText(`${COLUMN1}`, 365, 513); // Column 1
drawText(`${COLUMN2}`, 380, 513); // Column 2
drawText(`${NVD}`, 450, 513); // Column 1
drawText(`${NCV}`, 532, 513); 

// Airport of Destination Box
drawText(`${destination}`, 65, 490);

// Handling Information
drawText(`${handlingInformation}`, 65, 460);

// Reference Number (using departure value)
drawText(`${departure}`, 65, 535);

// Cargo Details
// Cargo Details with numbers replaced by their names
drawText(`${QTY}`, 65, 400, { size: 9 }); // Replaces '10' with 'ten'
drawText(`${totalQTY}`, 65, 252, { size: 9 }); // Replaces '10' with 'ten'
drawText(`${kiloGram}`, 138, 252, { size: 9 }); // Replaces "K G" with "kilogram"

drawText(`${grossWeight}`, 90, 400, { size: 9 });
drawText(`${grossWeight}`, 218, 400, { size: 9 });
drawText(`${grossWeight}`, 90, 252, { size: 9 });
drawText(`${RATECHARGE}`, 280, 400, { size: 9 }); // Replaces '5.57' with a variable 
drawText(`${prepaid}`, 348, 400, { size: 9 });
drawText(`${consolidated}`, 450, 400, { size: 9 }); // Replaces 'CONSOLIDATED' with a variable
drawText(`${awbNumber}`, 393, 35);
drawText(`${dimensions}`, 450, 380, { size: 9 });
drawText(`${kiloGram}`, 138, 400, { size: 9 });
drawText(`${totalChargesCarrier}`, 348, 252, { size: 9 });
// Additional Information
drawText(`${frieght}`, 320, 605);
drawText(`${carrierCode}`, 320, 730);
// drawText('ORIGINAL 3 (FOR SHIPPER)', 90, 185, { size: 9 });

// Bottom Section
drawText(`${date}`, 271, 65, { size: 8 });
drawText(`${place}`, 393, 65, { size: 8 });
drawText(`${signature}`, 322, 113, { size: 9 });
drawText(`${signature}`, 415, 65, { size: 8 });

// Charges
drawText(`${prepaid}`, 65, 223, { size: 9 });
drawText(`${totalChargesCarrier}`, 65, 127, { size: 9 });
        // Serialize the updated PDF to bytes
        const pdfBytes = await pdfDoc.save();

        // Define the output path
        const outputPath = path.join(__dirname, 'generated', `MAWB_${Date.now()}.pdf`);

        // Ensure the directory exists
        if (!fs.existsSync(path.join(__dirname, 'generated'))) {
            fs.mkdirSync(path.join(__dirname, 'generated'));
        }

        // Write the updated PDF to a file
        fs.writeFile(outputPath, pdfBytes, (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return res.status(500).send('Error generating MAWB PDF');
            }

            // Send the PDF as a downloadable file
            res.download(outputPath, `MAWB_${awbNumber}.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    return res.status(500).send('Error downloading file');
                }

                // Uncomment to delete the file after successful download
                // fs.unlinkSync(outputPath);
            });
        });

    } catch (error) {
        console.error('Error generating MAWB:', error);
        res.status(500).send('Error generating MAWB');
    }
},

getShipment: async (req, res) => {
    try {
        const shipments = await Shipment.find().sort({ createdAt: -1 });
        
        // Get statistics
        const totalShipments = await Shipment.countDocuments();
        const deliveredShipments = await Shipment.countDocuments({ status: 'Delivered' });
        const inTransitShipments = await Shipment.countDocuments({ status: 'In Transit' });
        const exceptionShipments = await Shipment.countDocuments({ 
            status: { $in: ['Failed Delivery', 'Cancelled'] }
        });

        res.render("admin/allShipment", { 
            shipments,
            stats: {
                total: totalShipments,
                delivered: deliveredShipments,
                inTransit: inTransitShipments,
                exceptions: exceptionShipments
            }
        });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.render("admin/allShipment", { error: 'Failed to load shipments' });
    }
},
fetchAllAwb: async (req, res) => { 
    try {
        const shipments = await Shipment.find({ status: { $ne: 'Delivered' } }).sort({ createdAt: -1 });
        res.render('admin/awbUpdate', { shipments });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).send('Server Error');
    }
},}