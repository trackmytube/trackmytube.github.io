document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('station-search');
    const searchResults = document.getElementById('search-results');
    const selectedStation = document.getElementById('selectedStation');
    const selectedLines = document.getElementById('selectedLines');
    const arrivalsContainer = document.getElementById('arrivalsContainer');
    let allStations = [];
    let selectedNaPTANId = null;
    let refreshInterval = null;

    // Define line colors (add more lines and colors as needed)
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
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allStations = await response.json();
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    }

    // Filter and display results based on user input
    function filterStations(query) {
        const results = allStations.filter(station => 
            station['Station Name'].toLowerCase().replace(/['’]/g, '').includes(query.toLowerCase().replace(/['’]/g, ''))
        ).slice(0, 3); // Limit to 3 results

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
                    // Filter arrivals by line
                    const arrivalsForLine = data.filter(arrival => arrival.lineName === line);
                    // Group by platform and get the earliest arrival for each platform
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
                            destinationName: earliestArrival.towards,  // Use 'towards' instead of 'destinationName'
                            timeToArrival: Math.floor(earliestArrival.timeToStation / 60)
                        };
                    });
                    return {
                        line,
                        arrivals: earliestArrivals
                    };
                })
        );
        
        // Wait for all promises to resolve
        const results = await Promise.all(arrivalsPromises);
        displayArrivals(results);
    }

    // Display arrivals
    function displayArrivals(arrivalData) {
        arrivalsContainer.innerHTML = '';
        arrivalData.forEach(data => {
            if (data.arrivals.length > 0) {
                const lineColor = lineColors[data.line] || '#000000'; // Default color if line not found
                const lineArrivals = data.arrivals.map(arrival => `
                    <div class="arrival">
                        <div class="arrival-details">
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

    // Handle station click event
    function handleStationClick(event) {
        const result = event.target.closest('.station-result');
        if (result) {
            const stationName = result.dataset.stationName;
            selectedNaPTANId = result.dataset.naptanId; // Store the NaPTAN ID
            const lines = JSON.parse(result.dataset.stationLines); // Get lines associated with the station
            searchResults.style.display = 'none'; // Hide the search results
            selectedStation.innerHTML = `<h4>${stationName} - Live Departures</h4>`; // Display the station name
            selectedStation.style.display = 'block'; // Show the selected station title

            // Display the line colors
            const colorRectangles = lines.map(line => `<span class="line-color" style="background-color: ${lineColors[line] || '#000000'};"></span>`).join(' ');
            selectedLines.innerHTML = colorRectangles;
            selectedLines.style.display = 'block'; // Show the line colors

            // Fetch and display live arrivals for only the lines served by the station
            fetchLiveArrivals(selectedNaPTANId, lines);

            // Set up auto-refresh every 20 seconds
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => fetchLiveArrivals(selectedNaPTANId, lines), 20000);
        }
    }

    // Event listeners
    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim();
        if (query) {
            filterStations(query);
            searchResults.style.display = 'block'; // Show search results
            selectedStation.style.display = 'none'; // Hide the selected station title
            selectedLines.style.display = 'none'; // Hide the line colors
            arrivalsContainer.innerHTML = ''; // Clear arrivals container
            if (refreshInterval) clearInterval(refreshInterval);
        } else {
            searchResults.innerHTML = ''; // Clear results if query is empty
            searchResults.style.display = 'none'; // Hide search results if no query
            selectedStation.style.display = 'none'; // Hide the selected station title
            selectedLines.style.display = 'none'; // Hide the line colors
            arrivalsContainer.innerHTML = ''; // Clear arrivals container
            if (refreshInterval) clearInterval(refreshInterval);
        }
    });

    searchResults.addEventListener('click', handleStationClick);

    // Initialize the station list
    fetchStations();
});
