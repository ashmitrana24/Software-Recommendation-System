import pandas as pd
import pickle
from pathlib import Path

def load_models():
    """Load the pre-trained models from the models directory"""
    try:
        models_path = Path(__file__).parent / 'models'
        
        with open(models_path / 'software_data.pkl', 'rb') as f:
            data = pickle.load(f)
        
        with open(models_path / 'cosine_sim.pkl', 'rb') as f:
            cosine_sim = pickle.load(f)
            
        return data, cosine_sim
    except Exception as e:
        raise Exception(f"Error loading models: {str(e)}")

def get_software_aliases():
    """Define common aliases for software names"""
    return {
        'vscode': 'Visual Studio Code',
        'vs code': 'Visual Studio Code',
        'visualstudiocode': 'Visual Studio Code',
        'word': 'Microsoft Word',
        'msword': 'Microsoft Word',
    }

def find_matching_software(query, data):
    """
    Find software matching the query by checking names, descriptions, and tags
    """
    query = query.lower()
    matches = []
    
    for idx, row in data.iterrows():
        # Check name
        if query in str(row['name']).lower():
            matches.append((idx, 1.0))  # Full weight for name matches
            continue
            
        # Check category
        if query in str(row['category']).lower():
            matches.append((idx, 0.8))  # High weight for category matches
            continue
            
        # Check description
        if query in str(row['description']).lower():
            matches.append((idx, 0.6))  # Medium weight for description matches
            continue
            
        # Check tags (safely handle missing tags)
        if 'tags' in row and query in str(row['tags']).lower():
            matches.append((idx, 0.5))  # Lower weight for tag matches
            
    return matches

def get_recommendations(query, num_recommendations=5):
    """
    Generate software recommendations based on similarity.
    
    Args:
        query (str): Search query (software name or general term)
        num_recommendations (int): Number of recommendations to return
    
    Returns:
        list: List of dictionaries containing recommended software with similarity scores
    """
    try:
        data, cosine_sim = load_models()
        
        # Convert input to lowercase for matching
        query_lower = query.lower()
        
        # Check aliases first
        aliases = get_software_aliases()
        if query_lower in aliases:
            query = aliases[query_lower]
            
        # First try exact software name match
        software_matches = data[data['name'].str.lower() == query_lower]
        
        if len(software_matches) > 0:
            # If exact match found, use cosine similarity
            idx = software_matches.index[0]
            sim_scores = list(enumerate(cosine_sim[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
            sim_scores = sim_scores[1:num_recommendations + 1]
        else:
            # If no exact match, search through descriptions and tags
            matches = find_matching_software(query_lower, data)
            
            if not matches:
                available_software = ", ".join(data['name'].tolist())
                raise ValueError(f"No matches found for '{query}'. Try searching for specific software names: {available_software}")
            
            # Sort matches by relevance score
            matches.sort(key=lambda x: x[1], reverse=True)
            
            # Get recommendations based on the most relevant match
            base_idx = matches[0][0]
            base_score = matches[0][1]
            
            sim_scores = list(enumerate(cosine_sim[base_idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
            sim_scores = [(idx, score * base_score) for idx, score in sim_scores[:num_recommendations]]
        
        # Format recommendations as list of dictionaries
        recommendations = [
            {
                'name': data.iloc[i[0]]['name'],
                'category': data.iloc[i[0]]['category'],
                'similarity': float(i[1])
            }
            for i in sim_scores
        ]
        
        return recommendations

    except Exception as e:
        raise Exception(f"Error generating recommendations: {str(e)}") 