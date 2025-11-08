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

// Update the HTML with GitHub data (GitHub-style layout)
if (profileStats) {
  profileStats.innerHTML = `
    <div class="github-stats">
      <div class="github-stat-item">
        <div class="github-stat-label">Followers</div>
        <div class="github-stat-value">${githubData.followers}</div>
      </div>
      <div class="github-stat-item">
        <div class="github-stat-label">Following</div>
        <div class="github-stat-value">${githubData.following}</div>
      </div>
      <div class="github-stat-item">
        <div class="github-stat-label">Public Repos</div>
        <div class="github-stat-value">${githubData.public_repos}</div>
      </div>
      <div class="github-stat-item">
        <div class="github-stat-label">Public Gists</div>
        <div class="github-stat-value">${githubData.public_gists}</div>
      </div>
    </div>
  `;
}
