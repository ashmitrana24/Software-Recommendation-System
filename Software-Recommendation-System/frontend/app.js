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
    const resultsSection = document.getElementById('results-section');
    
    if (!searchInput || searchInput.trim() === '') {
        // If no search input, don't show anything
        return;
    }
    
    // Show the results section that was initially hidden
    resultsSection.classList.remove('hidden');
    
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

// Modify event listeners to remove dropdown functionality
document.getElementById('search-input').addEventListener('keyup', function(e) {
    // Only trigger if Enter key is pressed
    if (e.key === 'Enter') {
        getRecommendations();
    }
});

document.getElementById('search-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        // Prevent form submission
        event.preventDefault();
        // Call getRecommendations on Enter
        getRecommendations();
    }
});

// Chatbot functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatbotTrigger = document.getElementById('chatbot-trigger');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Store conversation history
    let conversationHistory = [];

    // Toggle chatbot visibility
    chatbotTrigger.addEventListener('click', function() {
        chatbotContainer.classList.remove('hidden');
        scrollToBottom();
    });

    closeChatbot.addEventListener('click', function() {
        chatbotContainer.classList.add('hidden');
    });

    // Handle message submission
    chatbotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userMessage = chatbotInput.value.trim();
        if (userMessage === '') return;
        
        // Add user message to chat
        addMessage(userMessage, 'user');
        chatbotInput.value = '';
        
        // Add loading indicator
        const loadingId = showLoadingIndicator();
        
        // Call Gemini API
        fetchGeminiResponse(userMessage)
            .then(response => {
                // Remove loading indicator
                removeLoadingIndicator(loadingId);
                
                // Add bot response
                if (response.error) {
                    addMessage(`Sorry, I encountered an error: ${response.error}`, 'bot');
                } else if (response.response) {
                    addMessage(response.response, 'bot');
                    
                    // Store conversation history if available
                    if (response.history) {
                        conversationHistory = response.history;
                    }
                }
                scrollToBottom();
            })
            .catch(error => {
                // Remove loading indicator
                removeLoadingIndicator(loadingId);
                
                // Show error message
                addMessage("Sorry, I couldn't connect to my brain. Please try again later.", 'bot');
                console.error('Gemini API Error:', error);
                scrollToBottom();
            });
    });

    // Add a message to the chat
    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender + '-message');
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        if (sender === 'bot') {
            // Format bot messages with markdown-like styling
            contentElement.innerHTML = formatBotMessage(message);
        } else {
            // User messages remain as plain text
            contentElement.textContent = message;
        }
        
        messageElement.appendChild(contentElement);
        chatbotMessages.appendChild(messageElement);
        
        scrollToBottom();
    }

    // Function to format bot messages with better styling
    function formatBotMessage(message) {
        // Clean up any "text:" prefixes and unnecessary quotes
        message = message.replace(/^text:\s*/, '');
        message = message.replace(/^"(.+)"$/, '$1');
        
        // Replace line breaks with HTML breaks
        let formattedMessage = message.replace(/\n/g, '<br>');
        
        // Bold text between ** **
        formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text between * *
        formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code/monospace text between ` `
        formattedMessage = formattedMessage.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links in format [text](url)
        formattedMessage = formattedMessage.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Bullet points
        formattedMessage = formattedMessage.replace(/- (.*?)(?:<br>|$)/g, '<div class="list-item">• $1</div>');
        formattedMessage = formattedMessage.replace(/• (.*?)(?:<br>|$)/g, '<div class="list-item">• $1</div>');
        
        // Numbered lists (1. 2. 3. etc)
        formattedMessage = formattedMessage.replace(/(\d+)\. (.*?)(?:<br>|$)/g, '<div class="list-item"><span class="list-number">$1.</span> $2</div>');
        
        // Highlight important information
        formattedMessage = formattedMessage.replace(/\[!(.*?)\]/g, '<div class="highlight-info">$1</div>');
        
        // Add span around emojis for better styling (optional)
        formattedMessage = formattedMessage.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '<span class="emoji">$1</span>');
        
        return formattedMessage;
    }

    // Show loading indicator
    function showLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot-message', 'loading-message');
        loadingElement.innerHTML = `
            <div class="flex items-center message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatbotMessages.appendChild(loadingElement);
        scrollToBottom();
        
        return Date.now(); // Return a unique ID for this loading indicator
    }

    // Remove loading indicator
    function removeLoadingIndicator(id) {
        const loadingMessages = document.querySelectorAll('.loading-message');
        if (loadingMessages.length > 0) {
            loadingMessages[loadingMessages.length - 1].remove();
        }
    }

    // Function to fetch response from Gemini API
    async function fetchGeminiResponse(message) {
        try {
            // Create a clean request body
            const requestBody = {
                message: message
            };
            
            // Only add history if we have previous conversation
            if (conversationHistory && conversationHistory.length > 0) {
                requestBody.history = conversationHistory;
            }
            
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            // Check if the response has an error but also a fallback_response
            if (data.error && data.fallback_response) {
                console.error('Gemini API Error:', data.error);
                return { 
                    response: data.fallback_response,
                    error: data.error  // Include the error for debugging
                };
            }
            
            // Check if the response has an error
            if (data.error) {
                return { error: data.error };
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching from Gemini API:', error);
            return {
                error: 'Failed to connect to the server',
                response: fallbackResponse(message)  // Use the local fallback function
            };
        }
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Add fallback functionality in case API is not available
    function fallbackResponse(userInput) {
        // Simple responses when API is unavailable
        if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
            return "**Hi there!** 👋 I'm here to help you find software recommendations. What type of software are you looking for today?";
        } else if (userInput.toLowerCase().includes('recommend') || userInput.toLowerCase().includes('software')) {
            return "I'd be happy to help you find some software! 😊 Here are some categories you might be interested in:\n\n1. *Development* tools like IDEs and code editors\n2. *Design* software for graphics and UI/UX\n3. *Productivity* apps to improve your workflow\n4. *Communication* tools for teams\n\nOr just tell me what software you're currently using, and I'll suggest some alternatives!";
        } else if (userInput.toLowerCase().includes('thank')) {
            return "You're welcome! 😄 [!Feel free to ask if you need more recommendations or have questions about specific software. I'm always here to help!]";
        } else {
            return "Hey there! 👋 I'm here to help with software recommendations. Here's what you can do:\n\n- Ask about specific categories like `development`, `design`, or `productivity`\n- Tell me about software you already use, and I'll find alternatives\n- Ask questions about features of different software tools\n\nWhat are you looking for today?";
        }
    }
}); 