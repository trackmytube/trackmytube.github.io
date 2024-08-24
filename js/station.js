document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('station-search');
    const searchResults = document.getElementById('search-results');
    const selectedStation = document.getElementById('selectedStation');
    const selectedLines = document.getElementById('selectedLines');
    const arrivalsContainer = document.getElementById('arrivalsContainer');
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popupTitle');
    const popupClose = document.getElementById('popupClose');
    const overlay = document.getElementById('overlay');
    const popupArrivals = document.getElementById('popupArrivals');
    
    let allStations = [];
    let selectedNaPTANId = null;
    let refreshInterval = null;

    // Define line colors
    const lineColors = {
        "Bakerloo": "#B36305",
        "Central": "#E32017",
        "Circle": "#FFD300",
        "District": "#00782A",
        "DLR": "#00A4A7",
        "Elizabeth": "#5B2C6F",
        "Hammersmith & City": "#F3A9BB",
        "Jubilee": "#A0A5A9",
        "London Overground": "#EE7C0E",
        "Metropolitan": "#9B0056",
        "Northern": "#000000",
        "Piccadilly": "#003688",
        "Tram": "#84B817",
        "Victoria": "#0098D4",
        "Waterloo & City": "#95CDBA"
    };

    // Fetch all stations from the GitHub-hosted JSON file
    async function fetchStations() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/jahir10ali/naptans-for-tfl-stations/main/data/Station_NaPTANs.json');
            if (!response.ok) throw new Error('Network response was not ok');
            allStations = await response.json();
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    }

    // Filter and display results based on user input
    function filterStations(query) {
        const results = allStations.filter(station =>
            station['Station Name'].toLowerCase().replace(/['’]/g, '').includes(query.toLowerCase().replace(/['’]/g, ''))
        ).slice(0, 6); // Limit to 6 results

        displayResults(results);
    }

    // Display search results
    function displayResults(stations) {
        if (stations.length > 0) {
            searchResults.innerHTML = stations.map(station => {
                const colors = station.Lines.map(line => lineColors[line] || '#000000');
                const colorRectangles = colors.map(color => `<span class="line-color" style="background-color: ${color};"></span>`).join(' ');
                return `
                    <div class="station-result" data-station-name="${station['Station Name']}" data-naptan-id="${station['NaPTAN ID']}" data-station-lines='${JSON.stringify(station.Lines)}'>
                        <h3>${station['Station Name']}</h3>
                        <div class="line-colors">${colorRectangles}</div>
                    </div>
                `;
            }).join('');
        } else {
            searchResults.innerHTML = 'No results found.';
        }
    }

    // Fetch and display live arrivals
    async function fetchLiveArrivals(naptanId, lines) {
        const arrivalsPromises = lines.map(line =>
            fetch(`https://api.tfl.gov.uk/StopPoint/${naptanId}/Arrivals`)
                .then(response => response.json())
                .then(data => {
                    const arrivalsForLine = data.filter(arrival => arrival.lineName === line);
                    const groupedByPlatform = arrivalsForLine.reduce((acc, curr) => {
                        const platform = curr.platformName || 'Unknown';
                        if (!acc[platform]) acc[platform] = [];
                        acc[platform].push(curr);
                        return acc;
                    }, {});
                    const earliestArrivals = Object.entries(groupedByPlatform).map(([platform, arrivals]) => {
                        const earliestArrival = arrivals.reduce((prev, curr) => new Date(prev.expectedArrival) < new Date(curr.expectedArrival) ? prev : curr);
                        return {
                            platformName: platform,
                            lineName: earliestArrival.lineName,
                            destinationName: earliestArrival.destinationName,
                            timeToArrival: Math.floor(earliestArrival.timeToStation / 60)
                        };
                    });
                    return {
                        line,
                        arrivals: earliestArrivals
                    };
                })
        );

        const results = await Promise.all(arrivalsPromises);
        displayArrivals(results);
    }

    // Display arrivals
    function displayArrivals(arrivalData) {
        arrivalsContainer.innerHTML = '';
        arrivalData.forEach(data => {
            if (data.arrivals.length > 0) {
                const lineColor = lineColors[data.line] || '#000000';
                const lineArrivals = data.arrivals.map(arrival => `
                    <div class="arrival">
                        <div class="arrival-details" data-platform="${arrival.platformName}" data-line="${arrival.lineName}">
                            <strong>${arrival.platformName}</strong>
                            <span>To: ${arrival.destinationName}</span><br>
                            <span>${arrival.timeToArrival < 1 ? 'Due' : `${arrival.timeToArrival} min`}</span>
                        </div>
                    </div>
                `).join('');
                arrivalsContainer.innerHTML += `
                    <div class="line-arrivals" style="border-color: ${lineColor};">
                        <h4>${data.line}</h4>
                        ${lineArrivals}
                    </div>
                `;
            }
        });
    }

    // Fetch and display arrivals for the popup
    async function fetchPopupArrivals(naptanId, line, platform) {
        try {
            const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${naptanId}/Arrivals`);
            const data = await response.json();
            const arrivalsForPlatform = data.filter(arrival => arrival.platformName === platform && arrival.lineName === line);
            const sortedArrivals = arrivalsForPlatform.sort((a, b) => new Date(a.expectedArrival) - new Date(b.expectedArrival));
            
            popupArrivals.innerHTML = sortedArrivals.map(arrival => {
                const minutesToArrival = Math.floor(arrival.timeToStation / 60);
                const timeDisplay = minutesToArrival < 1 ? 'Due' : `${minutesToArrival} min`;
                return `
                    <div class="arrival-item">
                        <div class="destination-line">
                            <span class="destination">${arrival.destinationName}</span>
                            <span class="time-to-arrival">${timeDisplay}</span>
                        </div>
                        <div class="details-line">
                            <span class="location">${arrival.currentLocation}</span>
                            <span class="expected-time">${new Date(arrival.expectedArrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error fetching arrivals:', error);
        }
    }

    // Handle station click event
    function handleStationClick(event) {
        const result = event.target.closest('.station-result');
        if (result) {
            const stationName = result.dataset.stationName;
            selectedNaPTANId = result.dataset.naptanId;
            const lines = JSON.parse(result.dataset.stationLines);
            searchResults.style.display = 'none';
            selectedStation.innerHTML = `<h4>${stationName} - Live Departures</h4>`;
            selectedStation.style.display = 'block';

            const colorRectangles = lines.map(line => `<span class="line-color" style="background-color: ${lineColors[line] || '#000000'};"></span>`).join(' ');
            selectedLines.innerHTML = colorRectangles;
            selectedLines.style.display = 'block';

            fetchLiveArrivals(selectedNaPTANId, lines);

            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => fetchLiveArrivals(selectedNaPTANId, lines), 20000);
        }
    }

    // Handle platform box click event
    function handlePlatformClick(event) {
        const platformDetails = event.target.closest('.arrival-details');
        if (platformDetails) {
            const platformName = platformDetails.dataset.platform;
            const lineName = platformDetails.dataset.line;
            const lineColor = lineColors[lineName] || '#000000';
            popupTitle.textContent = `${platformName} - ${lineName}`;
            popup.style.borderColor = lineColor;
            fetchPopupArrivals(selectedNaPTANId, lineName, platformName);
            popup.style.display = 'block';
            overlay.style.display = 'block';

            // Set up refresh interval for popup arrivals
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => fetchPopupArrivals(selectedNaPTANId, lineName, platformName), 20000);
        }
    }

    // Close the popup
    function closePopup() {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        // Clear the refresh interval when closing the popup
        if (refreshInterval) clearInterval(refreshInterval);
    }

    popupClose.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim();
        if (query) {
            filterStations(query);
            searchResults.style.display = 'block';
            selectedStation.style.display = 'none';
            selectedLines.style.display = 'none';
            arrivalsContainer.innerHTML = '';
            if (refreshInterval) clearInterval(refreshInterval);
        } else {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            selectedStation.style.display = 'none';
            selectedLines.style.display = 'none';
            arrivalsContainer.innerHTML = '';
            if (refreshInterval) clearInterval(refreshInterval);
        }
    });

    searchResults.addEventListener('click', handleStationClick);
    arrivalsContainer.addEventListener('click', handlePlatformClick);

    fetchStations();
});
