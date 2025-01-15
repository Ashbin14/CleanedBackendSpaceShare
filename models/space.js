import mongoose from 'mongoose';
import  User from './user.js'

const spaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,   
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], 
      required: true
    }
  },
  monthlyRent: {
    type: Number,
   required: true
  },
  roomType: {
    type: String,
   required: true,
    enum: ['private', 'shared', 'studio']
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  amenities: {
    wifi: Boolean,
    kitchen: Boolean,
    washingMachine: Boolean,
    parking: Boolean
  },
  flatmatePreferences: {
    cleanlinessLevel: {
      type: String,
      enum: ['very-clean', 'clean', 'moderate']
    },
    socializingLevel: {
      type: String,
      enum: ['very-social', 'social', 'moderate', 'private']
    }
  }
}, {
  timestamps: true
});

spaceSchema.index({location:'2dsphere'})

export const Space = mongoose.model('Space', spaceSchema);
