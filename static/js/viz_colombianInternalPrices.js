(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombianInternalPrices');
    const margin = {
        'top': 100,
        'left': 75,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* svg */
    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    /* chartholder */
    const chartHolder = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    /* mousearea */
    const mouseArea = svg.append('rect').attr('class', 'mouseArea')
        .attr('x', margin.left).attr('y', margin.top).attr('width', width).attr('height', height)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair');

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
            return scaleValue(d.Price);
        });

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

    viz.initLineChart4 = function () {
        const data = viz.data.colombianInternalPrice;

        scaleTime.domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        scaleValue.domain([0, d3.max(data, function (d) {
            return d.Price;
        })]).nice();

        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(' + margin.left + ', ' + (margin.top + height) + ')');
            const xLine = xAxis.append('line').attr('x1', 0).attr('x2', width).attr('y1', 0).attr('y2', 0)
                .attr('stroke', '#222').attr('stroke-width', .75).attr('stroke-opacity', .75).attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round');
            const xTicks = xAxis.selectAll('.x-tick').data(d3.timeYear.every(5).range(scaleTime.domain()[0], scaleTime.domain()[1]))
                .enter().append('g').attr('class', 'x-tick')
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d3.timeFormat('\'%y %b')(d);
                        }).attr('x', scaleTime)
                        .attr('text-anchor', 'middle')
                        .attr('y', 20)
                        .attr('fill', '#222')
                        .style('font-size', '1.5rem')
                        .style('font-weight', 700)
                        .attr('opacity', .75);
                });

            const yAxis = svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
            const yTicks = yAxis.selectAll('.y-tick').data(d3.range(scaleValue.domain()[0], scaleValue.domain()[1], 175000))
                .enter().append('g').attr('class', 'y-tick')
                .call(function (g) {
                    g.append('line').attr('x1', 0).attr('x2', width)
                        .attr('y1', scaleValue).attr('y2', scaleValue)
                        .attr('stroke', '#666').attr('stroke-opacity', .5)
                        .attr('stroke-width', .5).attr('stroke-dasharray', '.75rem')
                        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
                    g.append('text').text(function (d) {
                            if (d === 0) return 0;

                            return d3.format('.2s')(d);
                        }).style('font-size', '1.5rem').attr('fill', '#222').attr('opacity', .75).style('font-weight', 700)
                        .attr('x', -10).attr('dy', '.32em').attr('text-anchor', 'end')
                        .attr('y', scaleValue);
                })
        }

        makeAxis();

        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + margin.left + ', 50)');

            const titleGroup = legend.append('g').attr('class', 'titleGroup')
                .call(function (g) {
                    g.append('text').text('Colombian monthly internal price of coffee').style('font-size', '2.6rem')
                        .style('font-weight', 700);
                    g.append('text').text('Measured in pesos per 125kg bags | 1944 January - 2020 July').attr('y', 32)
                        .style('font-weight', 700).style('font-size', '1.3rem').attr('opacity', .5);
                });
        }

        makeLegend();

        const makeChart = function () {
            const graph = chartHolder.append('path').datum(data)
                .attr('class', 'line').attr('d', line)
                .attr('stroke', '#666').attr('stroke-opacity', .75).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
                .attr('stroke-width', 3)
                .attr('fill', 'none')
                .style('mix-blend-mode', 'multiply')
                .style('pointer-events', 'none');
        }

        makeChart();

        const dot = svg.append('g')
            .attr('display', 'none').style('pointer-events', 'none');
        dot.append('circle')
            .attr('r', 4)
            .attr('fill', '#222');
        dot.append('text').attr('id', 'topText')
            .style('font-size', '1.5rem')
            .attr('text-anchor', 'middle')
            .attr('y', -30);
        dot.append('text').attr('id', 'bottomText')
            .style('font-size', '1.5rem')
            .attr('text-anchor', 'middle')
            .attr('y', -10);

        mouseArea.on('touchmove mousemove', function () {
            const {
                Year,
                Price
            } = bisect(d3.mouse(this)[0] - margin.left, data);

            dot.attr('transform', 'translate(' + (margin.left + scaleTime(Year)) + ', ' + (margin.top + scaleValue(Price)) + ')')
                .attr('display', null);
            dot.select('#topText').text(Price < 1000 ? Price : d3.format('.2s')(Price));
            dot.select('#bottomText').text(d3.timeFormat('\'%y %b')(Year));
        });
        mouseArea.on('touchend mouseleave', function () {
            dot.attr('display', 'none');
        });
    }
}(window.viz = window.viz || {}));