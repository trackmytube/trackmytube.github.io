async function fetchTflNews() {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Ftopics%2Fc26xnwx3m34t%2Frss.xml&api_key=k1ofkweiudezz4nnm4wcbgjyv0xktqjs9inbzpk6&order_by=pubDate&order_dir=desc&count=100';

    try {
        // Fetch the RSS feed data in JSON format
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Parse the RSS feed items from JSON
        const items = data.items;
        const seenTitles = new Set(); // To keep track of unique titles
        let newsItems = [];

        items.forEach(item => {
            const title = item.title;
            const link = item.link;
            const description = item.description; // Using description
            const pubDate = item.pubDate ? new Date(item.pubDate) : null;
            const source = "BBC News"; // Hardcoded as the source

            // Fetch the thumbnail image if it exists
            let imageUrl = item.thumbnail;

            // Adjust the image URL to a higher resolution
            if (imageUrl) {
                // Replace the width value in the URL with '600'
                imageUrl = imageUrl.replace(/\/(\d+)\//, '/600/');
            }

            // Check for duplicate titles
            if (!seenTitles.has(title)) {
                seenTitles.add(title);
                // Add the news item to the array
                newsItems.push({ title, link, description, pubDate, source, imageUrl });
            }
        });

        // Sort the news items by publication date (latest first)
        newsItems.sort((a, b) => b.pubDate - a.pubDate);

        // Generate HTML for news items
        let newsHtml = '';
        for (const item of newsItems) {
            const formattedDate = item.pubDate ? formatDate(item.pubDate) : 'Unknown date';
            const logoUrl = item.imageUrl; // Use the image URL from JSON

            // Create the HTML for each news item
            newsHtml += `
            <div class="news-item">
            <div class="news-item-header">
            ${logoUrl ? `<img src="${logoUrl}" alt="News image" class="news-image"/>` : ''}
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            </div>
            <p>${formattedDate} - <strong>${item.source}</strong></p>
            <p>${item.description}</p>
            </div>
            `;
        }

        // Display the news items in the container
        document.getElementById('news-container').innerHTML = newsHtml;

    } catch (error) {
        console.error('Error fetching news:', error);
        document.getElementById('news-container').innerHTML = '<p>Unable to fetch news at this time. Please try again later.</p>';
    }
}

// Function to format date into relative time or full date
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

    // Format the date as "18 Aug"
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-GB', options);
}

// Run the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchTflNews);
