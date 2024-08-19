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
            'tram': 'tram',  // Add class for tram
            'overground': 'overground', // Add class for overground
            'dlr': 'dlr', // Add class for DLR
            'elizabeth-line': 'elizabeth-line' // Add class for Elizabeth Line
        };

        // Function to update status for a given data and mode
        function updateStatus(data, mode) {
            data.forEach(item => {
                const lineId = item.id.toLowerCase();
                const lineClass = lineClassNames[lineId] || mode;
                if (lineClass) {
                    // Select the status element for the current line
                    const statusElement = document.querySelector(`.status-item.${lineClass} .status`);
                    if (statusElement) {
                        // Get the status description
                        const status = item.lineStatuses[0];
                        const statusDescription = status ? status.statusSeverityDescription : 'No Status Available';
                        statusElement.textContent = `Status: ${statusDescription}`;
                    } else {
                        console.warn(`No element found for line class: ${lineClass}`);
                    }
                } else {
                    console.warn(`No class mapping found for line ID: ${lineId}`);
                }
            });
        }

        // Update status for Tube
        updateStatus(tubeData, 'tube');
        // Update status for Tram
        updateStatus(tramData, 'tram');
        // Update status for Overground
        updateStatus(overgroundData, 'overground');
        // Update status for DLR
        updateStatus(dlrData, 'dlr');
        // Update status for Elizabeth Line
        updateStatus(elizabethLineData, 'elizabeth-line');

    } catch (error) {
        console.error('Error fetching status data:', error);
    }
}

// Run the updateStatusGrid function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', updateStatusGrid);
