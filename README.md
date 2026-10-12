# FSU Research Landscape

Liam Tingley | lt22m | CIS4930 Assignment 1

An analysis of FSU-affiliated works published during 2021–2026,
using OpenAlex, Python, Flask, and D3.js.

## Data

The works dataset contains 27,089 records. All six yearly counts
matched an independent OpenAlex API query.

Citation references are collected for 5,000 randomly sampled works,
without replacement, using seed 42. Internal links require both
papers to belong to the downloaded FSU dataset. This is a sampled
network, and 2026 is an incomplete publication year.

## Project structure

- hello.ipynb: data collection, cleaning, statistics, and Python visualizations.
- backend/app.py: Flask API.
- backend/data/: generated CSV files for the API.
- frontend/src/main.js: page and API requests.
- frontend/src/network.js: D3 graph and interactions.
- frontend/src/style.css: FSU styling.
- figures/: saved charts.

The notebook and generated data will be added after collection
and final execution.

## Run locally

Activate the Python environment and install backend dependencies:

```bash
conda activate dvjupyter
python -m pip install -r backend/requirements.txt
```

Place these files in backend/data/:

- fsu_works_2021_2026.csv
- paper_citation_links_within_fsu.csv

Start the backend from the project root:

```bash
python backend/app.py
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

## API

- GET /api/network: paper metadata and directed citation links.
  Link values count repeated occurrences of each citation pair.
- GET /api/stats: unique node and directed-edge counts, plus the
  ten network papers with the highest global OpenAlex citation counts.

CSV loading and aggregation happen on the backend. The frontend
fetches JSON from the API.

## Interactions

Scroll to zoom, drag the background to pan, and drag individual
papers to move them. The graph fits all nodes after the simulation
settles. Hover tooltips show titles, years, venues, and authors.

Nodes use FSU garnet (#782F40). Their size reflects incoming citations
within the sampled network.

## Excluded files

Raw JSONL, citation caches, node_modules, build output, virtual
environments, and secrets are excluded from Git and the submission.
