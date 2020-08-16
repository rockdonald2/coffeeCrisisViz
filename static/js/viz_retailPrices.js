(function (viz) {
    'use strict';
    const chartContainer = d3.select('#retailPrices');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 125,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    /* for future use */
    let years = null;

    /* svg */
    const svg = chartContainer.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right);

    const mouseRect = svg.append('rect').attr('class', 'mouseArea').attr('x', margin.left).attr('y', margin.top).attr('width', width).attr('height', height)
        .attr('fill', 'transparent')
        .style('cursor', 'crosshair');

    /* skálák */
    const scaleTime = d3.scaleTime().range([0, width]);
    const scaleValue = d3.scaleLinear().range([height, 0]);

    /* vonaldiagram */
    const line = d3.line()
        .defined(function (d) {
            return d.Value !== null;
        })
        .x(function (d) {
            return scaleTime(d.Year);
        })
        .y(function (d) {
            return scaleValue(d.Value);
        });

    function hover(rect, path, data) {
        if ('ontouchstart' in document) {
            rect.on('touchmove', moved)
                .on('touchstart', entered)
                .on('touchend', left);
        } else {
            rect.on('mousemove', moved)
                .on('mouseenter', entered)
                .on('mouseleave', left);
        }

        const dot = svg.append('g')
            .attr('display', 'none').style('pointer-events', 'none');
        dot.append('circle')
            .attr('r', 4)
            .attr('fill', '#222');
        dot.append('text')
            .style('font-size', '1.5rem')
            .attr('text-anchor', 'middle')
            .attr('y', -10);

        const valueLines = svg.append('g').attr('display', 'none').style('pointer-events', 'none');
        valueLines.append('line').attr('id', 'x-line').attr('stroke', '#222').attr('stroke-width', .5).attr('opacity', .75);
        valueLines.append('line').attr('id', 'y-line').attr('stroke', '#222').attr('stroke-width', .5).attr('opacity', .75);
        valueLines.append('text').attr('id', 'x-value').style('font-size', '1.5rem').style('font-weight', 700).attr('text-anchor', 'middle');
        valueLines.append('text').attr('id', 'y-value').style('font-size', '1.5rem')
            .style('font-weight', 700).attr('alignment-baseline', 'middle').attr('text-anchor', 'middle');

        function moved() {
            d3.event.preventDefault();

            const mouse = d3.mouse(this);

            const xm = scaleTime.invert(mouse[0] - margin.left);
            const ym = scaleValue.invert(mouse[1] - margin.top);

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

            dot.attr('transform', 'translate(' + (margin.left + scaleTime(years[i])) + ', ' + (margin.top + scaleValue(s.values[i].Value)) + ')');
            dot.select('text').text(viz.data.codes[s.key]);

            valueLines.select('#x-line').attr('x1', margin.left + scaleTime(years[i])).attr('x2', margin.left)
                .attr('y1', margin.top + scaleValue(s.values[i].Value)).attr('y2', margin.top + scaleValue(s.values[i].Value));
            valueLines.select('#y-line').attr('x1', scaleTime(years[i]) + margin.left).attr('x2', scaleTime(years[i]) + margin.left)
                .attr('y1', margin.top + scaleValue(s.values[i].Value)).attr('y2', height + margin.top);
            valueLines.select('#x-value').text(d3.timeFormat('%Y')(years[i]))
                .attr('x', margin.left + scaleTime(years[i]))
                .attr('y', height + margin.top + 20);
            valueLines.select('#y-value').text(s.values[i].Value.toFixed(0))
                .attr('x', margin.left - 20)
                .attr('y', scaleValue(s.values[i].Value) + margin.top);

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

    viz.initLineChart2 = function () {
        scaleTime.domain(d3.extent(viz.data.retailPrices, function (d) {
            return d.Year;
        }));
        scaleValue.domain([0, d3.max(viz.data.retailPrices, function (d) {
            return d.Value;
        })]).nice();

        years = d3.timeYear.range(new Date(1990, 0, 1), new Date(2019, 0, 1), 1);

        /* tengelyek */
        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
            const xLine = xAxis.append('line').attr('class', 'x-line').attr('x1', 0).attr('x2', width).attr('y1', 0).attr('y2', 0)
                .attr('stroke', '#222')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-width', .75)
                .attr('stroke-opacity', .75);
            const xTicks = xAxis.selectAll('.x-tick').data(d3.timeYear.every(8).range(scaleTime.domain()[0], scaleTime.domain()[1]))
                .enter().append('g').attr('class', 'x-tick')
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d3.timeFormat('%Y')(d);
                        }).attr('y', 20).attr('x', scaleTime)
                        .style('font-size', '1.5rem')
                        .style('font-weight', 700)
                        .attr('fill', '#222')
                        .attr('opacity', .75)
                        .attr('text-anchor', 'middle');
                });

            const yAxis = svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
            const yTicks = yAxis.selectAll('.y-tick').data(d3.range(0, 23, 2.5))
                .enter().append('g').attr('class', 'y-tick')
                .call(function (g) {
                    g.append('line').attr('x1', 0).attr('x2', width)
                        .attr('y1', scaleValue).attr('y2', scaleValue)
                        .attr('stroke', function (d) {
                            if (d === 0) return 'transparent'
                            else return '#222';
                        })
                        .attr('stroke-width', .5)
                        .attr('stroke-opacity', .75)
                        .attr('stroke-linejoin', 'round')
                        .attr('stroke-linecap', 'round')
                        .attr('stroke-dasharray', '.5rem');
                })
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d;
                        }).attr('y', scaleValue)
                        .attr('x', -20)
                        .style('font-size', '1.5rem')
                        .style('font-weight', 700)
                        .attr('fill', '#222')
                        .attr('opacity', .75)
                        .attr('alignment-baseline', 'middle')
                        .attr('text-anchor', 'middle')
                        .attr('dy', '.05em');
                });
        }

        makeAxis();

        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend');

            const labelGroup = legend.append('g').attr('class', 'labelGroup').attr('transform', 'translate(' + margin.left + ', ' + margin.top / 3 + ')')
                .call(function (g) {
                    g.append('text').text('Retail prices of roasted coffee in selected importing countries')
                        .style('font-size', '2.6rem').style('font-weight', 700);
                })
                .call(function (g) {
                    g.append('text').text('Measured in dollars per pounds | 1990-2018').style('font-size', '1.3rem').style('font-weight', 700)
                        .attr('opacity', .5).attr('y', 32);
                });
        }

        makeLegend();

        viz.updateLineChart2();
    }

    /* chartHolder */
    const chartHolder = svg.append('g').attr('class', 'chartHolder').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    viz.updateLineChart2 = function () {
        const data = d3.nest().key(function (d) {
            return d.Code;
        }).entries(viz.data.retailPrices);

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
                return line(d.values);
            })
            .attr('opacity', 1);

        mouseRect.call(hover, chartHolder.selectAll('.line'), data);
    }
}(window.viz = window.viz || {}));