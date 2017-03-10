function createStacked(data, endDate, startDate, keys, activeKeys) {
    d3.select(' #stacked-svg ').remove();
    // let data    = _.chain(raw_data).map((o) => ({date : o['date'], data : _.filter(o['data'], (d) => (_.includes(activeKeys, d['freq'])))})).value()

    let dateFormat  = "%Y-%m-%_d";
    let legendHgt   = 30;
    let padding     = { top: 15, right: 15, bottom: 15, left: 15 };
    let width       = $(' #stacked-chart ').outerWidth(true) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) * 2 / 3) - $(' #radio-container ').outerHeight() - padding.top - padding.bottom - legendHgt;

    $(' #stacked-chart ').width(width);
    $(' #stacked-chart ').height(height + legendHgt);
    $(' #stacked-chart ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let d3DateParse = d3.timeParse(dateFormat);

    let colors      = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];

    let maxData     = _.chain(data).map((o) => (_.chain(o).get('data').map('val').sum().value())).max().value();
    if (maxData == 0) { maxData++; }

    let x           = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width]);
    let defaultx    = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width]);
    let y           = d3.scaleLinear().domain([-maxData, maxData]).range([height, 0]);

    let xAxis       = d3.axisTop(x).tickSize(12);

    let positiveArea    = d3.area().x((o) => (x(d3DateParse(o.date)))).y0((o) => (y(o.y0))).y1((o) => (y(o.y1)));
    let negativeArea    = d3.area().x((o) => (x(d3DateParse(o.date)))).y0((o) => (y(-o.y0))).y1((o) => (y(-o.y1)));

    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width, height]])
        .on("zoom", () => {
            var transform = d3.event.transform;
            x.domain(transform.rescaleX(defaultx).domain());
            d3.select(' .center-line ').call(xAxis);
            d3.selectAll(' path.positive-layer ').attr('d', (d) => (positiveArea(d.data)));
            d3.selectAll(' path.negative-layer ').attr('d', (d) => (negativeArea(d.data)));

        });

    var svg = d3.select(' #stacked-chart ').append('svg')
        .attr('id', 'stacked-svg')
        .attr('width', width)
        .attr('height', height + legendHgt);

    // svg.append('g')
    //     .attr('id', 'positive-container')
    //     .selectAll('.positive-layer')
    //     .data(data)
    //     .enter().append('path')
    //         .attr('class', (d) => ('positive-layer stacked-layers layer-' + d.state ))
    //         .attr('d', (d) => (positiveArea(d.data)))
    //         .attr('fill', (d) => (colors[_.indexOf(keys, d.state)]))
    //         .attr('stroke', (d) => (colors[_.indexOf(keys, d.state)]));
    //
    // svg.append('g')
    //     .attr('id', 'negative-container')
    //     .selectAll('.negative-layer')
    //     .data(data)
    //     .enter().append('path')
    //         .attr('class', (d) => ('negative-layer stacked-layers layer-' + d.state ))
    //         .attr('d', (d) => (negativeArea(d.data)))
    //         .attr('fill', (d) => (colors[_.indexOf(keys, d.state)]))
    //         .attr('stroke', (d) => (colors[_.indexOf(keys, d.state)]));

    let barwidth    = width / moment(endDate).diff(moment(startDate), 'days');
    svg.append("g")
        .selectAll("g")
        .data(data)
        .enter().append("g")
            .attr("transform", (d) => ("translate(" + x(d3DateParse(d.date)) + ",0)"))
            .selectAll("rect")
            .data((d) => (_.chain(d.data).filter((o) => (_.includes(activeKeys, o['freq']))).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['val'] + prev, freq : val['freq']}); return res;}, []).value()))
            .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d) => (y(d.curr)))
                .attr("height", (d) => (y(d.prev) - y(d.curr)))
                .attr("width", barwidth)
                .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                .attr("shape-rendering", "crispEdges");

    svg.append("g")
        .selectAll("g")
        .data(data)
        .enter().append("g")
            .attr("transform", (d) => ("translate(" + x(d3DateParse(d.date)) + ",0)"))
            .selectAll("rect")
            .data((d) => (_.chain(d.data).filter((o) => (_.includes(activeKeys, o['freq']))).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['val'] + prev, freq : val['freq']}); return res;}, []).value()))
            .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d) => (y(-d.prev)))
                .attr("height", (d) => (y(d.prev) - y(d.curr)))
                .attr("width", barwidth)
                .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                .attr("shape-rendering", "crispEdges");

    // svg.append("g")
    //     .selectAll("g")
    //     .data(data)
    //     .enter().append("g")
    //         .attr("fill", (d) => (colors[_.indexOf(keys, d.state)]))
    //         .attr("class", (d) => ('group-' + d.state))
    //         .selectAll("rect")
    //         .data((d) => (d.data))
    //         .enter().append("rect")
    //             .attr("x", (d) => (x(d3DateParse(d.date))))
    //             .attr("y", (d) => (y(d.y0)))
    //             .attr("height", (d) => (y(d.y0) - y(d.y1)))
    //             .attr("width", barwidth)
    //             .attr('shape-rendering', 'crispEdges');

    // centerLine
    svg.append('g')
        .attr('class', 'center-line')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .attr('width', width)
        .call(xAxis)
        .selectAll('text')
            // .attr('dx', 23)
            // .attr('dy', 12)
            .attr('class', 'noselect cursor-default');

    // svg.append('rect')
    //     .attr('id', 'zoom-pane')
    //     .attr('width', width)
    //     .attr('height', height + legendHgt)
    //     .attr('transform', 'translate(0,0)')
    //     .call(zoom);

    var legend  = svg.append('g')
        .attr('id', 'legend-group')
        .attr('transform', 'translate(' + (width * 2 / 3) + ', ' + (height + legendHgt - 20) + ')')
        .selectAll('.legend')
            .data(keys)
            .enter().append('g')
                .attr('class', 'legend noselect')
                .attr('transform', (o, i) => ('translate(' + (i * (width / 16))  + ', 0)'));

    legend.append('rect')
        .attr('class', (o) => ('rect-' + o + (_.includes(activeKeys, o) ? '' : ' fill-none')))
        .attr('fill', (o) => (colors[_.indexOf(keys, o)]))
        .attr('stroke', (o) => (colors[_.indexOf(keys, o)]))
        .attr('stroke-width', '1.5px')
        .on('click', (d) => {
            if ($( '.rect-' + d ).hasClass( 'fill-none' )) {
                $( '.rect-' + d ).removeClass( 'fill-none' );
                $(' #chart-container ').trigger('keys-change', ['add', d]);
            } else {
                $( '.rect-' + d ).addClass( 'fill-none' );
                $(' #chart-container ').trigger('keys-change', ['remove', d]);
            }

        });

    legend.append('text')
        .attr('y', 14)
        .attr('x', 23)
        .style('font-size', '12px')
        .attr('class', (o) => ('text-' + o))
        .text((o) => (_.upperFirst(o) + ' days'));
}
