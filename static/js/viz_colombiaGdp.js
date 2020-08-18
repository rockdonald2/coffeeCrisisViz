(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombiaGdp');
    const margin = {
        'top': 165,
        'left': 100,
        'right': 50,
        'bottom': 60
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* svg */
    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    /* chartHolder */
    const chartHolder = svg.append('g').attr('class', 'chartHolder').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    /* skálák */
    /* years: 2009->2019 */
    const sectors = ['Services', 'Industry', 'Agriculture']
    const scaleYear = d3.scaleBand().domain(d3.range(2009, 2020, 1)).range([0, width]).paddingOuter(0).paddingInner(.05);
    const scalePerc = d3.scaleLinear().rangeRound([height, 0]);
    const colors = d3.schemeTableau10.slice(0, 3);
    const colorScale = d3.scaleOrdinal().domain(sectors).range(colors);

    /* tooltip */
    const tooltip = chartContainer.select('.tooltip');

    viz.initStackedChart = function () {
        const columns = d3.keys(viz.data.colombiaGdp[0]);
        const data = d3.stack().keys(columns.slice(1))(viz.data.colombiaGdp);
        data.forEach(function (d) {
                d.forEach(function (v) {
                    v.key = d.key;
                });
            });

        /* tengelyek */
        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(' + margin.left + ', ' + (margin.top + height) + ')');
            const xLine = xAxis.append('line').attr('x1', 0).attr('x2', width).attr('y1', 0).attr('y2', 0)
                .attr('stroke', '#666');
            const xTicks = xAxis.selectAll('.tick').data(d3.range(2009, 2020, 1));
            xTicks.enter().append('g').attr('class', 'tick')
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d;
                        }).attr('y', 20).attr('fill', '#222')
                        .attr('text-anchor', 'middle')
                        .style('font-size', '1.5rem').style('font-weight', 700).attr('x', function (d) {
                            return scaleYear(d) + scaleYear.bandwidth() / 2;
                        }).attr('opacity', .75);
                });

            const yAxis = svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
                .style('pointer-events', 'none');
            const yTicks = yAxis.selectAll('.tick').data(d3.range(0, 1.1, 0.1));
            yTicks.enter().append('g').attr('class', 'tick')
                .attr('id', function (d) {
                    return d;
                })
                .call(function (g) {
                    g.append('line').attr('x1', 0).attr('x2', width).attr('stroke', function (d) {
                            if (d === 0) return 'transparent';

                            return '#666';
                        })
                        .attr('stroke-dasharray', '.75rem').attr('stroke-opacity', .75).attr('stroke-width', .5)
                        .attr('y1', scalePerc)
                        .attr('y2', scalePerc);

                    g.append('text').text(function (d) {
                            return d.toFixed(1) * 100 + '%';
                        }).attr('x', -10).attr('y', scalePerc)
                        .attr('dy', '.32em')
                        .attr('text-anchor', 'end')
                        .attr('opacity', .75).style('font-size', '1.5rem').style('font-weight', 700)
                        .attr('fill', '#222');
                });
        }

        makeAxis();

        /* jelmagyarázat */
        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + margin.left + ', ' + 50 + ')');

            const labelGroup = legend.append('g').attr('class', 'labelGroup')
                .call(function (g) {
                    g.append('text').text('Colombian GDP by sector').style('font-size', '2.6rem').style('font-weight', 700);
                    g.append('text').text('Measured in percentage | 2009 - 2019 | Figures have been rounded | Percentages do not add up to 100%').style('font-size', '1.3rem').style('font-weight', 700).attr('opacity', .5)
                        .attr('y', 32);
                });

            const circleGroup = legend.append('g').attr('class', 'circleGroup')
                .attr('transform', 'translate(5, 64)')
                .selectAll('.group').data(sectors)
                .enter().append('g').attr('class', 'group')
                .call(function (g) {
                    g.append('circle').attr('r', 5).attr('cx', function (d, i) {
                        return i * 125;
                    }).attr('fill', colorScale);
                    g.append('text').text(function (d) {
                        return d;
                    }).attr('x', function (d, i) {
                        return i * 125 + 10;
                    }).attr('dy', '.35em')
                    .style('font-size', '1.3rem').style('font-weight', 700).attr('opacity', .5);
                });
        }

        makeLegend();

        const makeChart = function () {
            const groups = chartHolder.selectAll('.group').data(data);

            groups.enter().append('g').attr('class', 'group')
                .attr('fill', function (d) {
                    return colorScale(d.key);
                })
                .selectAll('rect')
                .data(function (d) {
                    return d;
                }).enter().append('rect')
                .attr('class', function (d) {
                    return 'rect rect__' + d.key;
                })
                .attr('x', function (d) {
                    return scaleYear(d.data.Year);
                })
                .attr('y', function (d) {
                    return scalePerc(d[1]);
                })
                .attr('width', scaleYear.bandwidth())
                .attr('height', function (d) {
                    return scalePerc(d[0]) - scalePerc(d[1]);
                })
                .on('mouseenter', function (d) {
                    chartHolder.selectAll('.rect').transition().duration(viz.TRANS_DURATION / 6).attr('opacity', 0.5);
                    chartHolder.selectAll('.rect__' + d.key).transition().duration(viz.TRANS_DURATION / 6).attr('opacity', 1);

                    tooltip.select('.tooltip--heading').html(d.data.Year);

                    tooltip.select('p.tooltip--info__services span.tooltip--info__text').html((d.data.Services * 100).toFixed(2) + '%');
                    tooltip.select('p.tooltip--info__services span.tooltip--info__circle').style('background-color', colorScale('Services'));

                    tooltip.select('p.tooltip--info__industry span.tooltip--info__text').html((d.data.Industry * 100).toFixed(2) + '%');
                    tooltip.select('p.tooltip--info__industry span.tooltip--info__circle').style('background-color', colorScale('Industry'));

                    tooltip.select('p.tooltip--info__agriculture span.tooltip--info__text').html((d.data.Agriculture * 100).toFixed(2) + '%');
                    tooltip.select('p.tooltip--info__agriculture span.tooltip--info__circle').style('background-color', colorScale('Agriculture'));
                })
                .on('mouseleave', function (d) {
                    chartHolder.selectAll('.rect').transition().duration(viz.TRANS_DURATION / 6).attr('opacity', 1);
                    tooltip.style('left', '-9999px');
                })
                .on('mousemove', function (d) {
                    if (d3.event.pageX >= width) {
                        tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) - 20) + 'px');
                    } else {
                        tooltip.style('left', (d3.event.pageX + 20) + 'px');
                    }
                    tooltip.style('top', (d3.event.pageY + 20) + 'px');
                });
        }

        makeChart();
    }
}(window.viz = window.viz || {}));