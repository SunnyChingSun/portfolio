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
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' }
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

// Create simple footer with logo and social links
const BASE_PATH_FOOTER = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/";

let footer = document.createElement('footer');
footer.innerHTML = `
  <div class="footer-content">
    <div class="footer-social">
      <a href="mailto:sunnychingsun@gmail.com" aria-label="Email" class="social-link">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </a>
      <a href="https://github.com/SunnyChingSun" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="social-link">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
      </a>
      <a href="https://www.linkedin.com/in/sunnychingsun" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="social-link">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      </a>
      <a href="${BASE_PATH_FOOTER}" class="footer-logo">
      <img src="${BASE_PATH_FOOTER}images/sun.gif" alt="Sunny Sun" class="footer-logo-img">
    </a>
      <p class="footer-copyright">© Sunny Sun | 2025</p>
    </div>
    
  </div>
`;
document.body.append(footer);

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
    let image = project.image || 'https://vis-society.github.io/labs/2/images/empty.svg';
    
    // Fix image path for local development vs GitHub Pages
    if (image.startsWith('../images/')) {
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (isLocal) {
        image = image.replace('../', '');
      } else {
        image = image.replace('../', '/portfolio/');
      }
    }
    
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
