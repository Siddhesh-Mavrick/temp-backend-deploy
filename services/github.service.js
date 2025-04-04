import { memoryCache } from '../utils/memoryCache.js';
import rateLimit from 'express-rate-limit';
import axios from 'axios'
import { DateTime } from 'luxon'
import dotenv from 'dotenv';

dotenv.config();

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 24 * 60 * 60;

// Rate limiter for GitHub API
export const githubRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // GitHub API limit
  message: 'Too many requests from this IP, please try again later.'
});


const GitHub_BaseURL = "https://api.github.com";

const token = process.env.GITHUB_TOKEN;

const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
})

// Fetch all user repos
export const getGithubUserRepos = async (githubID) => {
  try {
    const cacheKey = `github:repos:${githubID}`;
    const cachedData = memoryCache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    if (!token) {
      throw new Error('GitHub token not configured');
    }

    const repos = await githubApi.get(`/users/${githubID}/repos`);
    
    if (!repos.data) {
      throw new Error('No data received from GitHub API');
    }
    
    memoryCache.set(cacheKey, repos.data, CACHE_TTL);
    return repos.data;
    
  } catch (error) {
    console.error('GitHub API Error:', {
      message: error.message,
      status: error.response?.status,
      githubID
    });
    
    if (error.response?.status === 404) {
      throw new Error('GitHub user not found');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Invalid GitHub token');
    }
    
    throw new Error('Failed to fetch GitHub repositories: ' + error.message);
  }
};

// Fetch commits for a specific repo
export const getGithubRepoCommits = async (githubID, repoName) => {
  console.log("Fetching commits for:", githubID, repoName);

  try {
    const response = await githubApi.get(`/repos/${githubID}/${repoName}/commits`, {
      params: {
        per_page: 100,
        page: 1,
      },
      timeout: 10000 // 10 second timeout
    });

    const commits = response.data.map(commit => ({
      message: commit.commit.message,
      date: commit.commit.author.date,
      url: commit.html_url,
      author: commit.commit.author.name,
      sha: commit.sha
    }));

    return {
      commits: commits,
      success: true
    };
  } catch (error) {
    // Handle empty repository case
    if (error.response && error.response.status === 409) {
      console.log(`Repository ${repoName} is empty.`);
      return { 
        commits: [], 
        success: true, 
        isEmptyRepo: true 
      };
    }
    
    // Handle rate limiting
    if (error.response && error.response.status === 403 && 
        error.response.data.message.includes('rate limit')) {
      console.log(`GitHub API rate limit exceeded for ${githubID}`);
      return { 
        commits: [], 
        success: false, 
        error: 'GitHub API rate limit exceeded. Please try again later.',
        isRateLimited: true
      };
    }
    
    // Handle repository not found
    if (error.response && error.response.status === 404) {
      console.log(`Repository ${repoName} not found for user ${githubID}`);
      return { 
        commits: [], 
        success: false, 
        error: 'Repository not found',
        isNotFound: true
      };
    }
    
    console.error('Error fetching commits:', error);
    return { 
      commits: [], 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch GitHub data'
    };
  }
};

export const getGithubUserProfile = async (githubID) => {
    try {
        const response = await githubApi.get(`/users/${githubID}`);
        
        // Extract the necessary data
        const { login, avatar_url, html_url, bio, public_repos, followers, following } = response.data;

        // Return the data in a structured format
        return {
            username: login,
            profileImageUrl: avatar_url,
            profileUrl: html_url,
            bio: bio,
            publicRepos: public_repos,
            followers: followers,
            following: following
        };
    } catch (error) {
        console.error('Error fetching GitHub user profile:', error);
        throw error;
    }
}
