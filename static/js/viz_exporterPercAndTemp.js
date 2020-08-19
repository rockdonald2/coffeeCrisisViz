(function (viz) {
    'use strict';

    const chartContainer = d3.select('#exporterPercAndTemp');
    const margin = {
        'top': 220,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    /* domain of times */
    const domainOfTimes = ['1920/1939', '1940/1959', '1960/1979', '1980/1999', '2020/2039', '2040/2059', '2060/2079', '2080/2099'];

    /* scales */
    const scalePerc = d3.scaleLinear().range([0, width]);
    const scaleTemp = d3.scaleLinear().range([0, width]);
    const scaleCode = d3.scalePoint().rangeRound([0, height]).padding(1);
    const colorScale = d3.scaleOrdinal().domain(domainOfTimes).range(d3.schemePaired.slice(0, 8));

    /* precipitation/temperature */
    let currentPlot = 'temperature';
    const plots = ['temperature', 'precipitation'];
    let dataTemp = null;
    let dataPerc = null;

    /* tengelyek - axis = axisContainer */
    const makeAxis = function (axis, plot) {
        const currentScale = plot === 'temperature' ? scaleTemp : scalePerc;
        const data = d3.range(currentScale.domain()[0], currentScale.domain()[1] + 1, (currentScale.domain()[0] + currentScale.domain()[1]) / 6);

        const ticks = axis.selectAll('.tick')
            .data(data);

        ticks.enter().append('line').attr('class', 'tick')
            .style('pointer-events', 'none')
            .attr('y1', -10).attr('y2', height + 25).attr('x1', width).attr('x2', width)
            .merge(ticks)
            .transition().duration(viz.TRANS_DURATION)
            .attr('opacity', 0.75)
            .attr('y1', -10).attr('y2', height + 25).attr('x1', currentScale).attr('x2', currentScale)
            .attr('stroke', '#666').attr('stroke-opacity', .75).attr('stroke-width', 1.25)
            .attr('stroke-dasharray', '.75rem');

        ticks.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();

        const labels = axis.selectAll('.label')
            .data(data);

        labels.enter().append('text').attr('class', 'label')
            .style('pointer-events', 'none')
            .attr('y', -20).attr('x', width)
            .merge(labels)
            .text(function (d) {
                return d.toFixed(0) + (plot === 'temperature' ? '°C' : ' mm');
            })
            .style('font-size', '1.5rem').style('font-weight', 700)
            .transition().duration(viz.TRANS_DURATION)
            .attr('opacity', 1)
            .attr('y', -20).attr('x', currentScale)
            .attr('text-anchor', 'middle')
            .attr('opacity', .75);

        labels.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();

    }

    viz.initDotPlot = function () {
        dataTemp = d3.nest().key(function (d) {
            return d.Code;
        }).entries(viz.data.exporterTemp);
        dataPerc = d3.nest().key(function (d) {
            return d.Code;
        }).entries(viz.data.exporterPerc);

        scalePerc.domain(d3.extent(viz.data.exporterPerc, function (d) {
            return d.Value;
        })).nice();
        scaleTemp.domain(d3.extent(viz.data.exporterTemp, function (d) {
            return d.Value;
        })).nice();
        scaleCode.domain(dataTemp.map(function (d) {
            return d.key;
        }));

        const dimensions = viz.makeDimensionsObj(width, height, margin);
        const svg = viz.addSvg(chartContainer, dimensions);
        const chartHolder = viz.addChartHolder(svg, dimensions);

        // tengelycontainer
        const axis = svg.append('g').attr('class', 'axis').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        const makeLegend = function () {
            const legend = viz.makeLegend(svg, dimensions, 'Average annual temperature/precipitation in exporting countries', 'Measured in celsius degrees or mm | seperated into average groups | 1920-2100');

            const averageGroup = legend.append('g').attr('class', 'averageGroup')
                .attr('transform', 'translate(5, 64)')
                .selectAll('.group').data(domainOfTimes)
                .enter().append('g').attr('class', 'group')
                .call(function (g) {
                    g.append('circle').attr('r', 5).attr('fill', function (d) {
                            return colorScale(d);
                        })
                        .attr('cx', function (d, i) {
                            return i * 100;
                        });
                })
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d;
                        }).style('font-size', '1.3rem')
                        .attr('x', function (d, i) {
                            return i * 100 + 10;
                        }).attr('dy', '.32em').attr('opacity', .5).style('font-weight', 700);
                });

            const selectionGroup = legend.append('g').attr('class', 'selectionGroup')
                .attr('transform', 'translate(0, 96)')
                .selectAll('.group').data(plots)
                .enter().append('g').attr('class', 'group')
                .style('cursor', 'pointer')
                .attr('id', function (d) {
                    return d;
                })
                .call(function (g) {
                    g.append('rect').attr('width', 10).attr('height', 10)
                        .attr('x', function (d, i) {
                            return i * 99.5;
                        }).attr('fill', function (d, i) {
                            if (d === currentPlot) return '#7f2c2c';
                            else return '#666';
                        });
                })
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d[0].toUpperCase() + d.slice(1);
                        })
                        .attr('x', function (d, i) {
                            return i * 100 + 15;
                        })
                        .attr('y', 5)
                        .attr('dy', '.36em').style('font-weight', 700)
                        .attr('fill', function (d) {
                            if (d === currentPlot) return '#7f2c2c';
                            else return '#222';
                        });
                })
                .on('mouseenter', function (d) {
                    d3.select(this).select('rect').attr('fill', '#7f2c2c');
                    d3.select(this).select('text').attr('fill', '#7f2c2c');
                })
                .on('mouseleave', function (d) {
                    if (d !== currentPlot) {
                        d3.select(this).select('rect').attr('fill', '#666');
                        d3.select(this).select('text').attr('fill', '#222');
                    }
                })
                .on('click', function (d) {
                    if (d === currentPlot) return;

                    legend.select('g#' + currentPlot)
                        .call(function (g) {
                            g.select('text').attr('fill', '#222');
                            g.select('rect').attr('fill', '#666');
                        });

                    currentPlot = d;

                    viz.updateDotPlot(chartHolder, axis, currentPlot);
                });
        }();

        /* mousearea */
        const makeHoverEffect = function () {
            const mouseRect = svg.append('g').attr('class', 'mouseArea').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
                .call(function (g) {
                    g.append('rect').attr('x', 0).attr('y', -25).attr('width', width).attr('height', height + 25)
                        .attr('fill', 'transparent').style('cursor', 'crosshair');
                })
                .call(function (g) {
                    g.append('text').attr('y', -20).style('text-anchor', 'middle').style('font-size', '1.5rem').style('font-weight', 700)
                        .style('pointer-events', 'none');
                    g.append('line').attr('y1', -10).attr('y2', height + 25).attr('stroke', '#666').attr('stroke-dasharray', '.75rem')
                        .style('pointer-events', 'none');
                })
                .on('mousemove', function () {
                    const mouseCoords = d3.mouse(this);
                    const currentScale = currentPlot === 'temperature' ? scaleTemp : scalePerc;

                    d3.select(this).select('line').attr('opacity', 1)
                        .attr('x1', mouseCoords[0])
                        .attr('x2', mouseCoords[0]);
                    d3.select(this).select('text').attr('opacity', 1)
                        .text(function () {
                            return currentScale.invert(mouseCoords[0]).toFixed(0) + (currentPlot === 'temperature' ? '°C' : ' mm');
                        }).attr('x', mouseCoords[0]);
                })
                .on('mouseleave', function () {
                    d3.select(this).select('line').attr('opacity', 0);
                    d3.select(this).select('text').attr('opacity', 0);
                });
        }();

        viz.updateDotPlot(chartHolder, axis, currentPlot);
    }

    viz.updateDotPlot = function (chartHolder, axis, plot) {
        makeAxis(axis, plot);

        const data = plot === 'temperature' ? dataTemp : dataPerc;
        const currentScale = plot === 'temperature' ? scaleTemp : scalePerc;

        const makeChart = function () {
            const groups = chartHolder.selectAll('.group').data(data, function (d) {
                return d.key;
            });

            groups.enter().append('g').attr('class', 'group')
                .style('pointer-events', 'none')
                .call(function (g) {
                    g.append('line').style('pointer-events', 'none');
                    g.append('g');
                    g.append('text').style('pointer-events', 'none');
                })
                .attr('transform', function (d) {
                    return 'translate(0, ' + scaleCode(d.key) + ')';
                })
                .merge(groups)
                .call(function (g) {
                    g.select('line')
                        .attr('stroke', '#666')
                        .attr('stroke-width', 1.5)
                        .transition().duration(viz.TRANS_DURATION)
                        .attr('x1', function (d) {
                            return currentScale(d3.min(d.values, function (d) {
                                return d.Value;
                            }));
                        }).attr('x2', function (d) {
                            return currentScale(d3.max(d.values, function (d) {
                                return d.Value;
                            }));
                        }).attr('y1', 0).attr('y2', 0);

                    g.select('text').text(function (d) {
                            return viz.data.codes[d.key];
                        })
                        .attr('text-anchor', 'end')
                        .style('font-size', '1.2rem')
                        .transition().duration(viz.TRANS_DURATION)
                        .attr('x', function (d) {
                            return currentScale(d3.min(d.values, function (d) {
                                return d.Value;
                            })) - 10;
                        })
                        .attr('dy', '.35em');

                    const dots = g.select('g').selectAll('.dot').data(function (d) {
                        return d.values;
                    });

                    dots.enter().append('circle').attr('class', 'dot')
                        .merge(dots)
                        .transition().duration(viz.TRANS_DURATION)
                        .attr('opacity', 1)
                        .attr('r', 5).attr('fill', function (d) {
                            return colorScale(d.Year);
                        })
                        .attr('cx', function (d) {
                            return currentScale(d.Value);
                        });

                    dots.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();
                });

            groups.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();
        }();

        chartHolder.raise();
    }
}(window.viz = window.viz || {}));