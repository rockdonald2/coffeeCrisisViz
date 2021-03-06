(function (viz) {
    'use strict';

    /* adattároló */
    viz.data = {};

    /* alapvető változók */
    viz.TRANS_DURATION = 750;

    /* double tap fill */
    d3.selection.prototype.dblTap = function (callback) {
        var last = 0;
        return this.each(function () {
            d3.select(this).on("touchstart", function (e) {
                if ((d3.event.timeStamp - last) < 500) {
                    return callback(e);
                }
                last = d3.event.timeStamp;
            });
        });
    };

    /* lehetővé teszi, hogy crossfilter-rel több év/régió/rezsim szerint szűrjük az adatainkat */
    viz.multivalue_filter = function (values) {
        return function (v) {
            return values.indexOf(v) !== -1;
        };
    };

    /* data-generators w/ crossfilter */
    viz.makeDataMajorCoffeeProducers = function (data) {
        viz.filter = crossfilter(data);

        viz.data.majorProducers = viz.filter.dimension(function (o) {
            return o.Year;
        });
    };

    viz.makeDataGrowerPrices = function (data) {
        viz.filter = crossfilter(data);

        viz.data.pricesPaidToGrowers = viz.filter.dimension(function (o) {
            return o.Type;
        });
    };

    viz.makeDataTotalExport = function (data) {
        viz.filter = crossfilter(data);

        viz.data.totalExport = viz.filter.dimension(function (o) {
            return o.Year;
        });
    };

    viz.makeDataTotalImport = function (data) {
        viz.filter = crossfilter(data);

        viz.data.totalImport = viz.filter.dimension(function (o) {
            return o.Year;
        });
    };

    viz.makeDataCultivatedArea = function (data) {
        viz.filter = crossfilter(data);

        viz.data.cultivatedArea = viz.filter.dimension(function (o) {
            return o.Year;
        });
    };

    /* common functions */
    viz.makeDimensionsObj = function (width, height, margin) {
        return {
            'margin': {
                'top': margin.top,
                'left': margin.left,
                'right': margin.right,
                'bottom': margin.bottom
            },
            'width': width,
            'height': height
        };
    };

    viz.makeLegend = function (svg, dimensions, title, subTitle) {
        const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + (window.innerWidth <= 850 ? 10 : dimensions.margin.left) + ', 50)');

        let fontSize = {
            'title': '2.6rem',
            'subtitle': '1.3rem'
        };

        if (window.innerWidth > 625 && window.innerWidth <= 850) {
            fontSize = {
                'title': '1.6rem',
                'subtitle': '1rem'
            };
        } else if (window.innerWidth <= 625) {
            fontSize = {
                'title': '1.2rem',
                'subtitle': '1rem'
            };
        }

        const titleGroup = legend.append('g').attr('class', 'titleGroup')
            .call(function (g) {
                g.append('text').text(title).style('font-size', fontSize.title)
                    .style('font-weight', 700);
                g.append('text').text(subTitle).attr('y', 32)
                    .style('font-weight', 700).style('font-size', fontSize.subtitle).attr('opacity', .5);
            });

        return legend;
    };

    viz.addChartHolder = function (svg, dimensions) {
        return svg.append('g').attr('class', 'chartHolder')
            .attr('transform', 'translate(' + dimensions.margin.left + ', ' + dimensions.margin.top + ')');
    };

    viz.addSvg = function (container, dimensions) {
        return container.append('svg')
            .attr('width', dimensions.width + dimensions.margin.left + dimensions.margin.right)
            .attr('height', dimensions.height + dimensions.margin.top + dimensions.margin.bottom);
    };

    viz.addMouseArea = function (svg, dimensions) {
        return svg.append('rect').attr('class', 'mouseArea').attr('x', dimensions.margin.left).attr('y', dimensions.margin.top).attr('width', dimensions.width).attr('height', dimensions.height)
            .attr('fill', 'transparent')
            .style('cursor', 'crosshair');
    };

    viz.makeAxis = function (svg, dimensions, scaleX, scaleY, ticksX, ticksY, formatX, formatY) {
        const xAxis = svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(' + dimensions.margin.left + ', ' + (dimensions.height + dimensions.margin.top) + ')');
        const xLine = xAxis.append('line').attr('class', 'x-line').attr('x1', 0).attr('x2', dimensions.width).attr('y1', 0).attr('y2', 0)
            .attr('stroke', '#222')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('stroke-width', .75)
            .attr('stroke-opacity', .75);
        const xTicks = xAxis.selectAll('.x-tick').data(ticksX)
            .enter().append('g').attr('class', 'x-tick')
            .attr('transform', function (d) {
                if (window.innerWidth <= 850) {
                    return 'translate(' + scaleX(d) + ', 20)';
                } else {
                    return 'translate(' + scaleX(d) + ', 20)';
                }
            })
            .call(function (g) {
                g.append('text').text(function (d) {
                        return formatX(d);
                    })
                    .style('font-size', function () {
                        if (window.innerWidth <= 850) {
                            return '1rem';
                        } else {
                            return '1.5rem';
                        }
                    })
                    .style('font-weight', 700)
                    .attr('fill', '#222')
                    .attr('opacity', .75)
                    .attr('text-anchor', 'middle')
                    .attr('transform', function () {
                        if (window.innerWidth <= 850) {
                            return 'rotate(60)';
                        }
                    });
            });

        const yAxis = svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + dimensions.margin.left + ', ' + dimensions.margin.top + ')');
        const yTicks = yAxis.selectAll('.y-tick').data(ticksY)
            .enter().append('g').attr('class', 'y-tick')
            .call(function (g) {
                g.append('line').attr('x1', 0).attr('x2', dimensions.width)
                    .attr('y1', scaleY).attr('y2', scaleY)
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
                        if (d === 0) return;

                        return formatY(d);
                    }).attr('y', scaleY)
                    .attr('x', -10)
                    .style('font-size', function () {
                        if (window.innerWidth > 850) {
                            return '1.5rem';
                        } else {
                            return '1rem';
                        }
                    })
                    .style('font-weight', 700)
                    .attr('fill', '#222')
                    .attr('opacity', .75)
                    .attr('text-anchor', 'end')
                    .attr('dy', '.32em');
            });
    };

    viz.makeSingleLineChart = function (chartHolder, data, scaleTime, scalePrice) {
        chartHolder.append('path').datum(data).attr('class', 'line')
            .attr('d', function (d) {
                return d3.line()
                    .defined(function (d) {
                        return d.Value !== null;
                    })
                    .x(function (d) {
                        return scaleTime(d.Year);
                    })
                    .y(function (d) {
                        return scalePrice(d.Price);
                    })(d);
            })
            .attr('stroke', '#666')
            .attr('stroke-opacity', .75).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('mix-blend-mode', 'multiply')
            .style('pointer-events', 'none');
    };

    viz.bisectXAxis = function (mx, data, scaleX) {
        const bisect = d3.bisector(function (d) {
            return d.Year;
        }).left;

        const date = scaleX.invert(mx);
        const index = bisect(data, date, 1);
        const a = data[index - 1];
        const b = data[index];

        return b && (date - a.Year > b.Year - date) ? b : a;
    };

    viz.addHoverEffectXAxis = function (svg, dimensions, data, scaleTime, scaleValue, showMonth = false, bottomText = true) {
        const dot = svg.append('g')
            .attr('display', 'none').style('pointer-events', 'none');
        dot.append('circle')
            .attr('r', 4)
            .attr('fill', '#222');
        dot.append('text').attr('id', 'topText')
            .style('font-size', function () {
                if (window.innerWidth <= 850) {
                    return '1rem';
                } else {
                    return '1.5rem';
                }
            })
            .attr('text-anchor', 'middle')
            .attr('y', -10);
        dot.append('text').attr('id', 'bottomText')
            .style('font-size', function () {
                if (window.innerWidth <= 850) {
                    return '1rem';
                } else {
                    return '1.5rem';
                }
            })
            .attr('text-anchor', 'middle')
            .attr('y', function () {
                if (bottomText) return 20;

                return -30;
            });
        dot.append('line').attr('id', 'line')
            .attr('stroke', '#222').attr('stroke-width', 1).attr('opacity', .25)
            .attr('x1', 0).attr('x2', 0);

        const mouseArea = viz.addMouseArea(svg, dimensions);

        mouseArea.on('touchmove mousemove', function () {
            const {
                Year,
                Price
            } = viz.bisectXAxis(d3.mouse(this)[0] - dimensions.margin.left, data, scaleTime);

            dot.attr('transform', 'translate(' + (dimensions.margin.left + scaleTime(Year)) + ', ' + (dimensions.margin.top + scaleValue(Price)) + ')')
                .attr('display', null);
            dot.select('#topText').text(Price < 1000 ? d3.format('d')(Price) : d3.format('.2s')(Price));
            dot.select('#bottomText').text(function () {
                if (showMonth) return d3.timeFormat('\'%y %b')(Year);

                return d3.timeFormat('%Y')(Year);
            });
            dot.select('#line').attr('y1', -scaleValue(Price)).attr('y2', dimensions.height - scaleValue(Price));
        });
        mouseArea.on('touchend mouseleave', function () {
            dot.attr('display', 'none');
        });
    };

    viz.addSliderTime = function (years, def) {
        return d3.sliderBottom().min(d3.min(years)).max(d3.max(years))
            .step(1).tickFormat(d3.format('d'))
            .handle('M7.978845608028654,0A7.978845608028654,7.978845608028654,0,1,1,-7.978845608028654,0A7.978845608028654,7.978845608028654,0,1,1,7.978845608028654,0')
            .tickValues([]).default(def);
    };

    /* elindítja a vizualizáció betöltését */
    viz.init = function () {
        /* első ábra: major-producers térkép */
        viz.initMap1();
        /* második ábra: prices-paid-to-growers vonaldiagram */
        viz.initLineChart1();
        /* harmadik ábra: retail-prices vonaldiagram */
        viz.initLineChart2();
        /* negyedik ábra: historical-prices vonaldiagram */
        viz.initLineChart3();
        /* ötödik ábra: exporter precipitation dot-plot */
        viz.initDotPlot();
        /* hatodik ábra: kolumbiai GDP stacked-bar-chart*/
        viz.initStackedChart();
        /* hetedik ábra: coffee-aggreement térkép */
        viz.initMap2();
        /* nyolcadik ábra: kolumbiai termelés területdiagram */
        viz.initAreaChart();
        /* kilencedik ábra: kolumbiai belső árak vonaldiagram */
        viz.initLineChart4();
        /* tizedik ábra: kolumbiai export árak vonaldiagram */
        viz.initLineChart5();
        /* tizenegyedik ábra: kolumbiai térképdiagram */
        viz.initMap3();
    };
}(window.viz = window.viz || {}));