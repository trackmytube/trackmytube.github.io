document.addEventListener('DOMContentLoaded', function () {
    const searchInputOne = document.getElementById('station-search-1');
    const searchInputTwo = document.getElementById('station-search-2');
    const searchInputVia = document.getElementById('station-search-via');
    const searchResults = document.getElementById('search-results');
    const selectedStation = document.getElementById('selectedStation');
    const selectedLines = document.getElementById('selectedLines');
    const switchButton = document.getElementById('switch-stations');
    const searchButton = document.getElementById('search-button');
    const journeyPreferencesButton = document.getElementById('journey-preferences-button');
    const journeyPreferences = document.getElementById('journey-preferences');
    const datePicker = document.getElementById('date-picker');
    const timePicker = document.getElementById('time-picker');
    const timeIsSelect = document.getElementById('time-is');
    const journeyPreferenceSelect = document.getElementById('journey-preference');
    const journeyResults = document.getElementById('journey-results'); // Keep this

    let allStations = [];
    let activeInput = null;
    let stationFrom = "";
    let stationTo = "";
    let stationVia = "";
    let naptanFrom = ""; // To store the selected "FROM" station NaPTAN ID
    let naptanTo = ""; // To store the selected "TO" station NaPTAN ID
    let naptanVia = "";

    // Preferences data
    let date = "";
    let time = "";
    let timeIs = "departing";
    let journeyPreference = "leastinterchange";

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
                naptanFrom = naptanId;
                searchInputOne.value = stationName;
            } else if (activeInput === searchInputTwo) {
                stationTo = stationName;
                naptanTo = naptanId;
                searchInputTwo.value = stationName;
            } else if (activeInput === searchInputVia) {
                stationVia = stationName;
                naptanVia = naptanId;
                searchInputVia.value = stationName;
            }
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
        [stationFrom, stationTo] = [stationTo, stationFrom];
        [naptanFrom, naptanTo] = [naptanTo, naptanFrom];
        searchInputOne.value = stationFrom;
        searchInputTwo.value = stationTo;
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

        console.log("Journey Preferences:");
        console.log("Date:", date);
        console.log("Time:", time);
        console.log("Time Is:", timeIs);
        console.log("Journey Preference:", journeyPreference);
    }

    // Fetch and display journey results
    async function fetchJourneyResults() {
        if (!naptanFrom || !naptanTo) {
            alert('Please enter both FROM and TO NaPTAN IDs.');
            return;
        }

        try {
            const response = await fetch(`https://api.tfl.gov.uk/Journey/JourneyResults/${naptanFrom}/to/${naptanTo}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            console.log('API Response Data:', data);
            displayJourneyResults(data);
        } catch (error) {
            console.error('Error fetching journey results:', error);
            journeyResults.innerHTML = 'Error fetching journey details. Please try again.';
        }
    }

    function formatTime(time) {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function displayJourneyResults(data) {
        if (data && data.journeys && Array.isArray(data.journeys) && data.journeys.length > 0) {
            journeyResults.innerHTML = data.journeys.map(journey => {
                const legsHtml = journey.legs && Array.isArray(journey.legs) ? journey.legs.map((leg, index) => {
                    const trainName = leg.routeOptions && leg.routeOptions[0] ? leg.routeOptions[0].name : 'Unknown Train';
                    const departureStopName = leg.departurePoint ? leg.departurePoint.commonName : 'Unknown Departure Stop';
                    const arrivalStopName = leg.arrivalPoint ? leg.arrivalPoint.commonName : 'Unknown Arrival Stop';
                    const departureTime = leg.departureTime ? formatTime(leg.departureTime) : 'Unknown Time';
                    const arrivalTime = leg.arrivalTime ? formatTime(leg.arrivalTime) : 'Unknown Time';
                    const duration = leg.duration || 'Unknown Duration';
                    const stopPointsHtml = leg.path && leg.path.stopPoints && Array.isArray(leg.path.stopPoints) 
                        ? leg.path.stopPoints.map(stop => `
                            <li>${stop.name}</li>
                        `).join('') 
                        : '';

                    return `
                        <p><strong>${trainName}</strong></p>
                        <div class="journey-leg">
                            <div class="journey-leg-content">
                                <p class="journey-leg-station"><strong>${departureTime} - ${departureStopName}</strong></p>
                                <p><strong>${duration} min</strong> <button class="view-stops-button">View Stops</button></p>
                                <ul class="stop-points" style="display: none;">
                                    ${stopPointsHtml}
                                </ul>
                                <p class="journey-leg-station"><strong>${arrivalTime} - ${arrivalStopName}</strong></p>
                                
                            </div>
                        </div>
                    `;
                }).join('') : 'No legs data available';

                return `
                    <div class="journey-item">
                        <h3>Duration: ${journey.duration ? `${journey.duration} min` : 'Unknown Duration'}, ${journey.startDateTime ? formatTime(journey.startDateTime) : 'Unknown Time'} - ${journey.arrivalDateTime ? formatTime(journey.arrivalDateTime) : 'Unknown Time'}</h3>
                        ${legsHtml}
                    </div>
                `;
            }).join('');

            // Attach event listeners to "View Stops" buttons
            document.querySelectorAll('.view-stops-button').forEach(button => {
                button.addEventListener('click', () => {
                    const stopPointsList = button.closest('.journey-leg-content').querySelector('.stop-points');
                    stopPointsList.style.display = stopPointsList.style.display === 'none' ? 'block' : 'none';
                });
            });
        } else {
            journeyResults.innerHTML = 'No journey details found.';
        }
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
                activeInput = input;
            } else {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                selectedStation.style.display = 'none';
                selectedLines.style.display = 'none';
                activeInput = null;
            }
        });
    });

    // Handle search button click
    searchButton.addEventListener('click', function() {
        updateJourneyTitle();
        fetchJourneyResults(); // Fetch journey results when the search button is clicked
    });

    // Handle switch button click
    switchButton.addEventListener('click', switchStations);

    // Handle journey preferences button click
    journeyPreferencesButton.addEventListener('click', toggleJourneyPreferences);

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
