(function (viz) {
    'use strict';

    /* adattároló */
    viz.data = {};

    /* alapvető változók */
    viz.TRANS_DURATION = 750;

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
    }
}(window.viz = window.viz || {}));