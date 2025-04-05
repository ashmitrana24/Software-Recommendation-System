from flask import Flask, request, jsonify
from flask_cors import CORS
from recommend import get_recommendations
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Gemini API with the provided key
# Instead of using environment variable, we'll use the direct key for simplicity
os.environ['GOOGLE_API_KEY'] = 'AIzaSyAbQX1UDCzPDHPz8rQmOEkketuR71j5Y4E'
API_KEY = os.environ.get('GOOGLE_API_KEY', '')  # Get from environment variable

# Configure Gemini API
if API_KEY:
    genai.configure(api_key=API_KEY)
    print("Gemini API configured successfully with the provided key.")
else:
    print("WARNING: No Gemini API key found. Chat functionality will not work.")

@app.route('/')
def home():
    return jsonify({"status": "Software Recommendation System API is running"})

@app.route('/models', methods=['GET'])
def list_models():
    """
    Endpoint to list available Gemini models for debugging purposes
    """
    try:
        if not API_KEY:
            return jsonify({'error': 'Gemini API key not configured'}), 500
            
        # Get available models
        models = genai.list_models()
        model_names = [model.name for model in models]
        
        return jsonify({
            'available_models': model_names
        })
    except Exception as e:
        return jsonify({'error': f'Error listing models: {str(e)}'}), 500

@app.route('/recommend', methods=['POST'])  # Changed to POST to match frontend
def recommend_software():
    """
    API endpoint to get software recommendations.
    Expects a JSON body with:
    - software: name of the software to get recommendations for
    - num: (optional) number of recommendations to return
    """
    try:
        # Get data from JSON body instead of query parameters
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        software_name = data.get('software')
        if not software_name:
            return jsonify({'error': 'Software name is required'}), 400
        
        # Get num_recommendations with default value of 5
        num_recommendations = int(data.get('num', 5))
        
        # Get recommendations
        recommendations = get_recommendations(software_name, num_recommendations)
        return jsonify({'recommendations': recommendations})
    
    except ValueError as e:
        # Handle specific error for software not found
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        # Handle other errors
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    API endpoint to interact with Gemini AI.
    Expects a JSON body with:
    - message: user's message
    - history: (optional) conversation history
    """
    try:
        if not API_KEY:
            return jsonify({'error': 'Gemini API key not configured'}), 500
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_message = data.get('message')
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get conversation history (optional)
        history = data.get('history', [])
        
        # Create a system prompt with context about software recommendations
        system_prompt = """You are an AI assistant for a software recommendation system. Your role is to help users find the right software for their needs.

Available software categories include:
- Development (Visual Studio Code, IntelliJ IDEA, GitHub Desktop, etc.)
- Graphics (Photoshop, Adobe Illustrator, GIMP, Blender, etc.)
- Communication (Zoom, Slack, Microsoft Teams, Discord, etc.)
- Productivity (Microsoft Word, Excel, PowerPoint, Notion, etc.)
- Media (Premiere Pro, Final Cut Pro, Spotify, OBS Studio, etc.)
- Design (Figma, Adobe XD, etc.)

If the user asks about specific software, suggest they use the search feature to get detailed recommendations.
Your responses should be helpful, concise, and focused on software recommendations."""
        
        # Try different model names in case the API version changes
        potential_models = [
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-flash-latest',
            'models/gemini-1.5-pro-latest', 
            'models/gemini-1.5-pro-001'
        ]
        
        # Initialize response variables
        model = None
        response = None
        error_messages = []
        
        # Try each model until one works
        for model_name in potential_models:
            try:
                print(f"Trying model: {model_name}")
                model = genai.GenerativeModel(model_name)
                
                # Create a conversation
                chat = model.start_chat(history=history)
                
                # Add system prompt if this is a new conversation
                if not history:
                    chat.send_message(system_prompt)
                
                # Get response from Gemini
                response = chat.send_message(user_message)
                
                # If we get here, the model worked
                print(f"Successfully used model: {model_name}")
                break
                
            except Exception as e:
                error_message = f"Error with model {model_name}: {str(e)}"
                print(error_message)
                error_messages.append(error_message)
                continue
        
        # Check if any model succeeded
        if response:
            try:
                # Extract chat history as serializable data
                serialized_history = []
                if hasattr(chat, 'history'):
                    for message in chat.history:
                        # Convert the Content objects to dictionaries
                        if hasattr(message, 'parts'):
                            parts_text = [str(part) for part in message.parts]
                            serialized_history.append({
                                'role': message.role,
                                'parts': parts_text
                            })
                        elif isinstance(message, dict):
                            # Handle cases where message might already be a dict
                            serialized_history.append(message)
                
                return jsonify({
                    'response': response.text,
                    'history': serialized_history,
                    'model_used': model_name
                })
            except Exception as serialization_error:
                # If there's an error serializing the response, provide detailed error info
                print(f"Serialization error: {str(serialization_error)}")
                print(f"Response type: {type(response)}")
                print(f"Response content: {response}")
                
                return jsonify({
                    'response': str(response.text),
                    'error': f"Error serializing response: {str(serialization_error)}",
                    'history': []
                })
        else:
            # If no models worked, raise an exception with details
            error_details = "; ".join(error_messages)
            return jsonify({
                'error': f"Failed to get response from any Gemini model. Errors: {error_details}",
                'fallback_response': "I'm having trouble connecting to my AI services right now. Please try again later, or use the search box above to find software recommendations directly."
            }), 500
    
    except Exception as e:
        return jsonify({'error': f'Error with Gemini API: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True) 