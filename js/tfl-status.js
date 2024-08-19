async function updateStatusGrid() {
    try {
        // Fetch data from the TfL APIs
        const tubeResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/tube/Status');
        const tramResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/tram/Status');
        const overgroundResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/overground/Status');
        const dlrResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/dlr/Status');
        const elizabethLineResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/elizabeth-line/Status');

        if (!tubeResponse.ok || !tramResponse.ok || !overgroundResponse.ok || !dlrResponse.ok || !elizabethLineResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const tubeData = await tubeResponse.json();
        const tramData = await tramResponse.json();
        const overgroundData = await overgroundResponse.json();
        const dlrData = await dlrResponse.json();
        const elizabethLineData = await elizabethLineResponse.json();

        // Log API responses for debugging
        console.log('Tube API Response:', tubeData);
        console.log('Tram API Response:', tramData);
        console.log('Overground API Response:', overgroundData);
        console.log('DLR API Response:', dlrData);
        console.log('Elizabeth Line API Response:', elizabethLineData);

        // Create a mapping of line IDs to their class names for easier lookup
        const lineClassNames = {
            'bakerloo': 'bakerloo',
            'central': 'central',
            'circle': 'circle',
            'district': 'district',
            'hammersmith-city': 'hammersmith-city',
            'jubilee': 'jubilee',
            'metropolitan': 'metropolitan',
            'northern': 'northern',
            'piccadilly': 'piccadilly',
            'victoria': 'victoria',
            'waterloo-city': 'waterloo-city',
            'tram': 'tram',
            'overground': 'overground',
            'dlr': 'dlr',
            'elizabeth-line': 'elizabeth-line'
        };

        // Function to update status for a given data and mode
        function updateStatus(data, mode) {
            data.forEach(item => {
                const lineId = item.id.toLowerCase();
                const lineClass = lineClassNames[lineId] || mode;
                if (lineClass) {
                    // Select the status element for the current line
                    const statusElement = document.querySelector(`.status-item.${lineClass} .status-text`);
                    if (statusElement) {
                        // Get the status description
                        const status = item.lineStatuses[0];
                        const statusDescription = status ? status.statusSeverityDescription : 'No Status Available';
                        statusElement.textContent = statusDescription;

                        // Attach more detailed information to the element
                        statusElement.dataset.details = status.reason || 'No further details available';

                        // Add or remove the alert icon based on the status
                        const statusItem = statusElement.closest('.status-item');
                        let alertIcon = statusItem.querySelector('.alert-icon');
                        if (!alertIcon) {
                            alertIcon = document.createElement('img');
                            alertIcon.src = 'img/tfl_alert_icon.png'; // Path to the image
                            alertIcon.classList.add('alert-icon');
                            statusItem.appendChild(alertIcon);
                        }

                        // Show or hide the alert icon based on status
                        if (statusDescription !== 'Good Service') {
                            alertIcon.style.display = 'block';
                        } else {
                            alertIcon.style.display = 'none';
                        }
                    } else {
                        console.warn(`No element found for line class: ${lineClass}`);
                    }
                } else {
                    console.warn(`No class mapping found for line ID: ${lineId}`);
                }
            });
        }

        // Update status for each mode
        updateStatus(tubeData, 'tube');
        updateStatus(tramData, 'tram');
        updateStatus(overgroundData, 'overground');
        updateStatus(dlrData, 'dlr');
        updateStatus(elizabethLineData, 'elizabeth-line');

    } catch (error) {
        console.error('Error fetching status data:', error);
    }
}

// Run the updateStatusGrid function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', updateStatusGrid);

document.addEventListener('DOMContentLoaded', function () {
    // Select all status items
    const statusItems = document.querySelectorAll('.status-item');
    
    // Popup elements
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');
    const popupTitle = document.getElementById('popup-title');
    const popupDetails = document.getElementById('popup-details'); // Element for detailed status
    const closeButton = document.querySelector('.close-btn');

    // Function to open the popup
    function openPopup(serviceName, details, borderColor) {
        popupTitle.textContent = serviceName;
        popupDetails.textContent = details;  // Display the details in the popup
        popupContent.style.borderColor = borderColor;
        popupOverlay.style.display = 'block';
        popupContent.style.display = 'block';
    }

    // Function to close the popup
    function closePopup() {
        popupOverlay.style.display = 'none';
        popupContent.style.display = 'none';
    }

    // Attach click event listeners to each status item
    statusItems.forEach(item => {
        item.addEventListener('click', function () {
            const serviceName = this.querySelector('h3').textContent;
            const details = this.querySelector('.status-text').dataset.details; // Get the attached details
            const borderColor = window.getComputedStyle(this).borderColor;
            openPopup(serviceName, details, borderColor);
        });
    });

    // Close the popup when clicking the close button or overlay
    closeButton.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', closePopup);
});
