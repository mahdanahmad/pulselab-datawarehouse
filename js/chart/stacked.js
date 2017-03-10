function createStacked(data, keys, freqColors) {
    $(' #spinnerOverlay ').show();
    d3.select(' #stacked-svg ').remove();

    let legendHgt   = 0;
    let padding     = { top: 15, right: 15, bottom: 15, left: 30 };
    let width       = Math.floor($(' #chart-container ').outerWidth(true) - padding.right - padding.left);
    let height      = Math.floor(($(' #wrapper ').outerHeight(true) / 2) - padding.top - padding.bottom - legendHgt);

    if (_.size(data.timeline) > 0) {
        let dateFormat  = "%Y-%m-%_d";
        let d3DateParse = d3.timeParse(dateFormat);

        let colors      = freqColors;
        let timeline    = data.timeline;
        let maxData     = data.maxData;

        let x           = d3.scaleTime().domain([d3DateParse(data.startDate), d3DateParse(data.endDate)]).range([0, width]);
        let y           = d3.scaleLinear().domain([-maxData, maxData]).range([height, 0]);

        let xAxis       = d3.axisTop(x).tickSize(5);
        let yAxis       = d3.axisLeft(y).tickSize(3).tickFormat((d) => (d3.format('')(Math.abs(d))));

        let svg = d3.select(' #stacked-chart ').append('svg')
            .attr('id', 'stacked-svg')
            .attr('width', width + padding.right + padding.left)
            .attr('height', height + padding.top + padding.bottom + legendHgt)
            .append("g")
                .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');

        let barwidth    = width / moment(data.endDate).diff(moment(data.startDate), 'days');
        svg.append("g")
            .selectAll("g")
            .data(timeline)
            .enter().append("g")
                .attr("transform", (d) => ("translate(" + x(d3DateParse(d._id)) + ",0)"))
                .selectAll("rect")
                .data((d) => (_.chain(d.data).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['c'] + prev, freq : val['f']}); return res;}, []).value()))
                .enter().append("rect")
                    .attr("x", 0)
                    .attr("y", (d) => (y(d.curr)))
                    .attr("height", (d) => (y(d.prev) - y(d.curr)))
                    .attr("width", barwidth)
                    .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                    .attr("stroke", (d) => (colors[_.indexOf(keys, d.freq)]))
                    .attr("shape-rendering", "crispEdges");

        svg.append("g")
            .selectAll("g")
            .data(timeline)
            .enter().append("g")
                .attr("transform", (d) => ("translate(" + x(d3DateParse(d._id)) + ",0)"))
                .selectAll("rect")
                .data((d) => (_.chain(d.data).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['c'] + prev, freq : val['f']}); return res;}, []).value()))
                .enter().append("rect")
                    .attr("x", 0)
                    .attr("y", (d) => (y(-d.prev)))
                    .attr("height", (d) => (y(d.prev) - y(d.curr)))
                    .attr("width", barwidth)
                    .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                    .attr("stroke", (d) => (colors[_.indexOf(keys, d.freq)]))
                    .attr("shape-rendering", "crispEdges");

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

        // leftAxis
        svg.append('g')
            .attr('class', 'left-line')
            .attr('transform', 'translate(0,0)')
            .attr('height', height)
            .call(yAxis)
            .selectAll('text')
                // .attr('dx', 23)
                // .attr('dy', 12)
                .attr('class', 'noselect cursor-default');

    } else {
        let fontsize    = 10;
        d3.select(' #stacked-chart ').append('svg')
            .attr('id', 'stacked-svg')
            .attr('width', width + padding.right + padding.left)
            .attr('height', height + padding.top + padding.bottom + legendHgt)
            .append('text')
                .text('No tag selected.')
                .attr('class', 'noselect cursor-default')
                .attr('x', (width - 75) / 2)
                .attr('y', (height - fontsize) / 2)
                .style('font-size', fontsize + 'px');
    }

    $(' #spinnerOverlay ').hide();
}
