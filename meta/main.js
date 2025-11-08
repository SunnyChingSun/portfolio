import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Load and parse CSV data
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// Process commits data
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      
      let ret = {
        id: commit,
        url: 'https://github.com/SunnyChingSun/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    });
}

// Compute all stats from data
function computeStats(data, commits) {
  // Number of files
  const numFiles = d3.group(data, (d) => d.file).size;

  // File lengths
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file,
  );
  const maxFileLength = d3.max(fileLengths, (d) => d[1]);
  const longestFileData = d3.greatest(fileLengths, (d) => d[1]);
  const longestFile = longestFileData ? longestFileData[0] : 'N/A';
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

  // Line lengths
  const avgLineLength = d3.mean(data, (d) => d.length);
  const maxLineLength = d3.max(data, (d) => d.length);

  // Depths
  const maxDepth = d3.max(data, (d) => d.depth);
  const avgDepth = d3.mean(data, (d) => d.depth);
  const fileDepths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.depth),
    (d) => d.file,
  );
  const avgFileDepth = d3.mean(fileDepths, (d) => d[1]);

  // Time patterns
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => {
      const hour = d.datetime.getHours();
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    },
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1]);
  const mostWorkPeriod = maxPeriod ? maxPeriod[0] : 'N/A';

  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.datetime.getDay()];
    },
  );
  const maxDay = d3.greatest(workByDay, (d) => d[1]);
  const mostWorkDay = maxDay ? maxDay[0] : 'N/A';

  return {
    totalLOC: data.length,
    totalCommits: commits.length,
    numFiles,
    maxFileLength,
    longestFile,
    averageFileLength,
    avgLineLength,
    maxLineLength,
    maxDepth,
    avgDepth,
    avgFileDepth,
    mostWorkPeriod,
    mostWorkDay,
  };
}

// Render a single stat card
function renderStatCard(container, label, value, unit = '') {
  const card = container
    .append('div')
    .attr('class', 'stat-card');

  const dt = card
    .append('div')
    .attr('class', 'stat-label')
    .html(label);

  const dd = card
    .append('div')
    .attr('class', 'stat-value-wrapper');

  dd
    .append('span')
    .attr('class', 'stat-value')
    .text(value);

  if (unit) {
    dd
      .append('span')
      .attr('class', 'stat-unit')
      .text(' ' + unit);
  }
}

// Render commit info and stats
function renderCommitInfo(data, commits) {
  // Compute all stats
  const stats = computeStats(data, commits);

  // Create the container (using div instead of dl for better card structure)
  const container = d3.select('#stats').append('div').attr('class', 'stats');

  // Render each stat - GitHub style (simplified labels, no units for cleaner look)
  renderStatCard(container, 'Commits', stats.totalCommits);
  renderStatCard(container, 'Files', stats.numFiles);
  renderStatCard(container, 'Total LOC', stats.totalLOC);
  renderStatCard(container, 'Max Depth', stats.maxDepth);
  renderStatCard(container, 'Longest Line', stats.maxLineLength);
  renderStatCard(container, 'Max Lines', stats.maxFileLength);
  renderStatCard(container, 'Most Active Day', stats.mostWorkDay);
}

// Export stats computation for reuse
export { computeStats };

// Tooltip functions
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id.substring(0, 7);
  date.textContent = commit.datetime?.toLocaleDateString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });
  author.textContent = commit.author || 'Unknown';
  lines.textContent = commit.totalLines || 0;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.hidden = !isVisible;
  }
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    // Add offset to prevent tooltip from covering the cursor
    const offsetX = 15;
    const offsetY = 15;
    tooltip.style.left = `${event.clientX + offsetX}px`;
    tooltip.style.top = `${event.clientY + offsetY}px`;
  }
}

// Global variables for scales (needed for brush functionality)
let xScale, yScale, commitsData;

// Check if a commit is within the brush selection
function isCommitSelected(selection, commit) {
  if (!selection || !commit) {
    return false;
  }
  
  // Check if commit has required properties
  if (!commit.datetime || commit.hourFrac === undefined) {
    return false;
  }
  
  // Get commit position in pixel coordinates
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  
  // Selection is [[x0, y0], [x1, y1]] where (x0, y0) is top-left and (x1, y1) is bottom-right
  const [[x0, y0], [x1, y1]] = selection;
  
  // Check if point is within the selection rectangle
  // Note: y0 > y1 because SVG coordinates have y=0 at top
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

// Render selection count
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commitsData.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  if (countElement) {
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  }

  return selectedCommits;
}

// Render language breakdown
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commitsData.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (!container) return;

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const requiredCommits = selectedCommits.length ? selectedCommits : commitsData;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  // Sort breakdown by count (descending) for better display
  const sortedBreakdown = Array.from(breakdown).sort((a, b) => b[1] - a[1]);

  for (const [language, count] of sortedBreakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    // Create a div for each language item
    const item = document.createElement('div');
    item.className = 'language-item';
    item.innerHTML = `
      <div class="language-label">${language}</div>
      <div class="language-value">${count} lines (${formatted})</div>
    `;
    container.appendChild(item);
  }
}

// Brush event handler
function brushed(event) {
  const selection = event.selection;
  
  // Update selected state of circles (only those with commit data)
  // Select circles within the dots group to ensure we only target commit circles
  d3.selectAll('.dots circle').classed('selected', (d) => {
    // Safely check if commit is selected
    try {
      return isCommitSelected(selection, d);
    } catch (error) {
      console.warn('Error checking commit selection:', error, d);
      return false;
    }
  });
  
  // Update UI elements
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// Create brush selector
function createBrushSelector(svg, usableArea) {
  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);
  
  svg.call(brush);
  
  // Raise dots and everything after overlay to ensure tooltips work
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// Render scatter plot
function renderScatterPlot(data, commits) {
  // Store commits globally for brush functions
  commitsData = commits;
  
  // Define dimensions
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };

  // Define usable area
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Create SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Create scales (store globally for brush functions)
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  // Generate tick values for every 2 hours (0, 2, 4, ..., 22)
  // Note: Excluding 24 since it's the same as 0 (midnight)
  const yTickValues = d3.range(0, 23, 2); // [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  // Include 24 in gridlines for the top border
  const gridlineTickValues = [...yTickValues, 24];
  gridlines.call(d3.axisLeft(yScale).tickValues(gridlineTickValues).tickFormat('').tickSize(-usableArea.width));

  // Create color scale based on time of day
  // Bluer colors for night, orangish for daytime
  const colorScale = (hourFrac) => {
    // Map hour (0-24) to HSL color
    // Night (0-6, 22-24): blue tones (hue ~220)
    // Day (9-18): orange tones (hue ~30)
    // Transitions in between
    
    let hour = hourFrac;
    let hue, saturation, lightness;
    
    if (hour < 6 || hour >= 22) {
      // Night: blue tones
      hue = 220;
      saturation = 60;
      lightness = 45;
    } else if (hour < 9) {
      // Early morning: blue to orange transition
      let ratio = (hour - 6) / 3;
      hue = 220 - (220 - 30) * ratio;
      saturation = 60 + 20 * ratio;
      lightness = 45 + 15 * ratio;
    } else if (hour < 18) {
      // Daytime: orange tones
      if (hour < 12) {
        // Morning to noon: lighter orange
        let ratio = (hour - 9) / 3;
        hue = 30;
        saturation = 80;
        lightness = 60 - 10 * ratio;
      } else {
        // Afternoon: deeper orange
        let ratio = (hour - 12) / 6;
        hue = 30;
        saturation = 80;
        lightness = 50 - 5 * ratio;
      }
    } else {
      // Evening: orange to blue transition
      let ratio = (hour - 18) / 4;
      hue = 30 + (220 - 30) * ratio;
      saturation = 80 - 20 * ratio;
      lightness = 45 + 10 * (1 - ratio);
    }
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Calculate range of edited lines for radius scale
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  
  // Create square root scale for radius (ensures area is proportional to lines edited)
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  // Sort commits by total lines in descending order
  // This ensures smaller dots render on top of larger ones for better interaction
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Draw dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) => colorScale(d.hourFrac))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    });

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  
  // Format function for Y axis labels
  function formatHour(d) {
    if (d == null || d === undefined) return '';
    // Convert to number and round
    const num = typeof d === 'number' ? d : parseFloat(d);
    if (isNaN(num)) {
      console.warn('formatHour received NaN:', d);
      return '';
    }
    const hour = Math.round(num);
    // Clamp to valid range [0, 24]
    const clampedHour = Math.max(0, Math.min(24, hour));
    // Handle 24 as 0 (since 24:00 = 00:00)
    const displayHour = clampedHour === 24 ? 0 : clampedHour;
    // Format as HH:00 with leading zero
    const result = String(displayHour).padStart(2, '0') + ':00';
    return result;
  }
  
  const yAxis = d3
    .axisLeft(yScale)
    .tickValues(yTickValues)
    .tickFormat(formatHour);

  // Add X axis
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  const yAxisGroup = svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  
  // Adjust text positioning to ensure labels are fully visible
  yAxisGroup.selectAll('text')
    .attr('dx', '-0.5em') // Move text to the left of the axis line
    .style('text-anchor', 'end'); // Right-align text
  
  // Create brush selector (must be after dots are created)
  createBrushSelector(svg, usableArea);
}

// Main execution
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

