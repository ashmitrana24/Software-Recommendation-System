from flask import Flask, request, jsonify
from flask_cors import CORS
from recommend import get_recommendations

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

if __name__ == '__main__':
    app.run(debug=True) 