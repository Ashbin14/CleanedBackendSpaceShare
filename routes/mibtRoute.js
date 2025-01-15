import express from 'express'; 
import { personalityController} from '../controllers/personalityController.js'; 
import authMiddleware from './middleware/authUser.js'; 
import MBTIAnalysis from '../models/data.js';

const router=express.Router();
router.post('/analyze', authMiddleware, personalityController.analyzePersonality);

router.get('/analysis/:id', authMiddleware, personalityController.getAnalysisById);

router.get('/my-analyses', authMiddleware, async (req, res) => {
    try {
        const analyses = await MBTIAnalysis.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        console.log(analyses);
        res.json( analyses );
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch analyses',
            details: error.message
        });
    }
});

export default router;
