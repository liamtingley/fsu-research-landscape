from pathlib import Path
from collections import Counter

import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_DIR = Path(__file__).resolve().parent / "data"


def build_network():
    edges = pd.read_csv(
        DATA_DIR / "paper_citation_links_within_fsu.csv",
        dtype=str
    ).dropna(subset=["paper_id_1", "paper_id_2"])

    works = pd.read_csv(
        DATA_DIR / "fsu_works_2021_2026.csv"
    ).fillna("")

    # Count repetitions of each directed edge.
    grouped_edges = (
        edges.groupby(["paper_id_1", "paper_id_2"])
        .size()
        .reset_index(name="value")
    )

    links = [
        {
            "source": str(row.paper_id_1),
            "target": str(row.paper_id_2),
            "value": int(row.value)
        }
        for row in grouped_edges.itertuples(index=False)
    ]

    node_ids = sorted(
        set(grouped_edges["paper_id_1"])
        | set(grouped_edges["paper_id_2"])
    )

    metadata = works.set_index("openalex_id").to_dict("index")

    # In-degree counts unique incoming citation edges.
    incoming = Counter(link["target"] for link in links)

    nodes = []

    for node_id in node_ids:
        paper = metadata.get(node_id, {})

        nodes.append({
            "id": str(node_id),
            "group": paper.get("primary_field") or "Unknown",
            "title": paper.get("title") or "Untitled work",
            "year": int(paper.get("publication_year") or 0),
            "venue": paper.get("venue") or "Unknown venue",
            "authors": paper.get("authors") or "Unknown authors",
            "global_citations": int(paper.get("cited_by_count") or 0),
            "internal_citations": incoming[node_id]
        })

    return {"nodes": nodes, "links": links}


@app.get("/api/network")
def network():
    return jsonify(build_network())


@app.get("/api/stats")
def stats():
    network = build_network()

    top_ten = sorted(
        network["nodes"],
        key=lambda node: (-node["global_citations"], node["id"])
    )[:10]

    return jsonify({
        "node_count": len(network["nodes"]),
        "edge_count": len(network["links"]),
        "directed": True,
        "ranking": "OpenAlex global citations among network nodes",
        "top_ten": top_ten
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)