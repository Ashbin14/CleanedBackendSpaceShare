import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: [18, 'Must be at least 18 years old']
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other']
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
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
    images: [{
      type: String
    }]
  },
  {
    timestamps: true, 
  }
);
userSchema.index({location:'2dsphere'})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
