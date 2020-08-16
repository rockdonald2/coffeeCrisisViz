(function (viz) {
    'use strict';

    /* adattároló */
    viz.data = {};

    /* alapvető változók */
    viz.TRANS_DURATION = 750;

    /* elindítja a vizualizáció betöltését */
    viz.init = function () {
        /* első ábra: major-producers térkép */
        viz.initMap();
        /* második ábra: prices-paid-to-growers vonaldiagram */
        viz.initLineChart1();
        /* harmadik ábra: retail-prices vonaldiagram */
        viz.initLineChart2();
        /* negyedik ábra: historical-prices vonaldiagram */
        viz.initLineChart3();
    }
}(window.viz = window.viz || {}));