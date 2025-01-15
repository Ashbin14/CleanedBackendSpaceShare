import express from 'express';
import { spaceController } from '../controllers/spaceController.js';
import { upload }  from '../config/multerconfig.js';  // Multer config
import authenticateuser from './middleware/authUser.js'; // JWT authentication middleware

const router = express.Router();
router.post('/post', authenticateuser, upload.array('images', 5), spaceController.createSpace);
router.get('/get', authenticateuser, spaceController.getSpaces);
router.get('/:id', spaceController.getSpaceById);
router.patch('/:id', authenticateuser, upload.array('images', 5), spaceController.updateSpace);
router.delete('/:id', authenticateuser, spaceController.deleteSpace);

export default router;
