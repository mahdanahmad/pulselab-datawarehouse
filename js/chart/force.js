function createForce(data, activeSec) {
    d3.select(' #graph-canvas ').remove();
    let datasets    = _.chain(data);
    let nodeData    = datasets.flatMap((o) => (_.map(o.tags, (tag) => ( { tag : tag, count : o.count } ), []))).groupBy('tag').map((val, key) => ({name : key, count : _.sumBy(val, 'count')})).value();
    let linkData    = datasets.map('tags').flatMap((tags) => (_.reduce(tags, (result, value) => {
        let data    = [];
        if (_.size(result.tags) > 0) { _.forEach(result.tags, (o) => { data.push([o, value]); }); }
        return { data : _.concat((result['data'] || (result['data'] = [])), data), tags : _.concat(result['tags'] || (result['tags'] = []), value) };
    }, {}))['data']).groupBy((o) => (o)).map((val, key) => ({ source : key.split(',')[0], target : key.split(',')[1], count : _.size(val) })).value();

    let radiusrange = [15, 35];
    let linkrange   = [35, 15];
    let padding     = { top: 5, right: 15, bottom: 0, left: 15 };
    let width       = Math.floor($(' #sidebar-container ').outerWidth(true)) - padding.right - padding.left;
    let height      = Math.floor($(' #sidebar-container ').outerWidth(true)) - padding.top - padding.bottom;

    $(' #graph-container ').width(width);
    $(' #graph-container ').height(height);
    $(' #graph-container ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let sizeScale   = d3.scaleLinear().domain([_.minBy(nodeData, 'count').count, _.maxBy(nodeData, 'count').count]).range(radiusrange);
    let lengthScale = d3.scaleLinear().domain([_.minBy(linkData, 'count').count, _.maxBy(linkData, 'count').count]).range(linkrange);

    let forceSVG    = d3.select(' #graph-container ')
        .append('svg')
        .attr('id', 'graph-canvas')
        .attr('width', width)
        .attr('height', height);

    let simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.name; }).distance((d) => (lengthScale(d.count))))
        .force('collision', d3.forceCollide().radius(radiusrange[1]))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    let link = forceSVG.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(linkData)
        .enter().append('line')
            .attr('style', 'stroke: #999; stroke-opacity: 0.6;')
            .attr('stroke-width', '2');

    let node = forceSVG.append('g')
		.attr('class', 'nodes')
        .selectAll('.node')
        .data(nodeData)
        .enter().append('g')
			.attr('id', (d) => ('node-' + _.kebabCase(d.name)))
            .attr('class', (d) => ('node' + (_.includes(activeSec, d.name) ? ' nodes-selected' : '')));

    node.append('circle')
        .attr('id', (d) => ('circle-' + _.kebabCase(d.name)))
        .attr('class', (d) => ('circle-nodes'))
        .attr('r', (d) => (sizeScale(d.count) - .75))
		// .attr('fill', '#98df8a')
        .attr('style', 'cursor:pointer');
    node.append('text')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        // .attr('x', 0)
        .attr('y', 0)
        // .attr('y', (d) => (sizeScale(d.count) + 5))
        .attr('style', 'cursor:pointer')
        .text((o) => (o.name))
        .call(wrap, radiusrange[1] + 30);

    node.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.on('click', (o) => {
		// console.log(o);
        if ($( '#node-' + _.kebabCase(o.name) ).hasClass( 'nodes-selected' )) {
            $( '#node-' + _.kebabCase(o.name) ).removeClass( 'nodes-selected' );
            $(' #wrapper ').trigger('sector-change', ['remove', o.name]);
        } else {
            $( '#node-' + _.kebabCase(o.name) ).addClass( 'nodes-selected' );
            $(' #wrapper ').trigger('sector-change', ['add', o.name]);
        }
    });

    simulation
        .nodes(nodeData)
        .on('tick', ticked);

    simulation.force('link').links(linkData);

    function ticked() {
        link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

        node.attr('transform', function(d) { return 'translate(' + Math.max(radiusrange[1], Math.min(width - radiusrange[1], d.x)) + ',' + Math.max(radiusrange[1], Math.min(height - radiusrange[1], d.y)) + ')'; });
    }

    function dragstarted(d) {  if (!d3.event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(d) { d.fx = d3.event.x; d.fy = d3.event.y; }
    function dragended(d) { if (!d3.event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    function wrap(text, width) {
        text.each(function() {
            let text        = d3.select(this);
            let words       = text.text().split(/\s+/).reverse();
            let word;

            let y           = text.attr('y');
            let tspan       = text.text(null).append('tspan').attr('x', 0).attr('y', y);

            let line        = [];
            let lineNumber  = 0;
            let lineHeight  = 1; // ems
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line    = [word];
                    tspan   = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + 0 + 'em').text(word);
                }
            }
        });
    }

    $(' #wrapper ').on('sector-change', (event, state, sector) => {
        if (state == 'add') {
            $( '#node-' + _.kebabCase(sector) ).addClass( 'nodes-selected' );
        } else if (state == 'remove') {
            $( '#node-' + _.kebabCase(sector) ).removeClass( 'nodes-selected' );
        } else if (state == 'write') {
            $( '.node-nodes' ).removeClass( 'nodes-selected' );
            $( '#node-' + _.kebabCase(sector) ).addClass( 'nodes-selected' );
        }
    });
}
