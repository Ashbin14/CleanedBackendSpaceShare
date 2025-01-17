import json
import numpy as np
from typing import List, Dict, Tuple, Any
import sys
from dataclasses import dataclass

@dataclass
class DecisionNode:
    """Node for making binary decisions based on a threshold."""
    threshold: float = 50.0

class MBTIPredictor:
    def __init__(self) -> None:
        """Initialize the MBTI personality predictor with type mappings and questions."""
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
        
        self.questions = self._initialize_questions()
        self.trait_weights = self._initialize_trait_weights()

    def _initialize_questions(self) -> Dict[str, List[str]]:
        """Initialize the questionnaire with dimension-specific questions."""
        return {
            'E/I': [
                "I prefer group activities over solo activities",
                "I feel energized after social interactions",
                "I tend to think out loud rather than think silently",
                "I am usually the one to start conversations",
                "I enjoy being the center of attention"
            ],
            'S/N': [
                "I focus more on details than the big picture",
                "I trust experience more than theoretical possibilities",
                "I prefer practical solutions over creative ones",
                "I like working with concrete facts rather than abstract concepts",
                "I value tradition and proven methods"
            ],
            'T/F': [
                "I make decisions based on logic rather than feelings",
                "I value objective truth over personal feelings",
                "I prefer honest feedback over tactful communication",
                "I solve problems by analyzing facts rather than considering feelings",
                "I tend to be more critical than sympathetic"
            ],
            'J/P': [
                "I prefer having a structured schedule",
                "I like to plan ahead rather than be spontaneous",
                "I prefer having things settled and decided",
                "I feel stressed when things are disorganized",
                "I like to have clear rules and guidelines"
            ]
        }

    def _initialize_trait_weights(self) -> Dict[str, Dict[str, float]]:
        """Initialize personality trait weights for each MBTI type."""
        return {
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

    def validate_responses(self, responses: List[float]) -> None:
        """Validate questionnaire responses."""
        if len(responses) != 20:
            raise ValueError(f"Expected 20 responses, got {len(responses)}")
        if not all(1 <= r <= 7 for r in responses):
            raise ValueError("All responses must be between 1 and 7")

    def process_question_responses(self, responses: List[float]) -> List[float]:
        """Process question responses to calculate dimension scores."""
        self.validate_responses(responses)
        dimension_scores = []
        question_index = 0
        
        for dimension in self.dimensions:
            dimension_questions = len(self.questions[dimension])
            dimension_total = sum(responses[question_index:question_index + dimension_questions])
            dimension_score = ((dimension_total / dimension_questions) - 1) * (100/6)
            dimension_scores.append(dimension_score)
            question_index += dimension_questions
            
        return dimension_scores

    def normalize_score(self, score: float) -> float:
        """Normalize a score to be between 0 and 100."""
        return min(max(float(score), 0), 100)
    
    def get_preference_strength(self, score: float) -> str:
        """Determine the strength category of a preference score."""
        if score < 20: return "Very Clear"
        elif score < 40: return "Clear"
        elif score < 60: return "Moderate"
        elif score < 80: return "Slight"
        else: return "Very Slight"
    
    def calculate_personality_score(self, mbti_type: str, preferences: Dict) -> Dict:
        """Calculate detailed personality scores and traits."""
        base_score = 70
        traits = self.trait_weights[mbti_type]
        pref_score = sum(pref['strength'] for pref in preferences.values()) / len(preferences)
        trait_score = sum(weight * (pref_score/100) for weight in traits.values()) / len(traits)
        final_score = (base_score * 0.4) + (pref_score * 0.3) + (trait_score * 100 * 0.3)
        
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

    def predict_personality(self, input_scores: List[float]) -> Dict:
        """Predict MBTI personality type from dimension scores."""
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
            'personality_scores': personality_scores
        }

    def predict_personality_from_questionnaire(self, responses: List[float]) -> Dict:
        """Predict personality type from questionnaire responses."""
        dimension_scores = self.process_question_responses(responses)
        return self.predict_personality(dimension_scores)

def main():
    """Main function to run the MBTI predictor."""
    try:
        predictor = MBTIPredictor()
        responses = [float(arg) for arg in sys.argv[1:21]]
        responses = [float(r) for r in responses]
        result = predictor.predict_personality_from_questionnaire(responses)
        print(json.dumps(result, indent=2))
        
    except ValueError as e:
            print(f"ValueError: {e}")
            sys.exit(1)
    except Exception as e:
            print(f"Unexpected error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
