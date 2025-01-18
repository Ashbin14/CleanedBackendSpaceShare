import express from 'express';
import { spaceController } from '../controllers/spaceController.js';
import { upload }  from '../config/multerconfig.js';  // Multer config
import authenticateuser from './middleware/authUser.js'; // JWT authentication middleware'
import mongoose  from 'mongoose';
import { Space } from '../models/space.js';
import User from '../models/user.js';
import { userInfo } from 'os';

const router = express.Router();
router.post('/post', authenticateuser, upload.array('images', 5), spaceController.createSpace);
router.get('/get', authenticateuser, spaceController.getSpaces);
router.get('/:id', spaceController.getSpaceById);
router.patch('/:id', authenticateuser, upload.array('images', 5), spaceController.updateSpace);
router.delete('/:id', authenticateuser, spaceController.deleteSpace);

router.get('/spaces/user/:userId', async (req, res) => {
  try {
    console.log(req.params.userId);
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    const user = await User.findById(req.params.userId).select('-password');
    const spaces = await Space.find({ userId: req.params.userId })
      .populate('userId', 'name email') // Populate user details if needed
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!spaces) {
      return res.status(404).json({
        success: false,
        message: 'No spaces found for this user'
      });
    }

    return res.status(200).json({
      success: true,
      user:{user},
      count: spaces.length,
      data: spaces
    });
  } catch (error) {
    console.error('Error in getting spaces by user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching spaces',
      error: error.message
    });
  }
});
router.get('/spaces/filter', authenticateuser, async (req, res) => {
  try {
      const userId = req.user.userId;
      const { 
          limit = 10,
          page = 1,
          minRent,
          maxRent,
          roomType,
          cleanlinessLevel,
          socializingLevel,
          maxDistance,
      } = req.query;

      const skip = (page - 1) * limit;

      const user = await User.findById(userId).select('location.coordinates');
      const [longitude, latitude] = user.location.coordinates;
      const space=space.findAll();

      let filteredMatches = space.matches
          .filter(match => {
              if (space.userId==userId) return false
              if (space.minRent <minRent) return false;
              if (space.maxRent >maxRent) return false;
              if (space.cleanlinessLevel!=cleanlinessLevel) return false;
              if (space.roomType!=roomType) return false;
              if(space.socializingLevel!=socializingLevel)return false;

              if (maxDistance && matchedUser.location) {
                  const distance = calculateDistance(latitude, longitude , space.location.latitude, space.location.longitude);
                  if (distance > maxDistance) return false;
              }
              return true;
          })

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
