document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('station-search');
    const searchResults = document.getElementById('search-results');
    const selectedStation = document.getElementById('selectedStation'); // Use the div for selected station name
    const selectedLines = document.getElementById('selectedLines'); // Use the div for line colors
    let allStations = [];
    let selectedNaPTANId = null; // Variable to store the selected NaPTAN ID

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
                const colors = station.Lines.map(line => lineColors[line] || '#000000'); // Default color if line not found
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

    // Handle station click event
    function handleStationClick(event) {
        const result = event.target.closest('.station-result');
        if (result) {
            const stationName = result.dataset.stationName;
            selectedNaPTANId = result.dataset.naptanId; // Store the NaPTAN ID
            const lines = JSON.parse(result.dataset.stationLines); // Get lines associated with the station
            searchResults.style.display = 'none'; // Hide the search results
            selectedStation.innerHTML = `<h2>${stationName} - Live Departures</h2>`; // Display the station name
            selectedStation.style.display = 'block'; // Show the selected station title

            // Display the line colors
            const colorRectangles = lines.map(line => `<span class="line-color" style="background-color: ${lineColors[line] || '#000000'};"></span>`).join(' ');
            selectedLines.innerHTML = colorRectangles;
            selectedLines.style.display = 'block'; // Show the line colors

            console.log(`Selected NaPTAN ID: ${selectedNaPTANId}`); // Log the selected NaPTAN ID (optional)
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
        } else {
            searchResults.innerHTML = ''; // Clear results if query is empty
            searchResults.style.display = 'none'; // Hide search results if no query
            selectedStation.style.display = 'none'; // Hide the selected station title
            selectedLines.style.display = 'none'; // Hide the line colors
        }
    });

    searchResults.addEventListener('click', handleStationClick);

    // Initialize the station list
    fetchStations();
});
