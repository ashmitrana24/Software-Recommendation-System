# This file can be used for testing the recommendation system locally
from pathlib import Path
import sys

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.append(str(backend_path))

from recommend import get_recommendations

def test_recommendations():
    test_software = 'VSCode'
    recommendations = get_recommendations(test_software)
    
    print(f"\nRecommendations for {test_software}:")
    for rec in recommendations:
        print(f"- {rec['name']} (Similarity: {rec['similarity']:.2f})")

if __name__ == '__main__':
    test_recommendations() 