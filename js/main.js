let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in MB)', value : 'filesize' },
];
let datasources	= [
	{ title : 'data.humdata.org', value : 'data.humdata.org' },
	{ title : 'data.go.id', value : 'data.go.id' },
];

// let baseURL     = "http://139.59.230.55:3010/";
let baseURL     = "http://localhost:3010/";

let frequencies = [];
// let freqColors  = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];
let freqColors  = [];
let activeFreq  = [];
let activeSec   = [];
let freqLimt	= 5;
let filter      = {
    type        : null,
	source		: null,
}

let freqTimeout, secTimeout;
let freqTime	= 1000;
let secTime		= 1750;

let dialog;

$(' #wrapper ').on('sector-change', (event, state, sector) => {
    clearTimeout(secTimeout);

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    }

	secTimeout	= setTimeout(() => {
		let spinner     = new Spinner().spin(document.getElementById('root'));
		$(' #spinnerOverlay ').show();

		let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
		let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, false, false, true, true, null, () => {
			$(' #spinnerOverlay ').hide();
			spinner.stop();
		});
	}, secTime);

});

$(document).on('click', '.source-button', (e) => {
		let target	= $(e.target).attr('value');

		if (_.includes(filter.source, target)) {
			if (filter.source.length > 1) {
				_.pull(filter.source, target);
				$('#source-' + _.kebabCase(target)).removeClass('source-active');

				initData(() => {});
			}
		} else {
			filter.source.push(target);
			$('#source-' + _.kebabCase(target)).addClass('source-active');

			initData(() => {});
		}

});

$(document).on('click', '.type-button', (e) => {
	if (filter.type !== $(e.target).attr('value')) {
		let spinner     = new Spinner().spin(document.getElementById('root'));
		$(' #spinnerOverlay ').show();

		filter.type     = $(e.target).attr('value');
		$(' #types-container .type-active ').removeClass('type-active');
		$('#type-' + filter.type).addClass('type-active');

		let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
		let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, false, true, false, null, () => {
			$(' #spinnerOverlay ').hide();
			spinner.stop();
		});
	}
});

$(' #wrapper ').on('click', '.freq-button:not(#freq-showmore)', (e) => {
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
		fetchData(numtags, startDate, endDate, true, true, true, true, null, () => {
			$(' #spinnerOverlay ').hide();
			spinner.stop();
		});
	}, freqTime);
});

$(' #dialog ').on('click', '.freq-button:not(#freq-showmore)', (e) => {
    let selected    = _.toInteger($(e.target).attr('value'));
	if ($('#dialog #freq-' + selected).hasClass('freq-unactive')) {
		$('#dialog #freq-' + selected).removeClass('freq-unactive');
	} else {
		$('#dialog #freq-' + selected).addClass('freq-unactive');
	}
});

$(document).on('click', '#button-changer', (e) => {
    if ($(' #stacked-container ').is(":visible")) {
        $(' #stacked-container ').hide();
        $(' #datasets-wrapper ').show();

		$(' #informations-container ').addClass('trans-background');
        $(' #button-changer ').html('See informations');
    } else {
        $(' #stacked-container ').show();
        $(' #datasets-wrapper ').hide();

		$(' #informations-container ').removeClass('trans-background');
        $(' #button-changer ').html('See datasets');
    }
});

$(document).on('click', '#freq-showmore', (e) => {
	$('#wrapper .freq-button').each(function() {
		if ($(this).hasClass('freq-unactive')) {
			$('#dialog #' + this.id).addClass('freq-unactive');
		} else {
			$('#dialog #' + this.id).removeClass('freq-unactive');
		}
	});
	dialog.dialog( "open" );
});

function fetchData(numtags, startDate, endDate, isForce, isSwimlane, isStacked, isRedraw, forceWidth, callback) {
	async.waterfall([
		function (waterfallCallback) {
			$.get( baseURL + 'selector', { frequencies: JSON.stringify(activeFreq), datatype: filter.type, source: JSON.stringify(filter.source), startDate, endDate, numtags }, (response) => {
				tagChain    = _.chain(response.result.nodeData).flatMap('name').uniq();

				if (tagChain.intersection(activeSec).size().value() == 0) {
					activeSec = [tagChain.sortBy().head().value()];
				} else {
					activeSec = tagChain.intersection(activeSec).value();
				}

				if (isForce) { createForce(response.result, activeSec); }
				waterfallCallback(null, activeFreq, activeSec, tagChain.value());
			});
		},
		function (localFreq, localSec, tags, waterfallCallback) {
			$.get( baseURL + 'swimlane', { frequencies: JSON.stringify(localFreq), tags: JSON.stringify(tags), source: JSON.stringify(filter.source), startDate, endDate }, (response) => {
				if (isSwimlane) { createSwimlane(response.result, localSec, startDate, endDate, forceWidth); }
				waterfallCallback(null, localFreq, localSec);
			});
		},
		function (localFreq, localSec, waterfallCallback) {
			if (isRedraw) {
				$.get( baseURL + 'datasets', { frequencies: JSON.stringify(activeFreq), tags: JSON.stringify(activeSec), source: JSON.stringify(filter.source) }, (response) => {
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
				$.get( baseURL + 'stacked', { frequencies: JSON.stringify(activeFreq), tags: JSON.stringify(activeSec), datatype: filter.type, source: JSON.stringify(filter.source), startDate, endDate }, (response) => {
					createStacked(response.result, frequencies, freqColors);
					waterfallCallback(null);
				});
			} else {
				waterfallCallback(null);
			}
		},
	], (err) => { callback(); });
}

function initData(callback) {
	let spinner	= new Spinner().spin(document.getElementById('root'));
	$(' #spinnerOverlay ').show();

	$.get( baseURL + 'config', { source: JSON.stringify(filter.source) },  (response) => {
        frequencies     = response.result.frequency;
        activeFreq      = _.chain(response.result.frequency).drop().take(6).value();

		freqColors		= _.times(frequencies.length, (o) => ('#' + Math.random().toString(16).substr(2,6)));

        let stringFreq  = _.map(frequencies, (o, idx) => ("<div id='freq-" + o + "' class='freq-button noselect cursor-pointer" + (_.includes(activeFreq, o) ? '' : ' freq-unactive') + (idx >= (freqLimt - 1) ? ' freq-overflow' : '') + "' style='background : " + freqColors[idx] + "; border-color : " + freqColors[idx] + "; color : " + freqColors[idx] + "' value='" + o + "'>" + o + "</div>")).join('');
		$(' #dialog-freq-container ').html(stringFreq);
		stringFreq		+= "<div id='freq-showmore' class='freq-button noselect cursor-pointer'>more <i class='fa fa-angle-double-right' aria-hidden='true'></i></div>"
        $(' #frequency-container ').html(stringFreq);

		let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
		let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, true, true, true, null, () => {
            $(' #spinnerOverlay ').css('opacity', '0.7');
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    });
}

window.onload   = function() {
	let stringSrc	= _.map(datasources, (o) => ("<div id='source-" + _.kebabCase(o.value) + "' class='source-button source-active noselect cursor-pointer' value='" + o.value + "'>" + o.title + "</div>")).join('');
	$(' #sources-container ').append(stringSrc);
	filter.source     = _.map(datasources, 'value');
	// $('#source-' + _.kebabCase(filter.source)).addClass('');

    let stringType	= _.map(radio, (o) => ("<div id='type-" + o.value + "' class='type-button noselect cursor-pointer' value='" + o.value + "'>" + o.title + "</div>")).join('');
    $(' #types-container ').append(stringType);
    filter.type		= _.head(radio).value;
    $('#type-' + filter.type).addClass('type-active');

    let dateFormat  = 'dd MM yy';
    let dateConfig  = { showOtherMonths: true, selectOtherMonths: true, changeMonth: true, changeYear: true, dateFormat: dateFormat }
    let fromPicker  = $(' #startpicker ').datepicker(dateConfig);
    let untilPicker = $(' #endpicker ').datepicker(dateConfig);

    $(' #filter-wrapper ').height($(' #wrapper ').outerHeight(true) / 2);

    // $(' #datasets-wrapper ').width($(' #chart-container ').outerWidth(true));
    // $(' #datasets-wrapper ').height($(' #wrapper ').outerHeight(true) / 2 - 40);

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

	$(' #swimlane-container ').resizable({
		animate: true,
		handles: 'w',
		helper: 'resizable-helper',
		start: (event, ui) => {
			$( '#graph-canvas' ).hide();
			$( '#swimlane-canvas' ).hide();
		},
		resize: (event, ui) => {
			ui.position.left	= 0;
			$(' #relations-container ').css('width', 'calc(100% - ' + ui.size.width + 'px)');
		},
		stop: (event, ui) => {
			let spinner     = new Spinner().spin(document.getElementById('root'));
			$(' #spinnerOverlay ').show();

			let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
			let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
			let numtags		= $( '#numtags-container' ).slider( 'value' );
			fetchData(numtags, startDate, endDate, true, true, false, false, ui.helper.width(), () => {
				$(' #spinnerOverlay ').hide();
				spinner.stop();
			});
		}
	});

	let numtagsValue	= 20;
	$( '#numtags-container' ).slider({
		value: numtagsValue,
		orientation: "horizontal",
      	range: "min",
		max:100,
		min:2,
		create: () => { $( '#numtags-handle' ).text( numtagsValue ); },
		slide: ( event, ui ) => { $( '#numtags-handle' ).text( ui.value ); },
		stop: ( event, ui ) => {
			let spinner     = new Spinner().spin(document.getElementById('root'));
			$(' #spinnerOverlay ').show();

			let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
			let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
			fetchData(ui.value, startDate, endDate, true, true, true, true, null, () => {
				$(' #spinnerOverlay ').hide();
				spinner.stop();
			});
		}
    });

	dialog = $(' #dialog ').dialog({
		autoOpen: false,
		height: 300,
		width: 450,
		modal: true,
		buttons: {
			Submit: () => {
				activeFreq	= [];
				$('#dialog .freq-button').each(function() {
					if ($(this).hasClass('freq-unactive')) {
						$('#wrapper #' + this.id).addClass('freq-unactive');
					} else {
						$('#wrapper #' + this.id).removeClass('freq-unactive');
						activeFreq.push(parseInt(this.id.substr(5)));
					}
				});

				dialog.dialog( "close" );

				let spinner     = new Spinner().spin(document.getElementById('root'));
				$(' #spinnerOverlay ').show();

				let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
				let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
				let numtags		= $( '#numtags-container' ).slider( 'value' );
				fetchData(numtags, startDate, endDate, true, true, true, true, null, () => {
					$(' #spinnerOverlay ').hide();
					spinner.stop();
				});
			},
			Cancel: () => {
				dialog.dialog( "close" );
			}
		},
		close: () => {
			dialog.dialog( "close" );
		}
	});

	initData(() => {});

    function redrawOnDatepickerChange() {
        let spinner     = new Spinner().spin(document.getElementById('root'));
        $(' #spinnerOverlay ').show();

        let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
		let numtags		= $( '#numtags-container' ).slider( 'value' );
		fetchData(numtags, startDate, endDate, true, true, true, true, null, () => {
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    }
};
