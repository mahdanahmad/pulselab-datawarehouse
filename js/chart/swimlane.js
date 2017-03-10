function createSwimlane(data, activeSec, startDate, endDate) {
    d3.select(' #swimlane-canvas ').remove();
    let datasets    = _.chain(data).flatMap('tags').uniq();
    let sectorsLeft = datasets.difference(activeSec).sortBy().value();
    let activeLeft  = datasets.intersection(activeSec).sortBy().value();
	let localSec	= _.clone(activeLeft);

    if (activeLeft.length == 0) {
        $(' #wrapper ').trigger('sector-change', ['write', _.head(sectorsLeft)]);
    } else {
        let sectors     = _.concat(activeLeft, sectorsLeft);
        let dateFormat  = "%Y-%m-%_d";
        let padding     = { top: 5, right: 15, bottom: 10, left: 15 };
        let width       = Math.floor($(' #chart-container ').outerWidth(true)) - padding.right - padding.left;
        let height      = Math.floor($(' #wrapper ').outerHeight(true) / 2) - padding.top - padding.bottom;

        let axisHeight  = 25;
        let laneHeight  = 25;
        let sectorFont  = 14;
        let sectorWidth = 135;

        $(' #swimlane-chart ').width(width);
        $(' #swimlane-chart ').height(height);
        $(' #swimlane-chart ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

        let d3DateParse = d3.timeParse(dateFormat);
        let x           = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width - sectorWidth]);

        let swimlane    = d3.select(' #swimlane-chart ')
            .append('div')
            .attr('id', 'swimlane-canvas')
            .attr('width', width)
            .attr('height', height);

        swimlane.append('svg')
            .attr('id', 'ceil-axis-container')
            .attr('style', 'width: ' + (width) + 'px; height: ' + axisHeight + 'px')
            .append('g')
                .attr('transform', 'translate(' + sectorWidth + ', ' + (axisHeight - 5)  + ')')
                .attr('class', 'ceil-axis-svg')
                .attr('width', width - sectorWidth)
                .attr('height', axisHeight)
                .call(d3.axisTop(x).tickSize(12).tickFormat(d3.timeFormat('%b %Y')))
                .selectAll('text')
                    .attr('dx', -23)
                    .attr('dy', 12)
                    .attr('class', 'noselect cursor-default');

        let floorLane   = swimlane.append('div')
            .attr('id', 'floor-lane-container')
            .attr('style', 'width: ' + width + 'px; height: ' + (height - axisHeight) + 'px; overflow-y : auto;')
            .append('svg')
                .attr('width', width)
                .attr('height', (_.size(sectors) * laneHeight))
                .attr('id', 'floor-lane-svg');

        let swimlanePaths   = {};
        _.forEach(data, (o) => {
            _.forEach(o.data, (d) => {
                _.forEach(o.tags, (t) => {
                    if (_.isNil(swimlanePaths[t])) { swimlanePaths[t] = d3.path(); }

                    swimlanePaths[t].moveTo(sectorWidth + x(d3DateParse(moment(d.s).isAfter(startDate) ? d.s : startDate)), (laneHeight * 0.5));
                    swimlanePaths[t].lineTo(sectorWidth + x(d3DateParse(moment(moment(d.e).isBefore(endDate) ? d.e : endDate).add(1, 'd').format('YYYY-MM-DD'))), (laneHeight * 0.5));
                })
            });
        });

        let separatorPath   = d3.path();
        _.forEach(sectors, (sector, idx) => {
            separatorPath.moveTo(sectorWidth, ((idx + 1) * laneHeight));
            separatorPath.lineTo(width, ((idx + 1) * laneHeight));
        });
        separatorPath.closePath();
        floorLane.append('path').attr('d', separatorPath.toString()).attr('id', 'separator-line');

        let groups  = floorLane.selectAll(' g.sector-groups ')
            .data(sectors)
            .enter().append('g')
                .attr('class', 'sector-groups')
                .attr('id', (d) => ('group-' + _.kebabCase(d)))
                .attr('transform', (d, i) => ('translate(0,' + (i * laneHeight) + ')'));

        groups.append('text')
            .text((d) => (d))
            .attr('class', 'lane-sector noselect cursor-default')
            .attr('x', 5)
            .attr('y', 17)
            .style('font-size', sectorFont + 'px');

        groups.append('rect')
            .attr('id', (d) => ('select-' + _.kebabCase(d)))
            // .attr('class', (d) => ('floor-lane' + (_.includes(activeSec, d) ? ' floor-lane-selected' : '')))
            .attr('fill', 'transparent')
            .attr('width', width)
            .attr('height', laneHeight);

        groups.append('path')
			.attr('d', (d) => (swimlanePaths[d].toString()))
			.attr('id', (d) => ('swimlane-' + _.kebabCase(d)))
			.attr('class', (d) => ('swimlane-lane' + (_.includes(activeSec, d) ? ' swimlane-selected' : '')));

        groups.on('click', (o) => {
            if ($( '#swimlane-' + _.kebabCase(o) ).hasClass( 'swimlane-selected' )) {
                $( '#swimlane-' + _.kebabCase(o) ).removeClass( 'swimlane-selected' );
                $(' #wrapper ').trigger('sector-change', ['remove', o]);

                redrawOrder('remove', o);
            } else {
                $( '#swimlane-' + _.kebabCase(o) ).addClass( 'swimlane-selected' );
                $(' #wrapper ').trigger('sector-change', ['add', o]);

                redrawOrder('add', o);
            }
        });

        $(' #wrapper ').on('sector-change', (event, state, sector) => {
            if (state == 'add') {
                $( '#swimlane-' + _.kebabCase(sector) ).addClass( 'swimlane-selected' );

                redrawOrder(state, sector);
            } else if (state == 'remove') {
                $( '#swimlane-' + _.kebabCase(sector) ).removeClass( 'swimlane-selected' );

                redrawOrder(state, sector);
            }
        });

        function redrawOrder(state, sector) {
			if (state == 'add') {
				localSec	= _.chain(localSec).concat(sector).uniq().value();
			} else if (state == 'remove') {
				localSec	= _.chain(localSec).pull(sector).uniq().value();
			}

            _.chain(localSec).sortBy().concat(_.chain(sectors).difference(localSec).sortBy().value()).forEach((o, i) => {
                d3.select('#group-' + _.kebabCase(o) ).attr('transform', ('translate(0,' + (i * laneHeight) + ')'));
            }).value()
        }
    }
}
