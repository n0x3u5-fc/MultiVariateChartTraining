/**
 * @constructor
 */
var BarChartRenderer = function(charts, chartProperties) {
	'use strict';
	this.charts = charts;
    this.chartProperties = chartProperties;
};
BarChartRenderer.prototype.displayHeaders = function(keys) {
    'use strict';
    for(var key of keys) {
        console.log(key);
    }
};
BarChartRenderer.prototype.displayCharts = function(height, width, rowCount) {
    'use strict';
    var maxY = -Infinity, minY = Infinity;
    for (var i = 0; i < this.charts.length; i++) {
        var tempMaxY = Math.max.apply(Math, this.charts[i].yData.map(chartUtilities.nullMaxMapper));
        var tempMinY = Math.min.apply(Math, this.charts[i].yData.map(chartUtilities.nullMinMapper));
        if(tempMaxY > maxY) {
            maxY = tempMaxY;
        }
        if(tempMinY < minY) {
            minY = tempMinY;
        }
        if (minY !== Infinity || maxY !== -Infinity) {
            this.createDivs("chart-area", rowCount);
        }
    }

    for(i = 0; i < this.charts.length; i++) {
        if (minY !== Infinity || maxY !== -Infinity) {
            this.charts[i].yTicks = this.chartProperties.calculateYAxis(minY, maxY);
            this.charts[i].xTicks = this.chartProperties.calculateYAxis(minY, maxY);
        }
    }
    this.createCharts(this.charts, height, width, rowCount);
};
BarChartRenderer.prototype.createDivs = function(targetDiv, rowCount) {
    'use strict';
    var div = document.createElement('span');
    div.setAttribute('class', "multi-chart" + rowCount);
    div.style.display = "inline-block";
    var renderDiv = document.getElementById(targetDiv);
    renderDiv.appendChild(div);
};
BarChartRenderer.prototype.drawCompleteCharts = function(i, charts, multiCharts,
    chartsInARow, svgHelper, svg, height, width, columnsAreComplete) {
    'use strict';
    var columnPlot;
    var mappedCharts  = [];
    var formattedTickValues = [];
    var chartUbHeight = Math.ceil(height);
    var chartUbWidth  = Math.ceil(width);
    var chartLbHeight = Math.floor(0);
    var chartLbWidth  = Math.floor(1);
    var chartHeight   = chartUbHeight - chartLbHeight;
    var chartWidth    = chartUbWidth - chartLbWidth;

    var mappedData = this.chartProperties.dataMapper(chartHeight, chartWidth, chartLbHeight,
                                                     chartLbWidth, charts[i]);
    mappedCharts.push(mappedData);
    var yAxis = new YAxis(chartLbWidth, chartLbHeight, chartLbWidth, chartUbHeight,
                          "yAxis", columnsAreComplete);
    yAxis.type = "category";
    yAxis.render(svg);
    // yAxis.renderTicks(svg, mappedData.xTicks);
    // yAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
    yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

    var xAxis = new XAxis(chartUbWidth, chartUbHeight, chartLbWidth, chartUbHeight,
                          "xAxis", columnsAreComplete);
    xAxis.type = "numeric";
    xAxis.render(svg);
    // xAxis.renderTicks(svg, mappedData.yTicks);
    if (i >= multiCharts.length - chartsInARow) {
        for(var yTick of charts[i].yTicks) {
            formattedTickValues.push(chartUtilities.shortenLargeNumber(yTick, 2));
        }
        // xAxis.renderTickValues(svg, mappedData.yTicks, formattedTickValues);
    }

    var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartLbHeight - 40, 30, chartWidth, "y-title-rect");
    // svg.appendChild(yTitleRect);
    var yTitleContent = charts[i].yUnit === "" ?
        charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
    var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartLbHeight - 20, yTitleContent,
                                           "y-title");
    // svg.appendChild(yTitle);

    for (var k = 0; k < mappedData.yData.length; k++) {
        if (mappedData.yData[k] !== "") {
            var anchor = svgHelper.drawCircleByClass(mappedData.yData[k] + chartLbWidth,
                                    mappedData.xData[k] + chartLbHeight,
                                    4, "graphCircle");
            anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
            // svg.appendChild(anchor);
            var plotHeight = (chartHeight / mappedData.xData.length) - 13;
            if(svg.getElementsByClassName("zeroPlane").length > 0) {
                // var xZeroLine = svg.getElementsByClassName("zeroPlane");
                // var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
                // if(charts[i].yData[k] < 0) {
                //     var columnHeight = chartHeight - mappedData.yData[k] + chartLbHeight - 55 - zeroPlaneY;
                //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                //     zeroPlaneY - 1, columnHeight, plotWidth, "column-plot");
                // } else {
                //     columnPlot = svgHelper.drawRectByClass(mappedData.xData[k] + chartLbWidth - (plotWidth / 2),
                //     chartUbHeight - mappedData.yData[k] - 55,
                //     mappedData.yData[k] - (chartUbHeight - zeroPlaneY) + 55, plotWidth,
                //     "column-plot");
                // }
            } else {
                columnPlot = svgHelper.drawRectByClass(chartLbWidth,
                mappedData.xData[k] + chartLbHeight - (plotHeight / 2),
                plotHeight, mappedData.yData[k],
                "column-plot");
            }
            columnPlot.setAttributeNS(null, "data-value", charts[i].yData[k]);
            svg.appendChild(columnPlot);
        }
    }
};

BarChartRenderer.prototype.drawIncompleteCharts = function(i, charts, multiCharts,
    chartsInARow, svgHelper, svg, height, width, columnsAreComplete) {
    'use strict';
    var columnPlot;
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

    var yAxis = new YAxis(chartLbWidth, chartLbHeight - 15, chartLbWidth, chartUbHeight - 15,
                          "yAxis", columnsAreComplete);
    yAxis.render(svg);
    yAxis.renderTicks(svg, mappedData.yTicks);
    yAxis.renderTickValues(svg, mappedData.yTicks, charts[i].yTicks);
    yAxis.renderDivs(svg, mappedData.yTicks, chartHeight, chartLbWidth, chartWidth);
    yAxis.renderZeroPlane(svg, mappedData.yTicks, charts[i].yTicks, chartWidth);

    var xAxis = new XAxis(chartLbWidth, chartLbHeight - 15, chartLbWidth, chartLbHeight - 15,
                          "xAxis", columnsAreComplete);
    xAxis.render(svg);
    xAxis.renderTicks(svg, mappedData.xTicks);
    if(i < chartsInARow) {
        xAxis.renderTickValues(svg, mappedData.xTicks, charts[i].xData);
    }

    var yTitleRect = svgHelper.drawRectByClass(chartLbWidth, chartUbHeight - 7, 30, chartWidth, "y-title-rect");
    svg.appendChild(yTitleRect);
    var yTitleContent = charts[i].yUnit === "" ?
        charts[i].yTitle : charts[i].yTitle + " (" + charts[i].yUnit + ")";
    var yTitle = svgHelper.drawTextByClass((chartUbWidth / 2) - 15, chartUbHeight + 15, yTitleContent,
                                           "y-title");
    svg.appendChild(yTitle);

    for (var k = 0; k < mappedData.yData.length; k++) {
        if (mappedData.yData[k] !== "") {
            var anchor = svgHelper.drawCircleByClass(mappedData.xData[k] + chartLbWidth,
                                    chartHeight - mappedData.yData[k] + chartLbHeight - 15,
                                    4, "graphCircle");
            anchor.setAttributeNS(null, "data-value", charts[i].yData[k]);
            // svg.appendChild(anchor);
            var plotWidth = (chartWidth / mappedData.xData.length) - 10;
            if(svg.getElementsByClassName("zeroPlane").length > 0) {
                var xZeroLine = svg.getElementsByClassName("zeroPlane");
                var zeroPlaneY = xZeroLine[0].getAttributeNS(null, "y1");
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

BarChartRenderer.prototype.createCharts = function(charts, height, width, rowCount) {
    'use strict';
    var columnsAreComplete;
    var svgHelper    = new SvgHelper();
    var chartsInARow = Math.floor(window.innerWidth / (width));

    var multiCharts = document.getElementsByClassName("multi-chart" + rowCount);
    columnsAreComplete = true;              // since crosstabs always have their columns complete

    this.displayHeaders(charts[0].keys);

    for (var i = 0; i < multiCharts.length; i++) {
        var svg = svgHelper.createSvgByClass(height, width, "chart-svg");

        if(columnsAreComplete) {
            this.drawCompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                svg, height, width, columnsAreComplete);
        } else {
            this.drawIncompleteCharts(i, charts, multiCharts, chartsInARow, svgHelper,
                svg, height, width, columnsAreComplete);
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