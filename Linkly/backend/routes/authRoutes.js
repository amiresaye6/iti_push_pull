import express from 'express';
import { loginUser, getUsers } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/users', getUsers);

export default router;
