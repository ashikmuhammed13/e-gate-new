console.log('Address search script loading...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Initialize search functionality for both sender and receiver
    initializeSearch('sender');
    initializeSearch('receiver');

    function initializeSearch(type) {
        const searchInput = document.getElementById(`${type}SearchInput`);
        const resultsDiv = document.getElementById(`${type}SearchResults`);
        
        if (!searchInput || !resultsDiv) {
            console.error(`Required elements not found for ${type}`);
            return;
        }
    
        let debounceTimer;
    
        searchInput.addEventListener('input', (event) => {
            clearTimeout(debounceTimer);
            
            const searchTerm = event.target.value.trim();
            if (searchTerm.length < 2) {
                resultsDiv.style.display = 'none';
                resultsDiv.innerHTML = '';
                return;
            }
    
            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/admin/getSavedAddresses?search=${encodeURIComponent(searchTerm)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
    
                    resultsDiv.innerHTML = ''; // Clear previous results
                    resultsDiv.style.display = 'block'; // Show results div
    
                    if (!data.addresses || data.addresses.length === 0) {
                        resultsDiv.innerHTML = '<div class="p-2">No addresses found</div>';
                        return;
                    }
    
                    data.addresses.forEach(address => {
                        const div = document.createElement('div');
                        div.className = 'address-result p-2';
                        div.innerHTML = `
                            <div><strong>${address.contactName}</strong></div>
                            <div>${address.addressLine1}</div>
                            <div>${address.city}, ${address.country}</div>
                        `;
                        div.addEventListener('click', () => {
                            fillAddressForm(address, type);
                            resultsDiv.style.display = 'none';
                            resultsDiv.innerHTML = '';
                            searchInput.value = '';
                        });
                        resultsDiv.appendChild(div);
                    });
    
                } catch (error) {
                    console.error('Error during fetch:', error);
                    resultsDiv.innerHTML = '<div class="p-2 text-danger">Error fetching addresses</div>';
                    resultsDiv.style.display = 'block';
                }
            }, 300);
        });
    
        // Hide results when clicking outside
        document.addEventListener('click', (event) => {
            if (!searchInput.contains(event.target) && !resultsDiv.contains(event.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    }

    function fillAddressForm(address, type) {
        const fields = {
            [`${type}Contact`]: address.contactName,
            [`${type}Company`]: address.company,
            [`${type}Phone`]: address.phoneNumber,
            [`${type}Email`]: address.email,
            [`${type}Country`]: address.country,
            [`${type}Address1`]: address.addressLine1,
            [`${type}Address2`]: address.addressLine2,
            [`${type}Address3`]: address.addressLine3,
            [`${type}Postal`]: address.postalCode,
            [`${type}City`]: address.city
        };

        for (const [field, value] of Object.entries(fields)) {
            const input = document.querySelector(`input[name="${field}"]`);
            if (input) input.value = value || '';
        }

        const residentialCheck = document.getElementById(`${type}ResidentialCheck`);
        if (residentialCheck) residentialCheck.checked = address.isResidential;
    }
});