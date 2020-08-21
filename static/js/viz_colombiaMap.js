(function (viz) {
    'use strict';

    const chartContainer = d3.select('#colombiaMap');
    let margin = {};
    if (window.innerWidth < 625) {
        margin = {
            'top': 175,
            'left': -50,
            'right': 25,
            'bottom': 50
        };
    }
    else if (window.innerWidth >= 625 && window.innerWidth < 850) {
        margin = {
            'top': 175,
            'left': 50,
            'right': 50,
            'bottom': 75
        };
    }
    else if (window.innerWidth >= 850 && window.innerWidth < 1100) {
        margin = {
            'top': 150,
            'left': 50,
            'right': 50,
            'bottom': 75
        };
    } else {
        margin = {
            'top': 75,
            'left': 50,
            'right': 50,
            'bottom': 75
        };
    }

    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* tooltip */
    const tooltip = chartContainer.select('.tooltip');

    const colorScale = d3.scaleThreshold().domain([null, 0, 25, 50, 75, 100, 125])
        .range(["#fdc7b2", "#fc9d7f", "#fb8060", "#f9684b", "#f14835", "#eb3c2e", "#a10e15"]);
    /* years: 2002->2019 */
    let currentYear = 2019;
    let years = d3.range(2002, 2020, 1);

    viz.initMap3 = function () {
        const dimensions = viz.makeDimensionsObj(width, height, margin);

        /* svg */
        const svg = viz.addSvg(chartContainer, dimensions);
        /* chartHolder */
        const chartHolder = viz.addChartHolder(svg, dimensions);

        /* jelmagyarázat */
        const makeLegend = function () {
            const legend = viz.makeLegend(svg, dimensions, 'Colombian cultivated area by region', 'Measured in million hectares | 2002 - 2019');

            const responsiveSlider = window.innerWidth <= 850 ? 200 : 320;
            const sliderTime = viz.addSliderTime(years, 2019).width(responsiveSlider).on('onchange', function (d) {
                currentYear = d;
                viz.updateMap3(currentYear);
            });
            const sliderGroup = legend.append('g').attr('class', 'sliderGroup')
                .attr('transform', 'translate(10, 96)')
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

            const data = [{
                    'Name': 'No data',
                    'Color': '#ccc'
                },
                {
                    'Name': 'Cultivated',
                    'Color': '#f14835'
                },
                {
                    'Name': 'Not cultivated',
                    'Color': '#fafafa'
                }
            ]
            const labelGroup = legend.append('g').attr('class', 'labelGroup')
                .attr('transform', 'translate(2.5, 64)')
                .call(function (g) {
                    g.selectAll('.label-circle').data(data)
                        .enter().append('circle').attr('r', 5)
                        .attr('cx', function (d, i) {
                            if (window.innerWidth <= 850) {
                                return i * 75;
                            } else {
                                return i * 120;
                            }
                        })
                        .attr('fill', function (d) {
                            return d.Color;
                        })
                        .attr('stroke', function (d) {
                            if (d.Name === 'Not cultivated') return '#666'
                        })
                        .attr('stroke-opacity', .15)
                        .attr('stroke-width', .75);

                    g.selectAll('.label-text').data(data)
                        .enter().append('text').attr('x', function (d, i) {
                            if (window.innerWidth <= 850) {
                                return i * 75 + 10;
                            } else {
                                return i * 120 + 10;
                            }
                        }).text(function (d) {
                            return d.Name;
                        }).attr('opacity', .5).style('font-size', function () {
                            if (window.innerWidth <= 850) {
                                return '1rem';
                            } else {
                                return '1.3rem';
                            }
                        }).style('font-weight', 700)
                        .attr('dy', '.35em');
                });
        }();

        const makeMap = function () {
            /* projection & path */
            const landState = topojson.feature(viz.data.colombiaMap, {
                type: "GeometryCollection",
                geometries: viz.data.colombiaMap.objects.depts.geometries.filter(function (d) {
                    return (d.id / 10000 | 0) % 100 !== 99;
                })
            });
            const projection = d3.geoTransverseMercator()
                .rotate([74 + 30 / 60, -38 - 50 / 60])
                .fitExtent([
                    [0, 0],
                    [width + 50, height + 50]
                ], landState)
            const path = d3.geoPath().projection(projection);

            const regions = chartHolder.selectAll('.region').data(topojson.feature(viz.data.colombiaMap, viz.data.colombiaMap.objects.depts).features, function (d) {
                return d.properties.dpt;
            });

            regions.enter().append('path').attr('class', 'region').attr('id', function (d) {
                    return d.properties.dpt;
                }).attr('d', path).attr('stroke', '#666')
                .attr('stroke-opacity', .15)
                .attr('stroke-width', .75)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('stroke-dasharray', '2, 2')
                .attr('fill', '#fafafa');
        }();

        viz.updateMap3(currentYear);
    };

    viz.updateMap3 = function (year) {
        const data = viz.data.cultivatedArea.filterFunction(viz.multivalue_filter([year + '-01-01T00:00:00.000Z'])).top(Infinity);

        data.forEach(function (d) {
            chartContainer.select('.chartHolder').select('.region#' + d.Region.toUpperCase())
                .on('mouseenter touchmove', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', '#222');

                    tooltip.select('.tooltip--heading').html(d.Region).style('background-color', function () {
                        if (d.Value === null) return '#ccc';

                        return colorScale(d.Value);
                    });
                    tooltip.select('.tooltip--info').html(function () {
                        if (d.Value === null) {
                            return 'There was no data for that period';
                        } else {
                            return d.Value.toFixed(2) + ' million hectares of coffee land';
                        }
                    });
                })
                .on('mousemove', function () {
                    tooltip.style('left', (d3.event.pageX + 20) + 'px').style('top', (d3.event.pageY + 20) + 'px');
                })
                .on('mouseleave touchend', function () {
                    d3.select(this).transition().duration(viz.TRANS_DURATION / 5).attr('fill', function () {
                        if (d.Value === null) {
                            return '#ccc';
                        } else {
                            return colorScale(d.Value);
                        }
                    });
                    tooltip.style('left', '-9999px');
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('fill', function () {
                    if (d.Value === null) return '#ccc';

                    return colorScale(d.Value);
                })
                .attr('stroke', '#fafafa');
        });
    };

}(window.viz = window.viz || {}));