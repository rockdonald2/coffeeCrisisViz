(function (viz) {
    'use strict';

    const chartContainer = d3.select('#majorProducers');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 100,
        'left': 50,
        'right': 0,
        'bottom': 50
    }
    /* méretek */
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    /* skálák */
    const colorScale = d3.scaleThreshold().domain([1, 7500, 15000, 22500, 30000]).range(['#f36d6d', '#aa4b4b', '#7f2c2c', '#642828', '#691d1d', '#5e0606']);
    /* years: 1990->2018 */
    let years = d3.range(1990, 2019);
    let currentYear = 2018;

    /* tooltip */
    const tooltip = chartContainer.select('.tooltip');

    /* térkép létrehozása */
    viz.initMap1 = function () {
        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);

        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        /* path */
        let centerPoz = null;
        let scalePoz = null;
        if (window.innerWidth > 1350) {
            centerPoz = [65, 60];
            scalePoz = 170;
        } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
            centerPoz = [110, 30];
            scalePoz = 135;
        } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
            centerPoz = [175, 55];
            scalePoz = 105;
        } else if (window.innerWidth > 625 && window.innerWidth <= 850){
            centerPoz = [160, 0];
            scalePoz = 110;
        } else if (window.innerWidth > 475 && window.innerWidth <= 625) {
            centerPoz = [210, -10];
            scalePoz = 90;
        } else {
            centerPoz = [285, -10];
            scalePoz = 75;
        }
        const projection = d3.geoMercator().center(centerPoz).scale(scalePoz);
        const path = d3.geoPath().projection(projection);

        const graticuleHolder = chartHolder.append('g').attr('class', 'graticuleHolder')
        const graticuleTextHolder = chartHolder.append('g').attr('class', 'graticuleTextHolder');

        /* graticule */
        const graticule = d3.geoGraticule().step([5, 5]);

        const makeLegend = function () {
            let legendMargins = {};
            let legendMarginTop = null;
            if (window.innerWidth > 1350) {
                legendMargins = {
                    'top': 100,
                    'left': 2 * dimensions.margin.left
                };
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                legendMargins = {
                    'top': 125,
                    'left': 2 * dimensions.margin.left
                };
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                legendMargins = {
                    'top': 150,
                    'left': 2 * dimensions.margin.left
                };
            } else if (window.innerWidth > 625 && window.innerWidth <= 850) {
                legendMargins = {
                    'top': 75,
                    'left': 2 * dimensions.margin.left
                };
            } else {
                legendMargins = {
                    'top': 75,
                    'left': dimensions.margin.left
                };
            }

            const legend = viz.makeLegend(svg, dimensions, 'Major coffee producers', 'Measured in thousand 60kg bags')
                .attr('transform', 'translate(' + legendMargins.left + ', ' + legendMargins.top + ')');

            legend.select('.titleGroup')
                .call(function (g) {
                    g.insert('rect', 'text')
                        .attr('width', 32).attr('height', 32)
                        .attr('x', -42).attr('y', function () {
                            if (window.innerWidth <= 850) {
                                return -22;
                            } else {
                                return -27;
                            }
                        })
                        .attr('fill', '#7f2c2c')
                        .attr('opacity', .75);
                });

            let sliderWidth = null;
            if (window.innerWidth > 1350) {
                sliderWidth = 270;
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                sliderWidth = 210;
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                sliderWidth = 210;
            } else if (window.innerWidth > 625 && window.innerWidth <= 850) {
                sliderWidth = 160;
            } else {
                sliderWidth = 125;
            }

            const sliderTime = viz.addSliderTime(years, 2018).width(sliderWidth).on('onchange', function (d) {
                currentYear = d;
                viz.updateMap1(currentYear);
            });
            const sliderGroup = legend.append('g').attr('class', 'sliderGroup')
                .attr('transform', 'translate(10, 64)')
                .call(sliderTime)
                .call(function (g) {
                    g.select('.slider .parameter-value text').style('font-size', function () {
                        if (window.innerWidth <= 850) {
                            return '1rem';
                        } else {
                            return '1.4rem';
                        }
                    }).style('font-weight', 700).attr('fill', '#222')
                        .attr('opacity', .75).attr('dy', '.21em');
                })
                .call(function (g) {
                    g.selectAll('.slider line').attr('opacity', .75);
                });
        }();

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

            let differenceDistanceFromLeftSide = null;
            if (window.innerWidth > 1100) {
                differenceDistanceFromLeftSide = 100;
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                differenceDistanceFromLeftSide = 75;
            } else if (window.innerWidth > 625 && window.innerWidth <= 850) {
                differenceDistanceFromLeftSide = 50;
            } else if (window.innerWidth > 475 && window.innerWidth <= 625) {
                differenceDistanceFromLeftSide = 50;
            } else {
                differenceDistanceFromLeftSide = 52.5;
            }

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

                    return 'translate(' + (p[0] + width / 2 + differenceDistanceFromLeftSide) + ', ' + (p[1]) + ')';
                })
                .style('font-size', function () {
                    if (window.innerWidth <= 850) {
                        return '1rem';
                    } else {
                        return '1.3rem';
                    }
                })
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
        }();

        const makeMap = function () {
            const countries = chartHolder.insert('g', '.graticuleTextHolder').attr('class', 'countries').selectAll('.country').data(topojson.feature(viz.data.worldMap, viz.data.worldMap.objects.countries).features, function (d) {
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
                .attr('stroke-opacity', .25)
                .attr('stroke-width', .75)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-dasharray', '2, 2')
                .attr('fill', '#fafafa');
        }();

        viz.updateMap1(currentYear);
    }

    /* térkép frissítése */
    viz.updateMap1 = function (year) {
        const data = viz.data.majorProducers.filterFunction(viz.multivalue_filter([year + '-01-01T00:00:00.000Z'])).top(Infinity);

        data.forEach((d) => {
            chartContainer.select('.chartHolder').select('.country#' + d.Code)
                .on('mouseenter touchmove', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');

                    tooltip.select('.tooltip--heading')
                        .html(viz.data.codes[d.Code])
                        .style('background-color', function () {
                            if (d.Value === 0) {
                                return '#ccc';
                            } else {
                                return colorScale(d.Value);
                            }
                        }).style('color', '#fafafa');
                    tooltip.select('.tooltip--info')
                        .html(function () {
                            if (d.Value === 0) {
                                return 'There was no data for that period';
                            } else {
                                return 'Their total production in ' + year + ' was <span class="tooltip--emphasize">' + (d.Value.toFixed(2)) + '</span> thousands 60kg bags.'
                            }
                        });
                })
                .on('mousemove', function () {
                    if (d3.event.pageX >= width * 0.75) {
                        tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) - 20) + 'px');
                    } else {
                        tooltip.style('left', (d3.event.pageX + 20) + 'px');
                    }
                    tooltip.style('top', (d3.event.pageY + 20) + 'px');
                })
                .on('mouseleave touchend', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', function () {
                        if (d.Value === 0) {
                            return '#ccc';
                        } else {
                            return colorScale(d.Value);
                        }
                    });
                    tooltip.style('left', '-9999px');
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('fill', function () {
                    if (d.Value === 0) {
                        return '#ccc';
                    } else {
                        return colorScale(d.Value);
                    }
                })
                .attr('stroke', '#fafafa');
        });
    }
}(window.viz = window.viz || {}));
