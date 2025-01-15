import mongoose  from 'mongoose';
import  User from './user.js'

const MBTIAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    },
  type: {
    type: String,
    required: true,
  },
  overallPersonalityScore: {
    type: Number,
    required: true,
  },
  preferenceAlignment: {
    type: Number,
    required: true,
  },
  dominantTraits: {
    organization: Number,
    reliability: Number,
    analysis: Number,
    logic: Number,
  },
  preferenceBreakdown: {
    EI: {
      type: String,
      enum: ['Extraversion', 'Introversion'],
    },
    EIPercentage: Number,
    SN: {
      type: String,
      enum: ['Sensing', 'Intuition'],
    },
    SNPercentage: Number,
    TF: {
      type: String,
      enum: ['Thinking', 'Feeling'],
    },
    TFPercentage: Number,
    JP: {
      type: String,
      enum: ['Judging', 'Perceiving'],
    },
    JPPercentage: Number,
  },
  traitDevelopmentScores: {
    organization: Number,
    detail: Number,
    logic: Number,
    reliability: Number,
    analysis: Number,
    innovation: Number,
    adaptability: Number,
  },
  cognitiveFunctions: {
    type: [String], 
  },
});


const MBTIAnalysis = mongoose.model('MBTIAnalysis', MBTIAnalysisSchema);
export default MBTIAnalysis;



