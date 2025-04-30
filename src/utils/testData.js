/**
 * Test data utilities for development and testing purposes
 */

// Sample tutor recommendations data
export const sampleTutorRecommendations = [
  {
    tutor_id: '12345-test-1',
    tutor_name: 'John Smith',
    tutor_email: 'john.smith@example.com',
    match_probability: 95.5,
    confidence: 85.2
  },
  {
    tutor_id: '12345-test-2',
    tutor_name: 'Jane Doe',
    tutor_email: 'jane.doe@example.com',
    match_probability: 90.2,
    confidence: 82.8
  },
  {
    tutor_id: '12345-test-3',
    tutor_name: 'Alex Johnson',
    tutor_email: 'alex@example.com',
    match_probability: 88.7,
    confidence: 79.5
  }
];

/**
 * Injects sample tutor recommendations into the RecommendationsContext
 * @param {Function} updateRecommendations - The updateRecommendations function from RecommendationsContext
 */
export const injectSampleTutorRecommendations = (updateRecommendations) => {
  console.log('Injecting sample tutor recommendations');
  updateRecommendations(sampleTutorRecommendations);
}; 