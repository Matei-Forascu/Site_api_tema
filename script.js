const fetchBtn = document.getElementById('fetchBtn');
const duckImage = document.getElementById('duckImage');

fetchBtn.addEventListener('click', async () => {
    try {
        fetchBtn.disabled = true;
        fetchBtn.textContent = 'LOADING...';
        
        const response = await fetch('https://random-d.uk/api/v2/random');
        const data = await response.json();
        
        duckImage.src = data.url;
        
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'PRESS FOR A SURPRISEE!!1!';
    } catch (error) {
        console.error('Error fetching duck:', error);
        duckImage.alt = 'Failed to load duck picture';
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'PRESS FOR A SURPRISEE!!1!';
    }
});
