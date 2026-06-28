import express from 'express';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  fetchMessages,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', accessChat);
router.get('/', fetchChats);
router.post('/group', createGroupChat);
router.get('/:chatId/messages', fetchMessages);

export default router;
