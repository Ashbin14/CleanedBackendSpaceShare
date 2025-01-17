import { debug } from 'console';
import MBTIAnalysis from '../models/data.js';

const calculateSimilarityScore = (user1Analysis, user2Analysis) => {
    let score = 0;
    
    if (user1Analysis.type === user2Analysis.type) {
        score += 30;
    }
    
    const personalityScoreDiff = Math.abs(user1Analysis.overallPersonalityScore - user2Analysis.overallPersonalityScore);
    score += (100 - personalityScoreDiff) * 0.2;
    console.log("personlaity score diff");
    console.log(score);
    return Math.round(score * 100) / 100;
};

// Maximum Bipartite Matching Algorithm using Ford-Fulkerson
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

const findMBTIMatches = async (userId, threshold = 18) => {
    try {
        console.log("here ");
        const currentUserAnalysis = await MBTIAnalysis.findOne({ userId }).populate('userId');
        if (!currentUserAnalysis) {
            throw new Error('No MBTI analysis found for current user');
        }
        console.log("here find mibt");
        const otherAnalyses = await MBTIAnalysis.find({
            userId: { $ne: userId }
        }).populate('userId');
        const similarities = otherAnalyses.map(analysis => ({
            userId: analysis.userId._id,
            similarity: calculateSimilarityScore(currentUserAnalysis, analysis),
            analysis
        })).filter(match => match.similarity >= threshold);

        const n = similarities.length;
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
        
        for (let u = 0; u < n; u++) {
            const seen = Array(n).fill(false);
            if (findMaximumMatching(graph, matches, seen, u)) {
                matchCount++;
                console.log(matchCount);
            }
        }
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