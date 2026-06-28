const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.sendMessage);
router.get('/', messageController.getMessagesShortPoll);
router.get('/long-poll', messageController.getMessagesLongPoll);

module.exports = router;
