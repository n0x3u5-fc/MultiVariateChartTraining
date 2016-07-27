var XAxis = function(startX, startY, endX, endY, className) {
	'use strict';
	Axis.call(this, startX, startY, endX, endY, className);
};
chartUtilities.inheritsFrom(XAxis, Axis);
XAxis.prototype.renderTicks = function(svg, xTicks) {
	'use strict';
	var tickLength = 5;
	for (var xTick of xTicks) {
        var xTickLine = this.svgHelper.drawLineByClass(xTick, this.startY, xTick,
        											   this.endY + tickLength, "xTick");
        svg.appendChild(xTickLine);
    }
};
XAxis.prototype.renderTickValues = function(svg, xTicks, xData) {
	'use strict';
	for (var xTick of xTicks) {
        var xValuesContent = xData[xTicks.indexOf(xTick)];
        var xValues = this.svgHelper.drawTextByClass(xTick - 13, this.startY + 32, xValuesContent,
        										"x-value");
        svg.appendChild(xValues);
    }
};