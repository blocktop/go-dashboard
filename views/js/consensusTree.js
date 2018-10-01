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

var diagonal, tree, root, svg, g, t, x, width, height
var size = 3
var depthFactor = 10
var text = false

function setupSVG () {
  var margin = {top: 40, right: 120, bottom: 20, left: 120}
  width = 1060 - margin.right - margin.left
  height = 700 - margin.top - margin.bottom

  x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1, .3);

  tree = d3.layout.tree()
    .size([height, width])

  diagonal = d3.svg.diagonal()
    .projection(function (d) {
      return [d.x + size/2, d.y]
    })

  t = d3.transition()
    .duration(500).ease('cubic')

  d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
  };

  svg = d3.select('body').append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
  g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
}

function update (source) {
  root = source.roots[0]
  if (source.roots.length > 1) {
    for (var i = 1; i < source.roots.length; i++) {
      if (source.roots[i].children.length > 0) {
        root = source.roots[i]
        break
      }
    }
  }
  root = {
    id: '0',
    name: 'consensus',
    children: [root]
  }

  // set qualified nodes in center of tree
  //arrange(root) 
  function arrange(node) {
    var arranged = new Array(node.children.length)
    var beginning = 0
    var end = node.children.length - 1
    var qualified = node.children.filter((n) => !n.isDisqualified)
    var centerCount = qualified.length
    var center1 = Math.ceil(end / 2 - centerCount / 2)
    var center2 = center1 + centerCount - 1
    node.children.forEach((n, i) => {
      if (n.isDisqualified) {
        if (end > center2) {
          arranged[end--] = n
        } else if (beginning < center1) {
          arranged[beginning++] = n
        } else {
          console.log('should not happen')
          arranged[center1] = n
        }
      } else {
        arranged[center1++] = n
      }
    })
    node.children = arranged
    node.children.forEach((n) => arrange(n))
  }

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse()
  var links = tree.links(nodes)

  var dx
  // Normalize for fixed-depth.
  nodes.forEach(function (d) {
    d.y = d.depth * depthFactor
    if (d.id === '0') {
      dx = width/2 - d.x
    }
  })

  // Declare the nodes…
  var node = g.selectAll('g.node')
    .data(nodes, function (d) {
      d.x += dx
      return d.id
    })

  // update
  node
    .attr('class', function (d) {
      return 'node' + getClasses(d)
    })
    .transition(t)
    .attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')'
    })

  // Enter the nodes.
  var nodeG = node.enter().append('g')
    .attr('class', function (d) {
      return 'node' + getClasses(d)
    })
    .attr('transform', function (d) {
      var x, y
      if (d.parent && d.parent.x0) {
        x = d.parent.x0
        y = d.parent.y0
      } else {
        x = d.x
        y = d.y
      }
      return 'translate(' + x + ',' + y + ')'
    })
  nodeG.append('circle')
    .attr('cx', size/2)
    .attr('cy', size/2)
    .attr('r', size)
    .attr('class', function (d) {
      return 'node' + getClasses(d)
    })
  if (text) {
  nodeG.append('text')
    .attr("x", size / 2)
    .attr("y", size / 2)
    .attr("dy", ".01em")
    //.attr("text-anchor", "middle")
    .style('stroke-width', 1)
    .style('margin-left', 3)
    .text(function (d) { return d.name })
    .call(wrap, rectW * 0.9)
  }
  nodeG.transition(t)
    .style('fill-opacity', 1)
    .style('stroke-opacity', 1)
    .attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')'
    })

  // exit
  var nodeExit = node.exit().remove()

     // Stash the old positions for transition.
  nodes.forEach(function (d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Declare the links…
  var link = g.selectAll('path.link')
    .data(links, function (d) {
      return d.target.id
    })

  // update
  link
    .attr('class', function (d) {
      return 'link' + getClasses(d)
    })
    .transition(t)
    .attr('d', diagonal)

  // Enter the links.
  link.enter().insert('path')
    .attr('class', function (d) {
      return 'link' + getClasses(d.target)
    })
    .attr('d', diagonal)
    .moveToBack()
    .transition(t)
    .style('fill-opacity', 1)
    .style('stroke-opacity', 1)

  // exit
  link.exit().remove()
}

function getClasses (d) {
  var classes = ''
  if (d.isLocal) {
    classes += ' local'
  }
  if (d.isDisqualified) {
    classes += ' disqualified'
  }
  return classes
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 3).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan.attr("y", y - size/8)
        tspan = text.append("tspan").attr("x", 3).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}