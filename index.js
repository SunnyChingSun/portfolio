import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Fetch all project data
const projects = await fetchJSON('./lib/projects.json');

// Get the first 3 projects (latest)
const latestProjects = projects.slice(0, 3);

// Select the projects container on the home page
const projectsContainer = document.querySelector('.projects');

// Render the latest projects with h2 headings
renderProjects(latestProjects, projectsContainer, 'h2');

// Step 3: Fetch GitHub data
const githubData = await fetchGitHubData('SunnyChingSun');

// Select the profile stats container
const profileStats = document.querySelector('#profile-stats');

// Update the HTML with GitHub data
if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}
