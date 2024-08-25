document.addEventListener('DOMContentLoaded', function () {
    const searchInputOne = document.getElementById('station-search-1');
    const searchInputTwo = document.getElementById('station-search-2');
    const searchInputVia = document.getElementById('station-search-via');
    const searchResults = document.getElementById('search-results');
    const selectedStation = document.getElementById('selectedStation');
    const selectedLines = document.getElementById('selectedLines');
    const switchButton = document.getElementById('switch-stations');
    const searchButton = document.getElementById('search-button'); // New search button
    const journeyPreferencesButton = document.getElementById('journey-preferences-button');
    const journeyPreferences = document.getElementById('journey-preferences');
    const datePicker = document.getElementById('date-picker');
    const timePicker = document.getElementById('time-picker');
    const timeIsSelect = document.getElementById('time-is');
    const journeyPreferenceSelect = document.getElementById('journey-preference');
    
    let allStations = [];
    let activeInput = null; // To track which input is being edited
    let stationFrom = ""; // To store the selected "FROM" station name
    let stationTo = ""; // To store the selected "TO" station name
    let stationVia = ""; // To store the selected "VIA" station name
    let naptanFrom = ""; // To store the selected "FROM" station NaPTAN ID
    let naptanTo = ""; // To store the selected "TO" station NaPTAN ID
    let naptanVia = ""; // To store the selected "VIA" station NaPTAN ID

    // Preferences data
    let date = ""; // To store the selected date
    let time = ""; // To store the selected time
    let timeIs = "departing"; // Default value for "Time is"
    let journeyPreference = "leastinterchange"; // Default value for "Journey Preference"

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
                    <div class="station-result" data-station-name="${station['Station Name']}" data-station-lines='${JSON.stringify(station.Lines)}' data-naptan-id="${station['NaPTAN ID']}">
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
            const naptanId = result.dataset.naptanId;
            searchResults.style.display = 'none';

            if (activeInput === searchInputOne) {
                stationFrom = stationName;
                naptanFrom = naptanId; // Store the NaPTAN ID for the "FROM" station
                searchInputOne.value = stationName; // Set the FROM input field
            } else if (activeInput === searchInputTwo) {
                stationTo = stationName;
                naptanTo = naptanId; // Store the NaPTAN ID for the "TO" station
                searchInputTwo.value = stationName; // Set the TO input field
            } else if (activeInput === searchInputVia) {
                stationVia = stationName;
                naptanVia = naptanId; // Store the NaPTAN ID for the "VIA" station
                searchInputVia.value = stationName; // Set the VIA input field
            }

            // Do not update the journey title here
        }
    }

    // Update the journey title based on selected stations
    function updateJourneyTitle() {
        if (stationFrom && stationTo) {
            selectedStation.innerHTML = `<h5>${stationFrom} &rarr; ${stationTo}</h5>`;
            selectedStation.style.display = 'block'; 
        }
    }

    // Switch stations
    function switchStations() {
        // Swap the station names and NaPTAN IDs
        [stationFrom, stationTo] = [stationTo, stationFrom];
        [naptanFrom, naptanTo] = [naptanTo, naptanFrom];
        
        // Update the input fields
        searchInputOne.value = stationFrom;
        searchInputTwo.value = stationTo;
        // Do not update the journey title here
    }

    // Toggle the visibility of the journey preferences section
    function toggleJourneyPreferences() {
        if (journeyPreferences.classList.contains('hidden')) {
            journeyPreferences.classList.remove('hidden');
        } else {
            journeyPreferences.classList.add('hidden');
        }
    }

    // Collect and store journey preferences
    function collectJourneyPreferences() {
        date = datePicker.value;
        time = timePicker.value;
        timeIs = timeIsSelect.value;
        journeyPreference = journeyPreferenceSelect.value;

        // Log preferences for debugging purposes
        console.log("Journey Preferences:");
        console.log("Date:", date);
        console.log("Time:", time);
        console.log("Time Is:", timeIs);
        console.log("Journey Preference:", journeyPreference);
    }

    // Add event listeners to all input fields
    [searchInputOne, searchInputTwo, searchInputVia].forEach(input => {
        input.addEventListener('input', function () {
            const query = input.value.trim();
            if (query) {
                filterStations(query);
                searchResults.style.display = 'block';
                selectedStation.style.display = 'none';
                selectedLines.style.display = 'none';
                activeInput = input; // Set the active input field
            } else {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                selectedStation.style.display = 'none';
                selectedLines.style.display = 'none';
                activeInput = null; // Clear the active input if no query
            }
        });
    });

    // Handle search button click
    searchButton.addEventListener('click', function() {
        updateJourneyTitle(); // Update the title when the search button is clicked
    });

    // Handle switch button click
    switchButton.addEventListener('click', switchStations); // Update the input fields only

    // Handle journey preferences button click
    journeyPreferencesButton.addEventListener('click', toggleJourneyPreferences); // Toggle preferences section visibility

    // Collect journey preferences when they change
    datePicker.addEventListener('change', collectJourneyPreferences);
    timePicker.addEventListener('change', collectJourneyPreferences);
    timeIsSelect.addEventListener('change', collectJourneyPreferences);
    journeyPreferenceSelect.addEventListener('change', collectJourneyPreferences);

    // Handle search result click
    searchResults.addEventListener('click', handleStationClick);

    // Initial fetch
    fetchStations();
});
