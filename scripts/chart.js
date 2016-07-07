// IIFE to not pollute global namespace. Semi-colon for safety.
;(function(window){
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

    var MappedChart = function(index, xTitle, yTitle, xData, yData, yTicks, xTicks) {
        this.index = index;
        this.xTitle = xTitle;
        this.yTitle = yTitle;
        this.xData = xData;
        this.yData = yData;
        this.yTicks = yTicks;
        this.xTicks = xTicks;
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
        // console.log("Number of charts to render: " + numCharts);
        var charts = new Array();
        for (var i = 1; i <= numCharts; i++) {
            /** 
             * @type {number[]}
             */
            var xData = json.data[jsonDataKeys[0]].split(",");
            /** 
             * @type {number[]}
             */
            var yData = json.data[jsonDataKeys[i]].split(",").map(function (numStr) {
                if(numStr == "") {
                    return "";
                } else {
                    return Number(numStr);
                }
            }); // Mapping each string after splitting to numbers
            var chart = new MultiVarChart(i, jsonDataKeys[0], jsonDataKeys[i], xData, yData);
            charts.push(chart);
        }
        var chartCalculator = new ChartPropertyCalculator(charts);
        chartCalculator.displayCharts();
    };

    /**
     * Calculates and display all properties of all charts one chart at a time
     * 
     * @constructor
     * @param {Object[]} MultiVarChart - An array of charts whse properties need calculating
     */
    var ChartPropertyCalculator = function (charts) {
        this.charts = charts;
        /**
         * Displays the properties of every chart in the log
         */
        this.displayCharts = function() {
            for (var i = 0; i < charts.length; i++){
                // if(i === charts.length - 1) {
                //     console.log("X-Axis Title: " + charts[i].xTitle);
                // }
                // console.log("X-Axis Plots and Ticks: ");
                // console.log(charts[i].xData);
                // console.log("Y-Axis Title: " + charts[i].yTitle);
                // console.log("Y-Axis Plots: ");
                for(var yDatum of charts[i].yData) {
                    if(yDatum == "") {
                        charts[i].yData.splice(charts[i].yData.indexOf(yDatum), 1);
                    }
                }
                // console.log(charts[i].yData);
                var maxY = Math.max.apply(Math, charts[i].yData);
                var minY = Math.min.apply(Math, charts[i].yData);
                charts[i].yTicks = this.calculateYAxis(minY, maxY);
                charts[i].xTicks = this.calculateYAxis(0, charts[i].xData.length);
                this.createDivs("chart-area");
                // console.log("Y-Axis Ticks: ");
                // console.log(yAxis);
                // console.log("--------------------------------------------------");
            }
            this.createCharts(charts);
        };
        this.createDivs = function(targetDiv) {
            var div = document.createElement('div');
            div.setAttribute('class', "multi-chart");
            var renderDiv = document.getElementById(targetDiv);
            renderDiv.appendChild(div);
        }
        this.dataMapper = function(height, width, lbHeight, lbWidth, chart) {
            console.log(chart);
            var yTicks = new Array();
            var xTicks = new Array();
            var yData = new Array();
            var xData = new Array();

            var yTicksMin = chart.yTicks[0];
            var yTicksMax = chart.yTicks[chart.yTicks.length - 1];
            var xTicksMin = chart.xTicks[0];
            var xTicksMax = chart.xTicks[chart.xTicks.length - 1];
            var yDataMin = Math.min.apply(Math, chart.yData);
            var yDataMax = Math.max.apply(Math, chart.yData);
            var xDataMin = Math.min.apply(Math, chart.xData);
            var xDataMax = Math.max.apply(Math, chart.xData);

            var divDiff = height/chart.yTicks.length - 1;
            var tickVal = lbHeight;
            for(var yTick of chart.yTicks) {
                // var tickVal = this.pixelNormalizer(height, yTick, yTicksMax, yTicksMin);
                yTicks.push(tickVal);
                tickVal += divDiff;
            }
            yTicks.push(tickVal);
            divDiff = width/chart.xTicks.length - 1;
            tickVal = lbWidth;
            for(var xTick of chart.xTicks) {
                // var xTickVal = this.pixelNormalizer(width, xTick, xTicksMax, xTicksMin);
                xTicks.push(tickVal);
                tickVal += divDiff;
            }
            xTicks.push(tickVal);
            var yDataVal = yTicksMin;
            for(var yDatum of chart.yData) {
                // var yDataVal = this.pixelNormalizer(height, yDatum, yDataMax, yDataMin);
                var yInterval = height/(yTicksMax - yTicksMin);
                yDataVal += yInterval;
                yData.push(yDataVal);
            }
            var xDataVal = xTicksMin;
            for(var xDatum of chart.xData) {
                // var xDataVal = this.pixelNormalizer(height, chart.xData.indexOf(xDatum), xDataMax, xDataMin);
                var xInterval = width/(xTicksMax - xTicksMin);
                xDataVal += xInterval;
                xData.push(xDataVal);
            }
            var mappedChart = new MappedChart(chart.index, chart.xTitle, chart.yTitle, xData, yData, yTicks, xTicks);
            return mappedChart;
        }
        this.pixelNormalizer = function(dimension, data, ub, lb) {
            var val = (dimension/ub)*data;
            if(val < 0) {
                val = Math.ceil(val);
            } else {
                val = Math.floor(val);
            }
            return val;
        }
        this.createCharts = function(charts, height, width) {
            var svgns = "http://www.w3.org/2000/svg";
            var height = typeof height != 'undefined' ? height : 209;
            var width = typeof width != 'undefined' ? width : 372;
            var chartUbHeight = Math.ceil(height - (0.025*height));
            // console.log(chartUbHeight);
            var chartUbWidth = Math.ceil(width - (0.025*width));
            // console.log(chartUbWidth);
            var chartLbHeight = Math.floor(0 + (0.025*height));
            // console.log(chartLbHeight);
            var chartLbWidth = Math.floor(0 + (0.025*height));
            // console.log(chartLbWidth);
            var chartHeight = chartUbHeight - chartLbHeight;
            // console.log(chartHeight);
            var chartWidth = chartUbWidth - chartLbWidth;
            // console.log(chartWidth);

            var multiCharts = document.getElementsByClassName("multi-chart");
            for(var i = 0; i < multiCharts.length; i++) {
                var mappedData = this.dataMapper(chartHeight, chartWidth, chartLbHeight, chartLbWidth, charts[i]);
                console.log(mappedData);
                var svg = document.createElementNS(svgns, "svg");
                svg.setAttributeNS(null, "height", height+"px");
                svg.setAttributeNS(null, "width", width+"px");
                svg.setAttributeNS(null, "version", "1.1");
                var yline = document.createElementNS(svgns, "line");
                yline.setAttributeNS(null, "x1", chartLbHeight);
                yline.setAttributeNS(null, "y1", chartLbHeight);    
                yline.setAttributeNS(null, "x2", chartLbHeight);
                yline.setAttributeNS(null, "y2", chartUbHeight);
                yline.setAttributeNS(null, "class", "yAxis");
                svg.appendChild(yline);
                var xline = document.createElementNS(svgns, "line");
                xline.setAttributeNS(null, "x1", chartUbWidth);
                xline.setAttributeNS(null, "y1", chartUbHeight);
                xline.setAttributeNS(null, "x2", chartLbWidth);
                xline.setAttributeNS(null, "y2", chartUbHeight);
                xline.setAttributeNS(null, "class", "xAxis");
                svg.appendChild(xline);
                for(var xTick of mappedData.xTicks) {
                    var xTickLine = document.createElementNS(svgns, "line");
                    xTickLine.setAttributeNS(null, "x1", xTick);
                    xTickLine.setAttributeNS(null, "y1", chartUbHeight);
                    xTickLine.setAttributeNS(null, "x2", xTick);
                    xTickLine.setAttributeNS(null, "y2", chartUbHeight + 5);
                    xTickLine.setAttributeNS(null, "class", "xTick");
                    svg.appendChild(xTickLine);
                }
                for(var yTick of mappedData.yTicks) {
                    var yTickLine = document.createElementNS(svgns, "line");
                    yTickLine.setAttributeNS(null, "x1", chartLbWidth - 5);
                    yTickLine.setAttributeNS(null, "y1", height - yTick);
                    yTickLine.setAttributeNS(null, "x2", chartLbWidth);
                    yTickLine.setAttributeNS(null, "y2", height - yTick);
                    yTickLine.setAttributeNS(null, "class", "yTick");
                    svg.appendChild(yTickLine);
                    var yDivLine = document.createElementNS(svgns, "line");
                    yDivLine.setAttributeNS(null, "x1", chartLbWidth);
                    yDivLine.setAttributeNS(null, "y1", height - yTick);
                    yDivLine.setAttributeNS(null, "x2", chartUbWidth);
                    yDivLine.setAttributeNS(null, "y2", height - yTick);
                    yDivLine.setAttributeNS(null, "class", "yDiv");
                    yDivLine.setAttributeNS(null, "stroke", "black");
                    yDivLine.setAttributeNS(null, "stroke-width", 1);
                    svg.appendChild(yDivLine);
                }
                // for(var y of mappedData.yData) {
                //     console.log(mappedData.xData.indexOf(y), y);
                // }
                multiCharts[i].appendChild(svg);
            }
        }
        /**
         * Calculates the tick mark values so that the axes look pretty
         * @param {number} yMin - The minimum value of the user given data
         * @param {number} yMin - The maximum value of the user given data
         * @param {number} [ticks=8] - An optional value suggesting the number of ticks to be used
         */
        this.calculateYAxis = function(yMin, yMax, ticks) {
            var ticks = typeof ticks != 'undefined' ? ticks : 8;
            var tickValues = new Array();
            if(yMin === yMax) {
                yMin = yMin - 1;
                yMax = yMax + 1;
            }
            var range = yMax - yMin;
            if(ticks < 2) {
                ticks = 2;
            } else if(ticks > 2) {
                ticks -= 2;
            }
            var roughStep = range / ticks;
            var prettyMod = Math.floor(Math.log(roughStep)/Math.LN10);
            var prettyPow = Math.pow(10, prettyMod);
            var prettyDiv = Math.round(roughStep/prettyPow + 0.5);
            var prettyStep = prettyDiv * prettyPow;

            var lb = prettyStep * Math.floor(yMin/prettyStep);
            var ub = prettyStep * Math.ceil(yMax/prettyStep);
            var val = lb;
            while(1) {
                tickValues.push(Math.round((val + 0.00001)*1000)/1000);
                val += prettyStep;
                if(val > ub) {
                    break;
                }
            }
            return tickValues;
        }
    };

    // Reading the AJAX from the file.
    var ajax = new AJAX('res/data/user_data.json', parseData);
})(window);