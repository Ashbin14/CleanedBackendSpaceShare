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
router.post('/dealdone',authenticateuser,async(req,res)=>{
  const{spaceId}=req.body;
  try {
    const space= await Space.findById(spaceId)
    if(req.user.userId!=space.userId) 
      return res.status(200).json({
      success:false,
      message:"property doesnot belongs to the user and cannot edit it"
       })
    if(space){
      space.booked=true;
    }
    
    return res.status(200).json({
      success:true,
      space:{space},
      message: "the flat is booked change the colour"
    });
     
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while changing the staus',
      error: error.message
    });
  }
})
router.post('/dealcancled',authenticateuser,async(req,res)=>{
  const{spaceId}=req.body;
  try {
    const space= await Space.findById(spaceId)
    if(req.user.userId!=space.userId) 
      return res.status(200).json({
      success:false,
      message:"property doesnot belongs to the user and cannot edit it"
       })
    if(space){
      space.booked=false;
    }
    
    return res.status(200).json({
      success:true,
      space:{space},
      message: "the flat is unbooked change the colour"
    });
     
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while changing the staus',
      error: error.message
    });
  }
})
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
      const space= await Space.find();
      let filteredMatches = [];

      space
          .forEach((match,index) => {
            // console.log(match)
              if (match.userId==userId) return false
              console.log("Rent",match.monthlyRent > minRent && match.monthlyRent < maxRent)
              if (match.monthlyRent > minRent && match.monthlyRent < maxRent) return false;
              // if (match.maxRent > maxRent) return false;
              // if (match.flatmatePreferences.cleanlinessLevel!=cleanlinessLevel) return false;
              console.log("roomType", match.roomType!=roomType)
              if (match.roomType!=roomType) return false;
              // if(match.flatmatePreferences.socializingLevel!=socializingLevel)return false;
              console.log("coordinates", match.location.coordinates)
              console.log("user", match)
              let distance = 0;
              if (maxDistance && match.location) {
                distance = calculateDistance(
                  latitude,
                  longitude,
                  match.location.coordinates[1],
                  match.location.coordinates[0]
                );
                console.log(distance)
          
                if ( maxDistance < distance ) {
                  return false;
                }
          
                // Attach the calculated distance to the match for later use
                // match.distance = distance;
              }
              filteredMatches.push({"location":match.location, "amenities": match.amenities, "_id": match._id, "userId": match.userId,"title": match.title, "monthlyRent": match.monthlyRent, "roomType": match.roomType, "description": match.description, "images": match.images, "createdAt": match.createdAt, "updatedAt": match.updatedAt, "distance": distance})
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
