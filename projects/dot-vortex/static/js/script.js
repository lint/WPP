
let stage = null;
let main_layer = null;
let circles = [];
let anim = null;

let stage_center = null;

// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    create_stage();

    test_draw(main_layer);

    animate_circles();
});


// create the stage
function create_stage() {

    let stage_initial_size = 500;

    // get the containers of the stages and their parents
    let stage_container = document.getElementById("stage-container");
    let parent = stage_container.parentElement;

    // get necessary dimensions of the container cells
    let container_width = parent.offsetWidth;
    let container_height = parent.offsetHeight;

    // container_width = 500;
    // container_height = 500;

    // // determine the scale for the stage
    // let scale = Math.min(1, container_height / container_width);
    // if (stage_initial_size < container_width) {
    //     scale *= stage_initial_size / container_width;
    // }

    // // determine offset to place graph in the middle of the stage
    // let main_x_offset = (container_width - container_width * scale) / 2;
    // let main_y_offset = (container_height - container_width * scale) / 2;
    let main_x_offset = container_width / 2;
    let main_y_offset = container_height / 2;

    // create the stages
    stage = new Konva.Stage({
        container: "stage-container",
        width: Math.floor(container_width) - 1, // slightly underestimate size to prevent display bugs
        height: Math.floor(container_height) - 1,
        // scale: {x:scale, y:scale},
        x: main_x_offset,
        y: main_y_offset
    });

    main_layer = new Konva.Layer();
    stage.add(main_layer);

    // calculate the stage center point
    stage_center = {x: 0, y: 0};
}


// animate circles
function animate_circles() {

    let max_duration = 10000; // number of ms for the animation
    let min_duration = 1000;

    // angle to traverse in the duration, in radians.
    let rot_deg = 360 * Math.PI/180; 

    


    anim = new Konva.Animation(function(frame) {
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

        
        for (let i = 0; i < circles.length; i++) {
            let circle = circles[i];
            
            let dist_to_center = calc_dist(circle.position(), stage_center);
            let duration = Math.sqrt((dist_to_center / (stage.height() / 2))) * (max_duration - min_duration) + min_duration;

            let step = ((time - diff) % duration) / duration;
            let angle = step * rot_deg;
            
            
            let pos = calc_point_on_circle(stage_center, dist_to_center, angle);
            // console.log(step, angle, pos, stage_center, circle.position(), time, diff, frame_rate)
            // let pos = circle.position();
            circle.position(pos);
            // circle.radius(5 * Math.sin(step * Math.PI) + 5)

        }

        // anim.stop();

        
    }, main_layer);
    
    anim.start();
}

// draw squares
function test_draw(parent) {

    // let x = 250;
    // let y = 250;

    // let width = Math.random() * 100;
    // let height = Math.random() * 100;

    // let corners = [
    //     {x:x, y:y},
    //     {x:x+width, y:y},
    //     {x:x+width, y:y+height},
    //     {x:x, y:y+height}
    // ];

    // for (let i = 0; i < 50; i++) {

    //     let pos = corners.sample();

    //     let width = rand_in_range(-100, 100);
    //     let height = rand_in_range(-100, 100);

    //     let rect = new Konva.Rect({
    //         x: pos.x,
    //         y: pos.y,
    //         width: width,
    //         height: height,
    //         stroke: "white",
    //         strokeWidth: 5,
    //     });
    
    //     parent.add(rect);
    // }

    // for (let i = 0; i < 50; i++) {

    //     let x = Math.random() * stage.width();
    //     let y = Math.random() * stage.height();
    //     let r = Math.random() * 50;

    //     let hex = new Konva.RegularPolygon({
    //         x: x,
    //         y: y,
    //         sides: 6,
    //         radius: r,
    //         stroke: 'white',
    //         strokeWidth: 4,
    //     });

    //     parent.add(hex);
    // }

    // let num_lines = 25;
    // for (let i = 0; i < num_lines; i++) {

    //     let angle = 360 * Math.PI/180 * (i / num_lines);
    //     let p1 = calc_point_on_circle(stage_center, 25, angle);
    //     let p2 = calc_point_on_circle(stage_center, 500, angle);

    //     let line = new Konva.Line({
    //         points: [p1.x, p1.y, p2.x, p2.y],
    //         stroke: "white",
    //         strokeWidth: 2,
    //         closed: false
    //     });

    //     parent.add(line);
    // }
    
    for (let i = 0; i < 500; i++) {
        
        let x = 0;
        let y = rand_in_range(50, stage.height() / 2 - 50);
        
        // let dist_to_center = calc_dist({x:x, y:y}, stage_center);
        // let r = (1 - (dist_to_center / (stage.height() / 2))) * 25;
        let r = Math.random() * 4;

        let circle = new Konva.Circle({
            x: x,
            y: y,
            radius: r,
            fill: Konva.Util.getRandomColor(),
            // stroke: "white",
            // strokeWidth: 4,
        });

        parent.add(circle);
        circles.push(circle);
    }


}


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
