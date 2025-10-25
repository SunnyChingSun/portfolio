console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Get all nav links
let navLinks = $$("nav a");

// Find the link to the current page
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

// Add the current class to the current page link
currentLink?.classList.add('current');

// Define pages array
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'cv/', title: 'CV' },
  { url: 'contact/', title: 'Contact' }
];

// Create nav element and prepend to body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Define BASE_PATH for local vs GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";       // GitHub Pages repo name

// Create links dynamically
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  // Adjust URL for BASE_PATH
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }
  
  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Add current class if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );
  
  // Add target="_blank" for external links
  a.target = a.host !== location.host ? '_blank' : '';
  
  // Add link to nav
  nav.append(a);
}

// Add dark mode switcher HTML
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`,
);

// Get reference to the select element
let select = document.querySelector('select');

// Function to set color scheme
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  // Add class for additional CSS targeting
  document.documentElement.classList.toggle('dark-mode', colorScheme === 'dark');
}

// Add event listener for color scheme changes
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  setColorScheme(event.target.value);
  localStorage.colorScheme = event.target.value;
});

// Load saved preference on page load
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
  select.value = localStorage.colorScheme;
}

// Step 5: Better contact form
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Get reference to the form element
  let form = document.querySelector('form');
  
  console.log('Form found:', form);
  
  if (form) {
    // Add event listener for form submission with proper URL encoding
    form.addEventListener('submit', function(event) {
      console.log('Form submitted!');
      // Prevent default form submission
      event.preventDefault();
      
      // Create FormData object from the form
      let data = new FormData(form);
      
      // Build URL parameters with proper encoding
      let url = form.action + "?";
      let params = [];
      
      for (let [name, value] of data) {
        console.log('Form field:', name, '=', value);
        params.push(name + "=" + encodeURIComponent(value));
      }
      
      url += params.join("&");
      console.log('Final URL:', url);
      
      // Open the mailto URL
      window.location.href = url;
    });
  }
});


export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return [];
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Clear existing content
  containerElement.innerHTML = '';
  
  // Validate parameters
  if (!Array.isArray(projects)) {
    console.error('Projects must be an array');
    return;
  }
  
  if (!containerElement) {
    console.error('Container element is required');
    return;
  }
  
  // Validate heading level
  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) {
    console.warn(`Invalid heading level: ${headingLevel}. Using h2 instead.`);
    headingLevel = 'h2';
  }
  
  // Render each project
  projects.forEach(project => {
    const article = document.createElement('article');
    
    // Handle missing data gracefully
    const title = project.title || 'Untitled Project';
    const image = project.image || 'https://vis-society.github.io/labs/2/images/empty.svg';
    const description = project.description || 'No description available.';
    const year = project.year || 'Unknown';
    
    article.innerHTML = `
      <${headingLevel}>${title}</${headingLevel}>
      <img src="${image}" alt="${title}">
      <div class="project-year">${year}</div>
      <p>${description}</p>
    `;
    
    containerElement.appendChild(article);
  });
}

// Step 3: GitHub API functions
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
