import { User } from '../models/user.model.js';
import { GithubData } from '../models/githubData.model.js';
import { getGithubUserRepos, getGithubRepoCommits } from '../services/github.service.js';

export const updateGithubData = async () => {
  try {
    const users = await User.find({ githubID: { $exists: true } });

    for (const user of users) {
      const repos = await getGithubUserRepos(user.githubID);
      const reposWithCommits = await Promise.all(repos.map(async (repo) => {
        const commits = await getGithubRepoCommits(user.githubID, repo.name);
        return { ...repo, commits: commits.commits };
      }));

      await GithubData.findOneAndUpdate(
        { userId: user._id },
        { 
          $set: { 
            githubId: user.githubID,
            repos: reposWithCommits,
            lastUpdated: Date.now()
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log('GitHub data updated successfully');
  } catch (error) {
    console.error('Error updating GitHub data:', error);
  }
};