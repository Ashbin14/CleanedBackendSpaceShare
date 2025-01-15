import express from 'express';
import { messageController } from '../controllers/messageController.js';
import  authMiddleware  from './middleware/authUser.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/send', (req, res, next) => {
    console.log('sendMessage route hit');
    next();
  }, messageController.sendMessage);
//router.get('/conversation/:userId', messageController.getConversation);
//router.get('/conversations', messageController.getAllConversations);
//router.patch('/read/:messageId', messageController.markAsRead);

export default router;