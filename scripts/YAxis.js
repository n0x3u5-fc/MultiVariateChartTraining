var YAxis = function(startX, startY, endX, endY, className) {
	'use strict';
	Axis.call(this, startX, startY, endX, endY, className);
};
chartUtilities.inheritsFrom(YAxis, Axis);
YAxis.prototype.renderTicks = function(svg, yTicks) {
	'use strict';
	var tickLength = 5;
	for (var yTick of yTicks) {
        var yTickLine = this.svgHelper.drawLineByClass(this.startX - tickLength, yTick - 55,
        											   this.endX, yTick - 55, "yTick");
        svg.appendChild(yTickLine);
    }
};
YAxis.prototype.renderTickValues = function(svg, yTicks, yData) {
	'use strict';
	for(var yTick of yTicks) {
		var yValuesContent = yData[yTicks.indexOf(yTick)];
        var yValues = this.svgHelper.drawTextByClass(50 - 5, this.endY + this.startY - yTick + 55 + 5,
                                                yValuesContent, "y-value");
        yValues.setAttributeNS(null, "text-anchor", "end");
        svg.appendChild(yValues);
	}
};
YAxis.prototype.renderDivs = function(svg, yTicks, chartHeight, chartLbWidth, chartWidth) {
	'use strict';
	for(var yTick of yTicks) {
		var yDivRect = this.svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
                                                 chartHeight - yTick + yTicks[0], chartWidth,
                                                 "yDiv");
        svg.appendChild(yDivRect);
	}
};
// If ever needed, one can draw div lines instead of div rects by following the code below
// YAxis.prototype.renderDivLines = function() {
	// var yDivLine = svgHelper.drawLineByClass(chartLbWidth,
    //     height - yTick + 55, chartUbWidth, height - yTick + 55,
    //     "yDiv");
    // svg.appendChild(yDivLine);
    // var yDivRect = svgHelper.drawRectByClass(chartLbWidth, yTick - 55,
    //                                          chartHeight - yTick + mappedData.yTicks[0], chartWidth,
    //                                          "yDiv");
    // svg.appendChild(yDivRect);
// };