import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
from pathlib import Path

def train_model():
    try:
        # Load dataset
        csv_path = Path(__file__).parent / 'software_data.csv'
        if not csv_path.exists():
            raise FileNotFoundError(f"Could not find software_data.csv at {csv_path}")
            
        data = pd.read_csv(csv_path)
        
        # Ensure all text columns are strings
        text_columns = ['Description', 'Features', 'Tags', 'Category']
        for col in text_columns:
            data[col] = data[col].fillna('').astype(str)
        
        # Combine features for better similarity matching
        data['combined_features'] = data.apply(
            lambda x: ' '.join([
                str(x['Category']).lower() * 3,  # Give more weight to category
                str(x['Description']).lower(),
                str(x['Features']).lower() * 2,  # Give more weight to features
                str(x['Tags']).lower() * 2       # Give more weight to tags
            ]),
            axis=1
        )
        
        # Create TF-IDF vectors with improved parameters
        tfidf = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),     # Include both unigrams and bigrams
            max_features=1000,       # Limit features to most important ones
            analyzer='word',
            token_pattern=r'[a-zA-Z0-9]+(?:[-][a-zA-Z0-9]+)*'  # Handle hyphenated words
        )
        
        # Generate TF-IDF matrix
        tfidf_matrix = tfidf.fit_transform(data['combined_features'])
        
        # Calculate cosine similarity
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        # Prepare data for saving
        save_data = pd.DataFrame({
            'name': data['Software'],
            'category': data['Category'],
            'description': data['Description'],
            'tags': data['Tags']  # Include tags in saved data
        })
        
        # Save models
        models_path = Path(__file__).parent.parent / 'backend' / 'models'
        models_path.mkdir(parents=True, exist_ok=True)
        
        with open(models_path / 'cosine_sim.pkl', 'wb') as f:
            pickle.dump(cosine_sim, f)
        
        with open(models_path / 'software_data.pkl', 'wb') as f:
            pickle.dump(save_data, f)
        
        print("\nModel training completed successfully! 🎉")
        print(f"Number of software items processed: {len(data)}")
        print("\nFeature vocabulary size:", len(tfidf.vocabulary_))
        print("\nSample similarities:")
        
        # Print some sample similarities for verification
        for idx, software in enumerate(data['Software']):
            similar_idx = cosine_sim[idx].argsort()[-3:][::-1][1:]  # Get top 2 similar (excluding self)
            print(f"\n{software} is most similar to:")
            for sim_idx in similar_idx:
                similarity_score = cosine_sim[idx][sim_idx] * 100
                print(f"- {data['Software'][sim_idx]} ({similarity_score:.1f}% similar)")
        
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        raise

if __name__ == '__main__':
    train_model() 