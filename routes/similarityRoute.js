import express from 'express';
import mongoose from 'mongoose';
import MatchResult from '../models/matcheduser.js';
import User from '../models/user.js';
import findMBTIMatches  from '../controllers/smilarSearchController.js';
import authenticateUser from './middleware/authUser.js';
import { debug, log } from 'console';


const router = express.Router();

router.post('/calculate-matches', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(userId);
        const user = await User.findById(userId);
        console.log("user :", user);
        if (!user) {
            throw new Error('User not found');
        }
        const matchResults = await findMBTIMatches(userId);
        console.log("matchresult");
        const matchDocument = {
            userId: userId,
            matches: matchResults.matches.map(match => ({
                matchedUserId: match.user._id,
                similarityScore: match.similarity,
                mbtiType: match.mbtiType,
                timestamp: new Date()
            })),
            totalMatches: matchResults.totalMatches,
            calculatedAt: new Date()
        };
        await MatchResult.findOneAndUpdate(
            { userId: userId },
            matchDocument,
            { upsert: true, new: true }
        );
        res.status(200).json({
            status: 'success',
            data: {
                matches: matchResults.matches,
                totalMatches: matchResults.totalMatches
            }
        });

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});


router.get('/matches/',authenticateUser, async (req, res) => {
    try {
        const userId  = req.user.userId;
        console.log("user id",userId)
        const { 
            minSimilarity = 0,
            limit = 10,
            page = 1
        } = req.query;

        const skip = (page - 1) * limit;

        const matchResults = await MatchResult.findOne({ userId })
            .populate({
                path: 'matches.matchedUserId',
                select: 'firstName lastName email age gender phoneNumber images location'
            });
        console.log("length", matchResults)

        if (!matchResults) {
            return res.status(404).json({
                status: 'error',
                message: 'No matches found for this user'
            });
        }
        const filteredMatches = matchResults.matches
            .filter(match => match.similarityScore >= minSimilarity)
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(skip, skip + parseInt(limit));

        res.status(200).json({
            status: 'success',
            data: {
                matches: filteredMatches,
                total: matchResults.matches.length,
                page: parseInt(page),
                totalPages: Math.ceil(matchResults.matches.length / limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});
router.get('/matches/filter', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log("user id", userId);
        const { 
            minSimilarity = 0,
            limit = 10,
            page = 1,
            minAge,
            maxAge,
            gender,
            maxDistance,
        } = req.query;

        const skip = (page - 1) * limit;

        // Validate user and location
        const user = await User.findById(userId).select('location.coordinates');
        if (!user || !user.location || !Array.isArray(user.location.coordinates)) {
            return res.status(400).json({
                status: 'error',
                message: 'User location or coordinates are missing'
            });
        }
        const [longitude, latitude] = user.location.coordinates;

        // Validate match results
        const matchResults = await MatchResult.findOne({ userId })
            .populate({
                path: 'matches.matchedUserId',
                select: 'firstName lastName email age gender phoneNumber images location'
            });
        //console.log(matchResults)
        if (!matchResults || !Array.isArray(matchResults.matches)) {
            return res.status(404).json({
                status: 'error',
                message: 'No matches found or matches data is missing'
            });
        }

        // Filter matches
        let filteredMatches = matchResults.matches
            .filter(match => {
                const matchedUser = match.matchedUserId;
                console.log(matchedUser)
                if (!matchedUser) return false; 
                console.log(1);
                if (match.similarityScore < minSimilarity) return false;
                console.log(2);
                console.log(minAge , matchedUser.age);
                 if(minAge && matchedUser.age < minAge) return false;
                console.log(3);
                if (maxAge && matchedUser.age > maxAge) return false;
                console.log("here");
                if (gender &&( matchedUser.gender !== gender||gender==="all")) return false;
                console.log(4);
                if (maxDistance) {
                    if (matchedUser.location && Array.isArray(matchedUser.location.coordinates)) {
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            matchedUser.location.coordinates[1],
                            matchedUser.location.coordinates[0]
                        );
                        console.log(distance);
                        if (distance > maxDistance) return false;
                    } else {
                        return false; // Skip if coordinates are missing
                    }
                }

                return true;
            })
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(skip, skip + parseInt(limit));
        console.log(filteredMatches)
        res.status(200).json({
            status: 'success',
            data: {
                matches: filteredMatches,
                total: filteredMatches.length,
                page: parseInt(page),
                totalPages: Math.ceil(filteredMatches.length / limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180); 
    const R = 6371; 

    const dLat = toRadians(lat2 - lat1); 
    const dLon = toRadians(lon2 - lon1); 

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
}

export default router;
