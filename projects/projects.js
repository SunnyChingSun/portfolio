import { fetchJSON, renderProjects } from '../global.js';

// Fetch project data from JSON file
const projects = await fetchJSON('../lib/projects.json');

// Select the projects container
const projectsContainer = document.querySelector('.projects');

// Render the projects
renderProjects(projects, projectsContainer, 'h2');

// Add project count to the page title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects.length > 0) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}
