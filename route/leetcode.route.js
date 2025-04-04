import express from 'express';
import { getLCodeUserInfo } from '../controllers/leetcode.controller.js';

const router = express.Router();

router.get('/lcodeprofile/:userId', getLCodeUserInfo);

export default router;
