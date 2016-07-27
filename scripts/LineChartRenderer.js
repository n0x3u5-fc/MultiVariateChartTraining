var LineChartRenderer = function(charts, chartProperties) {
    'use strict';
    this.charts = charts;
    this.chartProperties = chartProperties;
};

LineChartRenderer.prototype.displayCharts = function(height, width) {
    'use strict';
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
    'use strict';
    var div = document.createElement('div');
    div.setAttribute('class', "multi-chart");
    div.style.display = "inline";
    var renderDiv = document.getElementById(targetDiv);
    renderDiv.appendChild(div);
};

LineChartRenderer.prototype.createCaptions = function(targetDiv, caption, subCaption) {
    'use strict';
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
    'use strict';
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

    // var yAxis = new YAxis();
    // yAxis.startX = chartLbWidth;
    // yAxis.startY = chartLbHeight - 55;
    // yAxis.endX = chartLbWidth;
    // yAxis.endY = chartUbHeight - 55;
    // yAxis.className = "yAxis";
    // yAxis.render();

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
    'use strict';
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
    'use strict';
    var columnsAreComplete;
    var svgHelper = new SvgHelper();
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