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
    }
}(window.viz = window.viz || {}));