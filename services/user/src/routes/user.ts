import {Router} from 'express';
import { getUserProfile, myProfile, profilePicUpdate, updateProfile, } from '../controllers/user.js';
import { isAuth } from '../middleware/auth.js';
import uploadFile from '../middleware/multer.js';


const router=Router();

router.route('/me').get(isAuth,myProfile);
router.route('/:userId').get(isAuth,getUserProfile);
router.route('/profile').put(isAuth,updateProfile);
router.route('/profile-pic').put(isAuth,uploadFile,profilePicUpdate);

export default router;


