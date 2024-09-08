async function updateStatusTicker() {
    try {
        const fetchingMessageElement = document.getElementById('fetching-message');
        fetchingMessageElement.style.display = 'block';

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

        const tickerContent = [
            generateTickerContent(tubeData, 'tube'),
            generateTickerContent(tramData, 'tram'),
            generateTickerContent(overgroundData, 'overground'),
            generateTickerContent(dlrData, 'dlr'),
            generateTickerContent(elizabethLineData, 'elizabeth-line')
        ].join('');

        document.getElementById('ticker-content1').innerHTML = tickerContent;
        document.getElementById('ticker-content2').innerHTML = tickerContent;

        fetchingMessageElement.style.display = 'none';

        const updateTimeElement = document.getElementById('update-time');
        if (updateTimeElement) {
            const now = new Date();
            updateTimeElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }

    } catch (error) {
        console.error('Error fetching status data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateStatusTicker();
    const updateInterval = 60000;
    setInterval(updateStatusTicker, updateInterval);
});


// Function to fetch and display TfL news
async function fetchTflNews() {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Ftopics%2Fc26xnwx3m34t%2Frss.xml&api_key=k1ofkweiudezz4nnm4wcbgjyv0xktqjs9inbzpk6&order_by=pubDate&order_dir=desc&count=100';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const items = data.items;
        const seenTitles = new Set();
        let newsItems = [];

        items.forEach(item => {
            const title = item.title;
            const link = item.link;
            const description = item.description;
            const pubDate = item.pubDate ? new Date(item.pubDate) : null;
            const source = "London";
            let imageUrl = item.thumbnail;

            if (imageUrl) {
                imageUrl = imageUrl.replace(/\/(\d+)\//, '/600/');
            }

            if (!seenTitles.has(title)) {
                seenTitles.add(title);
                newsItems.push({ title, link, description, pubDate, source, imageUrl });
            }
        });

        newsItems.sort((a, b) => b.pubDate - a.pubDate);

        let newsHtml = '';
        for (const item of newsItems) {
            const formattedDate = item.pubDate ? formatDate(item.pubDate) : 'Unknown date';
            const logoUrl = item.imageUrl;

            newsHtml += `
                <div class="news-item">
                    <img src="${logoUrl}" alt="News image">
                    <h2><a href="${item.link}" target="_blank">${item.title}</a></h2>
                    <p><strong>${formattedDate} - ${item.source}</strong></p>
                    <p>${item.description}</p>
                </div>
            `;
        }

        document.querySelector('.news-section').innerHTML = newsHtml;

    } catch (error) {
        console.error('Error fetching news:', error);
        document.querySelector('.news-section').innerHTML = '<p>Unable to fetch news at this time. Please try again later.</p>';
    }
}

// Function to format dates
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';

    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-GB', options);
}

// Initialising the script
document.addEventListener('DOMContentLoaded', fetchTflNews);
