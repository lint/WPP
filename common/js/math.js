
// add random sampling to arrays
Array.prototype.sample = function() {
    return this[Math.floor(Math.random()*this.length)];
}


// calculate random number in range
function rand_in_range(min, max) {
    return Math.random() * (max - min) + min;
}


// calculate random int in range
function rand_int_in_range(min, max) {
    const min_ceiled = Math.ceil(min);
    const max_floored = Math.floor(max);
    return Math.floor(Math.random() * (max_floored - min_ceiled) + min_ceiled);
}


// get the angle in radians of a point around circle
function calc_angle_around_circle(center, point) {

    let angle = Math.atan2(point.y - center.y, point.x - center.x);

    if (angle < 0) {
        angle += 2 * Math.PI;
    } 

    return angle;
}


// calculate a point around a circle with a given angle
function calc_point_on_circle(center, radius, angle) {
    return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
    };
}


// helper method to calculate the euclidean distance between two points
function calc_dist(p1, p2) {
    return Math.hypot(p2.x-p1.x, p2.y-p1.y);
}


// calculates a midpoint between two given points
function calc_midpoint(p1, p2) {
    return {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
}


// translates a point in the direction of a line by a given length
function calc_point_translation(p, l1, l2, len) {
    let dist = calc_dist(l1, l2);

    return {
        x: p.x + (l2.x - l1.x) / dist * len,
        y: p.y + (l2.y - l1.y) / dist * len
    };
}


// helper method to construct a flat path array from a list of points 
function flatten_points(points) {

    let path = [];

    points.forEach(function (p) {
        path.push(p.x, p.y);
    });

    return path;
}


// returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
function interpolate_color(color1, color2, factor) {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    var result = color1.slice();
    for (var i = 0; i < 4; i++) {
        result[i] = result[i] + factor * (color2[i] - color1[i]);
    }
    return "rgba("+result+")";
}


// function to interpolate between two colors completely, returning an array
function interpolate_colors(color1, color2, steps) {
    let step_factor = 1 / (steps - 1);
    let interpolated_colors = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    for(var i = 0; i < steps; i++) {
        interpolated_colors.push(interpolate_color(color1, color2, step_factor * i));
    }

    return interpolated_colors;
}
