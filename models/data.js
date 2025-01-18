import mongoose from 'mongoose';

const mbtiAnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    type: {
        type: String,
        required: true
    },
    overallPersonalityScore: {
        type: Number,
        required: true
    },
    preferenceAlignment:{
        type: Number,
        required: true
    },

    preferenceBreakdown: {
        EI: {
            type: String,
            required: true
        },
        EIPercentage: {
            type: Number,
            required: true
        },
        SN: {
            type: String,
            required: true
        },
        SNPercentage: {
            type: Number,
            required: true
        },
        TF: {
            type: String,
            required: true
        },
        TFPercentage: {
            type: Number,
            required: true
        },
        JP: {
            type: String,
            required: true
        },
        JPPercentage: {
            type: Number,
            required: true
        }
    },
}, { timestamps: true });

const MBTIAnalysis = mongoose.model('MBTIAnalysis', mbtiAnalysisSchema);

export default MBTIAnalysis;
