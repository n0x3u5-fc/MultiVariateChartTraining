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
        var chartCalculator = new ChartPropertyCalculator(charts);
        chartCalculator.calculateYMax();
    };

    var ChartPropertyCalculator = function (charts) {
        this.charts = charts;
        this.calculateYMax = function() {
            for (var chart of charts){
                console.log(chart.yData);
                var maxY = Math.max.apply(Math, chart.yData);
                var minY = Math.min.apply(Math, chart.yData);
                var prettyScale = new PrettyScale(2.04, 2.16);
                console.log(prettyScale.tickSpacing);
                console.log(prettyScale.niceMin);
                console.log(prettyScale.niceMax);
                console.log("------------------------------");
            }
        };
    };

    var PrettyScale = function (min, max) {
        var self = this;

        this.minPoint = min;
        this.maxPoint = max;
        this.maxTicks = 8;

        this.calculate = function() {
            self.range = self.niceNum(self.maxPoint - self.minPoint, false);
            self.tickSpacing = self.niceNum((self.range/(self.maxTicks - 1)), true);
            self.niceMin = Math.floor(self.minPoint / self.tickSpacing) * self.tickSpacing;
            self.niceMax = Math.ceil(self.maxPoint / self.tickSpacing) * self.tickSpacing;
        };

        this.niceNum = function (range, round) {
            var exponent;
            var fraction;
            var niceFraction;

            exponent = Math.floor(Math.log10(range));
            fraction = range/Math.pow(10, exponent);

            if(round) {
                if(fraction < 1.5) {
                    niceFraction = 1;
                } else if(fraction < 3) {
                    niceFraction = 2;
                } else if(fraction < 7) {
                    niceFraction = 5;
                } else {
                    niceFraction = 10;
                }
            } else {
                if(fraction <= 1) {
                    niceFraction = 1;
                } else if(fraction <= 2) {
                    niceFraction = 2;
                } else if(fraction <= 5) {
                    niceFraction = 5;
                } else {
                    niceFraction = 10;
                }
            }
            return niceFraction * Math.pow(10, exponent);
        };

        this.calculate();

        this.setMinMaxPoints = function(minPoint, maxPoint) {
            this.minPoint = minPoint;
            this.maxPoint = maxPoint;
            this.calculate();
        };

        this.setMaxTickMarks = function(maxTicks) {
            this.maxTicks = maxTicks;
            this.calculate();
        };
    }

    // Reading the AJAX from the file.
    var ajax = new AJAX('res/data/user_data.json', parseData);
})();