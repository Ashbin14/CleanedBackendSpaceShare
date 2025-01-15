import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    matches: [{
        matchedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        similarityScore: Number,
        mbtiType: String,
        timestamp: Date
    }],
    totalMatches: Number,
    calculatedAt: Date
}, {
    timestamps: true
});

const  MatchResult = mongoose.model('MatchResult', matchResultSchema);
export default MatchResult;