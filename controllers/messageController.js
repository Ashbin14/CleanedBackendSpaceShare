import Message from '../models/Message.js';
import User from '../models/user.js';
import { encryptionUtil } from '../utils/encryption.js';


const sendMessage = async(req,res)=>{
    try {
        const { receiverId, content } = req.body;
        console.log(req.user.userId)
        const senderId = req.user.userId;
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return res.status(404).json({ message: 'Receiver not found' });
        }
        const encryptedContent = encryptionUtil.encrypt(content);
  
        const newMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          content: encryptedContent
        });
  
        await newMessage.save();
        const decryptedMessage = {
          ...newMessage.toObject(),
          content: content
        };
        req.io.to(receiverId.toString()).emit('newMessage', decryptedMessage);
  
        res.status(201).json({
          success: true,
          message: 'Message sent successfully',
          data: decryptedMessage
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error sending message',
          error: error.message
        });
      }
    }
    const getConversation = async(req,res)=>{
        try {
            const { userId } = req.params;
            const currentUserId = req.user.userId;
            const messages = await Message.find({
              $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
              ],
              deletedFor: { $ne: currentUserId }
            })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName')
            .populate('receiver', 'firstName lastName');
            const decryptedMessages = messages.map(msg => ({
              ...msg.toObject(),
              content: msg.content ? encryptionUtil.decrypt(msg.content) : '[Message deleted]'
            }));
      
            res.status(200).json({
              success: true,
              data: decryptedMessages
            });
        } catch (error) {
            res.status(500).json({
              success: false,
              message: 'Error retrieving conversation',
              error: error.message
            });
        }
    }
    const deleteMessage = async(req,res)=>{
        try {
            const { messageId } = req.params;
            const userId = req.user.id;
      
            const message = await Message.findById(messageId);
            
            if (!message) {
              return res.status(404).json({ message: 'Message not found' });
            }
            if (message.sender.toString() !== userId.toString() && 
                message.receiver.toString() !== userId.toString()) {
              return res.status(403).json({ message: 'Unauthorized to delete this message' });
            }
            message.deletedFor.push(userId);
            if (message.deletedFor.length === 2) {
              message.deleted = true;
              message.content = null;
            }
      
            await message.save();
            const roomId = message.receiver.toString();
            req.io.to(roomId).emit('messageDeleted', { messageId });
      
            res.status(200).json({
              success: true,
              message: 'Message deleted successfully'
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              message: 'Error deleting message',
              error: error.message
            });
        }
    }

export const messageController = {
    sendMessage,getConversation,deleteMessage
};