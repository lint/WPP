
// add random sampling to arrays
Array.prototype.sample = function() {
    return this[Math.floor(Math.random()*this.length)];
}


// calculate random number in range
function rand_in_range(min, max) {
    return Math.random() * Math.abs(max - min) + Math.min(min, max);
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


// determines if a 3D point is inside a rectangular prism
function calc_is_point_in_prism(p, r1, r2) {
    let x_min = Math.min(r1.x, r2.x);
    let x_max = Math.max(r1.x, r2.x);
    let y_min = Math.min(r1.y, r2.y);
    let y_max = Math.max(r1.y, r2.y);
    let z_min = Math.min(r1.z, r2.z);
    let z_max = Math.max(r1.z, r2.z);

    return x_min <= p.x && p.x <= x_max 
        && y_min <= p.y && p.y <= y_max 
        && z_min <= p.z && p.z <= z_max;
}


// calculate a sigmoid function with the given inputs
function calc_sigmoid(z, k=1) {
  return 1 / (1 + Math.exp(-z/k));
}


// calculate a vector from one point to another point
function calc_point_sub(p1, p2) {
    return {x:p1.x - p2.x, y:p1.y - p2.y};
}


// calculate an addition of points
function calc_point_add(p1, p2) {
    return {x:p1.x + p2.x, y:p1.y + p2.y};
}


// calculate point times a scalar
function calc_point_mult_scalar(p, s) {
    return {x:p.x*s, y:p.y*s};
}


// calculate vector magnitude
function calc_magnitude(v) {
    return Math.sqrt(v.x*v.x + v.y*v.y);
}


// calculate normal vector
function calc_normalize(v) {
    return calc_point_mult_scalar(v, 1 / calc_magnitude(v));
}


// return a perpendicular unit vector for a given vector
function calc_perpendicular(v) {
    return calc_normalize({
        x: v.y,
        y: -v.x
    });
}


// helper function to calculate the intersection of two lines
function calc_lines_intersection(l1, l2) {

    let v1 = {
        x: l1[1].x - l1[0].x,
        y: l1[1].y - l1[0].y 
    };

    let v2 = {
        x: l2[1].x - l2[0].x,
        y: l2[1].y - l2[0].y 
    };

    let s = (-v1.y * (l1[0].x - l2[0].x) + v1.x * (l1[0].y - l2[0].y)) / (-v2.x * v1.y + v1.x * v2.y);
    let t = ( v2.x * (l1[0].y - l2[0].y) - v2.y * (l1[0].x - l2[0].x)) / (-v2.x * v1.y + v1.x * v2.y);
    
    // intersection detected
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return {
            x: l1[0].x + (t * v1.x),
            y: l1[0].y + (t * v1.y)
        };
    }

    return null;
}


// calculates a new end-point a given distance beyond a given line 
function calc_line_extend_point(l1, l2, len) {
    return calc_point_translation(l2, l1, l2, len);
}


// translates a point in the direction of a line by a given length
function calc_point_translation(p, l1, l2, len) {

    if (points_eq(l1, l2)) {
        return p;
    }


    let dist = calc_dist(l1, l2);

    return {
        x: p.x + (l2.x - l1.x) / dist * len,
        y: p.y + (l2.y - l1.y) / dist * len
    };
}


// helper method to determine equality of floats 
function floats_eq(f1, f2, tol=0.0001) {
    return Math.abs(f1 - f2) < tol
}


// helper method to determine equality of floats
function floats_leq(f1, f2, tol=0.0001) {
    return f1 < f2 || floats_eq(f1, f2, tol);
}


// helper method to determine equality of floats
function floats_geq(f1, f2, tol=0.0001) {
    return f1 > f2 || floats_eq(f1, f2, tol);
}


// helper method to determine if coordinates are equal
function points_eq(p1, p2, tol=0.0001) {
    return floats_eq(p1.x, p2.x, tol) && floats_eq(p1.y, p2.y, tol);
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


// convert hex string to rgb
function hex_to_rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }