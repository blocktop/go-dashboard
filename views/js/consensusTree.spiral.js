$(document).ready(() => {
  setupSVG()
  setFetchInterval()
})

var interval
function setFetchInterval () {
  interval = setInterval(fetchTree, 200)
}

function fetchTree () {
  $.get('http://localhost:3000/api/metrics/consensus/tree', res => {
    update(res)
  })
  // clearInterval(interval)
}

var root, maxBlockNumber, stratify, cluster, svg, height, width, g

function setupSVG() {
  svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + (height / 2 + 20) + ")");

  cluster = d3.cluster()
      .size([360, width / 2 - 120]);

  stratify = d3.stratify()
    .id(function(d) { return d.id; })
    .parentId(function(d) { return d.parentId; });
}

function update(res) {
  res.roots.forEach((r) => {
    if (r.children.length > 0) {
      root = r
    }
  })
  maxBlockNumber = parseInt(res.maxBlockNumber)
  root.parentId = null
  root.depth = maxBlockNumber - parseInt(root.blockNumber)
  var flat = [root]
  flatten(root)
  
  function flatten(node) {
    node.children.forEach((c) => {
      c.parentId = node.id
      c.depth = maxBlockNumber - parseInt(node.blockNumber)
      flat.push(c)
      flatten(c)
    })
  }

  var root = stratify(flat)
      .sort(function(a, b) { return a.depth > b.depth });

  cluster(root);

  var link = g.selectAll(".link")
      .data(root.descendants().slice(1))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + project(d.x, d.y)
            + "C" + project(d.x, (d.y + d.parent.y) / 2)
            + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
            + " " + project(d.parent.x, d.parent.y);
      });

  var node = g.selectAll(".node")
      .data(root.descendants())
    .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

  node.append("circle")
      .attr("r", 2.5);

  /*
  node.append("text")
      .attr("dy", "0.31em")
      .attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
      .style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; })
      .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
  */
}

function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
