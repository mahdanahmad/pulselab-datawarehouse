let sectors     = ['health', 'environtment', 'housing', 'energy', 'education', 'geography', 'social', 'community', 'transportation', 'economy', 'weather', 'tourism', 'crime', 'accomodation', 'population'];
let yearsAgo    = 2;

function randomSwimlane(callback) {
    let dateFormat  = "YYYY-MM-DD";

    let data        = {};
    _.forEach(_.sampleSize(sectors, 10), (sector) => {
        data[sector]    = [];
        _.forEach(_.chain(yearsAgo * 12).range().sampleSize(10).uniq().sortBy().reverse().chunk(2).value(), (val) => {
            data[sector].push({
                start   : moment().subtract(val[0], 'months').format(dateFormat),
                end     : moment().subtract(val[1], 'months').format(dateFormat),
            });
        });
    })

    callback(null, { data : data, startDate : moment().subtract(yearsAgo, 'years').format(dateFormat), endDate : moment().format(dateFormat) });
};
function randomStacked(callback) {
    let dateFormat  = "YYYY-MM-DD";
    let startDate   = moment().subtract(yearsAgo, 'years');
    let endDate     = moment();

    let timespans   = ['daily', 'weekly', 'monthly', 'yearly'];
    let timespawn   = { 'daily' : 52, 'weekly' : 25, 'monthly' : 20, 'yearly' : 3 };
    let timevalue   = { 'daily' : 'days', 'weekly' : 'weeks', 'monthly' : 'months', 'yearly' : 'years' };
    var reversed    = _.chain(timespans).clone().reverse().value();

    let rawData     = [];
    let data        = {
        dataset     : { 'daily' : [], 'weekly' : [], 'monthly' : [], 'yearly' : [] },
        questions   : { 'daily' : [], 'weekly' : [], 'monthly' : [], 'yearly' : [] },
        respondents : { 'daily' : [], 'weekly' : [], 'monthly' : [], 'yearly' : [] },
        joined      : { 'daily' : [], 'weekly' : [], 'monthly' : [], 'yearly' : [] }
    };

    _.times(_.chain(timespawn).values().sum().value(), () => {
        let timespan        = _.sample(timespans);
        timespawn[timespan]--;
        if (timespawn[timespan] === 0) { _.pull(timespans, timespan); }
        let currentStart    = moment().subtract(_.random(1, yearsAgo * 365), 'days');

        let timeskip    = 0;
        switch (timespan) {
            case 'daily': timeskip = _.random(30, 50); break;
            case 'yearly': timeskip = 1; break;
            default: timeskip = _.random(1, 5); break;
        }

        rawData.push({
            'timespan'  : timespan,
            'question'  : _.random(5, 20),
            'response'  : _.random(20, 100),
            'date'      : {
                'start' : currentStart,
                'end'   : currentStart.clone().add(timeskip, timevalue[timespan])
            }
        });
    });

    _.times(endDate.diff(startDate, 'days'), (i) => {
        let currentDate = startDate.clone().add(i, 'days');
        let counter     = { dataset : 0, questions : 0, respondents : 0, cross : 0 };
        _.each(reversed, (key) => {
            let filtered        = _(rawData).filter((o) => (currentDate.isBetween(o.date.start, o.date.end) && (o.timespan === key)));
            let nextdataset     = filtered.size();
            let nextquestions   = filtered.map('question').sum();
            let nextrespondents = filtered.map('response').sum();
            let nextcross       = (filtered.map('question').sum() * filtered.map('response').sum());

            data.dataset[key].push({ date : currentDate.format(dateFormat), y0 : counter['dataset'], y1 : counter['dataset'] +  nextdataset });
            data.questions[key].push({ date : currentDate.format(dateFormat), y0 : counter['questions'], y1 : counter['questions'] +  nextquestions });
            data.respondents[key].push({ date : currentDate.format(dateFormat), y0 : counter['respondents'], y1 : counter['respondents'] +  nextrespondents });
            data.joined[key].push({ date : currentDate.format(dateFormat), y0 : counter['cross'], y1 : counter['cross'] +  nextcross });

            counter.dataset     += nextdataset;
            counter.questions   += nextquestions;
            counter.respondents += nextrespondents;
            counter.cross       += nextcross;
        });
    });

    callback(null, { data : _.mapValues(data, (radiobased) => _.map(radiobased, (val, key) => ({ state : key, data : val }))), startDate : startDate.format(dateFormat), endDate : endDate.format(dateFormat) });
};
