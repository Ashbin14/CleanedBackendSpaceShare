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
    console.log("user:",user);
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
export default router;
