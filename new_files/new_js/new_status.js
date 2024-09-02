async function updateStatusGrid() {
    try {
        // Show "Fetching Status..." initially
        const updateTimeElement = document.getElementById('update-time');
        updateTimeElement.textContent = 'Last updated: Fetching Status...';

        // Fetch status data
        const tubeResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/tube/Status');
        const tramResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/tram/Status');
        const overgroundResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/overground/Status');
        const dlrResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/dlr/Status');
        const elizabethLineResponse = await fetch('https://api.tfl.gov.uk/Line/Mode/elizabeth-line/Status');

        // Check for errors in the network response
        if (!tubeResponse.ok || !tramResponse.ok || !overgroundResponse.ok || !dlrResponse.ok || !elizabethLineResponse.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse the response data
        const tubeData = await tubeResponse.json();
        const tramData = await tramResponse.json();
        const overgroundData = await overgroundResponse.json();
        const dlrData = await dlrResponse.json();
        const elizabethLineData = await elizabethLineResponse.json();

        // Check if any data array is empty
        if (
            tubeData.length === 0 &&
            tramData.length === 0 &&
            overgroundData.length === 0 &&
            dlrData.length === 0 &&
            elizabethLineData.length === 0
        ) {
            updateTimeElement.textContent = 'Last updated: We are experiencing issues';
            return;
        }

        // Log responses for debugging
        console.log('Tube API Response:', tubeData);
        console.log('Tram API Response:', tramData);
        console.log('Overground API Response:', overgroundData);
        console.log('DLR API Response:', dlrData);
        console.log('Elizabeth Line API Response:', elizabethLineData);

        // Line class names mapping
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

        function updateStatus(data, mode) {
            data.forEach(item => {
                const lineId = item.id.toLowerCase();
                const lineClass = lineClassNames[lineId] || mode;
                if (lineClass) {
                    const statusElement = document.querySelector(`.status-item.${lineClass} .status-text`);
                    if (statusElement) {
                        const status = item.lineStatuses[0];
                        const statusDescription = status ? status.statusSeverityDescription : 'No Status Available';
                        statusElement.textContent = statusDescription;

                        statusElement.dataset.details = status.reason || 'No further details available';

                        const statusItem = statusElement.closest('.status-item');
                        let alertIcon = statusItem.querySelector('.alert-icon');
                        if (!alertIcon) {
                            alertIcon = document.createElement('img');
                            alertIcon.src = '../img/tfl_alert_icon.png'; // Ensure this path is correct and image supports mobile-first design
                            alertIcon.classList.add('alert-icon');
                            statusItem.appendChild(alertIcon);
                        }

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

        // Update the last updated time
        const now = new Date();
        updateTimeElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    } catch (error) {
        console.error('Error fetching status data:', error);
        document.getElementById('update-time').textContent = 'Last updated: We are experiencing issues with live line status information. PLease try again later. (TfL Server Issue)';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateStatusGrid(); 
 
    const updateInterval = 60000; // 60 seconds
    setInterval(updateStatusGrid, updateInterval);

    const countdownElement = document.getElementById('update-countdown');
    let countdown = updateInterval / 1000; 

    function startCountdown() {
        countdown = updateInterval / 1000;
        const intervalId = setInterval(() => {
            countdown -= 1;
            countdownElement.textContent = `Update in: ${countdown}s`;

            if (countdown <= 0) {
                clearInterval(intervalId);
                startCountdown(); 
            }
        }, 1000);
    }

    startCountdown();

    const statusItems = document.querySelectorAll('.status-item');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');
    const popupTitle = document.getElementById('popup-title');
    const popupDetails = document.getElementById('popup-details'); 
    const closeButton = document.querySelector('.close-btn');

    function openPopup(serviceName, details, borderColor) {
        popupTitle.textContent = serviceName;
        popupDetails.textContent = details;  
        popupContent.style.borderColor = borderColor;
        popupOverlay.style.display = 'block';
        popupContent.style.display = 'block';
    }

    function closePopup() {
        popupOverlay.style.display = 'none';
        popupContent.style.display = 'none';
    }

    statusItems.forEach(item => {
        item.addEventListener('click', function () {
            const serviceName = this.querySelector('h2').textContent;
            const details = this.querySelector('.status-text').dataset.details; 
            const borderColor = window.getComputedStyle(this).borderColor;
            openPopup(serviceName, details, borderColor);
        });
    });

    closeButton.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', closePopup);
});
