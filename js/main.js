let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in MB)', value : 'filesize' },
];

let baseURL     = "http://139.59.230.55:3010/";
// let baseURL     = "http://localhost:3010/";

let frequencies = [];
// let freqColors  = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];
let freqColors  = [];
let activeFreq  = [];
let activeSec   = [];
let filter      = {
    type        : null,
}

let exclude     = ['China'];

let freqTimeout, secTimeout;
let freqTime	= 1000;
let secTime		= 1750;

$(' #wrapper ').on('sector-change', (event, state, sector) => {
    clearTimeout(secTimeout);

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    } else if (state == 'write') {
        activeSec   = [sector];
        createSwimlane(rangeData, activeSec, activeFreq, startDate, endDate);
    }

	secTimeout	= setTimeout(() => {
		let spinner     = new Spinner().spin(document.getElementById('root'));
		$(' #spinnerOverlay ').show();

		let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
		let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, false, false, true, true, () => {
			$(' #spinnerOverlay ').hide();
			spinner.stop();
		});
	}, secTime);

});

$(document).on('click', '.type-button', (e) => {
    let spinner     = new Spinner().spin(document.getElementById('root'));
    $(' #spinnerOverlay ').show();

    filter.type     = $(e.target).attr('value');
    $(' .type-active ').removeClass('type-active');
    $('#type-' + filter.type).addClass('type-active');

    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
	let numtags		= $( '#numtags-container' ).slider( 'value' );
	fetchData(numtags, startDate, endDate, true, false, true, false, () => {
        $(' #spinnerOverlay ').hide();
        spinner.stop();
    });
});

$(document).on('click', '.freq-button', (e) => {
	clearTimeout(freqTimeout);

    let selected    = _.toInteger($(e.target).attr('value'));
    if ($('#freq-' + selected).hasClass('freq-unactive')) {
        $('#freq-' + selected).removeClass('freq-unactive');
        activeFreq.push(selected);
    } else if (activeFreq.length > 1) {
        $('#freq-' + selected).addClass('freq-unactive');
        _.pull(activeFreq, selected);
    }

	freqTimeout	= setTimeout(() => {
		let spinner     = new Spinner().spin(document.getElementById('root'));
		$(' #spinnerOverlay ').show();

		let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
		let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, true, true, true, () => {
			$(' #spinnerOverlay ').hide();
			spinner.stop();
		});
	}, freqTime);

});

$(document).on('click', '#button-changer', (e) => {
    if ($(' #swimlane-chart ').is(":visible")) {
        $(' #swimlane-chart ').hide();
        $(' #datasets-wrapper ').show();

        $(' #button-changer ').html('See swimlane');
    } else {
        $(' #swimlane-chart ').show();
        $(' #datasets-wrapper ').hide();

        $(' #button-changer ').html('See datasets');
    }
});

function fetchData(numtags, startDate, endDate, isForce, isSwimlane, isStacked, isRedraw, callback) {
	async.waterfall([
		function (waterfallCallback) {
			$.get( baseURL + 'selector', { frequencies : JSON.stringify(activeFreq), datatype : filter.type, startDate, endDate, numtags }, (response) => {
				tagChain    = _.chain(response.result).flatMap('tags').uniq();

				if (tagChain.intersection(activeSec).size().value() == 0) {
					activeSec = [tagChain.sortBy().head().value()];
				} else {
					activeSec = tagChain.intersection(activeSec).value();
				}

				if (isForce) { createForce(response.result, activeSec); }
				if (isSwimlane) { createSwimlane(response.result, activeSec, startDate, endDate); }
				waterfallCallback(null, activeFreq, activeSec);
			});
		},
		function (localFreq, localSec, waterfallCallback) {
			if (isRedraw) {
				$.get( baseURL + 'datasets', { frequencies : JSON.stringify(activeFreq), tags : JSON.stringify(activeSec) }, (response) => {
					$(' #datasets-container ').html(
						_.map(response.result, (o, idx) => (
							"<div id='data-" + _.kebabCase(o.name) + "' class='data-container noselect cursor-default'>" +
								"<div class='data-title'><span>" + o.name + ".</span> Freq: " + o.frequency.join(',') + "</div>" +
								"<div class='data-tags'>" + _.chain(o.tags).map((t) => ("<div class='data-tag'>" + t + "</div>")).sortBy(_.size).value().join('') + "</div>" +
								"<div class='data-connect'></div>" +
							"</div>"
						)).join(''));
					waterfallCallback(null, activeFreq, activeSec);
				});
			} else {
				waterfallCallback(null, activeFreq, activeSec);
			}
		},
		function (localFreq, localSec, waterfallCallback) {
			if (isStacked) {
				$.get( baseURL + 'stacked', { frequencies : JSON.stringify(activeFreq), tags : JSON.stringify(activeSec), datatype : filter.type, startDate, endDate }, (response) => {
					createStacked(response.result, frequencies, freqColors);
					waterfallCallback(null);
				});
			} else {
				waterfallCallback(null);
			}
		},
	], (err) => { callback(); });
}

window.onload   = function() {
    let spinner     = new Spinner().spin(document.getElementById('root'));

    let stringType  = _.map(radio, (o) => ("<div id='type-" + o.value + "' class='type-button noselect cursor-pointer' value='" + o.value + "'>" + o.title + "</div>")).join('');
    $(' #types-container ').append(stringType);
    filter.type     = _.head(radio).value;
    $('#type-' + filter.type).addClass('type-active');

    let dateFormat  = 'dd MM yy';
    let dateConfig  = { showOtherMonths: true, selectOtherMonths: true, changeMonth: true, changeYear: true, dateFormat : dateFormat }
    let fromPicker  = $(' #startpicker ').datepicker(dateConfig);
    let untilPicker = $(' #endpicker ').datepicker(dateConfig);

    $(' #filter-wrapper ').height($(' #wrapper ').outerHeight(true) / 2);

    $(' #datasets-wrapper ').width($(' #chart-container ').outerWidth(true));
    $(' #datasets-wrapper ').height($(' #wrapper ').outerHeight(true) / 2 - 40);

    fromPicker.datepicker( 'setDate', moment().subtract(6, 'year').startOf('year').toDate() );
    untilPicker.datepicker( 'setDate', '0' );
    fromPicker.datepicker( 'option', 'maxDate', untilPicker.datepicker('getDate') );
    untilPicker.datepicker( 'option', 'minDate', fromPicker.datepicker('getDate') );

    fromPicker.on('change', () => {
        untilPicker.datepicker( 'option', 'minDate', fromPicker.datepicker('getDate') );

        redrawOnDatepickerChange();
    });

    untilPicker.on('change', () => {
        fromPicker.datepicker( 'option', 'maxDate', untilPicker.datepicker("getDate") );

        redrawOnDatepickerChange();
    });

	let numtagsValue	= 20;
	$( '#numtags-container' ).slider({
		value: numtagsValue,
		orientation: "horizontal",
      	range: "min",
		max:100,
		min:1,
		create: () => { $( '#numtags-handle' ).text( numtagsValue ); },
		slide: ( event, ui ) => { $( '#numtags-handle' ).text( ui.value ); },
		stop: ( event, ui ) => {
			let spinner     = new Spinner().spin(document.getElementById('root'));
			$(' #spinnerOverlay ').show();

			let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
			let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
			fetchData(ui.value, startDate, endDate, true, true, true, true, () => {
				$(' #spinnerOverlay ').hide();
				spinner.stop();
			});
		}
    });

    $.get( baseURL + 'config', (response) => {
        frequencies     = response.result.frequency;
        activeFreq      = _.chain(response.result.frequency).drop().take(6).value();

		freqColors		= _.times(frequencies.length, (o) => ('#' + Math.random().toString(16).substr(2,6)));

        let stringFreq  = _.map(frequencies, (o, idx) => ("<div id='freq-" + o + "' class='freq-button noselect cursor-pointer" + (_.includes(activeFreq, o) ? '' : ' freq-unactive') + "' style='background : " + freqColors[idx] + "; border-color : " + freqColors[idx] + "; color : " + freqColors[idx] + "' value='" + o + "'>" + o + "</div>"));
        $(' #frequency-container ').append(stringFreq);

        let startDate   = $.datepicker.formatDate('yy-mm-dd', fromPicker.datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', untilPicker.datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, true, true, true, () => {
            $(' #spinnerOverlay ').css('opacity', '0.7');
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    });

    function redrawOnDatepickerChange() {
        let spinner     = new Spinner().spin(document.getElementById('root'));
        $(' #spinnerOverlay ').show();

        let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, true, true, true, () => {
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    }
};
