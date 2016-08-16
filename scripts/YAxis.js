goog.require("Chart");
;(function() {
    'use strict';
    /**
     * @constructor
     */
    Chart.YAxis = function(startX, startY, endX, endY, className, columnsAreComplete) {
        Chart.Axis.call(this, startX, startY, endX, endY, className, columnsAreComplete);
    };
    Chart.chartUtilities.inheritsFrom(Chart.YAxis, Chart.Axis);
    Chart.YAxis.prototype.renderTicks = function(svg, yTicks) {
        'use strict';
        var tickLength = 5;
        var yTickLine;
        for (var yTick of yTicks) {
            if(this.columnsAreComplete) {
                yTickLine = this.svgHelper.drawLineByClass(this.startX - tickLength, yTick - 55,
                                                           this.endX, yTick - 55, "yTick");
            } else {
                yTickLine = this.svgHelper.drawLineByClass(this.startX - tickLength, yTick - 15,
                                                           this.endX, yTick - 15, "yTick");
            }
            svg.appendChild(yTickLine);
        }
    };
    Chart.YAxis.prototype.renderTickValues = function(svg, yTicks, yData) {
        var yValues;
        for(var yTick of yTicks) {
            var yValuesContent = yData[yTicks.indexOf(yTick)];
            yValuesContent = Chart.chartUtilities.shortenLargeNumber(yValuesContent, 2);
            if(this.columnsAreComplete) {
                if(this.type === "category") {
                    yValues = this.svgHelper.drawTextByClass(50 - 5, yTick - 55 + 5,
                                                             yValuesContent, "y-value");
                } else {
                    yValues = this.svgHelper.drawTextByClass(50 - 5,
                                                             this.endY + this.startY - yTick + 55 + 5,
                                                             yValuesContent, "y-value");
                }
            } else {
                if(this.type === "category") {
                    yValues = this.svgHelper.drawTextByClass(0 + 50,
                                                             this.endY + this.startY - yTick + 15 + 5,
                                                             yValuesContent, "y-value");
                } else {
                    yValues = this.svgHelper.drawTextByClass(0 + 50,
                                                             this.endY + this.startY - yTick + 15 + 5,
                                                             yValuesContent, "y-value");
                }
            }
            yValues.setAttributeNS(null, "text-anchor", "end");
            svg.appendChild(yValues);
        }
    };
    Chart.YAxis.prototype.renderDivs = function(svg, yTicks, chartHeight, chartLbWidth, chartWidth) {
        var yDivRect;
        for(var yTick of yTicks) {
            if(this.columnsAreComplete) {
                yDivRect = this.svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
                                                          chartHeight - yTick + yTicks[0], chartWidth,
                                                          "yDiv");
            } else {
                yDivRect = this.svgHelper.drawRectByClass(chartLbWidth, yTick - 15,
                                                          chartHeight - yTick + yTicks[0], chartWidth,
                                                          "yDiv");
            }
            svg.appendChild(yDivRect);
        }
    };
    Chart.YAxis.prototype.renderZeroPlane = function(svg, yTicks, yData, chartWidth) {
        var xZeroLine;
        for(var yTick of yTicks) {
            var yValuesContent = yData[yTicks.indexOf(yTick)];
            if(yValuesContent == 0) {
                if(this.columnsAreComplete) {
                    xZeroLine = this.svgHelper.drawLineByClass(this.startX,
                                                               this.endY + this.startY - yTick + 55,
                                                               this.startX + chartWidth,
                                                               this.endY + this.startY - yTick + 55,
                                                               "zeroPlane");
                } else {
                    xZeroLine = this.svgHelper.drawLineByClass(this.startX,
                                                               this.endY + this.startY - yTick + 15,
                                                               this.startX + chartWidth,
                                                               this.endY + this.startY - yTick + 15,"zeroPlane");
                }
                xZeroLine.setAttributeNS(null, "stroke-opacity", 100);
                svg.appendChild(xZeroLine);
                yValuesContent = 0;
            }
        }
    };
    // If ever needed, one can draw div lines instead of div rects by following the code below
    // Chart.YAxis.prototype.renderDivLines = function() {
        // var yDivLine = svgHelper.drawLineByClass(chartLbWidth,
        //     height - yTick + 55, chartUbWidth, height - yTick + 55,
        //     "yDiv");
        // svg.appendChild(yDivLine);
        // var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
        //                                          chartHeight - yTick + mappedData.yTicks[0],
        //                                          chartWidth,
        //                                          "yDiv");
        // svg.appendChild(yDivRect);
    // };
})();
