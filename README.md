# Affinity Map

**Affinity Map** is an interactive network visualization tool that reveals hidden collaboration dynamics within large academic organizations. Rather than displaying a conventional organizational chart, it maps relationships between research laboratories based on shared affinities — advising, publication, and teaching — encoding collaboration strength through the visual weight of connections.

The project was developed as part of a PhD thesis at EPFL and later published as an open-access book. A live demonstration is available at [rodighiero.github.io/affinity-map](https://rodighiero.github.io/affinity-map/).

## How It Works

The visualization loads a JSON dataset describing nodes (laboratories or research units) and links (affinity-based relationships). A D3 force simulation positions nodes on a canvas, while arcs and chords represent the intensity of each collaboration type. Users can filter by affinity type, zoom, and pan to explore the network interactively.

The build pipeline uses Webpack and Babel, outputting to the `/docs` folder for GitHub Pages deployment.

## Data Format

The input `data.json` file contains:

- **affinities** — a list of collaboration types, each with a name, acronym, and display order
- **graph.nodes** — research units with metadata and per-affinity collaboration counts
- **graph.links** — pairwise connections with normalized metrics and computed visual widths

## References

This project is grounded in the following publications:

Rodighiero, Dario. 2018. "Mapping Affinities: Visualizing Academic Practice through Collaboration." PhD, École polytechnique fédérale de Lausanne (EPFL). https://doi.org/10.5075/epfl-thesis-8242.

Rodighiero, Dario, Frédéric Kaplan, and Boris Beaude. 2018. "Mapping Affinities in Academic Organizations." *Frontiers in Research Metrics and Analytics* 3 (4). https://doi.org/10.3389/frma.2018.00004.

Rodighiero, Dario. 2021. *Mapping Affinities: Democratizing Data Visualization*. Open-Access English edition. With Jeffrey Schnapp. Métis Presses. https://doi.org/10.37866/0563-99-9.

## License

GPL-3.0 — see [LICENSE](LICENSE).
