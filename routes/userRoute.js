import express from 'express';  // Import express
import auth from '../middleware/auth.js';  
import userController from '../controllers/userController.js';

const router=express.Router();
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/profile/password', auth, userController.updatePassword);

export default router;