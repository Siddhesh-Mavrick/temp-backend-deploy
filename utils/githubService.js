import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

// Get the organization name from environment variables
const organization = process.env.GITHUB_ORG;

class GitHubService {
  constructor(accessToken) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async createRepoFromTemplate(templateRepo, newRepoName, organization) {
    try {
      // Validate inputs
      if (!templateRepo || !templateRepo.includes('/')) {
        throw new Error(`Invalid template repo format: ${templateRepo}. Expected format: 'owner/repo'`);
      }
      
      if (!newRepoName) {
        throw new Error('New repository name is required');
      }
      
      if (!organization) {
        throw new Error('Organization name is required');
      }
      
      const [owner, repo] = templateRepo.split('/');
      
      console.log(`Creating repo from template with params:`, {
        template_owner: owner,
        template_repo: repo,
        owner: organization,
        name: newRepoName
      });
      
      const response = await this.octokit.repos.createUsingTemplate({
        template_owner: owner,
        template_repo: repo,
        owner: organization,
        name: newRepoName,
        private: true,
        include_all_branches: true
      });

      return response.data.html_url;
    } catch (error) {
      console.error('GitHub API Error:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      if (error.status === 404) {
        throw new Error(`Failed to create repository: Template repository '${templateRepo}' not found or not accessible. Make sure the template repo exists and is actually marked as a template in GitHub.`);
      } else if (error.status === 401 || error.status === 403) {
        throw new Error(`Failed to create repository: Authentication error. Check your GitHub token permissions.`);
      } else if (error.response?.data?.message) {
        throw new Error(`Failed to create repository: ${error.response.data.message}`);
      } else {
        throw new Error(`Failed to create repository: ${error.message}`);
      }
    }
  }

  async addCollaborator(repoName, username, permission = 'push') {
    try {
      if (!organization) {
        throw new Error('Organization name is required for adding collaborator');
      }
      
      console.log(`Adding collaborator to repo:`, {
        owner: organization,
        repo: repoName,
        username: username
      });
      
      await this.octokit.repos.addCollaborator({
        owner: organization,
        repo: repoName,
        username,
        permission
      });
    } catch (error) {
      console.error('GitHub API Error (addCollaborator):', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }
}

export default GitHubService;