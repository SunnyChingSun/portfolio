import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Fetch project data from JSON file
const projects = await fetchJSON('../lib/projects.json');

// Select the projects container
const projectsContainer = document.querySelector('.projects');

// Add project count to the page title
const projectsTitle = document.querySelector('.projects-title');

// Create arc generator
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Create color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Track selected year for filtering
let selectedYear = null;

// Track search query
let query = '';

// Function to render the pie chart (always uses ALL projects)
function renderPieChart() {
  // Clear existing paths and legend
  d3.select('#projects-pie-plot').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();
  
  // Re-calculate rolled data from ALL projects
  let newRolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
  );
  
  // Re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  
  // Re-calculate slice generator and arc data
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  
  // Get SVG reference
  let svg = d3.select('#projects-pie-plot');
  
  // Draw pie chart
  newArcData.forEach((d, idx) => {
    let year = d.data.label;
    let count = d.data.value;
    svg
      .append('path')
      .attr('d', newArcs[idx])
      .attr('fill', colors(idx))
      .attr('data-year', year)
      .attr('data-count', count)
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        updateSelection();
        filterProjects();
      });
  });
  
  // Create legend using D3
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color: ${colors(idx)}`)
      .attr('data-year', d.label)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        updateSelection();
        filterProjects();
      });
  });
  
  // Update selection after rendering
  updateSelection();
}

// Update selection highlighting on pie slices and legend
function updateSelection() {
  // Update pie slices based on selectedYear
  d3.select('#projects-pie-plot')
    .selectAll('path')
    .classed('selected', function() {
      const year = d3.select(this).attr('data-year');
      return selectedYear === year;
    });
  
  // Update legend items based on selectedYear
  d3.select('.legend')
    .selectAll('li')
    .classed('selected', function() {
      const year = d3.select(this).attr('data-year');
      return selectedYear === year;
    });
}

// Function to filter and render projects
function filterProjects() {
  let filteredProjects = projects;
  
  // Filter by search query
  if (query) {
    filteredProjects = filteredProjects.filter(project => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  
  // Filter by selected year if a wedge is selected
  if (selectedYear) {
    filteredProjects = filteredProjects.filter(project => project.year === selectedYear);
  }
  
  // Re-render projects (filtered list below chart)
  renderProjects(filteredProjects, projectsContainer, 'h2');
  
  // Update title
  if (projectsTitle) {
    projectsTitle.textContent = `Projects (${filteredProjects.length})`;
  }
}

// Call this function on page load
renderPieChart();
filterProjects();

// Search functionality
const searchInput = document.querySelector('.searchBar');

searchInput?.addEventListener('input', (event) => {
  // Update query value
  query = event.target.value;
  
  // Filter and re-render projects
  filterProjects();
});
