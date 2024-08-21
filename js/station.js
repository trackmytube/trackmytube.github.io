document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('station-search');
    const searchResults = document.getElementById('search-results');
    let allStations = [];

    // Fetch all stations when the page loads
    async function fetchStations() {
        try {
            const response = await fetch('https://api.tfl.gov.uk/Place/Type/Station');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            allStations = data.places || [];
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    }

    // Filter and display results based on user input
    function filterStations(query) {
        const results = allStations.filter(station => 
            station.commonName.toLowerCase().includes(query.toLowerCase())
        );
        displayResults(results);
    }

    // Display search results
    function displayResults(stations) {
        if (stations.length > 0) {
            searchResults.innerHTML = stations.map(station => `
                <div class="station-result">
                    <h3>${station.commonName}</h3>
                    <p>Type: ${station.category}</p>
                    <p>ID: ${station.id}</p>
                </div>
            `).join('');
        } else {
            searchResults.innerHTML = 'No results found.';
        }
    }

    // Initialize the station list and set up event listener
    fetchStations().then(() => {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim();
            if (query) {
                filterStations(query);
            } else {
                searchResults.innerHTML = ''; // Clear results if query is empty
            }
        });
    });
});
