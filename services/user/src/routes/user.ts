import {Router} from 'express';
import { getUserProfile, myProfile, } from '../controllers/user.js';
import { isAuth } from '../middleware/auth.js';


const router=Router();

router.route('/me').get(isAuth,myProfile);
router.route('/:userId').get(isAuth,getUserProfile);

export default router;


