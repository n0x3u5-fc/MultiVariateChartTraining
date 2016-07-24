// IIFE to not pollute global namespace. Semi-colon for safety.
;(function(window) {
    'use strict';

    var Data = function() {
        this.caption    = "";
        this.subCaption = "";
        this.height     = "";
        this.width      = "";
        this.type       = "";
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
        this.type       = json.metadata.type;
        this.sortBy     = json.metadata.sortBy;
        this.sortOrder  = json.metadata.sortOrder;

        var jsonDataKeys = Object.keys(json.data);
        var numCharts    = jsonDataKeys.length - 1;
        var chartRenderer;

        for (var i = 1; i <= numCharts; i++) {
            var xData = json.data[jsonDataKeys[0]].split(",");
            var yData = json.data[jsonDataKeys[i]]
                .split(",")
                .map(this.numberMapper);

            if (!this.allSame(yData, "")) {
                var units = json.metadata.units.split(",");
                var chart = new MultiVarChart(i, this.type, jsonDataKeys[0],
                    jsonDataKeys[i], xData, yData, units[0], units[i]);
                this.chartData.push(chart);
            }
        }
        this.sortData(this.sortBy);
        var chartProperties = new ChartPropertyCalculator(this.chartData);
        var that = this;
        window.addEventListener("resize", function() {
            var chartDiv = document.getElementById("chart-area");
            while(chartDiv.firstChild) {
                chartDiv.removeChild(chartDiv.firstChild);
            }
            if(that.type === "line") {
                chartRenderer = new LineChartRenderer(that.chartData, chartProperties);
                chartRenderer.createCaptions("chart-area", that.caption, that.subCaption);
                chartRenderer.displayCharts(that.height, that.width);
            } else if(that.type === "column") {
                chartRenderer = new ColumnChartRenderer(that.chartData, chartProperties);
                chartRenderer.createCaptions("chart-area", that.caption, that.subCaption);
                chartRenderer.displayCharts(that.height, that.width);
            } else {
                console.log("Sorry Dave. I can't let you do that.");
            }
        });
        if(this.type === "line") {
            chartRenderer = new LineChartRenderer(this.chartData, chartProperties);
            chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
            chartRenderer.displayCharts(this.height, this.width);
        } else if(this.type === "column") {
            chartRenderer = new ColumnChartRenderer(this.chartData, chartProperties);
            chartRenderer.createCaptions("chart-area", this.caption, this.subCaption);
            chartRenderer.displayCharts(this.height, this.width);
        } else {
            console.log("Sorry Dave. I can't let you do that.");
        }
        var eventAgent = new EventAgents(this.type);
        eventAgent.crosshairHandler(document.getElementsByClassName("chart-svg"));
    };

    Data.prototype.sortData = function(sortBy) {
        switch(sortBy) {
            case "average":
                this.sortByAverage();
                break;
            case "value":
                this.sortByValue();
                break;
            default:
                console.log("default");
        }
    };

    Data.prototype.sortByAverage = function() {
        var averages = [];
        for(var chartDatum of this.chartData) {
            var sum = 0, length = 0;
            for (var yDatum of chartDatum.yData) {
                if(yDatum !== "") {
                    sum += yDatum;
                    length++;
                }
            }
            averages.push(sum / length);
        }
        this.chartData = this.multiSort(averages, this.chartData, this.sortOrder);
    };

    Data.prototype.sortByValue = function() {
        var maxes = [];
        for(var chartDatum of this.chartData) {
            maxes.push(Math.max.apply(Math, chartDatum.yData));
        }
        this.chartData = this.multiSort(maxes, this.chartData, this.sortOrder);
    };

    Data.prototype.multiSort = function(supportingArray, sortingArray, order) {
        var arr = [];
        for(var i in sortingArray) {
            arr.push({'sort': sortingArray[i], 'support': supportingArray[i]});
        }
        if(order == "descending") {
            arr.sort(function(a, b) {
                return ((a.support > b.support) ? -1 : ((a.support == b.support) ? 0 : 1));
            });
        } else if(order == "ascending") {
            arr.sort(function(a, b) {
                return ((a.support < b.support) ? -1 : ((a.support == b.support) ? 0 : 1));
            });
        }
        for(var j = 0; j < arr.length; j++) {
            sortingArray[j] = arr[j].sort;
        }
        return sortingArray;
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

    SvgHelper.prototype.getRotationPoint = function(elem) {
        var elemBox = elem.getBBox();
        var rotationPt = (elemBox.x + 14) + ", " + (elemBox.y + (elemBox.height / 2));
        return rotationPt;
    };

    var MultiVarChart = function(index, type, xTitle, yTitle, xData, yData, xUnit, yUnit) {
        this.index  = index;
        this.type   = type;
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

    var ColumnChartRenderer = function(charts, chartProperties) {
        this.charts = charts;
        this.chartProperties = chartProperties;
    };

    ColumnChartRenderer.prototype.displayCharts = function(height, width) {
        for (var i = 0; i < this.charts.length; i++) {
            var maxY = Math.max.apply(Math, this.charts[i].yData.map(chartUtilities.nullMaxMapper));
            var minY = Math.min.apply(Math, this.charts[i].yData.map(chartUtilities.nullMinMapper));
            if (minY !== Infinity || maxY !== -Infinity) {
                this.charts[i].yTicks = this.chartProperties.calculateYAxis(minY, maxY);
                this.charts[i].xTicks = this.chartProperties.calculateYAxis(0,
                                                                       this.charts[i].xData.length);
                this.createDivs("chart-area");
            }
        }
        this.createCharts(this.charts, height, width);
    };

    ColumnChartRenderer.prototype.createDivs = function(targetDiv) {
        var div = document.createElement('div');
        div.setAttribute('class', "multi-chart");
        div.style.display = "inline";
        var renderDiv = document.getElementById(targetDiv);
        renderDiv.appendChild(div);
    };

    ColumnChartRenderer.prototype.createCaptions = function(targetDiv, caption, subCaption) {
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

    ColumnChartRenderer.prototype.drawCompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width) {

        var xZeroLine, columnPlot;
        var mappedCharts  = [];
        var chartUbHeight = Math.ceil(height - (0.001 * height)) + 55;
        var chartUbWidth  = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.2 * height)) + 55;
        var chartLbWidth  = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        var yline = svgHelper.drawLineByClass(chartLbWidth, chartLbHeight - 55,
                                              chartLbWidth, chartUbHeight - 55, "yAxis");
        svg.appendChild(yline);

        var xline = svgHelper.drawLineByClass(chartLbWidth, chartUbHeight - 55,
                                              chartUbWidth, chartUbHeight - 55, "xAxis");
        svg.appendChild(xline);

        for (var yTick of mappedData.yTicks) {
            var yValuesContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
            var yTickLine = svgHelper.drawLineByClass(chartLbWidth - 5, yTick - 55,
                                                      chartLbWidth, yTick - 55,
                                                      "yTick");
            svg.appendChild(yTickLine);

            var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
                                                     chartHeight - yTick + mappedData.yTicks[0], chartWidth,
                                                     "yDiv");
            svg.appendChild(yDivRect);

            if(yValuesContent == 0) {
                xZeroLine = svgHelper.drawLineByClass(chartLbWidth, chartUbHeight - yTick + chartLbHeight - 55, chartUbWidth,
                                              chartUbHeight - yTick + chartLbHeight - 55, "zeroPlane");
                xZeroLine.setAttributeNS(null, "stroke-opacity", 0);
                svg.appendChild(xZeroLine);
                yValuesContent = 0;
            }

            var yValues = svgHelper.drawTextByClass(0 + 50, chartUbHeight - yTick + chartLbHeight - 50,
                                                    yValuesContent, "y-value");
            yValues.setAttributeNS(null, "text-anchor", "end");
            svg.appendChild(yValues);
        }

        var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartLbHeight - 55 - 40, 30, chartWidth, "y-title-rect");
        svg.appendChild(yTitleRect);
        var yTitleContent = charts[i].yUnit === "" ?
            charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
        var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartLbHeight - 55 - 20, yTitleContent,
                                               "y-title");
        svg.appendChild(yTitle);

        for (var xTick of mappedData.xTicks) {
            var xTickLine = svgHelper.drawLineByClass(xTick, chartUbHeight - 55, xTick,
                                                      chartUbHeight + 5 - 55, "xTick");
            svg.appendChild(xTickLine);

            if (i >= multiCharts.length - chartsInARow) {
                var xValuesContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                var xValues = svgHelper.drawTextByClass(xTick - 13, chartUbHeight - 23,
                                                        xValuesContent, "x-value");
                svg.appendChild(xValues);
            }
        }

        for (var k = 0; k < mappedData.yData.length; k++) {
            if (mappedData.yData[k] !== "") {
                var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                        chartHeight - mappedData.yData[k] + chartLbHeight - 55,
                                        4, "graphCircle");
                anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                // svg.appendChild(anchor);
                var plotWidth = (chartWidth / mappedData.xData.length) - 10;
                if(svg.getElementsByClassName("zeroPlane").length > 0) {
                    var zeroPlaneY = xZeroLine.getAttributeNS(null, "y1");
                    if(charts[i].yData[k] < 0) {
                        var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight - 55 - zeroPlaneY;
                        columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                    } else {
                        columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        chartUbHeight - mappedData.yData[k] - 55,
                        mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 55, plotWidth,
                        "column-plot");
                    }
                } else {
                    columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    chartUbHeight - mappedData.yData[k] - 55,
                    mappedData.yData[k], plotWidth,
                    "column-plot");
                }
                columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
                svg.appendChild(columnPlot);
            }
        }
    };

    ColumnChartRenderer.prototype.drawIncompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width) {

        var xZeroLine, columnPlot;
        var mappedCharts  = [];
        var chartUbHeight = Math.ceil(height - (0.095 * height)) + 55;
        var chartUbWidth  = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.025 * height)) + 55;
        var chartLbWidth  = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight   = chartUbHeight - chartLbHeight;
        var chartWidth    = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                             chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        var yline = svgHelper.drawLineByClass(chartLbWidth, chartLbHeight - 15,
                                              chartLbWidth, chartUbHeight - 15, "yAxis");
        svg.appendChild(yline);

        var xline = svgHelper.drawLineByClass(chartLbWidth, chartUbHeight - 15,
                                              chartUbWidth, chartUbHeight - 15, "xAxis");
        svg.appendChild(xline);

        for (var yTick of mappedData.yTicks) {
            var yValuesContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
            var yTickLine = svgHelper.drawLineByClass(chartLbWidth - 5, yTick - 15,
                                                      chartLbWidth, yTick - 15,
                                                      "yTick");
            svg.appendChild(yTickLine);

            var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 15,
                                                     chartHeight - yTick + mappedData.yTicks[0], chartWidth,
                                                     "yDiv");
            svg.appendChild(yDivRect);

            if(yValuesContent == 0) {
                xZeroLine = svgHelper.drawLineByClass(chartLbWidth, chartUbHeight - yTick + chartLbHeight - 15, chartUbWidth,
                                              chartUbHeight - yTick + chartLbHeight - 15, "zeroPlane");
                xZeroLine.setAttributeNS(null, "stroke-opacity", 0);
                svg.appendChild(xZeroLine);
                yValuesContent = 0;
            }

            var yValues = svgHelper.drawTextByClass(0 + 50, chartUbHeight - yTick + chartLbHeight - 10,
                                                    yValuesContent, "y-value");
            yValues.setAttributeNS(null, "text-anchor", "end");
            svg.appendChild(yValues);
        }

        var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartUbHeight - 7, 30, chartWidth, "y-title-rect");
        svg.appendChild(yTitleRect);
        var yTitleContent = charts[i].yUnit === "" ?
            charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
        var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartUbHeight + 15, yTitleContent,
                                               "y-title");
        svg.appendChild(yTitle);

        for (var xTick of mappedData.xTicks) {
            var xTickLine = svgHelper.drawLineByClass(xTick, chartLbHeight - 5 - 15, xTick,
                                                      chartLbHeight - 15, "xTick");
            svg.appendChild(xTickLine);

            if (i < chartsInARow) {
                var xValuesContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                var xValues = svgHelper.drawTextByClass(xTick - 13, chartLbHeight - 35,
                                                        xValuesContent, "x-value");
                svg.appendChild(xValues);
            }
        }

        for (var k = 0; k < mappedData.yData.length; k++) {
            if (mappedData.yData[k] !== "") {
                var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                        chartHeight - mappedData.yData[k] + chartLbHeight - 15,
                                        4, "graphCircle");
                anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                // svg.appendChild(anchor);
                var plotWidth = (chartWidth / mappedData.xData.length) - 10;
                if(svg.getElementsByClassName("zeroPlane").length > 0) {
                    var zeroPlaneY = xZeroLine.getAttributeNS(null, "y1");
                    if(charts[i].yData[k] < 0) {
                        var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight - 15 - zeroPlaneY;
                        columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                    } else {
                        columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                        chartUbHeight - mappedData.yData[k] - 15,
                        mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 15, plotWidth,
                        "column-plot");
                    }
                } else {
                    columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                    chartUbHeight - mappedData.yData[k] - 15,
                    mappedData.yData[k], plotWidth,
                    "column-plot");
                }
                columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
                svg.appendChild(columnPlot);
            }
        }
    };

    ColumnChartRenderer.prototype.createCharts = function(charts, height, width) {
        var columnsAreComplete;
        var svgHelper    = new SvgHelper();
        var svgns        = "http://www.w3.org/2000/svg";
        var chartsInARow = Math.floor(window.innerWidth / (width + 55));

        var multiCharts = document.getElementsByClassName("multi-chart");
        if(multiCharts.length % chartsInARow === 0) {
            columnsAreComplete = true;
        } else {
            columnsAreComplete = false;
        }
        for (var i = 0; i < multiCharts.length; i++) {

            var svg = svgHelper.createSvgByClass(height + 55, width + 55, "chart-svg");

            if(columnsAreComplete) {
                this.drawCompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                    svg, height, width);
            } else {
                this.drawIncompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                    svg, height, width);
            }

            // var rect = svgHelper.drawRectByClass(chartLbWidth,chartLbHeight - 55, chartHeight,
            //                                      chartWidth, "chart-rect");
            // rect.setAttributeNS(null, "fill-opacity", 0);
            // svg.appendChild(rect);
            multiCharts[i].appendChild(svg);
            var xValueElements = svg.getElementsByClassName("x-value");
            for(var e = 0; e < xValueElements.length; e++) {
                var rotationPt = svgHelper.getRotationPoint(xValueElements[e]);
                xValueElements[e].setAttributeNS(null, "transform",
                    "rotate(270 " + rotationPt + ")");
            }
            // var yTitleElems  = svg.getElementsByClassName("y-title");
            // for(var elem of yTitleElems) {
            //     var titleRotationPt = svgHelper.getRotationPoint(elem);
            //     elem.setAttributeNS(null, "transform", "rotate(270 " + titleRotationPt + ")");
            // }
        }
    };

    var LineChartRenderer = function(charts, chartProperties) {
        this.charts = charts;
        this.chartProperties = chartProperties;
    };

    LineChartRenderer.prototype.displayCharts = function(height, width) {
        for (var i = 0; i < this.charts.length; i++) {
            var maxY = Math.max.apply(Math, this.charts[i].yData.map(chartUtilities.nullMaxMapper));
            var minY = Math.min.apply(Math, this.charts[i].yData.map(chartUtilities.nullMinMapper));
            if (minY !== Infinity || maxY !== -Infinity) {
                this.charts[i].yTicks = this.chartProperties.calculateYAxis(minY, maxY);
                this.charts[i].xTicks = this.chartProperties.calculateYAxis(0,
                                                                       this.charts[i].xData.length);
                this.createDivs("chart-area");
            }
        }
        this.createCharts(this.charts, height, width);
    };

    LineChartRenderer.prototype.createDivs = function(targetDiv) {
        var div = document.createElement('div');
        div.setAttribute('class', "multi-chart");
        div.style.display = "inline";
        var renderDiv = document.getElementById(targetDiv);
        renderDiv.appendChild(div);
    };

    LineChartRenderer.prototype.createCaptions = function(targetDiv, caption, subCaption) {
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
    LineChartRenderer.prototype.drawCompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width) {

        var mappedCharts = [];
        var chartUbHeight = Math.ceil(height - (0.001 * height)) + 55;
        var chartUbWidth = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.2 * height)) + 55;
        var chartLbWidth = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight = chartUbHeight - chartLbHeight;
        var chartWidth = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                         chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        var yline = svgHelper.drawLineByClass(chartLbWidth, chartLbHeight - 55,
                                              chartLbWidth, chartUbHeight - 55, "yAxis");
        svg.appendChild(yline);

        var xline = svgHelper.drawLineByClass(chartUbWidth, chartUbHeight - 55, chartLbWidth,
                                              chartUbHeight - 55, "xAxis");
        svg.appendChild(xline);

        var yTitleContent = charts[i].yUnit === "" ?
            charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
        var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartLbHeight - 55 - 20, yTitleContent,
                                               "y-title");
        var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartLbHeight - 55 - 40, 30, chartWidth, "y-title-rect");
        svg.appendChild(yTitleRect);
        svg.appendChild(yTitle);

        // if (i === multiCharts.length - 1) {
        //     var xTitleContent = charts[i].xUnit === "" ?
        //         charts[i].xTitle : charts[i].xTitle + " (" + charts[i].xUnit + ")";
        //     var xTitle = svgHelper.drawTextByClass((chartWidth / 2), chartUbHeight + 4,
        //                                            xTitleContent, "x-title");
        //     svg.appendChild(xTitle);
        // }

        for (var xTick of mappedData.xTicks) {
            var xTickLine = svgHelper.drawLineByClass(xTick, chartUbHeight - 55, xTick,
                                                      chartUbHeight + 5 - 55, "xTick");
            svg.appendChild(xTickLine);

            if (i >= multiCharts.length - chartsInARow) {
                var xValuesContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                var xValues = svgHelper.drawTextByClass(xTick - 13, chartUbHeight - 23,
                                                        xValuesContent, "x-value");
                svg.appendChild(xValues);
            }
        }

        for (var yTick of mappedData.yTicks) {
            var yTickLine = svgHelper.drawLineByClass(chartLbWidth - 5, yTick - 55,
                                                      chartLbWidth, yTick - 55,
                                                      "yTick");
            svg.appendChild(yTickLine);

            // var yDivLine = svgHelper.drawLineByClass(chartLbWidth,
            //     height - yTick + 55, chartUbWidth, height - yTick + 55,
            //     "yDiv");
            // svg.appendChild(yDivLine);
            var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
                                                     chartHeight - yTick + mappedData.yTicks[0], chartWidth,
                                                     "yDiv");
            svg.appendChild(yDivRect);

            var yValuesContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
            var yValues = svgHelper.drawTextByClass(0 + 50, chartUbHeight - yTick + chartLbHeight - 50,
                                                    yValuesContent, "y-value");
            yValues.setAttributeNS(null, "text-anchor", "end");
            svg.appendChild(yValues);
        }
        for (var l = 0; l < mappedData.yData.length - 1; l++) {
            var graphLine;
            var c = 0;
            if (mappedData.yData[l + 1] !== "" && mappedData.yData[l] !== "") {
                graphLine = svgHelper.drawLineByClass(mappedData.xData[l] + chartLbWidth,
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
                var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                        chartHeight - mappedData.yData[k] + chartLbHeight - 55,
                                        4, "graphCircle");
                anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                svg.appendChild(anchor);
            }
        }
        var rect = svgHelper.drawRectByClass(chartLbWidth,chartLbHeight - 55, chartHeight,
                                             chartWidth, "chart-rect");
        rect.setAttributeNS(null, "fill-opacity", 0);
        svg.appendChild(rect);
    };
    LineChartRenderer.prototype.drawIncompleteCharts = function(i, charts, multiCharts,
        chartsInARow, svgHelper, svg, height, width) {

        var mappedCharts = [];
        var chartUbHeight = Math.ceil(height - (0.095 * height)) + 55;
        var chartUbWidth = Math.ceil(width - (0.025 * width)) + 55;
        var chartLbHeight = Math.floor(0 + (0.025 * height)) + 55;
        var chartLbWidth = Math.floor(0 + (0.025 * height)) + 55;
        var chartHeight = chartUbHeight - chartLbHeight;
        var chartWidth = chartUbWidth - chartLbWidth;

        var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                             chartLbWidth, charts[i]);
        mappedCharts.push(mappedData);

        var yline = svgHelper.drawLineByClass(chartLbWidth, chartLbHeight - 15,
                                              chartLbWidth, chartUbHeight - 15, "yAxis");
        svg.appendChild(yline);

        var xline = svgHelper.drawLineByClass(chartUbWidth, chartUbHeight - 15, chartLbWidth,
                                              chartUbHeight - 15, "xAxis");
        svg.appendChild(xline);

        for (var yTick of mappedData.yTicks) {
            var yTickLine = svgHelper.drawLineByClass(chartLbWidth - 5, yTick - 15,
                                                      chartLbWidth, yTick - 15,
                                                      "yTick");
            svg.appendChild(yTickLine);

            // var yDivLine = svgHelper.drawLineByClass(chartLbWidth,
            //     height - yTick + 55, chartUbWidth, height - yTick + 55,
            //     "yDiv");
            // svg.appendChild(yDivLine);
            var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 15,
                                                     chartHeight - yTick + mappedData.yTicks[0], chartWidth,
                                                     "yDiv");
            svg.appendChild(yDivRect);

            var yValuesContent = charts[i].yTicks[mappedData.yTicks.indexOf(yTick)];
            var yValues = svgHelper.drawTextByClass(0 + 50, chartUbHeight - yTick + chartLbHeight - 10,
                                                    yValuesContent, "y-value");
            yValues.setAttributeNS(null, "text-anchor", "end");
            svg.appendChild(yValues);
        }

        var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartUbHeight - 7, 30, chartWidth, "y-title-rect");
        svg.appendChild(yTitleRect);
        var yTitleContent = charts[i].yUnit === "" ?
            charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
        var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartUbHeight + 15, yTitleContent,
                                               "y-title");
        svg.appendChild(yTitle);

        // if (i === multiCharts.length - 1) {
        //     var xTitleContent = charts[i].xUnit === "" ?
        //         charts[i].xTitle : charts[i].xTitle + " (" + charts[i].xUnit + ")";
        //     var xTitle = svgHelper.drawTextByClass((chartWidth / 2), chartUbHeight + 4,
        //                                            xTitleContent, "x-title");
        //     svg.appendChild(xTitle);
        // }

        for (var xTick of mappedData.xTicks) {
            var xTickLine = svgHelper.drawLineByClass(xTick, chartLbHeight - 5 - 15, xTick,
                                                      chartLbHeight - 15, "xTick");
            svg.appendChild(xTickLine);

            if(i < chartsInARow) {
                var xValuesContent = charts[i].xData[mappedData.xTicks.indexOf(xTick)];
                var xValues = svgHelper.drawTextByClass(xTick - 13, chartLbHeight - 35,
                                                        xValuesContent, "x-value");
                svg.appendChild(xValues);
            }
        }

        for (var l = 0; l < mappedData.yData.length - 1; l++) {
            var graphLine;
            var c = 0;
            if (mappedData.yData[l + 1] !== "" && mappedData.yData[l] !== "") {
                graphLine = svgHelper.drawLineByClass(mappedData.xData[l] + chartLbWidth,
                                    chartHeight - mappedData.yData[l] + chartLbHeight - 15,
                                    mappedData.xData[l + 1] + chartLbWidth,
                                    chartHeight - mappedData.yData[l + 1] + chartLbHeight - 15,
                                    "graphLine");
                svg.appendChild(graphLine);
            } else if (mappedData.yData[l] !== "") {
                for (var j = l + 2; j < mappedData.yData.length; j++) {
                    l++;
                    c++;
                    if (mappedData.yData[j] !== "") {
                        graphLine = svgHelper
                            .drawLineByClass(mappedData.xData[l - c] + chartLbWidth,
                                    chartHeight - mappedData.yData[l - c] + chartLbHeight - 15,
                                    mappedData.xData[j] + chartLbWidth,
                                    chartHeight - mappedData.yData[j] + chartLbHeight - 15,
                                    "graphLine inferredLine");
                        svg.appendChild(graphLine);
                        break;
                    }
                }
            }
        }

        for (var k = 0; k < mappedData.yData.length; k++) {
            if (mappedData.yData[k] !== "") {
                var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                        chartHeight - mappedData.yData[k] + chartLbHeight - 15,
                                        4, "graphCircle");
                anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
                svg.appendChild(anchor);
            }
        }
        var rect = svgHelper.drawRectByClass(chartLbWidth,chartLbHeight - 15, chartHeight,
                                             chartWidth, "chart-rect");
        rect.setAttributeNS(null, "fill-opacity", 0);
        svg.appendChild(rect);
    };

    LineChartRenderer.prototype.createCharts = function(charts, height, width) {
        var columnsAreComplete;
        var svgHelper = new SvgHelper();
        var svgns = "http://www.w3.org/2000/svg";
        var chartsInARow = Math.floor(window.innerWidth / (width + 55));

        var multiCharts = document.getElementsByClassName("multi-chart");
        if(multiCharts.length % chartsInARow === 0) {
            columnsAreComplete = true;
        } else {
            columnsAreComplete = false;
        }
        for (var i = 0; i < multiCharts.length; i++) {

            var svg = svgHelper.createSvgByClass(height + 55, width + 55, "chart-svg");

            if(columnsAreComplete) {
                this.drawCompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                    svg, height, width);
            } else {
                this.drawIncompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                    svg, height, width);
            }

            multiCharts[i].appendChild(svg);
            var xValueElements = svg.getElementsByClassName("x-value");
            for(var e = 0; e < xValueElements.length; e++) {
                var rotationPt = svgHelper.getRotationPoint(xValueElements[e]);
                xValueElements[e].setAttributeNS(null, "transform",
                    "rotate(270 " + rotationPt + ")");
            }
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

    ChartPropertyCalculator.prototype.dataMapper = function(height, width, lbHeight, lbWidth,
                                                            chart) {
        var yTicks = [];
        var xTicks = [];
        var yData  = [];
        var xData  = [];

        var chartType = chart.type;
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
        // yTicks.push(tickVal);
        if(chartType === "column") {
            var divDiff = Math.floor((width - 80) / (chart.xData.length - 1));
            var tickVal = lbWidth + 40;
            for (var xTick of chart.xData) {
                xTicks.push(tickVal);
                tickVal += divDiff;
            }
            for (var i = 0; i <= xDataMax; i++) {
                var xDataVal = 40;
                var xInterval = (width - 80) / (xDataMax - xDataMin);
                if (i === 0) {
                    xDataVal += xInterval * (i - xTicksMin);
                } else {
                    xDataVal += xInterval * (i - xDataMin);
                }
                xData.push(Math.floor(xDataVal));
            }
        } else {
            var divDiff = Math.floor(width / (chart.xData.length - 1));
            var tickVal = lbWidth;
            for (var xTick of chart.xData) {
                xTicks.push(tickVal);
                tickVal += divDiff;
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

    var EventAgents = function(chartType) {
        this.chartType = chartType;
        this.svgHelper = new SvgHelper();
        if(document.getElementsByClassName("graphCircle")[0]) {
            this.defaultAnchorStroke = getComputedStyle(document.getElementsByClassName("graphCircle")[0]).stroke;
            this.defaultAnchorFill = getComputedStyle(document.getElementsByClassName("graphCircle")[0]).fill;
        }
        if(document.getElementsByClassName("column-plot")[0]) {
            this.defaultPlotFill = getComputedStyle(document.getElementsByClassName("column-plot")[0]).fill;
        }
    };

    EventAgents.prototype.createCrosshair = function(event) {
        var mouseOffset = event.target.getBoundingClientRect().left;
        var crosshairCreation = new CustomEvent("crosshairCreateEvent", {
            "detail": event.clientX - mouseOffset + 71
        });
        for (var rect of document.getElementsByClassName("chart-rect")) {
            rect.dispatchEvent(crosshairCreation);
        }
    };

    EventAgents.prototype.createOtherCrosshairs = function(event) {
        var targetSvgHeight = Number(event.target.getAttributeNS(null, "height"));
        var targetSvgX      = Number(event.target.getAttributeNS(null, "x"));
        var targetSvgY      = Number(event.target.getAttributeNS(null, "y"));
        var crosshair, tooltip, tooltipBg;
        if (targetSvgHeight) {
            crosshair = this.svgHelper.drawLineByClass(event.detail, targetSvgY, event.detail,
                                                       targetSvgHeight + targetSvgY, "otherCrosshair");
            event.target.parentNode.insertBefore(crosshair, event.target);

            tooltipBg = this.svgHelper.drawRectByClass(event.detail, targetSvgHeight, 20, 60,
                                                       "otherTooltipBg");
            tooltipBg.setAttributeNS(null, "rx", 2);
            tooltipBg.setAttributeNS(null, "ry", 2);
            tooltipBg.style.visibility = "hidden";
            event.target.parentNode.insertBefore(tooltipBg, event.target);

            tooltip = this.svgHelper.drawTextByClass(event.detail, targetSvgHeight, "",
                                                     "otherTooltip");
            tooltip.style.visibility = "hidden";
            event.target.parentNode.insertBefore(tooltip, event.target);
        }
    };

    EventAgents.prototype.moveCrosshair = function(event) {
        var mouseOffset = event.target.getBoundingClientRect().left;
        var crosshairMovement = new CustomEvent("crosshairMoveEvent", {
            "detail": event.clientX - mouseOffset + 71
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
        var defaultAnchorStroke = getComputedStyle(anchors[0]).stroke;
        var graphLineBox, graphLineStartX, graphLineStartY, graphLineEndX, graphLineEndY,
            crosshairStartX, crosshairStartY, crosshairEndX, crosshairEndY, crosshairBox,
            crossHairRect,
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
        if(crosshairs[0].getBoundingClientRect().left < anchors[0].getBoundingClientRect().left ||
            crosshairs[0].getBoundingClientRect().right > anchors[anchors.length - 1].getBoundingClientRect().right) {
            tooltips[0].style.visibility = "hidden";
            tooltipBgs[0].style.visibility = "hidden";
            anchors[0].style.stroke = this.defaultAnchorStroke;
            anchors[anchors.length - 1].style.stroke = this.defaultAnchorStroke;
            anchors[0].setAttributeNS(null, "r", 4);
            anchors[anchors.length - 1].setAttributeNS(null, "r", 4);
        } else {
            for (var i = 1; i < anchors.length; i++) {
                graphLineBox    = graphLines[i - 1].getBoundingClientRect();
                graphLineStartX = graphLines[i - 1].getAttributeNS(null, "x1");
                graphLineStartY = graphLines[i - 1].getAttributeNS(null, "y1");
                graphLineEndX   = graphLines[i - 1].getAttributeNS(null, "x2");
                graphLineEndY   = graphLines[i - 1].getAttributeNS(null, "y2");
                anchorData      = anchors[i].getAttributeNS(null, "data-value");
                prevAnchorData  = anchors[i - 1].getAttributeNS(null, "data-value");
                if (chartUtilities.isSvgColliding(graphLineBox, crosshairBox)) {
                    var intersect = chartUtilities.getLineIntersectionPoint(crosshairStartX,
                                                                            crosshairStartY,
                                                                            crosshairEndX,
                                                                            crosshairEndY,
                                                                            graphLineStartX,
                                                                            graphLineStartY,
                                                                            graphLineEndX,
                                                                            graphLineEndY);

                    var interpolatedVal = chartUtilities.getInterpolatedVal(graphLineStartX,
                                                                            prevAnchorData,
                                                                            graphLineEndX,
                                                                            anchorData,
                                                                            intersect.x);
                    tooltips[0].style.visibility = "initial";
                    tooltips[0].setAttributeNS(null, "x", intersect.x + 6);
                    tooltips[0].setAttributeNS(null, "y", intersect.y + 20);
                    tooltips[0].textContent = interpolatedVal;
                    tooltipBgs[0].style.visibility = "initial";
                    tooltipBgs[0].setAttributeNS(null, "x", intersect.x + 4);
                    tooltipBgs[0].setAttributeNS(null, "y", intersect.y + 5);
                    tooltipBgs[0].setAttributeNS(null, "width",
                                                 tooltips[0].getComputedTextLength() + 6);
                }
            }
            for (i = 0; i < anchors.length; i++) {
                anchorBox       = anchors[i].getBBox();
                anchorRect      = anchors[i].getBoundingClientRect();
                chartRect       = event.target.getBoundingClientRect();
                crossHairRect   = crosshairs[0].getBoundingClientRect();
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
                    anchors[i].setAttributeNS(null, "r", 5);
                    anchors[i].style.stroke = "#f15c5c";
                    tooltipBgs[0].setAttributeNS(null, "x", tooltipBgX);
                    tooltipBgs[0].setAttributeNS(null, "y", tooltipBgY);
                    tooltipBgs[0].setAttributeNS(null, "width",
                        tooltips[0].getComputedTextLength() + 6);
                } else {
                    anchors[i].setAttributeNS(null, "r", 4);
                    anchors[i].style.stroke = this.defaultAnchorStroke;
                }
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
        var tooltips   = event.target.parentNode.getElementsByClassName("otherTooltip");
        var anchors    = event.target.parentNode.getElementsByClassName("graphCircle");
        var tooltipBgs = event.target.parentNode.getElementsByClassName("otherTooltipBg");

        for (var crosshair of crosshairs) {
            event.target.parentNode.removeChild(crosshair);
        }
        for(var anchor of anchors) {
            anchor.style.stroke = this.defaultAnchorStroke;
            anchor.setAttributeNS(null, "r", 4);
        }
        for (var tooltip of tooltips) {
            event.target.parentNode.removeChild(tooltip);
        }
        for (var tooltipBg of tooltipBgs) {
            event.target.parentNode.removeChild(tooltipBg);
        }
    };

    EventAgents.prototype.prepPlot = function(event) {
        var mouseLeftOffset = event.target.getBoundingClientRect().left;
        var mouseTopOffset  = event.target.getBoundingClientRect().top;
        var plotx = event.target.getAttributeNS(null, "x");
        var plotHighlight   = new CustomEvent("plotLightEvent", {
            "detail": {
                "mousex"      : event.clientX - mouseLeftOffset + 62,
                "mousey"      : event.clientY - mouseTopOffset + 3,
                "hoveredPlotX": plotx
            }
        });
        for(var plot of document.getElementsByClassName("column-plot")) {
            plot.dispatchEvent(plotHighlight);
        }
    };
    EventAgents.prototype.prepAllPlots = function(event) {
        var tooltip, tooltipBg;
        var targetSvgHeight = Number(event.target.getAttributeNS(null, "height"));
        var targetSvgX      = Number(event.target.getAttributeNS(null, "x"));
        var targetSvgY      = Number(event.target.getAttributeNS(null, "y"));
        if(event.target.getBBox().x == event.detail.hoveredPlotX) {
            event.target.style.fill = "#b94748";
        }
        tooltipBg = this.svgHelper.drawRectByClass(event.detail.mousex, event.detail.mousey, 20, 60,
                                                   "otherTooltipBg");
        tooltipBg.setAttributeNS(null, "rx", 2);
        tooltipBg.setAttributeNS(null, "ry", 2);
        tooltipBg.style.visibility = "hidden";
        event.target.parentNode.appendChild(tooltipBg);
        tooltip = this.svgHelper.drawTextByClass(event.detail.mousex, event.detail.mousey, "",
                                                 "otherTooltip");
        event.target.parentNode.appendChild(tooltip);
    };
    EventAgents.prototype.prepTooltips = function(event) {
        var mouseLeftOffset = event.target.parentNode.getBoundingClientRect().left;
        var mouseTopOffset  = event.target.parentNode.getBoundingClientRect().top;
        var plotx = event.target.getAttributeNS(null, "x");
        var tooltipMovement = new CustomEvent("tooltipMoveEvent", {
            "detail": {
                "mousex": event.clientX - mouseLeftOffset - 15,
                "mousey": event.clientY - mouseTopOffset + 15,
                "hoveredPlotX": plotx
            }
        });
        for (var plot of document.getElementsByClassName("column-plot")) {
            plot.dispatchEvent(tooltipMovement);
        }
    };
    EventAgents.prototype.moveTooltips = function(event) {
        var rectRect   = event.target.getBoundingClientRect();
        var tooltips   = event.target.parentNode.getElementsByClassName("otherTooltip");
        var tooltipBgs = event.target.parentNode.getElementsByClassName("otherTooltipBg");
        var hoverColumnLeft;
        if(event.target.getBBox().x == event.detail.hoveredPlotX) {
            tooltipBgs[0].style.visibility = "initial";
            tooltipBgs[0].setAttributeNS(null, "x", event.detail.mousex);
            tooltipBgs[0].setAttributeNS(null, "y", event.detail.mousey);
            tooltips[0].textContent = event.target.getAttributeNS(null, "data-value");
            tooltips[0].setAttributeNS(null, "x", event.detail.mousex + 5);
            tooltips[0].setAttributeNS(null, "y", event.detail.mousey + 15);
            tooltipBgs[0].setAttributeNS(null, "width", tooltips[0].getComputedTextLength() + 10);
        }
    };
    EventAgents.prototype.unprepPlot = function(event) {
        var unprepAllPlots = new Event("unprepPlotEvent");
        for (var plot of document.getElementsByClassName("column-plot")) {
            plot.dispatchEvent(unprepAllPlots);
        }
    };
    EventAgents.prototype.unprepAllPlots = function(event) {
        if(event.target.style.fill === "rgb(185, 71, 72)") {
            event.target.style.fill = this.defaultPlotFill;
        }
        var tooltips   = event.target.parentNode.getElementsByClassName("otherTooltip");
        var tooltipBgs = event.target.parentNode.getElementsByClassName("otherTooltipBg");
        for (var tooltip of tooltips) {
            event.target.parentNode.removeChild(tooltip);
        }
        for (var tooltipBg of tooltipBgs) {
            event.target.parentNode.removeChild(tooltipBg);
        }
    };

    EventAgents.prototype.dragSelect = function(event) {
        var svg = event.target.parentNode;
        var mouseLeftOffset = svg.getBoundingClientRect().left;
        var mouseTopOffset  = svg.getBoundingClientRect().top;
        var customDragSelect = new CustomEvent("customDragSelect", {
            "detail": {
                "mousex": event.clientX - mouseLeftOffset,
                "mousey": event.clientY - mouseTopOffset
            }
        });
        for(var chartSvg of document.getElementsByClassName("chart-svg")) {
            chartSvg.dispatchEvent(customDragSelect);
        }
    };
    EventAgents.prototype.customDragSelect = function(event) {
        for (var plot of document.getElementsByClassName("column-plot")) {
            plot.style.fill = this.defaultPlotFill;
        }
        for (var anchor of document.getElementsByClassName("graphCircle")) {
            anchor.style.fill = this.defaultAnchorFill;
        }
        event.target.onmousemove = this.expandSelect;
        event.target.onmouseup = this.selectPlots;
        var selectBox = this.svgHelper.drawRectByClass(event.detail.mousex,
            event.detail.mousey, 5, 5, "select-box");
        selectBox.setAttributeNS(null, "fill", "red");
        selectBox.setAttributeNS(null, "fill-opacity", 0.4);
        event.target.appendChild(selectBox);
    };
    EventAgents.prototype.expandSelect = function(event) {
        var svg = event.target.parentNode;
        var mouseLeftOffset = svg.getBoundingClientRect().left;
        var mouseTopOffset  = svg.getBoundingClientRect().top;
        var customExpandSelect = new CustomEvent("customExpandSelect", {
            "detail": {
                "mousex": event.clientX - mouseLeftOffset,
                "mousey": event.clientY - mouseTopOffset
            }
        });
        for(var chartSvg of document.getElementsByClassName("chart-svg")) {
            chartSvg.dispatchEvent(customExpandSelect);
        }
    };
    EventAgents.prototype.customExpandSelect = function(event) {
        var svg = event.target.parentNode;
        var svgRect = svg.getBoundingClientRect();
        var selectBoxes = svg.getElementsByClassName("select-box");
        var columnPlots = event.target.parentNode.getElementsByClassName("column-plot");
        var anchorPlots = event.target.parentNode.getElementsByClassName("graphCircle");
        for(var selectBox of selectBoxes) {
            selectBox.setAttributeNS(null, "width", event.detail.mousex);
            selectBox.setAttributeNS(null, "height", event.detail.mousey);
            for(var columnPlot of columnPlots) {
                if(chartUtilities.isSvgColliding(selectBoxes[0].getBoundingClientRect(),
                    columnPlot.getBoundingClientRect())) {
                    columnPlot.style.fill = "#b94749";
                }
            }
            for(var anchorPlot of anchorPlots) {
                if(chartUtilities.isSvgColliding(selectBoxes[0].getBoundingClientRect(),
                    anchorPlot.getBoundingClientRect())) {
                    anchorPlot.style.fill = "#b94749";
                }
            }
        }
    };
    EventAgents.prototype.selectPlots = function(event) {
        var customSelectPlots = new Event("customSelectPlots");
        for(var chartSvg of document.getElementsByClassName("chart-svg")) {
            chartSvg.dispatchEvent(customSelectPlots);
        }
    };
    EventAgents.prototype.customSelectPlots = function(event) {
        event.target.onmouseup = null;
        event.target.onmousemove = null;
        var selectBoxes = document.getElementsByClassName("select-box");
        console.log(event.target);
        event.target.removeChild(selectBoxes[0]);
    };

    EventAgents.prototype.crosshairHandler = function(svgs) {
        for(var svg of svgs) {
            if(this.chartType === "column") {
                for(var plot of svg.getElementsByClassName("column-plot")) {
                    plot.addEventListener("mouseenter", this.prepPlot);
                    plot.addEventListener("plotLightEvent", this.prepAllPlots.bind(this));
                    plot.addEventListener("mousemove", this.prepTooltips);
                    plot.addEventListener("tooltipMoveEvent", this.moveTooltips.bind(this));
                    plot.addEventListener("mouseleave", this.unprepPlot);
                    plot.addEventListener("unprepPlotEvent", this.unprepAllPlots.bind(this));
                }
            } else if(this.chartType === "line") {
                for (var rect of svg.getElementsByClassName("chart-rect")) {
                    rect.addEventListener("mouseenter", this.createCrosshair);
                    rect.addEventListener("crosshairCreateEvent", this.createOtherCrosshairs.bind(this));
                    rect.addEventListener("mousemove", this.moveCrosshair);
                    rect.addEventListener("crosshairMoveEvent", this.moveOtherCrosshairs.bind(this));
                    rect.addEventListener("mouseleave", this.removeCrosshair);
                    rect.addEventListener("crosshairRemoveEvent", this.removeOtherCrosshairs.bind(this));
                }
            }
            svg.addEventListener("mousedown", this.dragSelect);
            svg.addEventListener("customDragSelect", this.customDragSelect.bind(this));
            svg.addEventListener("customExpandSelect", this.customExpandSelect.bind(this));
            svg.addEventListener("customSelectPlots", this.customSelectPlots.bind(this));
        }
    };

    var data = new Data();
    data.ajaxLoader('res/data/user_data.json', data.dataParser.bind(data));
})(window);
