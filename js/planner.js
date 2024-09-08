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
    const journeyPreferences = document.querySelector('.journey-preferences-section');
    const datePicker = document.getElementById('date-picker');
    const timePicker = document.getElementById('time-picker');
    const timeIsSelect = document.getElementById('time-is');
    const journeyPreferenceSelect = document.getElementById('journey-preference');
    const journeyResults = document.getElementById('journey-results');
    const clearJourneyPreferencesButton = document.getElementById('clear-journey-preferences');

    let allStations = [];
    let activeInput = null;
    let stationFrom = "";
    let stationTo = "";
    let stationVia = "";
    let naptanFrom = [];
    let naptanTo = [];
    let naptanVia = [];

    let date = "";
    let time = "";
    let timeIs = "departing";
    let journeyPreference = "leastinterchange";

    const lineColors = {
        "Bakerloo": "#B36305",
        "Central": "#E32017",
        "Circle": "#FFD300",
        "District": "#00782A",
        "DLR": "#00A4A7",
        "Elizabeth line": "#60399E",
        "Hammersmith & City": "#F3A9BB",
        "Jubilee": "#A0A5A9",
        "London Overground": "#EE7C0E",
        "Metropolitan": "#9B0056",
        "Northern": "#000000",
        "Piccadilly": "#003688",
        "Tram": "#84B817",
        "Tramway Tram": "#84B817", 
        "Victoria": "#0098D4",
        "Waterloo & City": "#95CDBA",
        "Chiltern Railways" : "#109BD5",
        "c2c" : "#B71C8C",
        "East Midlands Railway" : "#4D2F49",
        "Gatwick Express" : "#DC081F",
        "Great Northern" : "#50107D",
        "Great Western Railway" : "#0A493E",
        "Greater Anglia" : "#6A717B",
        "Heathrow Express" : "#522D61",
        "London Northwestern Railway" : "#1CA967",
        "South Western Railway" : "#020202",
        "Southeastern" : "#1D2452",
        "Southern" : "#337537",
        "Thameslink" : "#E9418C",
    };

    async function fetchStations() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/jahir10ali/naptans-for-tfl-stations/main/data/tfl-station-naptan-data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            allStations = await response.json();
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    }

    function filterStations(query) {
        const results = allStations.filter(station =>
            station['Station Name'].toLowerCase().replace(/['’]/g, '').includes(query.toLowerCase().replace(/['’]/g, ''))
        ).slice(0, 6); 

        displayResults(results);
    }

    function displayResults(stations) {
        if (stations.length > 0) {
            searchResults.innerHTML = stations.map(station => {
                const colors = station.Lines.map(line => lineColors[line] || '#000000');
                const colorRectangles = colors.map(color => `<span class="line-color" style="background-color: ${color};"></span>`).join(' ');
                return `
                    <div class="station-result" data-station-name="${station['Station Name']}" data-station-lines='${JSON.stringify(station.Lines)}' data-naptan-id='${JSON.stringify(station['NaPTAN ID'])}'>
                        <h3>${station['Station Name']}</h3>
                        <div class="line-colors">${colorRectangles}</div>
                    </div>
                `;
            }).join('');
        } else {
            searchResults.innerHTML = 'No results found.';
        }
    }

    function handleStationClick(event) {
        const result = event.target.closest('.station-result');
        if (result) {
            const stationName = result.dataset.stationName;
            const naptanIds = JSON.parse(result.dataset.naptanId);
            searchResults.style.display = 'none';

            if (activeInput === searchInputOne) {
                stationFrom = stationName;
                naptanFrom = naptanIds;
                searchInputOne.value = stationName;
            } else if (activeInput === searchInputTwo) {
                stationTo = stationName;
                naptanTo = naptanIds;
                searchInputTwo.value = stationName;
            } else if (activeInput === searchInputVia) {
                stationVia = stationName;
                naptanVia = naptanIds;
                searchInputVia.value = stationName;
            }

            clearJourneyResults(); 
        }
    }

    function updateJourneyTitle() {
        if (stationFrom && stationTo) {
            selectedStation.innerHTML = `<h3>${stationFrom} &rarr; ${stationTo}</h3>`;
            selectedStation.style.display = 'block'; 
        }
    }

    function switchStations() {
        [stationFrom, stationTo] = [stationTo, stationFrom];
        [naptanFrom, naptanTo] = [naptanTo, naptanFrom];
        searchInputOne.value = stationFrom;
        searchInputTwo.value = stationTo;

        clearJourneyResults(); 
        hideJourneyTitleAndResults();
    }

    function toggleJourneyPreferences() {
        journeyPreferences.classList.toggle('visible');
    }

    function collectJourneyPreferences() {
        date = datePicker.value;
        time = timePicker.value;
        timeIs = timeIsSelect.value;
        journeyPreference = journeyPreferenceSelect.value;

        console.log("Journey Preferences:", { date, time, timeIs, journeyPreference });
    }

    function clearJourneyResults() {
        journeyResults.innerHTML = '';
    }

    function hideJourneyTitleAndResults() {
        selectedStation.style.display = 'none';
        journeyResults.innerHTML = '';
    }

    function buildJourneyUrls() {
        let urls = [];

        naptanFrom.forEach(fromId => {
            naptanTo.forEach(toId => {
                let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${fromId}/to/${toId}?&mode=tube,overground,elizabeth-line,tram,dlr,national-rail&useRealTimeLiveArrivals=true&nationalSearch=true&walkingSpeed=Average`;

                if (naptanVia.length > 0) {
                    naptanVia.forEach(viaId => {
                        urls.push(`${url}&via=${viaId}`);
                    });
                } else {
                    urls.push(url);
                }
            });
        });

        if (date) {
            const formattedDate = date.replace(/-/g, ''); 
            urls = urls.map(url => `${url}&date=${formattedDate}`);
        }
        if (time) {
            const formattedTime = time.replace(/:/g, ''); 
            urls = urls.map(url => `${url}&time=${formattedTime}`);
        }

        if (timeIs) {
            urls = urls.map(url => `${url}&timeIs=${timeIs}`);
        }

        if (journeyPreference) {
            urls = urls.map(url => `${url}&journeyPreference=${journeyPreference}`);
        }

        return urls;
    }

    async function fetchJourneyResults() {
        if (!naptanFrom.length || !naptanTo.length) {
            alert('Please enter both FROM and TO Stations.');
            return;
        }
    
        journeyResults.innerHTML = '<p>Fetching journey details...</p>';
    
        const urls = buildJourneyUrls();
        const fetchPromises = urls.map(url => fetch(url).then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    if (data.httpStatusCode === 404 && data.exceptionType === "EntityNotFoundException") {
                        throw new Error(data.message || 'No journey found for your inputs.');
                    } else {
                        throw new Error('Error fetching journey details. Please try again.');
                    }
                });
            }
            return response.json();
        }));
    
        try {
            const results = await Promise.all(fetchPromises);
            let journeys = results.flatMap(result => result.journeys || []);
    
            // Filtering out journeys where the first leg has an empty name in routeOptions
            journeys = journeys.filter(journey => {
                const firstLeg = journey.legs[0];
                const routeOptions = firstLeg.routeOptions || []; 
                return routeOptions.length > 0 && routeOptions[0].name.trim() !== "";
            });
    
            // Removing duplicate journeys based on startDateTime and arrivalDateTime
            const uniqueJourneys = [];
            const seenJourneys = new Set();
    
            journeys.forEach(journey => {
                const key = `${journey.startDateTime}|${journey.arrivalDateTime}`;
                if (!seenJourneys.has(key)) {
                    uniqueJourneys.push(journey);
                    seenJourneys.add(key);
                }
            });
    
            console.log(uniqueJourneys);
    
            if (uniqueJourneys.length === 0) {
                journeyResults.innerHTML = 'We are experiencing issues with the journey data. Please try again later.';
            } else {
                displayJourneyResults(uniqueJourneys);
            }
        } catch (error) {
            console.error('Error fetching journey details:', error);
            journeyResults.innerHTML = error.message;
        }
    }

    function formatTime(time) {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
        } else {
            return `${mins} min`;
        }
    }

    function displayJourneyResults(journeys) {
        if (journeys.length > 0) {
            journeyResults.innerHTML = journeys.map(journey => {
                const legsHtml = journey.legs && Array.isArray(journey.legs) ? journey.legs.map(leg => {
                    const trainName = leg.routeOptions?.[0]?.name || 'Interchange';
                    const departureStopName = leg.departurePoint?.commonName || 'Unknown Departure Stop';
                    const arrivalStopName = leg.arrivalPoint?.commonName || 'Unknown Arrival Stop';
                    const departureTime = leg.departureTime ? formatTime(leg.departureTime) : 'Unknown Time';
                    const arrivalTime = leg.arrivalTime ? formatTime(leg.arrivalTime) : 'Unknown Time';
                    const duration = leg.duration ? formatDuration(leg.duration) : 'Unknown Duration';
                    const stopPoints = leg.path?.stopPoints || [];
                    const stopPointsHtml = stopPoints.map(stop => `<li>${stop.name}</li>`).join('');
    
                    const lineColor = lineColors[trainName] || '#000'; 
    
                    if (trainName != "Interchange") {
                        return `
                            <h3><strong>${trainName}</strong> <span class="line-color-inline" style="background-color: ${lineColor};"></span></h3>
                            <div class="journey-leg" style="border-color: ${lineColor};">
                                <div class="journey-leg-content">
                                    <p class="journey-leg-station"><strong>${departureTime} - ${departureStopName}</strong></p>
                                    <p><strong>${duration}</strong> <button class="view-stops-button">View Stops (${stopPoints.length})</button></p>
                                    <ul class="stop-points" style="display: none;">
                                        ${stopPointsHtml}
                                    </ul>
                                    <p class="journey-leg-station"><strong>${arrivalTime} - ${arrivalStopName}</strong></p>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <h3><strong>${trainName}</strong></h3>
                            <div class="journey-leg" style="border-color: ${lineColor};">
                                <div class="journey-leg-content">
                                    <p class="journey-leg-station"><strong>${departureStopName}</strong></p>
                                    <p class="journey-leg-station"><strong>${arrivalStopName}</strong></p>
                                </div>
                            </div>
                        `;
                    }
                }).join('') : 'No legs data available';

                const journeyDuration = journey.duration ? formatDuration(journey.duration) : 'Unknown Duration';
                const journeyChanges = journey.legs.length - 1 === 0 ? 'Direct' : `${journey.legs.length - 1} change(s)`;
    
                return `
                    <div class="journey-item">
                        <h3>Duration: ${journeyDuration}, ${formatTime(journey.startDateTime)} - ${formatTime(journey.arrivalDateTime)}, ${journeyChanges}</h3>
                        ${legsHtml}
                    </div>
                `;
            }).join('');
    
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

            clearJourneyResults();
        });

        // Adding the clear button functionality
        const clearButton = input.nextElementSibling;
        clearButton.addEventListener('click', function () {
            input.value = ''; 
            input.dispatchEvent(new Event('input'));

            if (input === searchInputOne) {
                stationFrom = "";
                naptanFrom = [];
            } else if (input === searchInputTwo) {
                stationTo = "";
                naptanTo = [];
            } else if (input === searchInputVia) {
                stationVia = "";
                naptanVia = [];
            }
    
            clearJourneyResults();
        });
    });

    clearJourneyPreferencesButton.addEventListener('click', function() {
        searchInputVia.value = '';
        datePicker.value = '';
        timePicker.value = '';
        timeIsSelect.value = 'departing';
        journeyPreferenceSelect.value = 'leastinterchange';

        stationVia = "";
        naptanVia = [];
        date = '';
        time = '';
        timeIs = 'departing';
        journeyPreference = 'leastinterchange';

        clearJourneyResults();
        hideJourneyTitleAndResults();
    });

    searchButton.addEventListener('click', function() {
        updateJourneyTitle();
        fetchJourneyResults();
    });

    journeyPreferencesButton.addEventListener('click', function() {
        toggleJourneyPreferences();
    });

    switchButton.addEventListener('click', function() {
        switchStations();
        hideJourneyTitleAndResults(); 
    });

    datePicker.addEventListener('change', function() {
        collectJourneyPreferences();
        hideJourneyTitleAndResults(); 
    });

    timePicker.addEventListener('change', function() {
        collectJourneyPreferences();
        hideJourneyTitleAndResults(); 
    });

    timeIsSelect.addEventListener('change', function() {
        collectJourneyPreferences();
        hideJourneyTitleAndResults(); 
    });

    journeyPreferenceSelect.addEventListener('change', function() {
        collectJourneyPreferences();
        hideJourneyTitleAndResults(); 
    });

    searchResults.addEventListener('click', handleStationClick);

    fetchStations();
});
