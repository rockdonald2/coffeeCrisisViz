(function (viz) {
    'use strict';

    const chartContainer = d3.select('#majorProducers');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 100,
        'left': 50,
        'right': 50,
        'bottom': 25
    };

    /* méretek */
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    /* svg */
    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const mapHolder = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        .attr('class', 'mapHolder');

    /* skálák */
    const colorScale = d3.scaleThreshold().domain([1, 7500, 15000, 22500, 30000]).range(['#f36d6d', '#aa4b4b', '#7f2c2c', '#642828', '#691d1d', '#5e0606']);
    /* years: 1990->2018 */
    let years = d3.range(1990, 2019);
    let currentYear = 2018;
    const sliderTime = d3.sliderBottom().min(d3.min(years)).max(d3.max(years))
        .step(1).width(340).tickFormat(d3.format('d'))
        .handle('M7.978845608028654,0A7.978845608028654,7.978845608028654,0,1,1,-7.978845608028654,0A7.978845608028654,7.978845608028654,0,1,1,7.978845608028654,0')
        .tickValues([]).default(new Date(2018, 0, 1))
        .on('onchange', function (d) {
            currentYear = d;
            viz.updateMap(currentYear);
        });

    /* path */
    const projection = d3.geoMercator().center([72.5, 38]).scale(160);
    const path = d3.geoPath().projection(projection);

    /* graticule */
    const graticule = d3.geoGraticule().step([5, 5]);
    const graticuleHolder = mapHolder.append('g').attr('class', 'graticuleHolder')
    const graticuleTextHolder = mapHolder.append('g').attr('class', 'graticuleTextHolder')

    /* tooltip */
    const tooltip = chartContainer.select('.tooltip');

    /* térkép létrehozása */
    viz.initMap = function () {
        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

            const labelGroup = legend.append('g').attr('class', 'labelGroup')
                .call(function (g) {
                    g.append('rect').attr('width', 32).attr('height', 32).attr('fill', '#7f2c2c')
                        .attr('opacity', .75);
                })
                .call(function (g) {
                    g.append('text').text('Major coffee producers')
                        .attr('alignment-baseline', 'middle')
                        .attr('x', 48).attr('y', 16)
                        .attr('dy', '.11em')
                        .style('font-size', '2.6rem')
                        .style('font-weight', '700')
                        .style('pointer-events', 'none');
                })
                .call(function (g) {
                    g.append('text').text('Measured in thousand 60kg bags')
                        .attr('alignment-baseline', 'middle')
                        .attr('x', 48).attr('y', 48)
                        .attr('dx', '.11em')
                        .style('font-size', '1.3rem')
                        .style('font-weight', 700)
                        .attr('opacity', .5)
                        .attr('fill', '#222');
                });

            const sliderGroup = legend.append('g').attr('class', 'sliderGroup')
                .attr('transform', 'translate(10, 80)')
                .call(sliderTime)
                .call(function (g) {
                    g.select('.slider .parameter-value text').style('font-size', '1.5rem').style('font-weight', 700).attr('fill', '#222')
                        .attr('opacity', .75).attr('dy', '.21em');
                })
                .call(function (g) {
                    g.selectAll('.slider line').attr('opacity', .75);
                })
                .call(function (g) {
                    g.select('.slider .parameter-value path').attr('fill', '#7f2c2c')
                        .attr('stroke', 'transparent');
                });
        }

        makeLegend();

        const makeGraticule = function () {
            /* hozzáadjuk a graticule-t */
            graticuleHolder.selectAll('path').data(graticule.lines())
                .enter().append('path').attr('class', 'graticule-line')
                .attr('d', function (d) {
                    const c = d.coordinates;

                    if (c[0][1] === 25 || c[0][1] === -30) {
                        return path(d);
                    }
                })
                .attr('fill', 'none')
                .attr('stroke', '#777')
                .attr('stroke-width', .5)
                .attr('stroke-opacity', .5)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-dasharray', '.75rem');

            graticuleTextHolder.selectAll('text').data(graticule.lines())
                .enter().append('text').text(function (d) {
                    const c = d.coordinates;

                    if (c[0][1] === 25 || c[0][1] === -30) {
                        return (c[0][1] < 0) ? -c[0][1] + "°S" : c[0][1] + "°N";
                    }
                })
                .attr('class', 'graticule-label')
                .attr('style', function (d) {
                    const c = d.coordinates;

                    return (c[0][1] == c[1][1]) ? 'text-anchor: end' : 'text-anchor: middle';
                })
                .attr('dx', function (d) {
                    const c = d.coordinates;

                    return (c[0][1] == c[1][1]) ? -10 : 0;
                })
                .attr('dy', function (d) {
                    const c = d.coordinates;

                    return (c[0][1] == c[1][1]) ? 4 : 10;
                })
                .attr('transform', function (d) {
                    const c = d.coordinates;
                    const p = projection(c[0]);

                    return 'translate(' + (p[0] + width / 2 + 100) + ', ' + (p[1]) + ')';
                })
                .style('font-size', '1.3rem')
                .style('font-weight', 700);

            /* bit messy, but it gets the job done, removing the unused graticule labels and lines */
            graticuleHolder.selectAll('path')._groups[0].forEach(function (g) {
                const curr = d3.select(g);
                if (!curr.attr('d')) {
                    curr.remove();
                }
            });

            graticuleTextHolder.selectAll('text')._groups[0].forEach(function (t) {
                const curr = d3.select(t);
                if (curr.text() == '') {
                    curr.remove();
                }
            });
        }

        makeGraticule();

        const countries = mapHolder.insert('g', '.graticuleTextHolder').attr('class', 'countries').selectAll('.country').data(topojson.feature(viz.data.worldMap, viz.data.worldMap.objects.countries).features, function (d) {
            return d.properties.name;
        });

        countries.enter().append('path').attr('class', 'country').attr('id', (d) => {
                if (viz.data.countryCodes[d.properties.name]) return viz.data.countryCodes[d.properties.name].Code;
            })
            .attr('d', (d) => {
                if (d.properties.name == 'Antarctica') return;

                return path(d);
            })
            .attr('stroke', '#666')
            .attr('stroke-opacity', .15)
            .attr('stroke-width', .75)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('fill', '#fafafa');

        viz.updateMap(currentYear);
    }

    /* térkép frissítése */
    viz.updateMap = function (year) {
        const data = viz.data.majorProducers.filter((e) => {
            return parseInt(d3.timeFormat('%Y')(e.Year)) === year;
        });

        data.forEach((d) => {
            mapHolder.select('.country#' + d.Code)
                .on('mouseover', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');
                })
                .on('mouseenter', function () {
                    tooltip.select('.tooltip--heading')
                        .html(viz.data.codes[d.Code])
                        .style('background-color', colorScale(d.Value)).style('color', '#fafafa');
                    tooltip.select('.tooltip--info')
                        .html('Their total production in ' + year + ' was <span class="tooltip--emphasize">' + (d.Value.toFixed(2)) + '</span> thousands 60kg bags.');
                })
                .on('mousemove', function () {
                    if (d3.event.pageX >= width) {
                        tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) - 20) + 'px');
                    } else {
                        tooltip.style('left', (d3.event.pageX + 20) + 'px');
                    }
                    tooltip.style('top', (d3.event.pageY + 20) + 'px');
                })
                .on('mouseleave', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', colorScale(d.Value));
                    tooltip.style('left', '-9999px');
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('fill', colorScale(d.Value))
                .attr('stroke', '#fafafa');
        });
    }
}(window.viz = window.viz || {}));