// IIFE to not pollute global namespace. Semi-colon for safety.
;(function(){
    'use strict';

    /**
     * Boilerplate AJAX class to fetch data from a file.
     * 
     * @constructor
     * @param {string} url - A URL specifying the location of the JSON file
     * @param {parseData} callback - Callback to receive and process fetched data 
     */
    var AJAX = function(url, callback) {
        this.httpRequest = new XMLHttpRequest;
        if(!this.httpRequest) {
            console.log("Unable to create XMLHTTP instance.");
            return false;
        }
        this.httpRequest.open('POST', url, true);
        this.httpRequest.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE) {
                if(this.status === 200) {
                    callback(JSON.parse(this.responseText));
                } else {
                    console.log("There was a problem with the request");
                }
            }
        };
        this.httpRequest.send();
    };

    /**
     * Represents a MuliVariate Chart
     * 
     * @constructor
     * @param {number} index
     * @param {string} xTitle
     * @param {string} yTitle
     * @param {number[]} xData
     * @param {number[]} yData
     */
    var MultiVarChart = function(index, xTitle, yTitle, xData, yData) {
        this.index = index;
        this.xTitle = xTitle;
        this.yTitle = yTitle;
        this.xData = xData;
        this.yData = yData;
    };

    /**
     * Callback to parse the data received via AJAX
     * 
     * @callback parseData
     * @param {Object} json
     */
    var parseData = function(json) {
        // console.log(json);
        console.log("Caption: " + json.metadata.caption);
        console.log("Sub-Caption: " + json.metadata.subCaption);
        /**
         * Contains the keys of the JSON's data attribute
         * @type {string[]}
         */
        var jsonDataKeys = Object.keys(json.data);
        var numCharts = jsonDataKeys.length - 1;
        console.log("Number of charts to render: " + numCharts);
        var charts = new Array();
        for (var i = 1; i <= numCharts; i++) {
            /** 
             * @type {number[]}
             */
            var xData = json.data.Ages.split(",").map(Number);  // Mapping the each string we get after splitting to numbers
            /** 
             * @type {number[]}
             */
            var yData = json.data[jsonDataKeys[i]].split(",").map(Number);
            var chart = new MultiVarChart(i, jsonDataKeys[0], jsonDataKeys[i], xData, yData);
            charts.push(chart);
        }
        console.log(charts);
    };

    // Reading the AJAX from the file.
    var ajax = new AJAX('res/data/user_data.json', parseData);
})();