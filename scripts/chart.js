// IIFE to not pollute global namespace. Semi-colon for safety.
;(function(window) {
    'use strict';

    var Data = function() {
        this.caption    = "";
        this.subCaption = "";
        this.height     = "";
        this.width      = "";
        this.chartData  = [];
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

    Data.prototype.dataParser = function(json) {
        this.caption    = json.metadata.caption;
        this.subCaption = json.metadata.subCaption;
        this.height     = json.metadata.height;
        this.width      = json.metadata.width;

        var jsonDataKeys = Object.keys(json.data);
        var numCharts    = jsonDataKeys.length - 1;

        for (var i = 1; i <= numCharts; i++) {
            var xData = json.data[jsonDataKeys[0]].split(",");
            var yData = json.data[jsonDataKeys[i]]
                .split(",")
                .map(this.numberMapper);

            if (!this.allSame(yData, "")) {
                var units = json.metadata.units.split(",");
                var chart = new MultiVarChart(i, jsonDataKeys[0],
                    jsonDataKeys[i], xData, yData, units[0], units[i]);
                this.chartData.push(chart);
            }
        }
        var chartProperties = new ChartPropertyCalculator(this.chartData);
        var chartRenderer   = new ChartRenderer(this.chartData, chartProperties);
        chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
        chartRenderer.displayCharts(this.height, this.width);
        var eventAgent = new EventAgents();
        eventAgent.crosshairHandler(document.getElementsByClassName("chart-rect"));
    };

    Data.prototype.allSame = function(arr, val) {
        for (var elem of arr) {
            if (elem !== val) {
                return false;
            }
        }

        return true;
    };

    Data.prototype.numberMapper = function(numStr) {
        return numStr === "" ? "" : Number(numStr);
    };

    var SvgHelper = function() {
        this.svgns = "http://www.w3.org/2000/svg";
    };

    SvgHelper.prototype.createSvgByClass = function(height, width, className) {
        var svg = document.createElementNS(this.svgns, "svg");
        svg.setAttributeNS(null, "height", height + "px");
        svg.setAttributeNS(null, "width", width + "px");
        svg.setAttributeNS(null, "version", "1.1");
        svg.setAttributeNS(null, "class", className);
        return svg;
    };

    SvgHelper.prototype.drawLineByClass = function(x1, y1, x2, y2, className) {
        var line = document.createElementNS(this.svgns, "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x2);
        line.setAttributeNS(null, "y2", y2);
        line.setAttributeNS(null, "stroke", "black");
        line.setAttributeNS(null, "class", className);
        return line;
    };

    SvgHelper.prototype.drawTextByClass = function(x, y, textContent, className) {
        var text = document.createElementNS(this.svgns, "text");
        text.setAttributeNS(null, "x", x);
        text.setAttributeNS(null, "y", y);
        text.setAttributeNS(null, "class", className);
        text.setAttributeNS(null, "stroke", "black");
        text.textContent = textContent;
        return text;
    };

    SvgHelper.prototype.drawRectByClass = function(x, y, height, width, className) {
        var rect = document.createElementNS(this.svgns, "rect");
        rect.setAttributeNS(null, "x", x);
        rect.setAttributeNS(null, "y", y);
        rect.setAttributeNS(null, "height", height);
        rect.setAttributeNS(null, "width", width);
        rect.setAttributeNS(null, "class", className);
        rect.setAttributeNS(null, "stroke", "black");
        rect.setAttributeNS(null, "fill", "white");
        return rect;
    };

    SvgHelper.prototype.drawCircleByClass = function(cx, cy, r, className) {
        var circle = document.createElementNS(this.svgns, "circle");
        circle.setAttributeNS(null, "cx", cx);
        circle.setAttributeNS(null, "cy", cy);
        circle.setAttributeNS(null, "r", r + "px");
        circle.setAttributeNS(null, "class", className);
        return circle;
    };

    var MultiVarChart = function(index, xTitle, yTitle, xData, yData, xUnit, yUnit) {
        this.index  = index;
        this.xTitle = xTitle;
        this.yTitle = yTitle;
        this.xData  = xData;
        this.yData  = yData;
        this.xUnit  = xUnit;
        this.yUnit  = yUnit;
    };

    var MappedChart = function(index, xTitle, yTitle, xData, yData, yTicks, xTicks) {
        this.index  = index;
        this.xTitle = xTitle;
        this.yTitle = yTitle;
        this.xData  = xData;
        this.yData  = yData;
        this.yTicks = yTicks;
        this.xTicks = xTicks;
    };

    var chartUtilities = {};

    chartUtilities.nullMinMapper = function(val) {
        return val === "" ? +Infinity : val;
    };

    chartUtilities.nullMaxMapper = function(val) {
        return val === "" ? -Infinity : val;
    };

    chartUtilities.isSvgColliding = function(rectNow, rectNext) {
        return !(rectNext.left > rectNow.right ||
            rectNext.right < rectNow.left ||
            rectNext.top > rectNow.bottom ||
            rectNext.bottom < rectNow.top);
    };

    chartUtilities.getLineIntersectionPoint = function(x1, y1, x2, y2, x3, y3, x4, y4) {
        var den, num1, num2, a, b, result = {
            x: null,
            y: null
        };

        den = ((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4));
        if (den === 0) {
            return result;
        }
        // a = l1StartY - l2StartY;
        // b = l1StartX - l2StartX;
        num1 = (((x1 * y2) - (y1 * x2)) * (x3 - x4)) - ((x1 - x2) * ((x3 * y4) - (y3 * x4)));
        num2 = (((x1 * y2) - (y1 * x2)) * (y3 - y4)) - ((y1 - y2) * ((x3 * y4) - (y3 * x4)));

        result.x = num1 / den;
        result.y = num2 / den;

        return result;
    };

    chartUtilities.getInterpolatedVal = function(x1, y1, x2, y2, x) {
        x1 = Number(x1);
        x2 = Number(x2);
        y1 = Number(y1);
        y2 = Number(y2);
        var interpolatedVal = Math.round((y1 + ((y2 - y1) * ((x - x1) / (x2 - x1)))) * 100) / 100;
        return interpolatedVal;
    };

    var ChartRenderer = function(charts, chartProperties) {
        this.charts = charts;
        this.chartProperties = chartProperties;
    };

    ChartRenderer.prototype.displayCharts = function(height, width) {
        for (var i = 0; i < this.charts.length; i++) {
            var maxY = Math.max.apply(Math, this.charts[i].yData.map(chartUtilities.nullMaxMapper));
            var minY = Math.min.apply(Math, this.charts[i].yData.map(chartUtilities.nullMinMapper));
            if (minY !== Infinity || maxY !== -Infinity) {
                this.charts[i].yTicks = this.chartProperties.calculateYAxis(minY, maxY);
                this.charts[i].xTicks = this.chartProperties.calculateYAxis(0, this.charts[i].xData.length);
                this.createDivs("chart-area");
            }
        }
        this.createCharts(this.charts, height, width);
    };

    ChartRenderer.prototype.createDivs = function(targetDiv) {
        var div = document.createElement('div');
        div.setAttribute('class', "multi-chart");
        var renderDiv = document.getElementById(targetDiv);
        renderDiv.appendChild(div);
    };

    ChartRenderer.prototype.createCaptions = function(targetDiv, caption, subCaption) {
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

    ChartRenderer.prototype.createCharts = function(charts, height, width) {
        var svgHelper = new SvgHelper();
        var svgns = "http://www.w3.org/2000/svg";
        var chartUbHeight = Math.ceil(height - (0.025 * height)) + 55;
        var chartUbWidth = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.025 * height)) + 55;
        var chartLbWidth = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight = chartUbHeight - chartLbHeight;
        var chartWidth = chartUbWidth - chartLbWidth;
        var mappedCharts = [];

        var multiCharts = document.getElementsByClassName("multi-chart");
        for (var i = 0; i < multiCharts.length; i++) {
            var mappedData = this.chartProperties.dataMapper(chartHeight,
                chartWidth, chartLbHeight, chartLbWidth, charts[i]);
            mappedCharts.push(mappedData);

            var svg = svgHelper.createSvgByClass(height + 55, width + 55,
                "chart-svg");

            var yline = svgHelper.drawLineByClass(chartLbHeight,
                chartLbHeight - 55, chartLbHeight, chartUbHeight - 55, "yAxis");
            svg.appendChild(yline);

            var xline = svgHelper.drawLineByClass(chartUbWidth,
                chartUbHeight - 55, chartLbWidth, chartUbHeight - 55, "xAxis");
            svg.appendChild(xline);

            var yTitleContent = charts[i].yUnit === "" ? charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
            var yTitle = svgHelper.drawTextByClass((chartHeight / 2) - 50, -255, yTitleContent, "y-title");
            yTitle.setAttributeNS(null, "transform", "rotate(270 270, 0)");
            svg.appendChild(yTitle);

            if (i === multiCharts.length - 1) {
                var xTitleContent = charts[i].xUnit === "" ? charts[i].xTitle : charts[i].xTitle + " (" + charts[i].xUnit + ")";
                var xTitle = svgHelper.drawTextByClass((chartWidth / 2),
                    chartHeight + 67, xTitleContent, "x-title");
                svg.appendChild(xTitle);
            }

            for (var xTick of mappedData.xTicks) {
                var xTickLine = svgHelper.drawLineByClass(xTick,
                    chartUbHeight - 55, xTick, chartUbHeight + 5 - 55, "xTick");
                svg.appendChild(xTickLine);

                if (i === multiCharts.length - 1) {
                    var xValuesContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                    var xValues = svgHelper.drawTextByClass(height - 385,
                        xTick - 265, xValuesContent, "x-value");
                    xValues.setAttributeNS(null, "transform", "rotate(270 270, 0)");
                    svg.appendChild(xValues);
                }
            }

            for (var yTick of mappedData.yTicks) {
                var yTickLine = svgHelper.drawLineByClass(chartLbWidth - 5,
                    height - yTick + 55, chartLbWidth, height - yTick + 55,
                    "yTick");
                svg.appendChild(yTickLine);

                // var yDivLine = svgHelper.drawLineByClass(chartLbWidth,
                //     height - yTick + 55, chartUbWidth, height - yTick + 55,
                //     "yDiv");
                // svg.appendChild(yDivLine);

                var yDivRect = svgHelper.drawRectByClass(chartLbWidth,
                    yTick - 55, chartHeight - yTick + 62, chartWidth, "yDiv");
                svg.appendChild(yDivRect);

                var yValuesContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
                var yValues = svgHelper.drawTextByClass(0 + 50,
                    height - yTick + 5 + 55, yValuesContent, "y-value");
                yValues.setAttributeNS(null, "text-anchor", "end");
                svg.appendChild(yValues);
            }
            for (var l = 0; l < mappedData.yData.length - 1; l++) {
                var graphLine;
                var c = 0;
                if (mappedData.yData[l + 1] !== "" && mappedData.yData[l] !== "") {
                    graphLine = svgHelper
                        .drawLineByClass(mappedData.xData[l] + chartLbWidth,
                            chartHeight - mappedData.yData[l] + chartLbHeight - 55,
                            mappedData.xData[l + 1] + chartLbWidth,
                            chartHeight - mappedData.yData[l + 1] + chartLbHeight - 55,
                            "graphLine");
                    svg.appendChild(graphLine);
                } else if (mappedData.yData[l] !== "") {
                    for (var j = l + 2; j < mappedData.yData.length; j++) {
                        l++;
                        c++;
                        if (mappedData.yData[j] !== "") {
                            graphLine = svgHelper
                                .drawLineByClass(mappedData.xData[l - c] + chartLbWidth,
                                    chartHeight - mappedData.yData[l - c] + chartLbHeight - 55,
                                    mappedData.xData[j] + chartLbWidth,
                                    chartHeight - mappedData.yData[j] + chartLbHeight - 55,
                                    "graphLine inferredLine");
                            svg.appendChild(graphLine);
                            break;
                        }
                    }
                }
            }

            for (var k = 0; k < mappedData.yData.length; k++) {
                if (mappedData.yData[k] !== "") {
                    var anchor = svgHelper
                        .drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                            chartHeight - mappedData.yData[k] + chartLbHeight - 55,
                            4, "graphCircle");
                    anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
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
        }
    };

    /**
     * Calculates and display all properties of all charts one chart at a time
     *
     * @constructor
     * @param {Object[]} MultiVarChart - An array of charts whse properties need calculating
     */
    var ChartPropertyCalculator = function(charts) {
        this.charts = charts;
    };

    ChartPropertyCalculator.prototype.dataMapper = function(height, width, lbHeight, lbWidth, chart) {
        var yTicks = [];
        var xTicks = [];
        var yData  = [];
        var xData  = [];

        var yTicksMin = chart.yTicks[0];
        var yTicksMax = chart.yTicks[chart.yTicks.length - 1];
        var xTicksMin = chart.xTicks[0];
        var xTicksMax = chart.xTicks[chart.xTicks.length - 1];
        var yDataMin  = Math.min.apply(Math, chart.yData.map(chartUtilities.nullMinMapper));
        var yDataMax  = Math.max.apply(Math, chart.yData.map(chartUtilities.nullMaxMapper));
        var xDataMin  = 0;
        var xDataMax  = chart.xData.length - 1;

        for (var yTick of chart.yTicks) {
            var yTickVal = lbHeight;
            var yTickInterval = height / (yTicksMax - yTicksMin);
            yTickVal += yTickInterval * (yTick - yTicksMin);
            yTicks.push(Math.floor(yTickVal));
        }
        // yTicks.push(tickVal);
        var divDiff = Math.floor(width / (chart.xData.length - 1));
        var tickVal = lbWidth;
        for (var xTick of chart.xData) {
            xTicks.push(tickVal);
            tickVal += divDiff;
        }
        xTicks.push(tickVal);
        for (var yDatum of chart.yData) {
            if (yDatum === "") {
                yData.push("");
            } else {
                var yDataVal  = 0;
                var yInterval = height / (yTicksMax - yTicksMin);
                yDataVal += yInterval * (yDatum - yTicksMin);
                yData.push(Math.floor(yDataVal));
            }
        }
        for (var i = 0; i <= xDataMax; i++) {
            var xDataVal = 0;
            var xInterval = width / (xDataMax - xDataMin);
            if (i === 0) {
                xDataVal += xInterval * (i - xTicksMin);
            } else {
                xDataVal += xInterval * (i - xDataMin);
            }
            xData.push(Math.floor(xDataVal));
        }
        var mappedChart = new MappedChart(chart.index, chart.xTitle,
            chart.yTitle, xData, yData, yTicks, xTicks);
        return mappedChart;
    };

    /**
     * Calculates the tick mark values so that the axes look pretty
     * @param {number} yMin - The minimum value of the user given Y data
     * @param {number} yMin - The maximum value of the user given Y data
     * @param {number} [ticks=8] - An optional value suggesting the number of ticks to be used
     */
    ChartPropertyCalculator.prototype.calculateYAxis = function(yMin, yMax, ticks) {
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
        var roughStep  = range / ticks;
        var prettyMod  = Math.floor(Math.log(roughStep) / Math.LN10);
        var prettyPow  = Math.pow(10, prettyMod);
        var prettyDiv  = Math.floor(roughStep / prettyPow + 0.5);
        var prettyStep = prettyDiv * prettyPow;

        var lb  = prettyStep * Math.floor(yMin / prettyStep);
        var ub  = prettyStep * Math.ceil(yMax / prettyStep);
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

    var EventAgents = function() {
        this.svgHelper = new SvgHelper();
    };

    EventAgents.prototype.createCrosshair = function(event) {
        var crosshairCreation = new CustomEvent("crosshairCreateEvent", {
            "detail": event.clientX
        });
        for (var rect of document.getElementsByClassName("chart-rect")) {
            rect.dispatchEvent(crosshairCreation);
        }
    };

    EventAgents.prototype.createOtherCrosshairs = function(event) {
        var targetSvgHeight = event.target.getAttributeNS(null, "height");
        var targetSvgX      = event.target.getAttributeNS(null, "x");
        var targetSvgY      = event.target.getAttributeNS(null, "y");
        var crosshair, tooltip, tooltipBg;
        if (targetSvgHeight) {
            crosshair = this.svgHelper.drawLineByClass(event.detail, targetSvgY, event.detail, targetSvgHeight, "otherCrosshair");
            event.target.parentNode.insertBefore(crosshair, event.target);

            tooltipBg = this.svgHelper.drawRectByClass(event.detail, targetSvgHeight, 20, 60, "otherTooltipBg");
            tooltipBg.setAttributeNS(null, "rx", 2);
            tooltipBg.setAttributeNS(null, "ry", 2);
            tooltipBg.style.visibility = "hidden";
            event.target.parentNode.appendChild(tooltipBg);

            tooltip = this.svgHelper.drawTextByClass(event.detail, targetSvgHeight, "","otherTooltip");
            tooltip.style.visibility = "hidden";
            event.target.parentNode.appendChild(tooltip);
        }
    };

    EventAgents.prototype.moveCrosshair = function(event) {
        var crosshairMovement = new CustomEvent("crosshairMoveEvent", {
            "detail": event.clientX
        });
        for (var rect of document.getElementsByClassName("chart-rect")) {
            rect.dispatchEvent(crosshairMovement);
        }
    };

    EventAgents.prototype.moveOtherCrosshairs = function(event) {
        var crosshairs = event.target.parentNode.getElementsByClassName("otherCrosshair");
        var tooltips   = event.target.parentNode.getElementsByClassName("otherTooltip");
        var tooltipBgs = event.target.parentNode.getElementsByClassName("otherTooltipBg");
        var anchors    = event.target.parentNode.getElementsByClassName("graphCircle");
        var graphLines = event.target.parentNode.getElementsByClassName("graphLine");
        var graphLineBox, graphLineStartX, graphLineStartY, graphLineEndX,
            graphLineEndY,
            crosshairStartX, crosshairStartY, crosshairEndX, crosshairEndY,
            crosshairBox, crossHairRect,
            tooltipX, tooltipY,
            tooltipBgX, tooltipBgY,
            prevAnchorData, anchorData, anchorRect, anchorBox,
            chartRect;

        crosshairs[0].setAttributeNS(null, "x1", event.detail - 9);
        crosshairs[0].setAttributeNS(null, "x2", event.detail - 9);
        crosshairBox    = crosshairs[0].getBoundingClientRect();
        crosshairStartX = crosshairs[0].getAttributeNS(null, "x1");
        crosshairStartY = crosshairs[0].getAttributeNS(null, "y1");
        crosshairEndX   = crosshairs[0].getAttributeNS(null, "x2");
        crosshairEndY   = crosshairs[0].getAttributeNS(null, "y2");
        for (var i = 1; i < anchors.length; i++) {
            graphLineBox    = graphLines[i - 1].getBoundingClientRect();
            graphLineStartX = graphLines[i - 1].getAttributeNS(null, "x1");
            graphLineStartY = graphLines[i - 1].getAttributeNS(null, "y1");
            graphLineEndX   = graphLines[i - 1].getAttributeNS(null, "x2");
            graphLineEndY   = graphLines[i - 1].getAttributeNS(null, "y2");
            prevAnchorData  = anchors[i - 1].getAttributeNS(null, "data-value");
            anchorData      = anchors[i].getAttributeNS(null, "data-value");
            anchorRect      = anchors[i].getBoundingClientRect();
            anchorBox       = anchors[i].getBBox();
            chartRect       = event.target.getBoundingClientRect();
            crossHairRect   = crosshairs[0].getBoundingClientRect();
            if (chartUtilities.isSvgColliding(graphLineBox, crosshairBox)) {
                var intersect = chartUtilities.getLineIntersectionPoint(crosshairStartX,
                    crosshairStartY, crosshairEndX, crosshairEndY,
                    graphLineStartX, graphLineStartY, graphLineEndX,
                    graphLineEndY);
                var interpolatedVal = chartUtilities.getInterpolatedVal(graphLineStartX,
                    prevAnchorData, graphLineEndX, anchorData,
                    intersect.x);
                tooltips[0].style.visibility = "initial";
                tooltips[0].setAttributeNS(null, "x", intersect.x + 6);
                tooltips[0].setAttributeNS(null, "y", intersect.y + 20);
                tooltips[0].textContent = interpolatedVal;
                tooltipBgs[0].style.visibility = "initial";
                tooltipBgs[0].setAttributeNS(null, "x", intersect.x + 4);
                tooltipBgs[0].setAttributeNS(null, "y", intersect.y + 5);
                tooltipBgs[0].setAttributeNS(null, "width", tooltips[0].getComputedTextLength() + 6);
            }
            if (chartUtilities.isSvgColliding(anchorRect, crossHairRect)) {
                tooltips[0].style.visibility   = "initial";
                tooltipBgs[0].style.visibility = "initial";
                tooltipX   = anchorBox.x + (anchorBox.width) + 5;
                tooltipBgX = anchorBox.x + (anchorBox.width) + 3;
                tooltipY   = anchorBox.y + (anchorBox.height * 2);
                tooltipBgY = anchorBox.y + anchorBox.height - 3;
                if (tooltipX + anchorBox.width > chartRect.right) {
                    tooltipX   -= (anchorBox.width * 5) - 5;
                    tooltipBgX -= (anchorBox.width * 5) - 5;
                }
                tooltips[0].setAttributeNS(null, "x", tooltipX);
                tooltips[0].setAttributeNS(null, "y", tooltipY + 3);
                tooltips[0].textContent = anchors[i].getAttributeNS(null, "data-value");
                tooltipBgs[0].setAttributeNS(null, "x", tooltipBgX);
                tooltipBgs[0].setAttributeNS(null, "y", tooltipBgY);
                tooltipBgs[0].setAttributeNS(null, "width", tooltips[0].getComputedTextLength() + 6);
            }
        }
    };

    EventAgents.prototype.removeCrosshair = function(event) {
        var crosshairRemoval = new Event("crosshairRemoveEvent");
        for (var rect of document.getElementsByClassName("chart-rect")) {
            rect.dispatchEvent(crosshairRemoval);
        }
    };

    EventAgents.prototype.removeOtherCrosshairs = function(event) {
        var crosshairs = event.target.parentNode.getElementsByClassName("otherCrosshair");
        var tooltips = event.target.parentNode.getElementsByClassName("otherTooltip");
        var tooltipBgs = event.target.parentNode.getElementsByClassName("otherTooltipBg");

        for (var crosshair of crosshairs) {
            event.target.parentNode.removeChild(crosshair);
        }
        for (var tooltip of tooltips) {
            event.target.parentNode.removeChild(tooltip);
        }
        for (var tooltipBg of tooltipBgs) {
            event.target.parentNode.removeChild(tooltipBg);
        }
    };

    EventAgents.prototype.crosshairHandler = function(rects) {
        for (var rect of rects) {
            rect.addEventListener("mouseenter", this.createCrosshair.bind(this));
            rect.addEventListener("crosshairCreateEvent", this.createOtherCrosshairs.bind(this));
            rect.addEventListener("mousemove", this.moveCrosshair);
            rect.addEventListener("crosshairMoveEvent", this.moveOtherCrosshairs);
            rect.addEventListener("mouseleave", this.removeCrosshair);
            rect.addEventListener("crosshairRemoveEvent", this.removeOtherCrosshairs);
        }
    };

    var data = new Data();
    data.ajaxLoader('res/data/user_data.json', data.dataParser.bind(data));

})(window);
