import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js';

// Creating instance of router package
const router = Router();

//as user goes to /register "registerUser" method will run
router.route("/register").post(registerUser)

export default router;