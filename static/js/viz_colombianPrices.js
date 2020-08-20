(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombianPrices');
    const nOfCharts = 2;
    const margin = {
        'top': 125,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) / nOfCharts - margin.top - margin.bottom;

    /* skálák - schema */
    const s_scaleTime = d3.scaleTime().range([0, width]);
    const s_scaleValue = d3.scaleLinear().range([height, 0]);

    viz.initLineChart4 = function () {
        /* data */
        const data = viz.data.colombianInternalPrice;

        const scaleTime = s_scaleTime.copy().domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        const scaleValue = s_scaleValue.copy().domain([0, d3.max(data, function (d) {
            return d.Price;
        })]).nice();

        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);

        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        viz.makeAxis(svg, dimensions, scaleTime, scaleValue, 
            d3.timeYear.every(5).range(scaleTime.domain()[0], scaleTime.domain()[1]),
            d3.range(scaleValue.domain()[0], scaleValue.domain()[1] + 150000, 150000),
            d3.timeFormat('\'%y %b'),
            d3.format('.2s'));
        viz.makeLegend(svg, dimensions, 'Colombian monthly internal price of coffee', 'Measured in pesos per 125kg bags | 1944 January - 2020 July');

        viz.makeSingleLineChart(chartHolder, data, scaleTime, scaleValue);
        viz.addHoverEffectXAxis(svg, dimensions, data, scaleTime, scaleValue, true, false);
    }

    viz.initLineChart5 = function () {
        /* data */
        const data = viz.data.colombianExportPrice;

        const scaleTime = s_scaleTime.copy().domain(d3.extent(data, function (d) {
            return d.Year;
        }));
        const scaleValue = s_scaleValue.copy().domain([0, d3.max(data, function (d) {
            return d.Price;
        })]).nice();

        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);

        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        viz.makeAxis(svg, dimensions, scaleTime, scaleValue,
            d3.timeYear.every(5).range(scaleTime.domain()[0], scaleTime.domain()[1]),
            d3.range(scaleValue.domain()[0], scaleValue.domain()[1] + 50, 50),
            d3.timeFormat('%Y'),
            d3.format('d'));
        viz.makeLegend(svg, dimensions, 'Colombian annual export price of coffee', 'Measured in cents per pounds | 1913 - 2019');

        viz.makeSingleLineChart(chartHolder, data, scaleTime, scaleValue);
        viz.addHoverEffectXAxis(svg, dimensions, data, scaleTime, scaleValue, false, false);
    }
} (window.viz = window.viz || {}));