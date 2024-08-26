document.addEventListener('DOMContentLoaded', () => {
    const fetchJourneyButton = document.getElementById('fetch-journey');
    const journeyResults = document.getElementById('journey-results');

    async function fetchJourneyResults() {
        const naptanFrom = "910GRICHMND";
        const naptanTo = "910GFRNDXR";

        try {
            const response = await fetch(`https://api.tfl.gov.uk/Journey/JourneyResults/${naptanFrom}/to/${naptanTo}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            console.log('API Response Data:', data); // Log data for debugging
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
                        <h3>${journey.from ? journey.from.name : 'Unknown FROM'} &rarr; ${journey.to ? journey.to.name : 'Unknown TO'}: ${journey.duration ? `${journey.duration} min` : 'Unknown Duration'}, ${journey.startDateTime ? formatTime(journey.startDateTime) : 'Unknown Time'} - ${journey.arrivalDateTime ? formatTime(journey.arrivalDateTime) : 'Unknown Time'}</h3>
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

    fetchJourneyButton.addEventListener('click', fetchJourneyResults);
});
