var Axis = function(startX, startY, endX, endY, className) {
	'use strict';
	this.startX    = startX;
	this.startY    = startY;
	this.endX      = endX;
	this.endY      = endY;
	this.className = className;
	this.svgHelper = new SvgHelper();
};
Axis.prototype.render = function(svg) {
	'use strict';
	var yLine = this.svgHelper.drawLineByClass(this.startX, this.startY, this.endX, this.endY, this.className);
	svg.appendChild(yLine);
};