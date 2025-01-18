import { debug } from 'console';
import MBTIAnalysis from '../models/data.js';

// Function to calculate similarity score between two users
const calculateSimilarityScore = (user1Analysis, user2Analysis) => {
    let score = 0;
    
    if (user1Analysis.type === user2Analysis.type) {
        score += 30;
    }
    const personalityScoreDiff = Math.abs(user1Analysis.overallPersonalityScore - user2Analysis.overallPersonalityScore);
    score += (100 - personalityScoreDiff) * 0.2;
    console.log("Personality score diff:", score);
    return Math.round(score * 100) / 100;
};

// Function to find the maximum matching using a bipartite graph
const findMaximumMatching = (graph, matches, seen, u) => {
    for (let v = 0; v < graph[u].length; v++) {
        if (graph[u][v] && !seen[v]) {
            seen[v] = true;
            if (matches[v] === -1 || findMaximumMatching(graph, matches, seen, matches[v])) {
                matches[v] = u;
                return true;
            }
        }
    }
    return false;
};

// Main function to find MBTI matches
const findMBTIMatches = async (userId, threshold = 18) => {
    try {
        console.log("Finding matches for user:", userId);
        
        // Fetch the current user's analysis
        const currentUserAnalysis = await MBTIAnalysis.findOne({ userId }).populate('userId');
        if (!currentUserAnalysis) {
            throw new Error('No MBTI analysis found for current user');
        }

        console.log("Found current user analysis");

        // Fetch all other users' analyses
        const otherAnalyses = await MBTIAnalysis.find({
            userId: { $ne: userId }
        }).populate('userId');

        // Calculate similarity scores for all other users
        const similarities = otherAnalyses.map(analysis => ({
            userId: analysis.userId._id,
            similarity: calculateSimilarityScore(currentUserAnalysis, analysis),
            analysis
        })).filter(match => match.similarity >= threshold);

        const n = similarities.length;

        // Create a bipartite graph for maximum matching
        const graph = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j && similarities[i].similarity >= threshold) {
                    graph[i][j] = 1;
                }
            }
        }

        const matches = Array(n).fill(-1);
        let matchCount = 0;

        // Find maximum matching using the graph
        for (let u = 0; u < n; u++) {
            const seen = Array(n).fill(false);
            if (findMaximumMatching(graph, matches, seen, u)) {
                matchCount++;
                console.log("Match count:", matchCount);
            }
        }

        // Collect the matched users
        const matchedUsers = [];
        for (let i = 0; i < n; i++) {
            if (matches[i] !== -1) {
                matchedUsers.push({
                    user: similarities[matches[i]].analysis.userId,
                    similarity: similarities[matches[i]].similarity,
                    mbtiType: similarities[matches[i]].analysis.type,
                    preferenceBreakdown: similarities[matches[i]].analysis.preferenceBreakdown,
                    traitDevelopmentScores: similarities[matches[i]].analysis.traitDevelopmentScores
                });
            }
        }

        // Return the sorted matched users
        return {
            matches: matchedUsers.sort((a, b) => b.similarity - a.similarity),
            totalMatches: matchCount
        };

    } catch (error) {
        console.error('Error in MBTI matching:', error);
        throw error;
    }
};

export default findMBTIMatches;
