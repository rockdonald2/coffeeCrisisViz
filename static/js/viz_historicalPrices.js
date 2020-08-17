(function (viz) {
    'use strict';

    const chartContainer = d3.select('#historicalPrices');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 150,
        'left': 75,
        'right': 25,
        'bottom': 50
    };
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    /* svg */
    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    /* mousearea */
    const mouseRect = svg.append('rect').attr('class', 'mouseArea')
        .attr('x', margin.left).attr('y', margin.top).attr('width', width).attr('height', height)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair');

    /* skálák */
    const scaleTime = d3.scaleTime().range([0, width]);
    const scalePrice = d3.scaleLinear().range([height, 0]);

    /* vonaldiagram */
    const line = d3.line()
        .defined(function (d) {
            return d.Value !== null;
        })
        .x(function (d) {
            return scaleTime(d.Year);
        })
        .y(function (d) {
            return scalePrice(d.Price);
        });

    let chartHolder = null;

    function bisect(mx, data) {
        const bisect = d3.bisector(function (d) {
            return d.Year;
        }).left;

        const date = scaleTime.invert(mx);
        const index = bisect(data, date, 1);
        const a = data[index - 1];
        const b = data[index];

        return b && (date - a.Year > b.Year - date) ? b : a;
    }

    viz.initLineChart3 = function () {
        const data = viz.data.historicalPrices;

        scaleTime.domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        scalePrice.domain([0, d3.max(data, function (d) {
            return d.Price;
        })]).nice();

        /* tengelyek */
        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
            const xLine = xAxis.append('line').attr('class', 'x-line').attr('x1', 0).attr('x2', width).attr('y1', 0).attr('y2', 0)
                .attr('stroke', '#222')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-width', .75)
                .attr('stroke-opacity', .75);
            const xTicks = xAxis.selectAll('.x-tick').data(d3.timeYear.every(6).range(scaleTime.domain()[0], scaleTime.domain()[1]))
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
            const yTicks = yAxis.selectAll('.y-tick').data(d3.range(0, d3.max(data, function (d) {
                    return d.Price;
                }) + 50, 50))
                .enter().append('g').attr('class', 'y-tick')
                .call(function (g) {
                    g.append('line').attr('x1', 0).attr('x2', width)
                        .attr('y1', scalePrice).attr('y2', scalePrice)
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
                        }).attr('y', scalePrice)
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

        /* jelmagyarázat */
        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend');

            const labelGroup = legend.append('g').attr('class', 'labelGroup').attr('transform', 'translate(' + margin.left + ', ' + margin.top / 2 + ')')
                .call(function (g) {
                    g.append('text').text('Historical retail prices of coffee in the U.S.')
                        .style('font-size', '2.6rem').style('font-weight', 700);
                })
                .call(function (g) {
                    g.append('text').text('Measured in cents per pounds | 1913-1978').style('font-size', '1.3rem').style('font-weight', 700)
                        .attr('opacity', .5).attr('y', 32);
                });
        }

        makeLegend();

        chartHolder = svg.append('g').attr('class', 'chartHolder').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        chartHolder.append('path').datum(data).attr('class', 'line')
            .attr('d', line)
            .attr('stroke', '#666')
            .attr('stroke-opacity', .75).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('mix-blend-mode', 'multiply')
            .style('pointer-events', 'none');

        const stockCrash = chartHolder.append('g').attr('class', 'stockCrash')
            .style('pointer-events', 'none')
            .attr('transform', 'translate(' + scaleTime(new Date(1929, 0, 1)) + ', 0)')
            .call(function (g) {
                g.append('line').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', height).attr('stroke', '#5e0606')
                    .attr('stroke-width', 3).attr('stroke-dasharray', '1rem')
                    .attr('opacity', .75);
            })
            .call(function (g) {
                g.append('text').text('Stock market crash')
                    .attr('y', 30).attr('x', 10)
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', '#5e0606')
                    .style('font-size', '1.5rem')
                    .style('font-weight', 700);
            });
        const oilCrisis = chartHolder.append('g').attr('class', 'oilCrisis')
            .style('pointer-events', 'none')
            .attr('transform', 'translate(' + scaleTime(new Date(1973, 0, 1)) + ', 0)')
            .call(function (g) {
                g.append('line').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', height).attr('stroke', '#5e0606')
                    .attr('stroke-width', 3).attr('stroke-dasharray', '1rem')
                    .attr('opacity', .75);
            })
            .call(function (g) {
                g.append('text').text('Oil crisis')
                    .attr('y', 30).attr('x', -80)
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', '#5e0606')
                    .style('font-size', '1.5rem')
                    .style('font-weight', 700);
            });

        const dot = svg.append('g')
            .attr('display', 'none').style('pointer-events', 'none');
        dot.append('circle')
            .attr('r', 4)
            .attr('fill', '#222');
        dot.append('text').attr('id', 'topText')
            .style('font-size', '1.5rem')
            .attr('text-anchor', 'middle')
            .attr('y', -10);
        dot.append('text').attr('id', 'bottomText')
            .style('font-size', '1.5rem')
            .attr('text-anchor', 'middle')
            .attr('y', 20);

        mouseRect.on('touchmove mousemove', function () {
            const {
                Year,
                Price
            } = bisect(d3.mouse(this)[0] - margin.left, data);

            dot.attr('transform', 'translate(' + (margin.left + scaleTime(Year)) + ', ' + (margin.top + scalePrice(Price)) + ')')
                .attr('display', null);
            dot.select('#topText').text(Price);
            dot.select('#bottomText').text(d3.timeFormat('%Y')(Year));
        });

        mouseRect.on('touchend mouseleave', function () {
            dot.attr('display', 'none');
        });
    }
}(window.viz = window.viz || {}));