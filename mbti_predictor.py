import json
import numpy as np
import sys

class DecisionNode:
    def __init__(self, threshold=50):
        self.threshold = threshold

class MBTIPredictor:
    def __init__(self):
        """Initialize the MBTI personality predictor."""
        self.type_mapping = {
            (0, 0, 0, 0): 'ISTJ', (0, 0, 0, 1): 'ISTP', 
            (0, 0, 1, 0): 'ISFJ', (0, 0, 1, 1): 'ISFP',
            (0, 1, 0, 0): 'INTJ', (0, 1, 0, 1): 'INTP',
            (0, 1, 1, 0): 'INFJ', (0, 1, 1, 1): 'INFP',
            (1, 0, 0, 0): 'ESTJ', (1, 0, 0, 1): 'ESTP',
            (1, 0, 1, 0): 'ESFJ', (1, 0, 1, 1): 'ESFP',
            (1, 1, 0, 0): 'ENTJ', (1, 1, 0, 1): 'ENTP',
            (1, 1, 1, 0): 'ENFJ', (1, 1, 1, 1): 'ENFP'
        }
        
        self.nodes = [DecisionNode() for _ in range(4)]
        self.dimensions = ['E/I', 'S/N', 'T/F', 'J/P']
        self.dimension_names = [
            ('Extraversion', 'Introversion'),
            ('Sensing', 'Intuition'),
            ('Thinking', 'Feeling'),
            ('Judging', 'Perceiving')
        ]
        
        # Define personality trait weights for scoring
        self.trait_weights = {
            'ISTJ': {'Organization': 0.9, 'Detail': 0.8, 'Logic': 0.7, 'Reliability': 0.9},
            'ISFJ': {'Dedication': 0.9, 'Support': 0.8, 'Organization': 0.7, 'Tradition': 0.8},
            'INFJ': {'Insight': 0.9, 'Empathy': 0.9, 'Planning': 0.7, 'Creativity': 0.8},
            'INTJ': {'Strategy': 0.9, 'Logic': 0.8, 'Innovation': 0.8, 'Independence': 0.7},
            'ISTP': {'Analysis': 0.8, 'Practicality': 0.9, 'Adaptability': 0.8, 'Problem-solving': 0.7},
            'ISFP': {'Creativity': 0.8, 'Sensitivity': 0.9, 'Adaptability': 0.7, 'Harmony': 0.8},
            'INFP': {'Idealism': 0.9, 'Creativity': 0.8, 'Empathy': 0.8, 'Authenticity': 0.7},
            'INTP': {'Analysis': 0.9, 'Innovation': 0.8, 'Logic': 0.9, 'Adaptability': 0.6},
            'ESTP': {'Action': 0.9, 'Adaptability': 0.8, 'Problem-solving': 0.7, 'Energy': 0.8},
            'ESFP': {'Enthusiasm': 0.9, 'Adaptability': 0.8, 'People-oriented': 0.8, 'Energy': 0.7},
            'ENFP': {'Enthusiasm': 0.8, 'Creativity': 0.9, 'Innovation': 0.8, 'People-oriented': 0.7},
            'ENTP': {'Innovation': 0.9, 'Analysis': 0.8, 'Adaptability': 0.8, 'Strategy': 0.7},
            'ESTJ': {'Organization': 0.9, 'Leadership': 0.8, 'Logic': 0.8, 'Efficiency': 0.7},
            'ESFJ': {'Harmony': 0.9, 'Support': 0.8, 'Organization': 0.8, 'Tradition': 0.7},
            'ENFJ': {'Leadership': 0.9, 'Empathy': 0.9, 'Support': 0.8, 'Vision': 0.7},
            'ENTJ': {'Leadership': 0.9, 'Strategy': 0.9, 'Logic': 0.8, 'Efficiency': 0.7}
        }

    def normalize_score(self, score):
        return min(max(float(score), 0), 100)
    
    def get_preference_strength(self, score):
        if score < 20: return "Very Clear"
        elif score < 40: return "Clear"
        elif score < 60: return "Moderate"
        elif score < 80: return "Slight"
        else: return "Very Slight"
    
    def calculate_personality_score(self, mbti_type, preferences):
        """Calculate overall personality score based on type and preferences."""
        # Base score starting point
        base_score = 70
        
        # Get trait weights for the type
        traits = self.trait_weights[mbti_type]
        
        # Calculate preference alignment score
        pref_score = sum(pref['strength'] for pref in preferences.values()) / len(preferences)
        
        # Calculate trait development score
        trait_score = sum(weight * (pref_score/100) for weight in traits.values()) / len(traits)
        
        # Combine scores with weights
        final_score = (base_score * 0.4) + (pref_score * 0.3) + (trait_score * 100 * 0.3)
        
        # Calculate development areas
        development_areas = {
            trait: round(weight * (pref_score/100) * 100, 1)
            for trait, weight in traits.items()
        }
        
        return {
            'overall_score': round(final_score, 1),
            'preference_alignment': round(pref_score, 1),
            'trait_development': development_areas,
            'dominant_traits': sorted(development_areas.items(), key=lambda x: x[1], reverse=True)[:2]
        }
            
    def calculate_cognitive_functions(self, mbti_type):
        functions = {
            'Se': 'Extraverted Sensing', 'Si': 'Introverted Sensing',
            'Ne': 'Extraverted Intuition', 'Ni': 'Introverted Intuition',
            'Te': 'Extraverted Thinking', 'Ti': 'Introverted Thinking',
            'Fe': 'Extraverted Feeling', 'Fi': 'Introverted Feeling'
        }
        
        function_stacks = {
            'ISTJ': ['Si', 'Te', 'Fi', 'Ne'], 'ISTP': ['Ti', 'Se', 'Ni', 'Fe'],
            'ISFJ': ['Si', 'Fe', 'Ti', 'Ne'], 'ISFP': ['Fi', 'Se', 'Ni', 'Te'],
            'INTJ': ['Ni', 'Te', 'Fi', 'Se'], 'INTP': ['Ti', 'Ne', 'Si', 'Fe'],
            'INFJ': ['Ni', 'Fe', 'Ti', 'Se'], 'INFP': ['Fi', 'Ne', 'Si', 'Te'],
            'ESTJ': ['Te', 'Si', 'Ne', 'Fi'], 'ESTP': ['Se', 'Ti', 'Fe', 'Ni'],
            'ESFJ': ['Fe', 'Si', 'Ne', 'Ti'], 'ESFP': ['Se', 'Fi', 'Te', 'Ni'],
            'ENTJ': ['Te', 'Ni', 'Se', 'Fi'], 'ENTP': ['Ne', 'Ti', 'Fe', 'Si'],
            'ENFJ': ['Fe', 'Ni', 'Se', 'Ti'], 'ENFP': ['Ne', 'Fi', 'Te', 'Si']
        }
        
        stack = function_stacks[mbti_type]
        return [(fn, functions[fn]) for fn in stack]
    
    def predict_personality(self, input_scores):
        if len(input_scores) != 4:
            raise ValueError("Must provide exactly 4 scores (E/I, S/N, T/F, J/P)")

        normalized_scores = [self.normalize_score(score) for score in input_scores]
        binary_preferences = [1 if score > node.threshold else 0 
                            for score, node in zip(normalized_scores, self.nodes)]
        
        mbti_type = self.type_mapping[tuple(binary_preferences)]
        
        preferences = {}
        for i, (score, (name1, name2)) in enumerate(zip(normalized_scores, self.dimension_names)):
            dim = self.dimensions[i]
            if score > 50:
                preference = name2
                strength = score
            else:
                preference = name1
                strength = 100 - score
                
            preferences[dim] = {
                'preferred': preference,
                'strength': strength,
                'category': self.get_preference_strength(strength)
            }
        
        personality_scores = self.calculate_personality_score(mbti_type, preferences)
        
        return {
            'type': mbti_type,
            'scores': dict(zip(self.dimensions, normalized_scores)),
            'preferences': preferences,
            'cognitive_functions': self.calculate_cognitive_functions(mbti_type),
            'personality_scores': personality_scores
        }

def format_analysis(analysis):
    """Format the personality analysis for display."""
    output = [
        "\nMBTI Personality Analysis",
        "========================",
        f"Type: {analysis['type']}",
        f"\nOverall Personality Score: {analysis['personality_scores']['overall_score']}/100",
        f"Preference Alignment: {analysis['personality_scores']['preference_alignment']}%",
        
        "\nDominant Traits:",
        "---------------"
    ]
    
    for trait, score in analysis['personality_scores']['dominant_traits']:
        output.append(f"{trait}: {score}%")
    
    output.extend([        
        "\nPreference Breakdown:",
        "-------------------"
    ])
    
    for dim, pref in analysis['preferences'].items():
        output.append(
            f"{dim}: {pref['preferred']} ({pref['strength']:.1f}% - {pref['category']} preference)"
        )
    
    output.extend([
        "\nTrait Development Scores:",
        "----------------------"
    ])
    
    for trait, score in analysis['personality_scores']['trait_development'].items():
        output.append(f"{trait}: {score}%")
    
    output.extend([
        "\nCognitive Functions:",
        "------------------"
    ])
    
    for i, (fn, desc) in enumerate(analysis['cognitive_functions'], 1):
        output.append(f"{i}. {fn} - {desc}")
    
    return "\n".join(output)

def main():
    predictor = MBTIPredictor()
    if len(sys.argv) > 1:
        try:
            scores = [float(arg) for arg in sys.argv[1:5]]
            result = predictor.predict_personality(scores)
            print(json.dumps(result, indent=4))  # Output result as JSON
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        sample_scores = [50, 50, 50, 50]
        result = predictor.predict_personality

if __name__ == "__main__":
    main()