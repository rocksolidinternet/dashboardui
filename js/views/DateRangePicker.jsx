import React, { Fragment } from 'react';
var ReactDOM = require('react-dom');
var PropTypes = require('prop-types');
var moment = require('moment');

var parse_date = require('../parse_date.js').parse_date;

class DRP extends React.Component {
    contextTypes = {
        show_dialog: PropTypes.func,
        close_dialog: PropTypes.func
    };

    periods = {
        days: 'Day',
        weeks: 'Week',
        months: 'Month',
        quarters: 'Quarter',
        years: 'Year'
    };

    toDates = {
        '-to-yesterday': 'to date of yesterday', //-to-yesterday
        '-to-date': 'to date of today', //-to-date
        period: 'to end of period', //
        ' plus future': 'no end date' // plus future
    };

    presets = {
        today: [0, 'days', 'period', true],
        yesterday: [1, 'days', 'period', false],
        'last 7 days': [7, 'days', 'period', false],
        'last 30 days': [30, 'days', 'period', false],
        'Last week': [1, 'weeks', 'period', false], //duplicated below
        'Last month': [1, 'months', 'period', false], //duplicated below
        'This month-to-yesterday': [0, 'months', '-to-yesterday', true], //duplicated below
        'last 2 months-to-date': [2, 'months', '-to-date', true],

        'this week': [0, 'weeks', 'period', true],
        'this week-to-date': [0, 'weeks', '-to-date', true],
        'this week-to-yesterday': [0, 'weeks', '-to-yesterday', true],

        'this month': [0, 'months', 'period', true],
        'this month-to-date': [0, 'months', '-to-date', true],
        'this month-to-yesterday': [0, 'months', '-to-yesterday', true],

        'this quarter': [0, 'quarters', 'period', true],
        'this quarter-to-date': [0, 'quarters', '-to-date', true],
        'this quarter-to-yesterday': [0, 'quarters', '-to-yesterday', true],

        'this year': [0, 'years', 'period', true],
        'this year-to-date': [0, 'years', '-to-date', true],
        'this year-to-yesterday': [0, 'years', '-to-yesterday', true],

        'last week': [1, 'weeks', 'period', false],
        'last week-to-date': [1, 'weeks', '-to-date', false],
        'last week-to-yesterday': [1, 'weeks', '-to-yesterday', false],

        'last month': [1, 'months', 'period', false],
        'last month-to-date': [1, 'months', '-to-date', false],
        'last month-to-yesterday': [1, 'months', '-to-yesterday', false],

        'last quarter': [1, 'quarters', 'period', false],
        'last quarter-to-date': [1, 'quarters', '-to-date', false],
        'last quarter-to-yesterday': [1, 'quarters', '-to-yesterday', false],

        'last year': [1, 'years', 'period', false],
        'last year-to-date': [1, 'years', '-to-date', false],
        'last year-to-yesterday': [1, 'years', '-to-yesterday', false]
    };

    formatDate(date) {
        function pad(number) {
            return (number < 10 ? '0' : '') + number;
        }
        var prevdate = date;
        var date = !date ? new Date() : moment(date).toDate();
        return (
            date.getFullYear() +
            '-' +
            pad(date.getMonth() + 1) +
            '-' +
            pad(date.getDate())
        );
    }

    state = {
        defaultValue: '',
        custom: true,
        range: false,
        last: 1,
        period: 'days',
        to_date: '',
        current: 0,
        start: null,
        end: null,
        atDateRange: false,
        showPresets: true
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        var thisComponent = this;

        var state = {
            defaultValue: '',
            custom: true,
            range: false,
            last: 1,
            period: 'days',
            to_date: '',
            current: 0,
            start: null,
            end: null,
            atDateRange: false
        };

        if (this.props.filter.is_metric_filter) {
            state.atDateRange = true;
        }

        if (!this.props.filter.value) {
            state.custom = false;
        } else {
            state.defaultValue = this.props.filter.value
                .join(' - ')
                .toLowerCase();

            if (state.defaultValue.slice(0, 11) == '@daterange(') {
                if (state.defaultValue.indexOf('-') != -1) {
                    state.atDateRange = state.defaultValue
                        .slice(11)
                        .split(/[\(\- ]+/);
                } else {
                    state.atDateRange = state.defaultValue.split(/[\(\- ]+/);
                }

                if (
                    state.atDateRange[2] &&
                    state.atDateRange[2].slice(-1) != 's'
                ) {
                    state.atDateRange[2] += 's';
                }
            } else if (state.defaultValue in this.presets) {
                state.custom = false;

                state.last = this.presets[state.defaultValue][0];
                state.period = this.presets[state.defaultValue][1];
                state.to_date = this.presets[state.defaultValue][2];
                state.current = this.presets[state.defaultValue][3];
            } else {
                Object.keys(this.presets).map(function(preset) {
                    var dates = parse_date(preset)
                        .map(function(date) {
                            return thisComponent.formatDate(date);
                        })
                        .join(' - ');
                    if (
                        state.defaultValue == dates ||
                        state.defaultValue == dates + ' - ' + dates
                    ) {
                        state.defaultValue = dates;
                        state.custom = false;
                    }
                });
            }
        }

        if (state.custom == true) {
            if (
                this.props.filter.value[0] &&
                this.props.filter.value[0].match(/\d{4}\-\d{2}\-\d{2}/)
            ) {
                state.start = this.props.filter.value[0];
                state.end = this.props.filter.value[1]
                    ? this.props.filter.value[1]
                    : startDate;
                state.range = true;
            } else {
                var defaults = state.defaultValue.split(/[ +]+/g);
                state.last = defaults[1] || 0;
                state.period = defaults[2] || 'days';
                if (defaults[3] && defaults[3].indexOf('current') != -1) {
                    state.current = true;
                    defaults[3] = defaults[3].substr(
                        defaults[3].indexOf('current') + 7
                    );
                } else {
                    state.current = false;
                }
                state.to_date = defaults[3] || 'period';
            }
        }

        this.setState(state);

        this.initCalendars();
    }

    componentDidUpdate(prevProps, prevState) {
        this.initCalendars();
    }

    loading = false;

    initCalendars() {
        var thisComponent = this;
        //if (this.state.custom && !$('#custom-date-range > div').hasClass('hasDatepicker')) {
        if (!$('#custom-date-range > div').hasClass('hasDatepicker')) {
            $('#custom-date-range').dateRangePicker({
                appendTo: $('#custom-date-range'),
                //setRange: [ this.state.start, this.state.end ],
                firstDay: 0,
                onChange() {
                    var range = $('#custom-date-range').dateRangePicker(
                        'getRange'
                    );
                    if (range) {
                        range.end = range.end || range.start;
                        thisComponent.setCustomRange([
                            thisComponent.formatDate(range.start),
                            thisComponent.formatDate(range.end)
                        ]);
                    }
                }
            });

            if (!this.state.range) {
                if (this.state.atDateRange) {
                    var dates = parse_date(this.state.defaultValue);
                    $('#custom-date-range').dateRangePicker('setRange', {
                        start: new Date(dates[0]),
                        end: new Date(dates[1] + ' 23:59:59')
                    });
                } else if (this.props.filter.value.length == 2) {
                    var dates = this.props.filter.value;
                    $('#custom-date-range').dateRangePicker('setRange', {
                        start: new Date(dates[0]),
                        end: new Date(dates[1] + ' 23:59:59')
                    });
                } else {
                    var date =
                        'Last ' +
                        this.refs.customLast.value +
                        ' ' +
                        this.refs.customPeriod.value +
                        (this.refs.customCurrent.checked ? '+current' : '') +
                        (this.refs.customToDate.value == 'period'
                            ? ''
                            : this.refs.customToDate.value);
                    var dates = parse_date(date);
                    $('#custom-date-range').dateRangePicker('setRange', {
                        start: new Date(dates[0]),
                        end: new Date(dates[1] + ' 23:59:59')
                    });
                }
            } else {
                $('#custom-date-range').dateRangePicker('setRange', {
                    start: new Date(thisComponent.state.start),
                    end: new Date(thisComponent.state.end + ' 23:59:59')
                });
            }
        }

        this.loading = true;

        /* fix calendar height */
        if (
            $(this.refs.presetList)
                .closest('.filter-select')
                .hasClass('flow-up')
        ) {
            var off = $(this.refs.presetList)
                .closest('.filter-wrapper')
                .offset();
            $(this.refs.presetList).css({ maxHeight: off.top - 400 });
        } else {
            var off = $(this.refs.presetList).offset();
            $(this.refs.presetList).css({
                maxHeight:
                    'calc(100vh - ' + Math.max(0, (off || {}).top + 20) + 'px)'
            });
        }
    }

    /*
	toggleCustom() {
		var thisComponent = this;

		if (!this.state.custom) {
			setTimeout(function() {
				thisComponent.setCustomTimespan();
			}, 500)
		}
		this.setState({custom:!this.state.custom});
	},
	*/

    setRange(dates, e) {
        $(this.refs.presetList)
            .find('button')
            .removeClass('active');
        $(e.target).addClass('active');

        if (typeof dates == 'string') {
            dates = [dates];
        }

        if (dates.length == 1 && dates[0].match(/\d{4}-\d{2}-\d{2}/)) {
            dates[1] = dates[0];
        }

        this.props.setRange(dates);

        if (this.props.delayedClose) {
            this.props.delayedClose(true);
        }
    }

    setCustomTimespan() {
        var date =
            'Last ' +
            this.refs.customLast.value +
            ' ' +
            this.refs.customPeriod.value +
            (this.refs.customCurrent.checked ? '+current' : '') +
            (this.refs.customToDate.value == 'period'
                ? ''
                : this.refs.customToDate.value);
        this.props.setRange([date]);

        var test = parse_date(date);
        this.loading = false;
        $('#custom-date-range').dateRangePicker('setRange', {
            start: new Date(test[0]),
            end: new Date(test[1] + ' 23:59:59')
        });
        this.loading = true;
    }

    setCustomRange(range) {
        if (this.loading) {
            this.setState({ range: true });
            this.props.setRange(range);
        }
    }

    changedCustom(which, e) {
        this.setState({ range: false });
        switch (which) {
            case 'last':
                this.refs.customLast.value = Math.abs(
                    parseInt(this.refs.customLast.value)
                );
                this.setState({ last: e.currentTarget.value });
                break;
            case 'period':
                this.setState({ period: e.currentTarget.value });
                break;
            case 'current':
                this.setState({ current: e.currentTarget.checked });
                break;
            case 'to_date':
                this.setState({ to_date: e.currentTarget.value });
                break;
        }
        this.setCustomTimespan();
    }

    changedAtDateRange(which, e) {
        this.setState({ range: false });
        switch (which) {
            case 'start':
                this.setState({ start: e.currentTarget.value });
                break;
            case 'end':
                this.setState({ end: e.currentTarget.value });
                break;
            case 'periond':
                this.setState({ period: e.currentTarget.value });
                break;
        }
        this.setAtDateRange();
    }

    setAtDateRange() {
        var date =
            '@daterange(' +
            this.refs.dateRangeStart.value +
            (this.refs.dateRangeStart.value && this.refs.dateRangeEnd.value
                ? '-'
                : '') +
            this.refs.dateRangeEnd.value +
            ' ' +
            this.refs.dateRangePeriod.value +
            ' ago)';
        this.props.setRange([date]);
        var dates = parse_date(date);
        this.loading = false;
        $('#custom-date-range').dateRangePicker('setRange', {
            start: new Date(dates[0]),
            end: new Date(dates[1] + ' 23:59:59')
        });
        this.loading = true;
    }

    clickPreset(bPreset) {
        this.setState({ showPresets: bPreset });
    }

    render() {
        var thisComponent = this;

        String.prototype.capitalize = function() {
            return this.toLowerCase().replace(/\b\w/g, function(m) {
                return m.toUpperCase();
            });
        };

        return (
            <div>
                <table style={{ marginBottom: '20px', width: '100%' }}>
                    <tbody>
                        <tr style={{ fontSize: '11pt' }}>
                            <td
                                onClick={this.clickPreset.bind(this, true)}
                                style={
                                    this.state.showPresets
                                        ? {
                                              textAlign: 'center',
                                              width: '50%',
                                              borderBottom: '1px #999999 solid',
                                              borderRight: '1px #999999 solid',
                                              color: 'white',
                                              background: 'highlight',
                                              padding: '5px',
                                              cursor: 'pointer'
                                          }
                                        : {
                                              textAlign: 'center',
                                              width: '50%',
                                              borderBottom: '1px #999999 solid',
                                              borderRight: '1px #999999 solid',
                                              padding: '5px',
                                              cursor: 'pointer'
                                          }
                                }
                            >
                                Presets
                            </td>
                            <td
                                onClick={this.clickPreset.bind(this, false)}
                                style={
                                    this.state.showPresets
                                        ? {
                                              textAlign: 'center',
                                              width: '50%',
                                              borderBottom: '1px #999999 solid',
                                              padding: '5px',
                                              cursor: 'pointer'
                                          }
                                        : {
                                              textAlign: 'center',
                                              width: '50%',
                                              borderBottom: '1px #999999 solid',
                                              color: 'white',
                                              background: 'highlight',
                                              padding: '5px',
                                              cursor: 'pointer'
                                          }
                                }
                            >
                                Custom Timespan
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div
                    style={{
                        display: this.state.showPresets ? 'none' : 'block'
                    }}
                >
                    {!this.state.atDateRange ? (
                        <div className="range-custom">
                            <fieldset
                                className={!this.state.range ? 'active' : ''}
                            >
                                <div>
                                    Last{' '}
                                    <input
                                        ref="customLast"
                                        className="new-styled"
                                        type="number"
                                        min="0"
                                        defaultValue={this.state.last}
                                        onChange={this.changedCustom.bind(
                                            this,
                                            'last'
                                        )}
                                    />
                                    <select
                                        ref="customPeriod"
                                        className="new-styled"
                                        defaultValue={this.state.period}
                                        onChange={this.changedCustom.bind(
                                            this,
                                            'period'
                                        )}
                                    >
                                        {Object.keys(this.periods).map(function(
                                            period,
                                            i
                                        ) {
                                            return (
                                                <option key={i} value={period}>
                                                    {
                                                        thisComponent.periods[
                                                            period
                                                        ]
                                                    }
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <select
                                        ref="customToDate"
                                        className="new-styled"
                                        defaultValue={this.state.to_date}
                                        onChange={this.changedCustom.bind(
                                            this,
                                            'to_date'
                                        )}
                                    >
                                        {Object.keys(this.toDates).map(function(
                                            toDate,
                                            i
                                        ) {
                                            return (
                                                <option key={i} value={toDate}>
                                                    {
                                                        thisComponent.toDates[
                                                            toDate
                                                        ]
                                                    }
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label>
                                        <input
                                            ref="customCurrent"
                                            type="checkbox"
                                            defaultChecked={this.state.current}
                                            onChange={this.changedCustom.bind(
                                                this,
                                                'current'
                                            )}
                                        />{' '}
                                        Include current <span></span>
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset
                                className={this.state.range ? 'active' : ''}
                            >
                                <legend>Custom Range</legend>
                                <div
                                    id="custom-date-range"
                                    className="calendar"
                                ></div>
                            </fieldset>
                        </div>
                    ) : (
                        <div className="range-custom">
                            <fieldset
                                className={!this.state.range ? 'active' : ''}
                            >
                                <legend>Date Range</legend>
                                <div>
                                    <input
                                        ref="dateRangeStart"
                                        className="new-styled"
                                        type="number"
                                        min="0"
                                        defaultValue={this.state.atDateRange[0]}
                                        onChange={this.changedAtDateRange.bind(
                                            this,
                                            'start'
                                        )}
                                    />
                                    <span> &mdash; </span>
                                    <input
                                        ref="dateRangeEnd"
                                        className="new-styled"
                                        type="number"
                                        min="0"
                                        defaultValue={this.state.atDateRange[1]}
                                        onChange={this.changedAtDateRange.bind(
                                            this,
                                            'end'
                                        )}
                                    />
                                    <select
                                        ref="dateRangePeriod"
                                        className="new-styled"
                                        defaultValue={this.state.atDateRange[2]}
                                        onChange={this.changedAtDateRange.bind(
                                            this,
                                            'period'
                                        )}
                                    >
                                        {Object.keys(this.periods).map(function(
                                            period,
                                            i
                                        ) {
                                            return (
                                                <option key={i} value={period}>
                                                    {period}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <span>ago</span>
                                </div>
                            </fieldset>

                            <fieldset
                                className={this.state.range ? 'active' : ''}
                            >
                                <legend>Custom Range</legend>
                                <div
                                    id="custom-date-range"
                                    className="calendar"
                                ></div>
                            </fieldset>
                        </div>
                    )}
                </div>
                <div
                    style={{
                        display: this.state.showPresets ? 'block' : 'none'
                    }}
                >
                    {!this.state.atDateRange ? (
                        <div className="range-presets">
                            <div className="preset-list" ref="presetList">
                                <ul>
                                    {Object.keys(this.presets).map(function(
                                        preset,
                                        index
                                    ) {
                                        var parsed = parse_date(preset);
                                        var dates = parsed
                                            .map(function(date) {
                                                return thisComponent.formatDate(
                                                    date
                                                );
                                            })
                                            .join(' - ');
                                        //if (parsed.length == 1) { parsed[1] = parsed[0]; }
                                        return (
                                            <li key={index}>
                                                <button
                                                    type="button"
                                                    className={
                                                        preset.toLowerCase() ==
                                                        thisComponent.state
                                                            .defaultValue
                                                            ? 'active'
                                                            : ''
                                                    }
                                                    onClick={thisComponent.setRange.bind(
                                                        thisComponent,
                                                        preset.capitalize()
                                                    )}
                                                >
                                                    {preset.capitalize()}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={
                                                        dates.toLowerCase() ==
                                                        thisComponent.state
                                                            .defaultValue
                                                            ? 'active'
                                                            : ''
                                                    }
                                                    onClick={thisComponent.setRange.bind(
                                                        thisComponent,
                                                        parsed
                                                    )}
                                                >
                                                    {dates}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        false
                    )}
                </div>
            </div>
        );
    }
}

module.exports = DRP;
