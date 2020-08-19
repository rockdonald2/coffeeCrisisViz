(function (viz) {
    'use strict';

    const chartContainer = d3.select('#historicalPrices');
    const margin = {
        'top': 135,
        'left': 75,
        'right': 25,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* skálák */
    const scaleTime = d3.scaleTime().range([0, width]);
    const scalePrice = d3.scaleLinear().range([height, 0]);

    viz.initLineChart3 = function () {
        const data = viz.data.historicalPrices;
        
        const dimensions = viz.makeDimensionsObj(width, height, margin);

        scaleTime.domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        scalePrice.domain([0, d3.max(data, function (d) {
            return d.Price;
        })]).nice();

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);
        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        /* tengelyek */
        viz.makeAxis(svg, dimensions, 
            scaleTime, scalePrice, 
            d3.timeYear.every(5).range(scaleTime.domain()[0], scaleTime.domain()[1]),
            d3.range(0, scalePrice.domain()[1] + 50, 50),
            d3.timeFormat('%Y'),
            d3.format('d'));

        /* jelmagyarázat */
        viz.makeLegend(svg, dimensions, 'Historical retail prices of coffee in the U.S.', 'Measured in cents per pounds | 1913-1978');

        const addMemorableDates = function () {
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
        } ();

        viz.makeSingleLineChart(chartHolder, data, scaleTime, scalePrice);
        viz.addHoverEffectXAxis(svg, dimensions, data, scaleTime, scalePrice)
    }
}(window.viz = window.viz || {}));