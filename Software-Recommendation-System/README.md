# Software Recommendation System

A modern web application that recommends similar software based on user input, powered by machine learning and AI.

## Features

- Search for software by name
- Get similarity-based recommendations
- Visual chart representation of recommendations
- AI-powered chatbot using Google's Gemini API
- Modern, responsive UI with animations and glassmorphism effects

## Setup Instructions

### Prerequisites

- Python 3.7+
- Flask
- Node.js (optional, for alternative frontend serving)
- Google Gemini API key (for advanced chatbot functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Software-Recommendation-System.git
cd Software-Recommendation-System
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

3. Set up the Gemini API:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Set the API key as an environment variable:
     - Windows: `set GOOGLE_API_KEY=your-api-key-here`
     - MacOS/Linux: `export GOOGLE_API_KEY=your-api-key-here`
   - Alternatively, uncomment and modify this line in `backend/app.py`:
     ```python
     # os.environ['GOOGLE_API_KEY'] = 'your-api-key-here'
     ```

### Running the Application

1. Train the model:
```bash
cd ml_model
python train_model.py
```

2. Start the backend server:
```bash
cd ../backend
python app.py
```

3. Serve the frontend (choose one method):

   **Option A**: Using Python's built-in server:
   ```bash
   cd ../frontend
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

   **Option B**: Using Node.js http-server:
   ```bash
   npm install -g http-server
   cd ../frontend
   http-server
   ```
   Then open `http://localhost:8080` in your browser.

   **Option C**: Simply open `frontend/index.html` directly in your browser.

## Using the Software Recommendation System

1. Type a software name in the search box (e.g., "Photoshop", "VSCode", "Excel")
2. Click "Get Recommendations" or press Enter
3. View the recommended software and their similarity scores
4. Explore the visual chart showing the recommendations
5. Use the AI chatbot for additional assistance by clicking the robot icon in the bottom right corner

## Chatbot Features

- Powered by Google's Gemini API for more intelligent and context-aware responses
- Can answer questions about software categories and recommendations
- Understands natural language queries about software needs
- Maintains conversation context

## Troubleshooting

- **CORS Issues**: Make sure the backend server is running on port 5000
- **Module Not Found**: Ensure you've installed all required packages
- **No Recommendations**: Check that both the frontend and backend servers are running
- **Chatbot Not Working**: Verify your Gemini API key is correctly set
- **Model Training Errors**: Ensure the CSV file is in the correct location

## License

MIT 