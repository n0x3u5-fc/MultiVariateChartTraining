var chartUtilities = {};

chartUtilities.nullMinMapper = function(val) {
    'use strict';
    return val === "" ? +Infinity : val;
};

chartUtilities.nullMaxMapper = function(val) {
    'use strict';
    return val === "" ? -Infinity : val;
};

chartUtilities.isSvgColliding = function(rectNow, rectNext) {
    'use strict';
    return !(rectNext.left > rectNow.right ||
        rectNext.right < rectNow.left ||
        rectNext.top > rectNow.bottom ||
        rectNext.bottom < rectNow.top);
};

chartUtilities.getLineIntersectionPoint = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    'use strict';
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
    'use strict';
    x1 = Number(x1);
    x2 = Number(x2);
    y1 = Number(y1);
    y2 = Number(y2);
    var interpolatedVal = Math.round((y1 + ((y2 - y1) * ((x - x1) / (x2 - x1)))) * 100) / 100;
    return interpolatedVal;
};

chartUtilities.generateColor = function(color, lum) {
    'use strict';
    lum = Math.abs(lum * 3);
    // validate color string
    color = String(color).replace(/[^0-9a-f]/gi, '');
    if (color.length < 6) {
        color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(color.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00"+c).substr(c.length);
    }
    return rgb;
};

chartUtilities.shortenLargeNumber = function(num, digits) {
    'use strict';
    var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
        decimal;
    for(var i=units.length-1; i>=0; i--) {
        decimal = Math.pow(1000, i+1);

        if(num <= -decimal || num >= decimal) {
            return +(num / decimal).toFixed(digits) + units[i];
        }
    }
    return num;
}

chartUtilities.inheritsFrom = function(child, parent) {
    'use strict';
    child.prototype = Object.create(parent.prototype);
};