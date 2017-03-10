function createSwimlane(data) {
    let dateFormat  = "%Y-%m-%_d";
    let padding     = { top: 5, right: 15, bottom: 0, left: 15 };
    let width       = $(' #swimlane-container ').outerWidth(true) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) / 3) - padding.top - padding.bottom;

    let axisHeight  = 20;
    let laneHeight  = 25;
    let sectorFont  = 10;
    let sectorWidth = 100;

    $(' #swimlane-container ').width(width);
    $(' #swimlane-container ').height(height);
    $(' #swimlane-container ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let d3DateParse = d3.timeParse(dateFormat);
    let x           = d3.scaleTime().domain([d3DateParse(data.startDate), d3DateParse(data.endDate)]).range([0, width - sectorWidth]);
    let sectors     = _.chain(data.data).keys().sortBy().value();

    $(' #swimlane-container ').trigger('sector-change', [_.head(sectors)]);

    d3.select(' #swimlane-container ').append('svg')
        .attr('id', 'ceil-axis-container')
        .attr('style', 'width: ' + (width) + 'px; height: ' + axisHeight + 'px')
        .append('g')
            .attr('transform', 'translate(' + sectorWidth + ', ' + (axisHeight - 2)  + ')')
            .attr('class', 'ceil-axis-svg')
            .attr('width', width - sectorWidth)
            .attr('height', axisHeight)
            .call(d3.axisTop(x).tickSize(12).tickFormat(d3.timeFormat('%b %Y')))
            .selectAll('text')
                .attr('dx', -23)
                .attr('dy', 12)
                .attr('class', 'noselect cursor-default');

    let floorLane   = d3.select(' #swimlane-container ').append('div')
        .attr('id', 'floor-lane-container')
        .attr('style', 'width: ' + width + 'px; height: ' + (height - axisHeight) + 'px; overflow-y : auto;')
        .append('svg')
            .attr('width', width)
            .attr('height', (_.size(sectors) * laneHeight))
            .attr('id', 'floor-lane-svg')
            .on('mousedown', () => {
                let point   = d3.mouse(d3.select(' #floor-lane-svg ').node());
                let idx = _.floor(point[1] / laneHeight);
                $(' #swimlane-container ').trigger('sector-change', [_.nth(sectors, idx)]);

                d3.select('#floor-lane-selected').attr('transform', 'translate(0, ' + (idx * laneHeight) + ')');
            });;

    floorLane.append('g')
        .attr('class', 'noselect cursor-default')
        .attr('transform', 'translate(10, 10)')
        .selectAll('.lane-sector')
        .data(sectors)
        .enter().append('text')
            .text((o) => (o))
            .attr('class', 'lane-sector')
            .attr('x', 0)
            .attr('y', (o) => ((_.indexOf(sectors, o) * laneHeight) + 5))
            .style('font-size', sectorFont + 'px');

    let separatorPath   = d3.path();
    _.forEach(sectors, (sector, idx) => {
        separatorPath.moveTo(sectorWidth, ((idx + 1) * laneHeight));
        separatorPath.lineTo(width, ((idx + 1) * laneHeight));
    });
    separatorPath.closePath();
    floorLane.append('path').attr('d', separatorPath.toString()).attr('id', 'separator-line');

    let swimlanePath    = d3.path();
    _.forEach(data.data, (val, sector) => {
        _.forEach(val, (timerange) => {
            swimlanePath.moveTo(sectorWidth + x(d3DateParse(timerange.start)), _.indexOf(sectors, sector) * laneHeight + (laneHeight * 0.5));
            swimlanePath.lineTo(sectorWidth + x(d3DateParse(timerange.end)), _.indexOf(sectors, sector) * laneHeight + (laneHeight * 0.5));
        });
    });
    swimlanePath.closePath();
    floorLane.append('path').attr('d', swimlanePath.toString()).attr('id', 'swimlane-lane');

    floorLane.append('rect')
        .attr('id', 'floor-lane-selected')
        .attr('width', width)
        .attr('height', laneHeight)
        .attr('transform', 'translate(0,0)');

}
