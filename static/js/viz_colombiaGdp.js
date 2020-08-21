(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombiaGdp');
    let margin = {
        'top': 165,
        'left': 100,
        'right': 50,
        'bottom': 60
    };
    if (window.innerWidth < 850) {
        margin = {
            'top': 150,
            'left': 50,
            'right': 50,
            'bottom': 50
        };
    }

    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

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
        /* data */
        const columns = d3.keys(viz.data.colombiaGdp[0]);
        const data = d3.stack().keys(columns.slice(1))(viz.data.colombiaGdp);
        data.forEach(function (d) {
            d.forEach(function (v) {
                v.key = d.key;
            });
        });

        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);
        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        /* tengelyek */
        const makeAxis = function () {
            viz.makeAxis(svg, dimensions, scaleYear, scalePerc,
                d3.range(2009, 2020, 1),
                d3.range(0, 1.1, 0.1),
                d3.format('d'),
                d3.format('.0%'));

            svg.select('.x-axis').selectAll('.x-tick').attr('transform', 'translate(0, 20)').selectAll('text').attr('x', function (d) {
                return scaleYear(d) + scaleYear.bandwidth() / 2;
            }).attr('transform', null);
        }();

        /* jelmagyarázat */
        const makeLegend = function () {
            const legend = viz.makeLegend(svg, dimensions, 'Colombian GDP by sector', 'Measured in percentage | 2009 - 2019');

            const circleGroup = legend.append('g').attr('class', 'circleGroup')
                .attr('transform', 'translate(5, 64)')
                .selectAll('.group').data(sectors)
                .enter().append('g').attr('class', 'group')
                .call(function (g) {
                    g.append('circle').attr('r', 5).attr('cx', function (d, i) {
                        if (window.innerWidth <= 850) {
                            return i * 75;
                        } else {
                            return i * 125;
                        }
                    }).attr('fill', colorScale);
                    g.append('text').text(function (d) {
                            return d;
                        }).attr('x', function (d, i) {
                            if (window.innerWidth <= 850) {
                                return i * 75 + 10;
                            } else {
                                return i * 125 + 10;
                            }
                        }).attr('dy', '.35em')
                        .style('font-size', function () {
                            if (window.innerWidth <= 850) {
                                return '1rem';
                            } else {
                                return '1.3rem';
                            }
                        }).style('font-weight', 700).attr('opacity', .5);
                });
        }();

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
                .on('mouseenter touchmove', function (d) {
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
                .on('mousemove', function (d) {
                    if (d3.event.pageX >= width * 0.75) {
                        tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) - 20) + 'px');
                    } else {
                        tooltip.style('left', (d3.event.pageX + 20) + 'px');
                    }
                    tooltip.style('top', (d3.event.pageY + 20) + 'px');
                })
                .on('mouseleave touchend', function (d) {
                    chartHolder.selectAll('.rect').transition().duration(viz.TRANS_DURATION / 6).attr('opacity', 1);
                    tooltip.style('left', '-9999px');
                });
        }();
    }
}(window.viz = window.viz || {}));
