import express from 'express';
import mongoose from 'mongoose';
import MatchResult from '../models/matcheduser.js';
import User from '../models/user.js';
import findMBTIMatches  from '../controllers/smilarSearchController.js';
import authenticateUser from './middleware/authUser.js';

const router = express.Router();


router.post('/calculate-matches',authenticateUser, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = req.user.userId;


        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // maximum bipartile wala yaha bata call vai rako cha
        const matchResults = await findMBTIMatches(userId);

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

        // Store or update matches in database
        await MatchResult.findOneAndUpdate(
            { userId: userId },
            matchDocument,
            { upsert: true, new: true, session }
        );

        await session.commitTransaction();

        res.status(200).json({
            status: 'success',
            data: {
                matches: matchResults.matches,
                totalMatches: matchResults.totalMatches
            }
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    } finally {
        session.endSession();
    }
});

// Get stored matches for a user
router.get('/matches/',authenticateUser, async (req, res) => {
    try {
        const { userId } = req.user.userId;
        const { 
            minSimilarity = 0,
            limit = 10,
            page = 1
        } = req.query;

        const skip = (page - 1) * limit;

        const matchResults = await MatchResult.findOne({ userId })
            .populate({
                path: 'matches.matchedUserId',
                select: 'firstName lastName email age gender phoneNumber images'
            });

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

export default router;
