import './style.css';
import { drawNetwork } from './network.js';

document.querySelector('#app').innerHTML = `
  <header>
    <h1>Citation Network Visualization in FSU (lt22m, Liam Tingley)</h1>
    <p>FSU-affiliated works, 2021–2026 | Sampled citation network</p>
  </header>
  <main>
    <div class="toolbar">
      <p id="status">Connecting to the Flask API...</p>
      <button id="fit" disabled>Fit all papers</button>
    </div>
    <p class="instructions">
      Scroll to zoom. Drag the background to pan. Drag a paper to move it.
      Hover over a paper for details.
    </p>
    <svg id="network" aria-label="FSU citation network"></svg>
    <p>Each node is a paper. Each line is a citation.
       Node size reflects citations received within this sampled network.</p>
  </main>
  <div id="tooltip" role="tooltip" hidden></div>
`;

async function getJSON(endpoint) {
  const response = await fetch(`http://127.0.0.1:5001${endpoint}`);
  if (!response.ok) {
    throw new Error(`${endpoint}: HTTP ${response.status}`);
  }
  return response.json();
}

async function start() {
  const status = document.querySelector('#status');

  try {
    const [data, stats] = await Promise.all([
      getJSON('/api/network'),
      getJSON('/api/stats'),
    ]);

    if (!data.nodes.length) {
      status.textContent = 'The API returned an empty network.';
      return;
    }

    const graph = drawNetwork(document.querySelector('#network'), data);

    status.textContent =
      `${stats.node_count.toLocaleString()} papers · ` +
      `${stats.edge_count.toLocaleString()} unique directed citations`;

    const fitButton = document.querySelector('#fit');
    fitButton.disabled = false;
    fitButton.addEventListener('click', graph.fit);
  } catch (error) {
    status.textContent =
      `Could not load the network: ${error.message}. ` +
      'Start the Flask backend with its data files, then refresh.';
  }
}

start();