const fetchBtn = document.getElementById('fetchBtn');
const duckImage = document.getElementById('duckImage');
const loadingText = document.getElementById('loading');

// Function to fetch a random duck image
async function fetchRandomDuck() {
    try {
        // Disable button and show loading
        fetchBtn.disabled = true;
        loadingText.style.display = 'block';
        duckImage.style.display = 'none';

        // Fetch from the API
        const response = await fetch('https://random-d.uk/api/v2/random');
        const data = await response.json();

        // Update the image source
        duckImage.src = data.url;
        duckImage.style.display = 'block';
        loadingText.style.display = 'none';
    } catch (error) {
        console.error('Error fetching duck image:', error);
        loadingText.textContent = 'Failed to load image. Please try again.';
        loadingText.style.display = 'block';
        loadingText.style.color = '#e74c3c';
    } finally {
        // Re-enable button
        fetchBtn.disabled = false;
    }
}

// Add click event listener to button
fetchBtn.addEventListener('click', fetchRandomDuck);

// Optional: Fetch a duck image on page load
fetchRandomDuck();
