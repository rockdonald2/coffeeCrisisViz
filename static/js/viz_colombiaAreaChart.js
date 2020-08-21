(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombiaAreaChart');
    const margin = {
        'top': 100,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* skálák */
    /* years: 1956-01-> 2020-06*/
    const scaleTime = d3.scaleTime().range([0, width]);
    const scaleValue = d3.scaleLinear().range([height, 0]).nice();

    /* update elemek */
    const areaGenerator = d3.area().x(function (d) {
            return scaleTime(d.Year);
        })
        .y0(scaleValue(0))
        .y1(function (d) {
            return scaleValue(d.Production);
        });

    const makeXAxis = function (g) {
        g.call(d3.axisBottom(scaleTime));
        g.call(function (g) {
            g.attr('font-family', null).attr('font-size', null).attr('fill', null).attr('text-anchor', 'start');
            g.select('.domain').remove();
            g.selectAll('.tick').attr('opacity', null);
            g.selectAll('.x-axis line').remove();
            g.selectAll('.x-axis text').style('font-size', function () {
                    if (window.innerWidth <= 850) {
                        return '1rem';
                    } else {
                        return '1.5rem';
                    }
                })
                .style('font-weight', 700).attr('fill', '#222')
                .attr('opacity', 0.75)
                .attr('text-anchor', 'middle')
                .attr('y', 10)
                .call(function (g) {
                    if (window.innerWidth <= 850) {
                        g.attr('transform', 'translate(10, 20) rotate(60)');
                    }
                });
        });
    };

    /* azért van szükség erre, hogy ne lehessen azonnal reset után brusholni */
    let idleTimeout;

    function idled() {
        idleTimeout = null;
    }

    viz.initAreaChart = function () {
        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);
        svg.on('dblclick', function () {
            scaleTime.domain(d3.extent(viz.data.colombiaProduction, function (d) {
                return d.Year;
            }));
            svg.select('.x-axis').call(makeXAxis);
            chartHolder.select('.area').transition().duration(viz.TRANS_DURATION).attr('d', areaGenerator);
        }).dblTap(function () {
            scaleTime.domain(d3.extent(viz.data.colombiaProduction, function (d) {
                return d.Year;
            }));
            svg.select('.x-axis').call(makeXAxis);
            chartHolder.select('.area').transition().duration(viz.TRANS_DURATION).attr('d', areaGenerator);
        });
        /* clip-path, bármi ezen a területen kívül nem lesz látható */
        const clip = svg.append('defs').append('svg:clipPath')
            .attr('id', 'clip').append('svg:rect').attr('width', dimensions.width)
            .attr('height', dimensions.height).attr('x', 0).attr('y', 0);
        /* brush */
        const brush = d3.brushX().extent([
                [0, 0],
                [width, height]
            ])
            .on('end', function (e) {
                updateAreaChart(svg, chartHolder);
            });

        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions).attr('clip-path', 'url(#clip)');

        const data = viz.data.colombiaProduction;
        const mean = d3.mean(data, function (d) {
            return d.Production;
        });

        scaleTime.domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        scaleValue.domain([0, d3.max(data, function (d) {
            return d.Production;
        })]);

        const makeAxis = function () {
            svg.append('line').attr('x1', margin.left).attr('x2', margin.left + width)
                .attr('y1', margin.top + height)
                .attr('y2', margin.top + height).attr('stroke', '#222')
                .attr('stroke-width', .75).attr('stroke-opacity', .75)
                .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');

            const xAxis = svg.append('g').attr('class', 'x-axis')
                .attr('transform', 'translate(' + margin.left + ', ' + (margin.top + height) + ')')
                .call(makeXAxis);

            const yAxis = svg.append('g').attr('class', 'y-axis')
                .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
            const yTicks = yAxis.selectAll('.y-tick')
                .data(d3.range(scaleValue.domain()[0], scaleValue.domain()[1], 500));
            yTicks.enter().append('g').attr('class', 'y-tick')
                .call(function (g) {
                    g.append('line').attr('x1', 0).attr('x2', width)
                        .attr('y1', scaleValue).attr('y2', scaleValue).attr('stroke', '#666')
                        .attr('stroke-dasharray', '.75rem').attr('stroke-opacity', .75)
                        .attr('stroke-width', .5).attr('stroke-linejoin', 'round')
                        .attr('stroke-linecap', 'round');

                    g.append('text').text(function (d) {
                            if (d === 0) return;

                            return d;
                        }).attr('fill', '#222').attr('opacity', .75)
                        .attr('x', -10).attr('y', scaleValue).style('font-size', function () {
                            if (window.innerWidth <= 850) {
                                return '1rem';
                            } else {
                                return '1.5rem';
                            }
                        }).style('font-weight', 700).attr('text-anchor', 'end').attr('dy', '.32em');
                });
            const meanLine = function () {
                yAxis.append('g').attr('class', 'meanGroup')
                    .call(function (g) {
                        g.append('line').attr('stroke', '#620303').attr('stroke-width', 1).attr('opacity', 1)
                            .attr('stroke-dasharray', '1rem')
                            .attr('x1', 0).attr('x2', width).attr('y1', scaleValue(mean)).attr('y2', scaleValue(mean));
                        g.append('text').text('Mean').attr('fill', '#620303').style('font-size', '1.1rem')
                            .attr('y', scaleValue(mean) - 10).attr('x', 10);
                    });
            }();
        }();

        viz.makeLegend(svg, dimensions, 'Colombian monthly production of coffee', 'Measured in thousand 60kg bags | 1956 January - 2020 June');

        const makeChart = function () {
            chartHolder.append('path').datum(data)
                .attr('class', 'area')
                .attr('fill', '#7f2c2c')
                .attr('fill-opacity', .75)
                .attr('d', areaGenerator);

            chartHolder.append('g').attr('class', 'brush')
                .call(brush);
        }();

        /* muszáj a brush-al egy scope-ban legyen */
        function updateAreaChart(svg, chartHolder) {
            const extent = d3.event.selection;

            if (!extent) {
                if (!idleTimeout) {
                    return idleTimeout = setTimeout(idled, viz.TRANS_DURATION);
                }
            } else {
                /* ha a kijelölt időtáv kevesebb lenne, mint 1 év, ne csináljon semmit */
                if ((scaleTime.invert(extent[1]) - scaleTime.invert(extent[0])) > (1000 * 60 * 60 * 24 * 365)) {
                    scaleTime.domain([scaleTime.invert(extent[0]), scaleTime.invert(extent[1])]);
                }

                chartHolder.select('.brush').call(brush.move, null);
            }

            svg.select('.x-axis').call(makeXAxis);
            chartHolder.select('.area').transition().duration(viz.TRANS_DURATION).attr('d', areaGenerator);
        }
    }
}(window.viz = window.viz || {}));