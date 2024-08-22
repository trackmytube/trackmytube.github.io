document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('naptan-form');
    const naptanCodeInput = document.getElementById('naptan-code');
    const arrivalDataDiv = document.getElementById('arrival-data');
    let refreshInterval;

    // Object to keep track of the expanded/collapsed state of each line
    const expandedStates = {};

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const naptanCode = naptanCodeInput.value.trim();

        if (naptanCode) {
            clearInterval(refreshInterval); // Clear any existing interval
            await fetchAndDisplayArrivals(naptanCode);

            // Set up the interval to refresh data every 20 seconds
            refreshInterval = setInterval(() => {
                fetchAndDisplayArrivals(naptanCode);
            }, 20000); // 20 seconds
        }
    });

    async function fetchAndDisplayArrivals(naptanCode) {
        try {
            const response = await fetch(`https://api.tfl.gov.uk/StopPoint/${naptanCode}/Arrivals`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            displayArrivals(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            arrivalDataDiv.innerHTML = '<p>Error fetching data. Please try again.</p>';
        }
    }

    function displayArrivals(arrivals) {
        if (arrivals.length === 0) {
            arrivalDataDiv.innerHTML = '<p>No arrivals found.</p>';
            return;
        }

        // Organize arrivals by line and then by platform
        const lineData = arrivals.reduce((acc, arrival) => {
            if (!acc[arrival.lineName]) {
                acc[arrival.lineName] = {};
            }
            if (!acc[arrival.lineName][arrival.platformName]) {
                acc[arrival.lineName][arrival.platformName] = [];
            }
            acc[arrival.lineName][arrival.platformName].push(arrival);
            return acc;
        }, {});

        let html = '';

        for (const lineName in lineData) {
            const platforms = lineData[lineName];
            const collapsedContentId = `collapsed-${lineName.replace(/\s+/g, '-')}`;
            const lineClass = lineName.toLowerCase().replace(/[^a-z]+/g, '-');

            const isActive = expandedStates[collapsedContentId] ? 'active' : '';

            html += `
                <div class="line-box ${lineClass}">
                    <h2 class="line-name" data-collapsed-content-id="${collapsedContentId}">${lineName}</h2>
                    <div class="minimized-info">
                        ${Object.keys(platforms).map(platformName => {
                            const firstArrival = platforms[platformName].sort((a, b) => a.timeToStation - b.timeToStation)[0];
                            const minutesLeft = Math.ceil(firstArrival.timeToStation / 60);
                            const minutesText = minutesLeft < 1 ? 'Due' : `${minutesLeft} min`;

                            return `
                                <div class="platform-summary">
                                    <p><strong>${platformName}</strong></p>
                                    <p>To: ${firstArrival.destinationName}</p>
                                    <p>${minutesText}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div id="${collapsedContentId}" class="collapsed-content ${isActive}">
                        <div class="platforms-container">
                            ${Object.keys(platforms).map(platformName => {
                                const arrivals = platforms[platformName].sort((a, b) => a.timeToStation - b.timeToStation);
                                return `
                                    <div class="platform-column">
                                        <h3>${platformName}</h3>
                                        ${arrivals.map(arrival => {
                                            const minutesLeft = Math.ceil(arrival.timeToStation / 60);
                                            const minutesText = minutesLeft < 1 ? 'Due' : `${minutesLeft} min`;
                                            return `
                                                <div class="arrival-item">
                                                    <div class="left-info">
                                                        <p class="destination"><strong>${arrival.destinationName}</strong></p>
                                                        <p class="location">${arrival.currentLocation}</p>
                                                    </div>
                                                    <div class="right-info">
                                                        <p class="minutes-left"><strong>${minutesText}</strong></p>
                                                        <p class="expected-time">${new Date(arrival.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        arrivalDataDiv.innerHTML = html;

        // Add event listeners for collapsible functionality
        document.querySelectorAll('.line-name').forEach(lineName => {
            lineName.addEventListener('click', function () {
                const contentId = this.dataset.collapsedContentId;
                const content = document.getElementById(contentId);
                content.classList.toggle('active');
                // Update the expanded state
                expandedStates[contentId] = content.classList.contains('active');
            });
        });
    }
});
