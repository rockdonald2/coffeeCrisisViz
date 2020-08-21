(function (viz) {
    'use strict';

    /* alapvető változók */
    const chartContainer = d3.select('#prices');
    const nOfCharts = 2;
    const responsive = window.innerWidth <= 625 ? 180 : 150;
    const margin = {
        'top': responsive,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) / nOfCharts - margin.top - margin.bottom;

    /* skálák - schema */
    const s_scaleTime = d3.scaleTime().range([0, width]);
    const s_scaleValue = d3.scaleLinear().range([height, 0]);

    /* both line-chart make use of this range and dimensions */
    const years = d3.timeYear.range(new Date(1990, 0, 1), new Date(2019, 0, 1), 1);

    function hover(rect, svg, path, data, scaleTime, scaleValue, dimensions, years) {
        rect.on('touchmove mousemove', moved)
            .on('touchstart mouseenter', entered)
            .on('touchend mouseleave', left);

        const dot = svg.append('g')
            .attr('display', 'none').style('pointer-events', 'none');
        dot.append('circle')
            .attr('r', 4)
            .attr('fill', '#222');
        dot.append('text')
            .style('font-size', function () {
                if (window.innerWidth <= 850) {
                    return '1rem';
                } else {
                    return '1.5rem';
                }
            })
            .attr('text-anchor', 'middle')
            .attr('y', -10);

        const valueLines = svg.append('g').attr('display', 'none').style('pointer-events', 'none');
        valueLines.append('line').attr('id', 'x-line').attr('stroke', '#222').attr('stroke-width', 1).attr('opacity', .25);
        valueLines.append('line').attr('id', 'y-line').attr('stroke', '#222').attr('stroke-width', 1).attr('opacity', .25);
        valueLines.append('text').attr('id', 'x-value').style('font-size', function () {
                if (window.innerWidth <= 850) {
                    return '1rem';
                } else {
                    return '1.5rem';
                }
            })
            .style('font-weight', 700).attr('text-anchor', 'middle');
        valueLines.append('text').attr('id', 'y-value').style('font-size', function () {
                if (window.innerWidth <= 850) {
                    return '1rem';
                } else {
                    return '1.5rem';
                }
            })
            .style('font-weight', 700).attr('dy', '.32em').attr('text-anchor', 'end');

        function moved() {
            d3.event.preventDefault();

            const mouse = d3.mouse(this);

            const xm = scaleTime.invert(mouse[0] - dimensions.margin.left);
            const ym = scaleValue.invert(mouse[1] - dimensions.margin.top);

            const i1 = d3.bisectLeft(years, xm, 1);
            const i0 = i1 - 1;

            const i = xm - years[i0] > years[i1] - xm ? i1 : i0;
            const s = d3.least(data, function (d) {
                if (d.values[i].Value !== null) return Math.abs(d.values[i].Value - ym);
            });

            path.attr('stroke', function (d) {
                if (d === s) return '#7f2c2c';
                else return '#ddd';
            }).filter(function (d) {
                return d === s;
            }).raise();

            dot.attr('transform', 'translate(' + (dimensions.margin.left + scaleTime(years[i])) + ', ' + (dimensions.margin.top + scaleValue(s.values[i].Value)) + ')');
            dot.select('text').text(viz.data.codes[s.key]);

            valueLines.select('#x-line').attr('x1', dimensions.margin.left + scaleTime(years[i])).attr('x2', dimensions.margin.left)
                .attr('y1', dimensions.margin.top + scaleValue(s.values[i].Value)).attr('y2', dimensions.margin.top + scaleValue(s.values[i].Value));
            valueLines.select('#y-line').attr('x1', scaleTime(years[i]) + dimensions.margin.left).attr('x2', scaleTime(years[i]) + dimensions.margin.left)
                .attr('y1', dimensions.margin.top + scaleValue(s.values[i].Value)).attr('y2', dimensions.height + dimensions.margin.top);
            valueLines.select('#x-value').text(d3.timeFormat('%Y')(years[i]))
                .attr('x', dimensions.margin.left + scaleTime(years[i]))
                .attr('y', dimensions.height + dimensions.margin.top + 20);
            valueLines.select('#y-value').text(s.values[i].Value.toFixed(0))
                .attr('x', dimensions.margin.left - 10)
                .attr('y', scaleValue(s.values[i].Value) + dimensions.margin.top);

            dot.raise();
            valueLines.raise();
        }

        function entered() {
            path.style('mix-blend-mode', null).attr('stroke', '#ddd');
            dot.attr('display', null);
            valueLines.attr('display', null);
        }

        function left() {
            path.style('mix-blend-mode', 'multiply').attr('stroke', '#222');
            dot.attr('display', 'none');
            valueLines.attr('display', 'none');
        }
    }

    const makeChart = function (chartHolder, scaleTime, scaleValue, data) {
        const lines = chartHolder.selectAll('.line').data(data, function (d) {
            return d.key;
        });

        lines.enter().append('path').attr('class', 'line').attr('id', function (d) {
                return d.key;
            })
            .attr('opacity', 0)
            .merge(lines)
            .attr('stroke', '#666').attr('stroke-opacity', .75).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('mix-blend-mode', 'multiply')
            .style('pointer-events', 'none')
            .transition().duration(viz.TRANS_DURATION)
            .attr('d', function (d) {
                return d3.line()
                    .defined(function (d) {
                        return d.Value !== null;
                    })
                    .x(function (d) {
                        return scaleTime(d.Year);
                    })
                    .y(function (d) {
                        return scaleValue(d.Value);
                    })(d.values);
            })
            .attr('opacity', 1);

        lines.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();
    }

    const makeData = function (collection) {
        return d3.nest().key(function (d) {
                return d.Code;
            }).entries(collection)
            .map(function (d) {
                return {
                    'key': d.key,
                    'values': d.values.sort(function (a, b) {
                        return a.Year - b.Year;
                    })
                };
            });
    };

    viz.initLineChart1 = function () {
        /* Types: Columbian Milds, Other Milds, Brazilian Naturals, Robustas */
        const types = ['Colombian Milds', 'Other Milds', 'Brazilian Naturals', 'Robustas'];
        let currentType = 'Colombian Milds';

        const dimensions = viz.makeDimensionsObj(width, height, margin);

        const scaleTime = s_scaleTime.copy().domain(d3.extent(viz.data.pricesPaidToGrowers.top(Infinity), function (d) {
            return d.Year;
        }));
        const scaleValue = s_scaleValue.copy().domain([0, d3.max(viz.data.pricesPaidToGrowers.top(Infinity), function (d) {
            return d.Value;
        })]).nice();

        const svg = viz.addSvg(chartContainer, dimensions);
        const chartHolder = viz.addChartHolder(svg, dimensions);
        const mouseArea = viz.addMouseArea(svg, dimensions);

        const makeLegend = function () {
            let legendMargins = {};
            if (window.innerWidth > 1350) {
                legendMargins = {
                    'top': 75,
                    'left': dimensions.margin.left
                };
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                legendMargins = {
                    'top': 50,
                    'left': dimensions.margin.left
                };
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                legendMargins = {
                    'top': 50,
                    'left': dimensions.margin.left
                };
            } else {
                legendMargins = {
                    'top': 50,
                    'left': 10
                };
            }

            const legend = viz.makeLegend(svg, dimensions, 'Prices paid to growers by coffee plant type', 'Measured in cents per pounds | 1990-2018').attr('transform', 'translate(' + legendMargins.left + ', ' + legendMargins.top + ')');

            let typeMargins = {};
            if (window.innerWidth > 1350) {
                typeMargins = {
                    'left': width / 2,
                    'top': -15,
                    'difference': [160, 170, 175],
                    'differenceText': 20,
                    'fontSize': '1.5rem'
                };
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                typeMargins = {
                    'left': width / 2 - 25,
                    'top': -15,
                    'difference': [130, 140, 145],
                    'differenceText': 20,
                    'fontSize': '1.5rem'
                };
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                typeMargins = {
                    'left': 0,
                    'top': 55,
                    'difference': [130, 140, 145],
                    'differenceText': 20,
                    'fontSize': '1.5rem'
                };
            } else {
                typeMargins = {
                    'left': 0,
                    'top': 55,
                    'difference': [110, 120, 125],
                    'differenceText': 20,
                    'fontSize': '1rem'
                };
            }
            const typeGroup = legend.append('g').attr('class', 'typeGroup')
                .attr('transform', 'translate(' + (typeMargins.left) + ', ' + (typeMargins.top) + ')');
            typeGroup.selectAll('type').data(types).enter().append('g')
                .attr('id', function (d) {
                    return d.split(' ')[0];
                })
                .style('cursor', 'pointer')
                .call(function (g) {
                    g.append('rect').attr('width', 16).attr('height', 16).attr('fill', function (d) {
                            if (d === currentType) return '#7f2c2c';

                            return '#666';
                        })
                        .attr('x', function (d, i) {
                            if (window.innerWidth <= 625) {
                                if (i >= 2) {
                                    if (i === 2) return (i - 2) * typeMargins.difference[0];
                                    else return (i - 2) * typeMargins.difference[2];
                                } else return i * typeMargins.difference[2];
                            } else {
                                if (i === 2) return i * typeMargins.difference[0];
                                else if (i === 3) return i * typeMargins.difference[1];
                                return i * typeMargins.difference[2];
                            }
                        })
                        .attr('y', function (d, i) {
                            if (window.innerWidth <= 625) {
                                if (i >= 2) return 32;
                            }
                        });
                })
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d;
                        })
                        .attr('fill', function (d) {
                            if (d === currentType) return '#7f2c2c';

                            return '#222';
                        })
                        .attr('x', function (d, i) {
                            if (window.innerWidth <= 625) {
                                if (i >= 2) {
                                    if (i === 2) return (i - 2) * typeMargins.difference[0] + typeMargins.differenceText;
                                    else return (i - 2) * typeMargins.difference[2] + typeMargins.differenceText;
                                } else return i * typeMargins.difference[2] + typeMargins.differenceText;
                            } else {
                                if (i === 2) return i * typeMargins.difference[0] + typeMargins.differenceText;
                                else if (i === 3) return i * typeMargins.difference[1] + typeMargins.differenceText;
                                else return i * typeMargins.difference[2] + typeMargins.differenceText;
                            }
                        })
                        .attr('y', function (d, i) {
                            if (window.innerWidth <= 625) {
                                if (i >= 2) return 32 + 8;
                                else return 8;
                            } else {
                                return 8;
                            }
                        }).attr('dy', '.38em')
                        .style('font-size', typeMargins.fontSize)
                        .style('font-weight', 700);
                })
                .on('mouseover', function (d) {
                    const textLabel = d3.select(this).select('text');
                    const rectLabel = d3.select(this).select('rect');

                    textLabel.attr('fill', '#7f2c2c');
                    rectLabel.attr('fill', '#7f2c2c');
                })
                .on('mouseleave', function (d) {
                    if (d !== currentType) {
                        d3.select(this).select('text').attr('fill', '#222')
                        d3.select(this).select('rect').attr('fill', '#666')
                    }
                })
                .on('click', function (d) {
                    if (d === currentType) return;

                    legend.select('.typeGroup g#' + currentType.split(' ')[0])
                        .call(function (g) {
                            g.select('text').attr('fill', '#222');
                            g.select('rect').attr('fill', '#666');
                        });

                    currentType = d;

                    viz.updateLineChart1(svg, chartHolder, mouseArea, scaleTime, scaleValue, currentType, dimensions, years);
                });
        }();

        viz.makeAxis(svg, dimensions,
            scaleTime, scaleValue,
            d3.timeYear.every(8).range(scaleTime.domain()[0], scaleTime.domain()[1]),
            d3.range(scaleValue.domain()[0], scaleValue.domain()[1] + 1, 100),
            d3.timeFormat('%Y'),
            d3.format('d'));

        viz.updateLineChart1(svg, chartHolder, mouseArea, scaleTime, scaleValue, currentType, dimensions, years);
    }

    viz.updateLineChart1 = function (svg, chartHolder, mouseArea, scaleTime, scaleValue, type, dimensions, years) {
        viz.data.pricesPaidToGrowers.filterFunction(viz.multivalue_filter([type]));
        const data = makeData(viz.data.pricesPaidToGrowers.top(Infinity));

        makeChart(chartHolder, scaleTime, scaleValue, data);

        mouseArea.call(hover, svg, chartHolder.selectAll('.line'), data, scaleTime, scaleValue, dimensions, years);
    }

    viz.initLineChart2 = function () {
        const dimensions = viz.makeDimensionsObj(width, height, margin);
        if (window.innerWidth > 625 && window.innerWidth <= 850) {
            dimensions.margin.top = dimensions.margin.top - 25;
        } else if (window.innerWidth <= 625) {
            dimensions.margin.top = dimensions.margin.top - 50;
        }

        const scaleTime = s_scaleTime.copy().domain(d3.extent(viz.data.retailPrices, function (d) {
            return d.Year;
        }));
        const scaleValue = s_scaleValue.copy().domain([0, d3.max(viz.data.retailPrices, function (d) {
            return d.Value;
        })]).nice();

        const svg = viz.addSvg(chartContainer, dimensions);
        const chartHolder = viz.addChartHolder(svg, dimensions);
        const mouseArea = viz.addMouseArea(svg, dimensions);

        viz.makeLegend(svg, dimensions, 'Retail prices of roasted coffee in selected importing countries', 'Measured in dollars per pounds | 1990-2018');

        viz.makeAxis(svg, dimensions,
            scaleTime, scaleValue,
            d3.timeYear.every(8).range(scaleTime.domain()[0], scaleTime.domain()[1]),
            d3.range(scaleValue.domain()[0], scaleValue.domain()[1] + 1, 3.75),
            d3.timeFormat('%Y'),
            d3.format('d'));

        viz.updateLineChart2(svg, chartHolder, mouseArea, scaleTime, scaleValue, dimensions, years);
    }

    viz.updateLineChart2 = function (svg, chartHolder, mouseArea, scaleTime, scaleValue, dimensions, years) {
        const data = makeData(viz.data.retailPrices);

        makeChart(chartHolder, scaleTime, scaleValue, data);

        mouseArea.call(hover, svg, chartHolder.selectAll('.line'), data, scaleTime, scaleValue, dimensions, years);
    }
}(window.viz = window.viz || {}));