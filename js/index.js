async function updateStatusTicker() {
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

        function generateTickerContent(data, mode) {
            return data.map(item => {
                const lineId = item.id.toLowerCase();
                const lineClass = lineClassNames[lineId] || mode;
                const status = item.lineStatuses[0];
                const statusDescription = status ? status.statusSeverityDescription : 'No Status Available';
                return `
                    <div class="status-item ${lineClass}">
                        <span class="status-text"><strong>${item.name}:</strong> ${statusDescription}</span>
                    </div>
                `;
            }).join('');
        }

        // Generate ticker content for each mode
        const tickerContent = [
            generateTickerContent(tubeData, 'tube'),
            generateTickerContent(tramData, 'tram'),
            generateTickerContent(overgroundData, 'overground'),
            generateTickerContent(dlrData, 'dlr'),
            generateTickerContent(elizabethLineData, 'elizabeth-line')
        ].join('');

        // Insert content into two ticker containers for seamless scrolling
        document.getElementById('ticker-content1').innerHTML = tickerContent;
        document.getElementById('ticker-content2').innerHTML = tickerContent;

        // Update the timestamp of the last update
        const updateTimeElement = document.getElementById('update-time');
        if (updateTimeElement) {
            const now = new Date();
            updateTimeElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }

    } catch (error) {
        console.error('Error fetching status data:', error);
    }
}

// Run the updateStatusTicker function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    updateStatusTicker(); // Initial call to populate the ticker

    // Set interval for periodic updates (e.g., every 60 seconds)
    const updateInterval = 60000; // 60 seconds
    setInterval(updateStatusTicker, updateInterval);
});
