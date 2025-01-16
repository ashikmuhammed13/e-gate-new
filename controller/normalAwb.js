// const { Address, Shipment } = require('../models/Shipment');

// module.exports = {
//   getAwbPage: async (req, res) => {
//     res.render("admin/awbCreate");
//   },

//   createAwb: async (req, res) => {
//     try {
//       // Generate unique AWB number (you can customize this format)
//       const awbNumber = 'AWB' + Date.now() + Math.floor(Math.random() * 1000);

//       // Extract data from request body
//       const {
//         senderContact, senderCompany, senderPhone, senderEmail,
//         senderCountry, senderAddress1, senderAddress2, senderAddress3,
//         senderPostal, senderCity, senderIsResidential,
        
//         receiverContact, receiverCompany, receiverPhone, receiverEmail,
//         receiverCountry, receiverAddress1, receiverAddress2, receiverAddress3,
//         receiverPostal, receiverCity, receiverIsResidential,
        
//         shipmentDate,
//         packages // Array of package objects
//       } = req.body;

//       // Calculate totals
//       const totalPackages = packages.length;
//       const totalWeight = packages.reduce((sum, pkg) => sum + parseFloat(pkg.weight), 0);

//       // Create new shipment
//       const shipment = new Shipment({
//         awbNumber,
//         shipmentDate,
//         sender: {
//           addressDetails: {
//             contactName: senderContact,
//             company: senderCompany,
//             phoneNumber: senderPhone,
//             email: senderEmail,
//             country: senderCountry,
//             addressLine1: senderAddress1,
//             addressLine2: senderAddress2,
//             addressLine3: senderAddress3,
//             postalCode: senderPostal,
//             city: senderCity,
//             isResidential: senderIsResidential
//           }
//         },
//         receiver: {
//           addressDetails: {
//             contactName: receiverContact,
//             company: receiverCompany,
//             phoneNumber: receiverPhone,
//             email: receiverEmail,
//             country: receiverCountry,
//             addressLine1: receiverAddress1,
//             addressLine2: receiverAddress2,
//             addressLine3: receiverAddress3,
//             postalCode: receiverPostal,
//             city: receiverCity,
//             isResidential: receiverIsResidential
//           }
//         },
//         packages,
//         totalPackages,
//         totalWeight
//       });

//       await shipment.save();
//       res.status(200).json({ success: true, awbNumber });

//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ success: false, error: error.message });
//     }
//   }
// };


const { Address, Shipment } = require('../models/Shipment');

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
            const { search } = req.query;
            const query = search ? {
                $or: [
                    { contactName: new RegExp(search, 'i') },
                    { company: new RegExp(search, 'i') },
                    { phoneNumber: new RegExp(search, 'i') }
                ]
            } : {};

            const addresses = await Address.find(query).limit(10);
            res.json({ success: true, addresses });
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
        }
    },

    createAwb: async (req, res) => {
        try {
            // Generate unique AWB number (you can customize this format)
            const awbNumber = 'AWB' + Date.now() + Math.floor(Math.random() * 1000);

            // Extract data from request body
            const {
                senderContact, senderCompany, senderPhone, senderEmail,
                senderCountry, senderAddress1, senderAddress2, senderAddress3,
                senderPostal, senderCity, senderIsResidential,
                saveSenderAddress,

                receiverContact, receiverCompany, receiverPhone, receiverEmail,
                receiverCountry, receiverAddress1, receiverAddress2, receiverAddress3,
                receiverPostal, receiverCity, receiverIsResidential,
                saveReceiverAddress,

                shipmentDate,
                packages // Array of package objects
            } = req.body;

            // Calculate totals
            const totalPackages = packages.length;
            const totalWeight = packages.reduce((sum, pkg) => sum + parseFloat(pkg.weight), 0);

            // Create sender address if save is requested
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

            // Create receiver address if save is requested
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

            // Create new shipment
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
                // Add initial timeline event
                timeline: [{
                    location: senderCity,
                    status: 'Created',
                    description: 'Shipment created and AWB generated',
                    updatedBy: 'System' // You might want to replace this with actual user info
                }]
            });

            await shipment.save();

            // Return success response
            res.status(200).json({
                success: true,
                awbNumber,
                message: 'Shipment created successfully'
            });

        } catch (error) {
            console.error('Error creating shipment:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create shipment'
            });
        }
    },
  // controller/normalAwb.js


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
  };