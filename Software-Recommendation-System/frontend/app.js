const AVAILABLE_SOFTWARE = [
    'Photoshop',
    'Visual Studio Code',
    'Zoom',
    'Microsoft Word',
    'Slack',
    'Adobe Illustrator',
    'IntelliJ IDEA',
    'Microsoft Teams',
    'Final Cut Pro',
    'AutoCAD',
    'Figma',
    'Chrome',
    'Excel',
    'Unity',
    'Premiere Pro',
    'GitHub Desktop',
    'Notion',
    'Blender',
    'Docker Desktop',
    'Spotify',
    'PowerPoint',
    'Discord',
    'Adobe XD',
    'OBS Studio',
    'PostgreSQL'
];

let similarityChart = null;

async function getRecommendations() {
    const searchInput = document.getElementById('search-input').value;
    const recommendationsDiv = document.getElementById('recommendations');
    
    // Show loading state
    recommendationsDiv.innerHTML = `
        <div class="loading">
            Fetching recommendations...
        </div>
    `;
    
    try {
        const response = await fetch('http://localhost:5000/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                software: searchInput,
                num: 5
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            recommendationsDiv.innerHTML = `
                <div class="error">
                    <div class="font-medium">Oops!</div>
                    <div class="text-sm">${data.error}</div>
                </div>
            `;
            destroyChart();
            return;
        }
        
        if (!data.recommendations || !Array.isArray(data.recommendations)) {
            recommendationsDiv.innerHTML = `
                <div class="error">
                    <div class="font-medium">No Results</div>
                    <div class="text-sm">No recommendations found</div>
                </div>
            `;
            destroyChart();
            return;
        }
        
        // Display recommendations
        recommendationsDiv.innerHTML = `
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Recommended Software</h2>
            <ul>
                ${data.recommendations.map(rec => `
                    <li>
                        <div class="flex items-center justify-between">
                            <div>
                                <strong>${rec.name}</strong>
                                <div class="mt-1">
                                    <span class="category">${rec.category}</span>
                                </div>
                            </div>
                            <span class="similarity">${(rec.similarity * 100).toFixed(1)}% match</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

        updateSimilarityChart(data.recommendations);

    } catch (error) {
        recommendationsDiv.innerHTML = `
            <div class="error">
                <div class="font-medium">Error</div>
                <div class="text-sm">
                    Failed to fetch recommendations. Please try again later.
                    <br>
                    <span class="text-xs opacity-75">${error.message}</span>
                </div>
            </div>
        `;
        destroyChart();
        console.error('Error:', error);
    }
}

function updateSimilarityChart(recommendations) {
    destroyChart();

    const labels = recommendations.map(rec => rec.name);
    const similarities = recommendations.map(rec => (rec.similarity * 100).toFixed(1));
    const categories = recommendations.map(rec => rec.category);

    const colorMap = {
        'Development': 'rgba(99,102,241,0.8)',    // Indigo
        'Graphics': 'rgba(236,72,153,0.8)',       // Pink
        'Communication': 'rgba(16,185,129,0.8)',  // Emerald
        'Productivity': 'rgba(245,158,11,0.8)',   // Amber
        'Media': 'rgba(139,92,246,0.8)',         // Purple
        'Design': 'rgba(14,165,233,0.8)',        // Sky
        'Engineering': 'rgba(234,88,12,0.8)',    // Orange
        'Internet': 'rgba(59,130,246,0.8)'       // Blue
    };

    const colors = categories.map(category => colorMap[category] || 'rgba(107, 114, 128, 0.8)');

    const ctx = document.getElementById('similarityChart').getContext('2d');
    similarityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Similarity Score (%)',
                data: similarities,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const rec = recommendations[context.dataIndex];
                            return [
                                `Similarity: ${context.parsed.y}%`,
                                `Category: ${rec.category}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

function destroyChart() {
    if (similarityChart) {
        similarityChart.destroy();
        similarityChart = null;
    }
}

function showAvailableSoftware() {
    const searchInput = document.getElementById('search-input');
    const availableList = document.getElementById('available-software');
    
    const userInput = searchInput.value.toLowerCase();
    const filteredSoftware = AVAILABLE_SOFTWARE.filter(software => 
        software.toLowerCase().includes(userInput)
    );
    
    if (filteredSoftware.length === 0 && userInput) {
        availableList.innerHTML = `
            <div class="py-3 px-4 text-sm text-gray-500">
                No matching software found
            </div>
        `;
        return;
    }
    
    availableList.innerHTML = `
        <div class="hint">Available Software</div>
        <ul class="software-list">
            ${filteredSoftware.map(software => `
                <li onclick="selectSoftware('${software.split('(')[0].trim()}')">${software}</li>
            `).join('')}
        </ul>
    `;
}

function selectSoftware(software) {
    document.getElementById('search-input').value = software;
    document.getElementById('available-software').innerHTML = '';
    getRecommendations();
}

document.getElementById('search-input').addEventListener('keyup', showAvailableSoftware);
document.getElementById('search-input').addEventListener('focus', showAvailableSoftware);
document.addEventListener('click', function(e) {
    if (!e.target.closest('#search-container')) {
        document.getElementById('available-software').innerHTML = '';
    }
});

document.getElementById('search-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        getRecommendations();
    }
}); 