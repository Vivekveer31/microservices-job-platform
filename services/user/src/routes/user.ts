import {Router} from 'express';
import { addSkills, deleteSkill, getUserProfile, myProfile, profilePicUpdate, updateProfile,updateResume} from '../controllers/user.js';
import { isAuth } from '../middleware/auth.js';
import uploadFile from '../middleware/multer.js';


const router=Router();

router.route('/me').get(isAuth,myProfile);
router.route('/:userId').get(isAuth,getUserProfile);
router.route('/profile').put(isAuth,updateProfile);
router.route('/profile-pic').put(isAuth,uploadFile,profilePicUpdate);
router.route('/resume').put(isAuth,uploadFile,updateResume);
router.route('/skills/add').post(isAuth,addSkills);
router.route('/skills/remove').delete(isAuth,deleteSkill);

export default router;


