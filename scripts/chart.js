// IIFE to not pollute global namespace. Semi-colon for safety.
;(function(document, console) {
    'use strict';

    /**
     * Boilerplate AJAX class to fetch data from a file.
     *
     * @constructor
     * @param {string} url - A URL specifying the location of the JSON file
     * @param {parseData} callback - Callback to receive and process fetched data
     */

    var Data = function() {
        this.caption = "";
        this.subCaption = "";
        this.height = "";
        this.width = "";
        this.charts = [];
    };

    Data.prototype.ajaxLoader = function(url, callback) {
        var httpRequest = new XMLHttpRequest();
        if (!httpRequest) {
            console.log("Unable to create XMLHTTP instance.");
            return false;
        }
        httpRequest.open('POST', url, true);
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                if (httpRequest.status === 200) {
                    callback(JSON.parse(httpRequest.responseText));
                } else {
                    console.log("There was a problem with the request");
                }
            }
        };
        httpRequest.send();
    };

    /**
     * Callback to parse the data received via AJAX
     *
     * @callback dataParser
     * @param {Object} json
     */
    Data.prototype.dataParser = function(json) {
        this.caption = json.metadata.caption;
        this.subCaption = json.metadata.subCaption;
        this.height = json.metadata.height;
        this.width = json.metadata.width;
        /**
         * Contains the keys of the JSON's data attribute
         * @type {string[]}
         */
        var jsonDataKeys = Object.keys(json.data);
        var numCharts = jsonDataKeys.length - 1;
        for (var i = 1; i <= numCharts; i++) {
            /**
             * @type {number[]}
             */
            var xData = json.data[jsonDataKeys[0]].split(",");
            /**
             * @type {number[]}
             */
            var yData = json.data[jsonDataKeys[i]].split(",").map(numberMapper); // Mapping each string after splitting to numbers
            if(!this.allSame(yData, "")) {
                var units = json.metadata.units.split(",");
                var chart = new MultiVarChart(i, jsonDataKeys[0], jsonDataKeys[i], xData, yData, units[0], units[i]);
                this.charts.push(chart);
            }
        }
        createCaptions('chart-area', this.caption, this.subCaption);
        var chartCalculator = new ChartPropertyCalculator(this.charts);
        chartCalculator.displayCharts(this.height, this.width);
    };

    Data.prototype.allSame = function(arr, val) {
        for(var elem of arr) {
            if(elem !== val) { return false; }
        }
        return true;
    }

    var SvgHelper = function() {
        this.svgns = "http://www.w3.org/2000/svg";
    };

    SvgHelper.prototype.drawLine = function(svg, x1, y1, x2, y2, className) {
        var line = document.createElementNS(this.svgns, "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x2);
        line.setAttributeNS(null, "y2", y2);
        line.setAttributeNS(null, "class", className);
        svg.appendChild(line);
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
    var MultiVarChart = function(index, xTitle, yTitle, xData, yData, xUnit, yUnit) {
        this.index = index;
        this.xTitle = xTitle;
        this.yTitle = yTitle;
        this.xData = xData;
        this.yData = yData;
        this.xUnit = xUnit;
        this.yUnit = yUnit;
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

    var numberMapper = function(numStr) {
        if (numStr === "") {
            return "";
        } else {
            return Number(numStr);
        }
    };

    var nullMinMapper = function(val) {
        return val === "" ? +Infinity : val;
    };

    var nullMaxMapper = function(val) {
        return val === "" ? -Infinity : val;
    };

    var createCaptions = function(targetDiv, caption, subCaption) {
        var captionHeader = document.createElement('h1');
        captionHeader.setAttribute('class', 'caption');
        var renderDiv = document.getElementById(targetDiv);
        captionHeader.innerHTML = caption;
        renderDiv.appendChild(captionHeader);
        var subCaptionHeader = document.createElement('h2');
        subCaptionHeader.setAttribute('class', 'sub-caption');
        subCaptionHeader.innerHTML = subCaption;
        renderDiv.appendChild(subCaptionHeader);
    };

    /**
     * Calculates and display all properties of all charts one chart at a time
     *
     * @constructor
     * @param {Object[]} MultiVarChart - An array of charts whse properties need calculating
     */
    var ChartPropertyCalculator = function(charts) {
        this.charts = charts;
        /**
         * Displays the properties of every chart in the log
         */
        this.displayCharts = function(height, width) {
            for (var i = 0; i < charts.length; i++) {
                // if(i === charts.length - 1) {
                //     console.log("X-Axis Title: " + charts[i].xTitle);
                // }
                // console.log("X-Axis Plots and Ticks: ");
                // console.log(charts[i].xData);
                // console.log("Y-Axis Title: " + charts[i].yTitle);
                // console.log("Y-Axis Plots: ");
                // for (var yDatum of charts[i].yData) {
                //     if (yDatum === "") {
                //         charts[i].yData.splice(charts[i].yData.indexOf(yDatum), 1);
                //     }
                // }
                // console.log(charts[i].yData);
                // if(i > 2) { debugger; }
                var maxY = Math.max.apply(Math, charts[i].yData.map(nullMaxMapper));
                var minY = Math.min.apply(Math, charts[i].yData.map(nullMinMapper));
                if(minY !== Infinity || maxY !== -Infinity) {
                    charts[i].yTicks = this.calculateYAxis(minY, maxY);
                    charts[i].xTicks = this.calculateYAxis(0, charts[i].xData.length);
                    this.createDivs("chart-area");
                    // console.log("Y-Axis Ticks: ");
                    // console.log(yAxis);
                    // console.log("--------------------------------------------------");
                }
            }
            this.createCharts(charts, height, width);
        };
        this.createDivs = function(targetDiv) {
            var div = document.createElement('div');
            div.setAttribute('class', "multi-chart");
            var renderDiv = document.getElementById(targetDiv);
            renderDiv.appendChild(div);
        };
        this.dataMapper = function(height, width, lbHeight, lbWidth, chart) {
            // console.log(chart);
            var yTicks = [];
            var xTicks = [];
            var yData = [];
            var xData = [];

            var yTicksMin = chart.yTicks[0];
            var yTicksMax = chart.yTicks[chart.yTicks.length - 1];
            var xTicksMin = chart.xTicks[0];
            var xTicksMax = chart.xTicks[chart.xTicks.length - 1];
            var yDataMin = Math.min.apply(Math, chart.yData.map(nullMinMapper));
            var yDataMax = Math.max.apply(Math, chart.yData.map(nullMaxMapper));
            var xDataMin = 0;
            var xDataMax = chart.xData.length - 1;

            for (var yTick of chart.yTicks) {
                var yTickVal = lbHeight;
                // var tickVal = this.pixelNormalizer(height, yTick, yTicksMax, yTicksMin);
                var yTickInterval = height / (yTicksMax - yTicksMin);
                yTickVal += yTickInterval * (yTick - yTicksMin);
                yTicks.push(Math.floor(yTickVal));
            }
            // yTicks.push(tickVal);
            var divDiff = Math.floor(width / (chart.xData.length - 1));
            var tickVal = lbWidth;
            for (var xTick of chart.xData) {
                // var xTickVal = this.pixelNormalizer(width, xTick, xTicksMax, xTicksMin);
                xTicks.push(tickVal);
                tickVal += divDiff;
            }
            xTicks.push(tickVal);
            for (var yDatum of chart.yData) {
                if (yDatum === "") {
                    yData.push("");
                } else {
                    var yDataVal = 0;
                    // var yDataVal = this.pixelNormalizer(height, yDatum, yDataMax, yDataMin);
                    var yInterval = height / (yTicksMax - yTicksMin);
                    yDataVal += yInterval * (yDatum - yTicksMin);
                    yData.push(Math.floor(yDataVal));
                }
            }
            for (var i = 0; i <= xDataMax; i++) {
                var xDataVal = 0;
                // var xDataVal = this.pixelNormalizer(height, chart.xData.indexOf(xDatum), xDataMax, xDataMin);
                var xInterval = width / (xDataMax - xDataMin);
                if (i === 0) {
                    xDataVal += xInterval * (i - xTicksMin);
                } else {
                    xDataVal += xInterval * (i - xDataMin);
                }
                xData.push(Math.floor(xDataVal));
            }
            var mappedChart = new MappedChart(chart.index, chart.xTitle, chart.yTitle, xData, yData, yTicks, xTicks);
            return mappedChart;
        };
        this.pixelNormalizer = function(dimension, data, ub, lb) {
            var val = (dimension / ub) * data;
            if (val < 0) {
                val = Math.ceil(val);
            } else {
                val = Math.floor(val);
            }
            return val;
        };
        this.createCharts = function(charts, height, width) {
            console.log(charts);
            var svgns = "http://www.w3.org/2000/svg";
            var chartUbHeight = Math.ceil(height - (0.025 * height)) + 55;
            console.log("chartUbHeight: " + chartUbHeight);
            var chartUbWidth = Math.ceil(width - (0.025 * width)) + 55;
            console.log("chartUbWidth: " + chartUbWidth);
            var chartLbHeight = Math.floor(0 + (0.025 * height)) + 55;
            console.log("chartLbHeight: " + chartLbHeight);
            var chartLbWidth = Math.floor(0 + (0.025 * height)) + 55;
            console.log("chartLbWidth: " + chartLbWidth);
            var chartHeight = chartUbHeight - chartLbHeight;
            console.log("chartHeight: " + chartHeight);
            var chartWidth = chartUbWidth - chartLbWidth;
            console.log("chartWidth: " + chartWidth);
            var mappedCharts = [];

            var multiCharts = document.getElementsByClassName("multi-chart");
            for (var i = 0; i < multiCharts.length; i++) {
                var mappedData = this.dataMapper(chartHeight, chartWidth, chartLbHeight, chartLbWidth, charts[i]);
                mappedCharts.push(mappedData);
                console.log(mappedData);
                var svg = document.createElementNS(svgns, "svg");
                svg.setAttributeNS(null, "height", height + 55 + "px");
                svg.setAttributeNS(null, "width", width + 55 + "px");
                svg.setAttributeNS(null, "version", "1.1");
                svg.setAttributeNS(null, "class", "chart-svg");
                var yline = document.createElementNS(svgns, "line");
                yline.setAttributeNS(null, "x1", chartLbHeight);
                yline.setAttributeNS(null, "y1", chartLbHeight - 55);
                yline.setAttributeNS(null, "x2", chartLbHeight);
                yline.setAttributeNS(null, "y2", chartUbHeight - 55);
                yline.setAttributeNS(null, "class", "yAxis");
                svg.appendChild(yline);
                var xline = document.createElementNS(svgns, "line");
                xline.setAttributeNS(null, "x1", chartUbWidth);
                xline.setAttributeNS(null, "y1", chartUbHeight - 55);
                xline.setAttributeNS(null, "x2", chartLbWidth);
                xline.setAttributeNS(null, "y2", chartUbHeight - 55);
                xline.setAttributeNS(null, "class", "xAxis");
                svg.appendChild(xline);
                var yTitle = document.createElementNS(svgns, "text");
                yTitle.setAttributeNS(null, "x", (chartHeight / 2) + 50);
                yTitle.setAttributeNS(null, "y", -261);
                yTitle.setAttributeNS(null, "class", "y-title");
                yTitle.setAttributeNS(null, "transform", "rotate(270 270, 0)");
                yTitle.setAttributeNS(null, "stroke", "black");
                yTitle.textContent = charts[i].yUnit === "" ? charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
                svg.appendChild(yTitle);
                var yDivGroup = document.createElementNS(svgns, "g");
                yDivGroup.setAttributeNS(null, "class", "y-div-group");
                if (i === multiCharts.length - 1) {
                    var xTitle = document.createElementNS(svgns, "text");
                    xTitle.setAttributeNS(null, "x", (chartWidth / 2));
                    xTitle.setAttributeNS(null, "y", chartHeight + 63);
                    xTitle.setAttributeNS(null, "class", "x-title");
                    xTitle.setAttributeNS(null, "stroke", "black");
                    xTitle.textContent = charts[i].xUnit === "" ? charts[i].xTitle : charts[i].xTitle + " (" + charts[i].xUnit + ")";
                    svg.appendChild(xTitle);
                }
                for (var xTick of mappedData.xTicks) {
                    var xTickLine = document.createElementNS(svgns, "line");
                    xTickLine.setAttributeNS(null, "x1", xTick);
                    xTickLine.setAttributeNS(null, "y1", chartUbHeight - 55);
                    xTickLine.setAttributeNS(null, "x2", xTick);
                    xTickLine.setAttributeNS(null, "y2", chartUbHeight + 5 - 55);
                    xTickLine.setAttributeNS(null, "class", "xTick");
                    svg.appendChild(xTickLine);
                    if (i === multiCharts.length - 1) {
                        var xValues = document.createElementNS(svgns, "text");
                        xValues.textContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                        xValues.setAttributeNS(null, "x", height - 180);
                        xValues.setAttributeNS(null, "y", xTick - 265);
                        xValues.setAttributeNS(null, "transform", "rotate(270 270, 0)");
                        xValues.setAttributeNS(null, "stroke", "black");
                        xValues.setAttributeNS(null, "class", "x-value");
                        svg.appendChild(xValues);
                    }
                }
                for (var yTick of mappedData.yTicks) {
                    var yTickLine = document.createElementNS(svgns, "line");
                    yTickLine.setAttributeNS(null, "x1", chartLbWidth - 5);
                    yTickLine.setAttributeNS(null, "y1", height - yTick + 55);
                    yTickLine.setAttributeNS(null, "x2", chartLbWidth);
                    yTickLine.setAttributeNS(null, "y2", height - yTick + 55);
                    yTickLine.setAttributeNS(null, "class", "yTick");
                    svg.appendChild(yTickLine);
                    var yDivLine = document.createElementNS(svgns, "line");
                    yDivLine.setAttributeNS(null, "x1", chartLbWidth);
                    yDivLine.setAttributeNS(null, "y1", height - yTick + 55);
                    yDivLine.setAttributeNS(null, "x2", chartUbWidth);
                    yDivLine.setAttributeNS(null, "y2", height - yTick + 55);
                    yDivLine.setAttributeNS(null, "class", "yDiv");
                    yDivLine.setAttributeNS(null, "stroke", "black");
                    yDivLine.setAttributeNS(null, "stroke-width", 1);
                    // yDivGroup.appendChild(yDivLine);
                    svg.appendChild(yDivLine);
                    var yValues = document.createElementNS(svgns, "text");
                    yValues.setAttributeNS(null, "x", 0 + 25);
                    yValues.setAttributeNS(null, "y", height - yTick + 5 + 55);
                    yValues.setAttributeNS(null, "stroke", "black");
                    yValues.textContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
                    svg.appendChild(yValues);
                }
                for (var l = 0; l < mappedData.yData.length - 1; l++) {
                    var graphLine;
                    var c = 0;
                    if (mappedData.yData[l + 1] !== "") {
                        graphLine = document.createElementNS(svgns, "line");
                        graphLine.setAttributeNS(null, "x1", mappedData.xData[l] + chartLbWidth);
                        graphLine.setAttributeNS(null, "y1", chartHeight - mappedData.yData[l] + chartLbHeight - 55);
                        graphLine.setAttributeNS(null, "x2", mappedData.xData[l + 1] + chartLbWidth);
                        graphLine.setAttributeNS(null, "y2", chartHeight - mappedData.yData[l + 1] + chartLbHeight - 55);
                        graphLine.setAttributeNS(null, "class", "graphLine");
                        svg.appendChild(graphLine);
                    } else if (mappedData.yData[l] !== "") {
                        for (var j = l + 2; j < mappedData.yData.length; j++) {
                            l++; c++;
                            if (mappedData.yData[j] !== "") {
                                graphLine = document.createElementNS(svgns, "line");
                                graphLine.setAttributeNS(null, "x1", mappedData.xData[l - c] + chartLbWidth);
                                graphLine.setAttributeNS(null, "y1", chartHeight - mappedData.yData[l - c] + chartLbHeight - 55);
                                graphLine.setAttributeNS(null, "x2", mappedData.xData[j] + chartLbWidth);
                                graphLine.setAttributeNS(null, "y2", chartHeight - mappedData.yData[j] + chartLbHeight - 55);
                                graphLine.setAttributeNS(null, "class", "inferredLine");
                                svg.appendChild(graphLine);
                                break;
                            }
                        }
                    }                
                }

                for (var k = 0; k < mappedData.yData.length; k++) {
                    if (mappedData.yData[k] !== "") {
                        var anchor = document.createElementNS(svgns, "circle");
                        anchor.setAttributeNS(null, "cx", mappedData.xData[k] + chartLbWidth);
                        anchor.setAttributeNS(null, "cy", chartHeight - mappedData.yData[k] + chartLbHeight - 55);
                        anchor.setAttributeNS(null, "r", "4px");
                        anchor.setAttributeNS(null, "class", "graphCircle");
                        var toolTip = document.createElementNS(svgns, "title");
                        toolTip.setAttributeNS(null, "class", "plotToolTip");
                        toolTip.innerHTML = charts[i].yData[k];
                        anchor.appendChild(toolTip);
                        svg.appendChild(anchor);
                    }
                }

                var rect = document.createElementNS(svgns, "rect");
                rect.setAttributeNS(null, "width", chartWidth);
                rect.setAttributeNS(null, "height", chartHeight);
                rect.setAttributeNS(null, "x", chartLbWidth);
                rect.setAttributeNS(null, "y", chartLbHeight - 55);
                rect.setAttributeNS(null, "class", "chart-rect");
                rect.setAttributeNS(null, "fill-opacity", 0);
                svg.appendChild(rect);

                multiCharts[i].appendChild(svg);
                if (i === multiCharts.length - 1) {
                    var textCollisions = [];
                    var xTextValues = document.getElementsByClassName("x-value");
                    for (var textValue = 0; i < xTextValues.length - 1; i++) {
                        var rectNow = xTextValues[textValue].getBoundingClientRect();
                        var rectNext = xTextValues[textValue + 1].getBoundingClientRect();
                        textCollisions.push(this.isSvgColliding(rectNow, rectNext));
                    }
                }
            }

            crosshairHandler(document.getElementsByClassName("chart-rect"));
            // tooltipHandler(document.getElementsByClassName("chart-svg"), mappedCharts);
        };

        this.isSvgColliding = function(rectNow, rectNext) {
            return !(rectNext.left > rectNow.right ||
                rectNext.right < rectNow.left ||
                rectNext.top > rectNow.bottom ||
                rectNext.bottom < rectNow.top);
        };
        /**
         * Calculates the tick mark values so that the axes look pretty
         * @param {number} yMin - The minimum value of the user given data
         * @param {number} yMin - The maximum value of the user given data
         * @param {number} [ticks=8] - An optional value suggesting the number of ticks to be used
         */
        this.calculateYAxis = function(yMin, yMax, ticks) {
            ticks = typeof ticks != 'undefined' ? ticks : 8;
            var tickValues = [];
            if (yMin === yMax) {
                yMin = yMin - 1;
                yMax = yMax + 1;
            }
            var range = yMax - yMin;
            if (ticks < 2) {
                ticks = 2;
            } else if (ticks > 2) {
                ticks -= 2;
            }
            var roughStep = range / ticks;
            var prettyMod = Math.floor(Math.log(roughStep) / Math.LN10);
            var prettyPow = Math.pow(10, prettyMod);
            var prettyDiv = Math.floor(roughStep / prettyPow + 0.5);
            var prettyStep = prettyDiv * prettyPow;

            var lb = prettyStep * Math.floor(yMin / prettyStep);
            var ub = prettyStep * Math.ceil(yMax / prettyStep);
            var val = lb;
            while (1) {
                tickValues.push(Math.round((val + 0.00001) * 1000) / 1000);
                val += prettyStep;
                if (val > ub) {
                    break;
                }
            }
            return tickValues;
        };
    };

    var createTooltip = function(event, mappedCharts) {
        console.log(this);
        var tooltip;
        for(var svgChart of document.getElementsByClassName("chart-svg")) {
            tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tooltip.setAttributeNS(null, "x", event.clientX - 10);
            tooltip.setAttributeNS(null, "y", event.clientY - 120);
            tooltip.setAttributeNS(null, "class", "tooltip");
            tooltip.setAttributeNS(null, "stroke", "black");
            tooltip.textContent = "Hi";
            event.target.appendChild(tooltip);
        }
    };

    var tooltipHandler = function(svgCharts, mappedCharts) {
        for(var svgChart of svgCharts) {
            svgChart.addEventListener("mouseenter", function(event) { createTooltip(event, mappedCharts); });
        }
    };

    var createCrosshair = function(event) {
        var targetSvgHeight = event.target.getAttributeNS(null, "height");
        var targetSvgX = event.target.getAttributeNS(null, "x");
        var targetSvgY = event.target.getAttributeNS(null, "y");
        var crosshair;
        var crosshairCreation = new CustomEvent("crosshairCreateEvent", {"detail": event.clientX});
        for(var rect of document.getElementsByClassName("chart-rect")) {
            if(rect !== event.target) {
                rect.dispatchEvent(crosshairCreation);
            }
        }
        if(targetSvgHeight) {
            // var svgHelper = new SvgHelper();
            // svgHelper.drawLine(event.target, event.clientX, 0, event.clientX, targetSvgHeight, "crosshair");
            crosshair = document.createElementNS("http://www.w3.org/2000/svg", "line");
            crosshair.setAttributeNS(null, "x1", event.clientX);
            crosshair.setAttributeNS(null, "y1", targetSvgY);
            crosshair.setAttributeNS(null, "x2", event.clientX);
            crosshair.setAttributeNS(null, "y2", targetSvgHeight);
            crosshair.setAttributeNS(null, "stroke", "red");
            crosshair.setAttributeNS(null, "id", "crosshair");
            event.target.parentNode.appendChild(crosshair);
        }
    };

    var createOtherCrosshairs = function(event) {
        // if(event.target !== event.source) {
            console.log(event);
            var targetSvgHeight = event.target.getAttributeNS(null, "height");
            var targetSvgX = event.target.getAttributeNS(null, "x");
            var targetSvgY = event.target.getAttributeNS(null, "y");
            var crosshair;
            if(targetSvgHeight) {
                crosshair = document.createElementNS("http://www.w3.org/2000/svg", "line");
                crosshair.setAttributeNS(null, "x1", event.detail);
                crosshair.setAttributeNS(null, "y1", targetSvgY);
                crosshair.setAttributeNS(null, "x2", event.detail);
                crosshair.setAttributeNS(null, "y2", targetSvgHeight);
                crosshair.setAttributeNS(null, "stroke", "red");
                crosshair.setAttributeNS(null, "class", "otherCrosshair");
                event.target.parentNode.appendChild(crosshair);
            }
        // }
    };

    var moveCrosshair = function(event) {
        var crosshair = document.getElementById("crosshair");
        var crosshairMovement = new CustomEvent("crosshairMoveEvent", {"detail": event.clientX});
        for(var rect of document.getElementsByClassName("chart-rect")) {
            if(rect !== event.target) {
                rect.dispatchEvent(crosshairMovement);
            }
        }
        if(crosshair) {
            crosshair.setAttributeNS(null, "x1", event.clientX - 10);
            crosshair.setAttributeNS(null, "x2", event.clientX - 10);
        }
    };

    var moveOtherCrosshairs = function(event) {
        // if(event.target !== event.source) {
            var crosshairs = document.getElementsByClassName("otherCrosshair");
            for(var crosshair of crosshairs) {
                crosshair.setAttributeNS(null, "x1", event.detail - 10);
                crosshair.setAttributeNS(null, "x2", event.detail - 10);
            }
        // }
    };

    var removeCrosshair = function(event) {
        var crosshair = document.getElementById("crosshair");
        event.target.parentNode.removeChild(crosshair);
        var crosshairRemoval = new Event("crosshairRemoveEvent");
        for(var rect of document.getElementsByClassName("chart-rect")) {
            if(rect !== event.target) {
                rect.dispatchEvent(crosshairRemoval);
            }
        }
    };

    var removeOtherCrosshairs = function(event) {
        // if(event.target !== event.source) {
            var crosshairs = document.getElementsByClassName("otherCrosshair");
            for(var crosshair of crosshairs) {
                if(crosshair.parentNode === event.target.parentNode) {
                    event.target.parentNode.removeChild(crosshair);
                }
            }
        // }
    };

    var crosshairHandler = function(rects) {
        for (var rect of rects) {
            rect.addEventListener("mouseenter", createCrosshair);
            rect.addEventListener("crosshairCreateEvent", createOtherCrosshairs);
            rect.addEventListener("mousemove", moveCrosshair);
            rect.addEventListener("crosshairMoveEvent", moveOtherCrosshairs);
            rect.addEventListener("mouseleave", removeCrosshair);
            rect.addEventListener("crosshairRemoveEvent", removeOtherCrosshairs);
        }
    };

    // Reading the AJAX from the file.
    var data = new Data();
    data.ajaxLoader('res/data/user_data.json', data.dataParser.bind(data));

})(document, console);