import express from 'express';
import { getStudentReposWithCommits, getStudentGitHubSummary } from '../controllers/github.controller.js';
import { getGithubRepoCommits } from '../services/github.service.js';

const router = express.Router();
router.get('/:userId/repos', getStudentReposWithCommits);
router.get('/:userId/repos/:repoName/commits', getGithubRepoCommits);
router.get('/:userId/summary', getStudentGitHubSummary);

router.get('/github/:userId/repos', getStudentReposWithCommits);
router.get('/github/:userId/repos/:repoName/commits', getGithubRepoCommits);
router.get('/github/:userId/summary', getStudentGitHubSummary);

export default router;