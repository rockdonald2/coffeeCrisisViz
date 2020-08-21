(function (viz) {
    'use strict';

    const chartContainer = d3.select('#coffeeAgreement');
    const margin = {
        'top': 125,
        'left': 75,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* skálák */
    const colorScale = d3.scaleOrdinal().domain(['Importing', 'Exporting']).range(['#3f596e', '#376940']);
    /* years: 1990->2018 */
    const years = d3.range(1990, 2019, 1);
    let currentYear = 2018;
    const europeanUnion = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Finland', 'France', 'Germany', 'Greece',
        'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
        'Spain', 'Sweden', 'United Kingdom of Great Britain'
    ];

    /* tooltip */
    const tooltip = chartContainer.select('.tooltip');

    viz.initMap2 = function () {
        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);
        const chartHolder = viz.addChartHolder(svg, dimensions);

        /* térképgenerálás */
        let centerPoz = null;
        let scalePoz = null;
        if (window.innerWidth > 1350) {
            centerPoz = [20, 20];
            scalePoz = 210;
        } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
            centerPoz = [55, -15];
            scalePoz = 140;
        } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
            centerPoz = [75, -15];
            scalePoz = 150;
        } else if (window.innerWidth > 625 && window.innerWidth <= 850 ) {
            centerPoz = [175, -15];
            scalePoz = 115;
        } else if (window.innerWidth > 475 && window.innerWidth <= 625) {
            centerPoz = [325, -40];
            scalePoz = 80;
        } else {
            centerPoz = [359, -40];
            scalePoz = 80;
        }
        const projection = d3.geoNaturalEarth1().center(centerPoz).scale(scalePoz);
        const path = d3.geoPath().projection(projection);

        const makeLegend = function () {
            let legendMargins = {};
            let legendMarginTop = null;
            if (window.innerWidth > 1350) {
                legendMargins = {
                    'top': 60,
                    'left': margin.left
                };
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                legendMargins = {
                    'top': 45,
                    'left': margin.left
                };
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                legendMargins = {
                    'top': 45,
                    'left': margin.left
                };
            } else if (window.innerWidth > 625 && window.innerWidth <= 850) {
                legendMargins = {
                    'top': 45,
                    'left': 10
                };
            } else {
                legendMargins = {
                    'top': 35,
                    'left': 10
                };
            }

            const legend = viz.makeLegend(svg, dimensions, 'International Coffee Agreement', 'Total exports and imports measured in thousand 60kg bags | 1990-2018')
                .attr('transform', 'translate(' + legendMargins.left + ', ' + legendMargins.top + ')');

            let sliderWidth = null;
            if (window.innerWidth > 1350) {
                sliderWidth = 340;
            } else if (window.innerWidth > 1100 && window.innerWidth <= 1350) {
                sliderWidth = 300;
            } else if (window.innerWidth > 850 && window.innerWidth <= 1100) {
                sliderWidth = 280;
            } else {
                sliderWidth = 180;
            }

            const sliderTime = viz.addSliderTime(years, 2018).width(sliderWidth).on('onchange', function (d) {
                currentYear = d;
                viz.updateMap2(currentYear);
            });

            let sliderPos = null;
            if (window.innerWidth > 850) {
                sliderPos = {
                    'left': dimensions.width * 0.55,
                    'top': -8
                };
            } else {
                sliderPos = {
                    'left': 10,
                    'top': 96
                };
            }

            const sliderGroup = legend.append('g').attr('class', 'sliderGroup').attr('transform', 'translate(' + sliderPos.left + ', ' + sliderPos.top + ')')
                .call(sliderTime)
                .call(function (g) {
                    g.select('.slider .parameter-value text').style('font-size', function () {
                        if (window.innerWidth <= 850) {
                            return '1rem';
                        } else {
                            return '1.4rem';
                        }
                    }).style('font-weight', 700).attr('fill', '#222')
                        .attr('opacity', .75).attr('dy', '.15em');
                })
                .call(function (g) {
                    g.selectAll('.slider line').attr('opacity', .75);
                });

            let colorPos = null;
            if (window.innerWidth > 850) {
                colorPos = {
                    'left': dimensions.width * 0.63,
                    'top': 29
                };
            } else {
                colorPos = {
                    'left': 5,
                    'top': 64
                };
            }

            const colorGroup = legend.append('g').attr('class', 'colorGroup').attr('transform', 'translate(' + colorPos.left + ', ' + colorPos.top + ')')
                .call(function (g) {
                    g.selectAll('circle').data(colorScale.domain()).enter().append('circle').attr('r', 5)
                        .attr('fill', colorScale).attr('cx', function (d, i) {
                            return i * 125;
                        });
                    g.selectAll('text').data(colorScale.domain()).enter().append('text').text(function (d) {
                            return d;
                        }).style('font-size', function () {
                            if (window.innerWidth <= 850) {
                                return '1rem';
                            } else {
                                return '1.3rem';
                            }
                        }).attr('opacity', .5)
                        .style('font-weight', 700).attr('x', function (d, i) {
                            return i * 125 + 10;
                        }).attr('dy', '.35em');
                });
        }();

        const makeMap = function () {
            const countries = chartHolder.append('g').attr('class', 'countries').selectAll('.country').data(topojson.feature(viz.data.worldMap, viz.data.worldMap.objects.countries).features, function (d) {
                return d.properties.name;
            });

            countries.enter().append('path').attr('class', 'country').attr('id', function (d) {
                    let code = null;

                    if (europeanUnion.includes(d.properties.name)) {
                        return 'EAU';
                    } else {
                        code = viz.data.countryCodes[d.properties.name];
                    }

                    if (code) return code.Code;
                }).attr('d', function (d) {
                    if (d.properties.name === 'Antarctica') return null;

                    return path(d);
                }).attr('stroke', '#666')
                .attr('stroke-opacity', .15)
                .attr('stroke-width', .75)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-dasharray', '2, 2')
                .attr('fill', '#fafafa');
        }();

        viz.updateMap2(currentYear);
    }

    viz.updateMap2 = function (year) {
        const dataExport = viz.data.totalExport.filterFunction(viz.multivalue_filter([year + '-01-01T00:00:00.000Z'])).top(Infinity);
        const dataImport = viz.data.totalImport.filterFunction(viz.multivalue_filter([year + '-01-01T00:00:00.000Z'])).top(Infinity);

        dataExport.forEach(function (d) {
            chartContainer.select('.chartHolder').select('.country#' + d.Code)
                .on('mouseenter', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');

                    tooltip.select('.tooltip--heading')
                        .html(viz.data.codes[d.Code])
                        .style('background-color', colorScale('Exporting')).style('color', '#fafafa');
                    tooltip.select('.tooltip--info')
                        .html(function () {
                            if (d.Value === null) {
                                return 'There was no data for that period'
                            } else {
                                return 'Their total exports in ' + year + ' was <span class="tooltip--emphasize">' + (d.Value.toFixed(2)) + '</span> thousands 60kg bags.'
                            }
                        });
                })
                .on('mousemove', function () {
                    if (d3.event.pageX >= width) {
                        tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) - 20) + 'px');
                    } else {
                        tooltip.style('left', (d3.event.pageX + 20) + 'px');
                    }
                    tooltip.style('top', (d3.event.pageY + 20) + 'px');
                    tooltip.transition().duration(viz.TRANS_DURATION / 7).style('opacity', 1);
                })
                .on('mouseleave', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', colorScale('Exporting'));
                    tooltip.transition().duration(viz.TRANS_DURATION / 7).style('opacity', 0);
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('fill', colorScale('Exporting'));
        });

        dataImport.forEach(function (d) {
            chartContainer.select('.chartHolder').selectAll('.country#' + d.Code)
                .on('mouseenter touchstart', function () {
                    const curr = d3.select(this);

                    if (curr.attr('id') === 'EAU') {
                        chartContainer.select('.chartHolder').selectAll('.country#EAU').transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');
                    } else {
                        curr.transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');
                    }

                    tooltip.select('.tooltip--heading')
                        .html(viz.data.codes[d.Code])
                        .style('background-color', colorScale('Importing')).style('color', '#fafafa');
                    tooltip.select('.tooltip--info')
                        .html(function () {
                            if (d.Value === null) {
                                return 'There was no data for that period';
                            } else {
                                return 'Their total imports in ' + year + ' was <span class="tooltip--emphasize">' + (d.Value.toFixed(2)) + '</span> thousands 60kg bags.';
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
                    const curr = d3.select(this);

                    if (curr.attr('id') === 'EAU') {
                        chartContainer.select('.chartHolder').selectAll('.country#EAU').transition().duration(viz.TRANS_DURATION / 5).attr('fill', colorScale('Importing'));
                    } else {
                        curr.transition().duration(viz.TRANS_DURATION / 5).attr('fill', colorScale('Importing'));
                    }

                    tooltip.style('left', '-9999px');
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('fill', colorScale('Importing'));
        });
    }
}(window.viz = window.viz || {}));