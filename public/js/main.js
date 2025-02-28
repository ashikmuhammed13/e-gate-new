class ShipmentForm {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentPackageCount = 1;
    }
  
    initializeElements() {
        // Form elements
        this.form = document.querySelector('form') || document.body;
        this.packagesContainer = document.getElementById('packages-container');
        this.addPackageBtn = document.getElementById('add-package');
        this.createShipmentBtn = document.querySelector('.btn-create-shipment');
        
        // Counters
        this.totalPackagesSpan = document.getElementById('total-packages');
        this.totalWeightSpan = document.getElementById('total-weight');
  
        // Initialize with current date
        const today = new Date().toISOString().split('T')[0];
        const shipmentDateInput = document.getElementById('shipmentDate');
        if (shipmentDateInput) {
            shipmentDateInput.value = today;
        }
  
        // Setup postal code lookup
        this.setupPostalCodeInputs();
    }
  
    async handlePostalCodeLookup(postalCode, section) {
        const countryInput = document.querySelector(`input[name="${section}Country"]`);
        const cityInput = document.querySelector(`input[name="${section}City"]`);
    
        try {
            // First try for Indian postcodes
            if (/^[1-9][0-9]{5}$/.test(postalCode)) {  // Indian postal code format
                try {
                    const indiaResponse = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
                    const indiaData = await indiaResponse.json();
    
                    if (indiaData && indiaData[0] && indiaData[0].Status === "Success" && indiaData[0].PostOffice) {
                        countryInput.value = "India";
                        cityInput.value = indiaData[0].PostOffice[0].District;
                        return;
                    }
                } catch (indiaError) {
                    console.log('Indian postal code lookup failed:', indiaError);
                }
            }
    
            // Try for UK postcodes
            try {
                const ukResponse = await fetch(`https://api.postcodes.io/postcodes/${postalCode}`);
                const ukData = await ukResponse.json();
                
                if (ukData.status === 200) {
                    countryInput.value = "United Kingdom";
                    cityInput.value = ukData.result.admin_district || ukData.result.parish || '';
                    return;
                }
            } catch (ukError) {
                console.log('Not a UK postcode, trying other services...');
            }
    
            // Try for Saudi postal codes
            if (/^[0-9]{5}(-[0-9]{4})?$/.test(postalCode)) {
                try {
                    const saudiResponse = await fetch(`https://apina.address.gov.sa/NationalAddress/v3.1/Address/PostalCode/Rest/GetAddress/${postalCode}`);
                    const saudiData = await saudiResponse.json();
                    
                    if (saudiData && saudiData.city) {
                        countryInput.value = "Saudi Arabia";
                        cityInput.value = saudiData.city;
                        return;
                    }
                } catch (saudiError) {
                    console.log('Saudi postal code lookup failed:', saudiError);
                }
            }
    
            // Try with Zippopotam.us for common countries
            try {
                const countryCodes = ['US', 'GB', 'FR', 'DE', 'CA', 'IT', 'ES', 'AU', 'BR', 'IN'];
                
                for (let countryCode of countryCodes) {
                    const zipResponse = await fetch(`https://api.zippopotam.us/${countryCode}/${postalCode}`);
                    
                    if (zipResponse.ok) {
                        const zipData = await zipResponse.json();
                        countryInput.value = zipData.country;
                        cityInput.value = zipData.places[0]?.['place name'] || '';
                        return;
                    }
                }
            } catch (zipError) {
                console.log('Zippopotam.us lookup failed, trying final option...');
            }
    
            // Final fallback to GeoNames
            try {
                const geoNamesUsername = 'ashique13';
                const geoNamesUrl = `http://api.geonames.org/postalCodeSearchJSON?postalcode=${postalCode}&maxRows=1&username=${geoNamesUsername}`;
                
                const geoResponse = await fetch(geoNamesUrl);
                const geoData = await geoResponse.json();
                
                if (geoData.postalCodes && geoData.postalCodes.length > 0) {
                    countryInput.value = geoData.postalCodes[0].countryCode;
                    cityInput.value = geoData.postalCodes[0].placeName;
                }
            } catch (geoError) {
                console.log('GeoNames lookup failed:', geoError);
            }
    
        } catch (error) {
            console.error('Postal code lookup failed:', error);
        }
    }
    
    setupPostalCodeInputs() {
        ['sender', 'receiver'].forEach(section => {
            const postalInput = document.querySelector(`input[name="${section}Postal"]`);
            if (postalInput) {
                let timeoutId;
                
                const handlePostalCodeInput = () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(async () => {
                        const postalCode = postalInput.value.trim().replace(/\s+/g, '');
                        if (postalCode.length >= 3) {
                            await this.handlePostalCodeLookup(postalCode, section);
                        }
                    }, 1000); // Wait 1 second after typing stops
                };
    
                postalInput.addEventListener('input', handlePostalCodeInput);
                postalInput.addEventListener('blur', handlePostalCodeInput);
            }
        });
    }
  














































    attachEventListeners() {
        if (this.addPackageBtn) {
            this.addPackageBtn.addEventListener('click', () => this.addNewPackage());
        }
  
        if (this.packagesContainer) {
            this.packagesContainer.addEventListener('input', (e) => {
                if (e.target.classList.contains('package-weight')) {
                    this.updateTotals();
                }
            });
        }
  
        if (this.createShipmentBtn) {
            this.createShipmentBtn.addEventListener('click', (e) => this.handleSubmit(e));
        }
    }
  
    async handleSubmit(event) {
        event.preventDefault();
      
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields');
            return;
        }
      
        try {
          const formData = {
            senderContact: document.querySelector('input[name="senderContact"]').value,
            senderCompany: document.querySelector('input[name="senderCompany"]').value,
            senderPhone: document.querySelector('input[name="senderPhone"]').value,
            senderEmail: document.querySelector('input[name="senderEmail"]').value,
            senderCountry: document.querySelector('input[name="senderCountry"]').value,
            senderAddress1: document.querySelector('input[name="senderAddress1"]').value,
            senderAddress2: document.querySelector('input[name="senderAddress2"]').value,
            senderAddress3: document.querySelector('input[name="senderAddress3"]').value,
            senderPostal: document.querySelector('input[name="senderPostal"]').value,
            senderCity: document.querySelector('input[name="senderCity"]').value,
            senderIsResidential: document.querySelector('input[name="senderIsResidential"]')?.checked || false,
      
            receiverContact: document.querySelector('input[name="receiverContact"]').value,
            receiverCompany: document.querySelector('input[name="receiverCompany"]').value,
            receiverPhone: document.querySelector('input[name="receiverPhone"]').value,
            receiverEmail: document.querySelector('input[name="receiverEmail"]').value,
            receiverCountry: document.querySelector('input[name="receiverCountry"]').value,
            receiverAddress1: document.querySelector('input[name="receiverAddress1"]').value,
            receiverAddress2: document.querySelector('input[name="receiverAddress2"]').value,
            receiverAddress3: document.querySelector('input[name="receiverAddress3"]').value,
            receiverPostal: document.querySelector('input[name="receiverPostal"]').value,
            receiverCity: document.querySelector('input[name="receiverCity"]').value,
            receiverIsResidential: document.querySelector('input[name="receiverIsResidential"]')?.checked || false,
      
            shipmentDate: document.getElementById('shipmentDate').value,
            saveSenderAddress: document.getElementById('senderSaveAddressCheck').checked,
            saveReceiverAddress: document.getElementById('receiverSaveAddressCheck').checked,
            packages: this.getPackagesData()
          };
      
        //   console.log('Submitting form data:', formData);

          const response = await fetch('/admin/createAwb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
      
          if (!response.ok) {
            const errorText = await response.text();
            this.showError(errorText || 'Failed to create Airway Bill');
            return;
          }
      
          // Get AWB number from custom header (if desired)
          const awbNumber = response.headers.get('X-AWB-Number') || 'N/A';
      
          // Convert response to a Blob (PDF file)
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
      
          // Create a temporary download link and trigger the download
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          
          // Extract filename from headers if available
          let fileName = 'shipping_label.pdf';
          const disposition = response.headers.get('Content-Disposition');
          if (disposition && disposition.indexOf('filename=') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              fileName = matches[1].replace(/['"]/g, '');
            }
          }
          a.download = fileName;
          
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
      
          this.showSuccess(`Airway Bill created successfully. AWB Number: ${awbNumber}`);
          this.resetForm();
        } catch (error) {
          console.error('Form submission error:', error);
          this.showError('An error occurred while creating the Airway Bill');
        }
      }
      
  
    validateForm() {
        const requiredFields = document.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });
  
        return isValid;
    }
  
    getPackagesData() {
        if (!this.packagesContainer) return [];
        
        return Array.from(this.packagesContainer.querySelectorAll('.package-form')).map(pkg => ({
            packageType: pkg.querySelector('.package-type').value,
            weight: parseFloat(pkg.querySelector('.package-weight').value) || 0,
            dimensions: {
                length: parseFloat(pkg.querySelector('input[placeholder="Length"]').value) || 0,
                width: parseFloat(pkg.querySelector('input[placeholder="Width"]').value) || 0,
                height: parseFloat(pkg.querySelector('input[placeholder="Height"]').value) || 0
            }
        }));
    }
  
    addNewPackage() {
        this.currentPackageCount++;
        const packageHtml = this.createPackageHtml(this.currentPackageCount);
        this.packagesContainer.insertAdjacentHTML('beforeend', packageHtml);
        this.updateTotals();
    }
  
    createPackageHtml(packageNumber) {
        return `
            <div class="package-form mb-4">
                <div class="package-header d-flex justify-content-between align-items-center">
                    <h6 class="package-title">Package #${packageNumber}</h6>
                    <button type="button" class="btn btn-delete-package" onclick="shipmentForm.deletePackage(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label required-field">Package Type</label>
                        <select class="form-select package-type" required>
                            <option value="">Select Package Type</option>
                            <option value="Document">Document</option>
                            <option value="Parcel">Parcel</option>
                            <option value="Heavy Cargo">Heavy Cargo</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label required-field">Weight (kg)</label>
                        <input type="number" class="form-control package-weight" step="0.1" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Dimensions (L × W × H) cm</label>
                        <div class="input-group">
                            <input type="number" class="form-control" placeholder="Length">
                            <span class="input-group-text">×</span>
                            <input type="number" class="form-control" placeholder="Width">
                            <span class="input-group-text">×</span>
                            <input type="number" class="form-control" placeholder="Height">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
  
    deletePackage(button) {
        button.closest('.package-form').remove();
        this.updateTotals();
        this.renumberPackages();
    }
  
    renumberPackages() {
        const packages = this.packagesContainer.querySelectorAll('.package-form');
        packages.forEach((pkg, index) => {
            pkg.querySelector('.package-title').textContent = `Package #${index + 1}`;
        });
        this.currentPackageCount = packages.length;
    }
  
    updateTotals() {
        const packages = this.packagesContainer.getElementsByClassName('package-form');
        this.totalPackagesSpan.textContent = packages.length;
  
        let totalWeight = 0;
        const weightInputs = this.packagesContainer.getElementsByClassName('package-weight');
        Array.from(weightInputs).forEach(input => {
            totalWeight += parseFloat(input.value) || 0;
        });
        this.totalWeightSpan.textContent = totalWeight.toFixed(2);
    }
  
    showSuccess(message) {
        alert(message); // Replace with your preferred notification system
    }
  
    showError(message) {
        alert(message); // Replace with your preferred notification system
    }
  
    resetForm() {
        this.form.reset();
        this.packagesContainer.innerHTML = this.createPackageHtml(1);
        this.currentPackageCount = 1;
        this.updateTotals();
        
        // Reset date to current date
        const today = new Date().toISOString().split('T')[0];
        const shipmentDateInput = document.getElementById('shipmentDate');
        if (shipmentDateInput) {
            shipmentDateInput.value = today;
        }
    }
  }
  
  // Initialize the form handler when the document is ready
  document.addEventListener('DOMContentLoaded', function() {
    window.shipmentForm = new ShipmentForm();
  });

  

  let debounceTimer;