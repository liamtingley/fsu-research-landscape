import * as d3 from 'd3';

export function drawNetwork(svgElement, data) {
  const width = svgElement.clientWidth || 1000;
  const height = svgElement.clientHeight || 650;
  const svg = d3.select(svgElement);

  svg.selectAll('*').remove();
  svg.attr('viewBox', [0, 0, width, height]);

  // D3 modifies these objects, so work with copies.
  const nodes = data.nodes.map(node => ({
    ...node,
    id: String(node.id),
  }));
  const links = data.links.map(link => ({
    ...link,
    source: String(link.source),
    target: String(link.target),
  }));

  const container = svg.append('g');
  const tooltip = document.querySelector('#tooltip');

  const zoom = d3.zoom()
    .scaleExtent([0.01, 15])
    .on('zoom', event => {
      container.attr('transform', event.transform);
      tooltip.hidden = true;
    });

  svg.call(zoom);

  const lines = container.append('g')
    .attr('stroke', '#777')
    .attr('stroke-opacity', 0.35)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', link => Math.sqrt(link.value));

  const circles = container.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', node =>
      3 + Math.min(7, Math.sqrt(node.internal_citations || 0))
    )
    .attr('fill', '#782F40')
    .attr('fill-opacity', 0.8)
    .attr('stroke', 'white')
    .attr('stroke-width', 0.6);

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(node => node.id)
      .distance(35))
    .force('charge', d3.forceManyBody().strength(-25))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2).strength(0.03))
    .force('y', d3.forceY(height / 2).strength(0.03))
    .force('collision', d3.forceCollide()
      .radius(node =>
        4 + Math.min(7, Math.sqrt(node.internal_citations || 0))
      ));

  simulation.on('tick', () => {
    lines
      .attr('x1', link => link.source.x)
      .attr('y1', link => link.source.y)
      .attr('x2', link => link.target.x)
      .attr('y2', link => link.target.y);

    circles
      .attr('cx', node => node.x)
      .attr('cy', node => node.y);
  });

  circles.call(d3.drag()
    .on('start', (event, node) => {
      tooltip.hidden = true;
      if (!event.active) simulation.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on('drag', (event, node) => {
      node.fx = event.x;
      node.fy = event.y;
    })
    .on('end', (event, node) => {
      if (!event.active) simulation.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }));

  function moveTooltip(event) {
    tooltip.style.left =
      `${Math.max(12, Math.min(event.clientX + 14, window.innerWidth - 340))}px`;
    tooltip.style.top =
      `${Math.max(12, Math.min(event.clientY + 14, window.innerHeight - 300))}px`;
  }

  circles
    .on('mouseenter', (event, node) => {
      const title = node.title.length > 220
        ? node.title.slice(0, 220) + '…'
        : node.title;

      tooltip.textContent = [
        title,
        `Year: ${node.year}`,
        `Venue: ${node.venue}`,
        `Authors: ${node.authors.slice(0, 350)}`,
        `Primary field: ${node.group}`,
        `Global citations: ${node.global_citations}`,
        `Sampled internal citations: ${node.internal_citations}`,
      ].join('\n');

      tooltip.hidden = false;
      moveTooltip(event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', () => { tooltip.hidden = true; });

  function fit() {
    const [minX, maxX] = d3.extent(nodes, node => node.x);
    const [minY, maxY] = d3.extent(nodes, node => node.y);

    const graphWidth = Math.max(1, maxX - minX + 40);
    const graphHeight = Math.max(1, maxY - minY + 40);
    const scale = Math.max(
      0.01,
      Math.min(5, width / graphWidth, height / graphHeight) * 0.9
    );

    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-(minX + maxX) / 2, -(minY + maxY) / 2);

    svg.transition().duration(600).call(zoom.transform, transform);
  }

  // Fit automatically once the initial simulation settles.
  let fitted = false;
  simulation.on('end', () => {
    if (!fitted) {
      fit();
      fitted = true;
    }
  });

  return { fit };
}