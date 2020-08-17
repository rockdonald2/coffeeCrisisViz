(function (viz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/cleaned/totalProduction.json')
        .defer(d3.json, 'static/data/cleaned/pricesPaidToGrowers.json')
        .defer(d3.json, 'static/data/cleaned/retailPrices.json')
        .defer(d3.json, 'static/data/cleaned/historicalPrices.json')
        .defer(d3.json, 'static/data/cleaned/exporterPerc.json')
        .defer(d3.json, 'static/data/cleaned/exporterTemperatures.json')
        .defer(d3.json, 'static/data/cleaned/colombiaGdp.json')
        .defer(d3.json, 'static/data/cleaned/worldMap.json')
        .defer(d3.json, 'static/data/cleaned/countryCodes.json')
        .defer(d3.json, 'static/data/cleaned/codes.json')
        .await(ready);

    function ready(error, totalProduction, pricesPaidToGrowers, retailPrices, historicalPrices, exporterPerc, exporterTemp, colombiaGdp, worldMap, countryCodes, codes) {
        /* ha valami hiba történt az adatok beolvasásakor álljon le */

        if (error) {
            return console.warn(error);
        }

        viz.data.majorProducers = totalProduction;
        viz.data.pricesPaidToGrowers = pricesPaidToGrowers;
        viz.data.retailPrices = retailPrices;
        viz.data.historicalPrices = historicalPrices;
        viz.data.exporterPerc = exporterPerc;
        viz.data.exporterTemp = exporterTemp;
        viz.data.colombiaGdp = colombiaGdp;
        viz.data.worldMap = worldMap;
        viz.data.countryCodes = countryCodes;
        viz.data.codes = codes;

        /* elindítjuk a vizualizáció betöltését */
        viz.init();
    }
}(window.viz = window.viz || {}));