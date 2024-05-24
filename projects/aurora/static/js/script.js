
let stage = null;
let main_layer = null;
let anim = null;
let lines = [];

let num_points = 100;
let max_dist = 1000;

let stage_center = null;

// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    create_stage();

    // initialize the aurora lines and animate them
    initialize_lines();
    animate_stage();
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


// animate the stage
function animate_stage() {

    let num_up_lines = 15;
    let up_dist = 40;
    let colors = interpolate_colors("rgba(0,255,0,1)", "rgba(255,255,255,0.5)", num_up_lines);

    // define the animation
    anim = new Konva.Animation(function(frame) {

        // animation variables
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

        // reset the layer
        main_layer.destroyChildren();

        // iterate over every line object
        for (let li = 0; li < lines.length; li++) {
            let line_data = lines[li];

            // create new shifts to move down the wave
            line_data.shifts = line_data.shifts.map(shift => shift += diff / 50);

            // recalculate the list of points
            let points = [];
            for (let i = 0; i < num_points; i++) {
                
                let x =  max_dist * i / num_points;
                let y = calc_sins(line_data.amps, line_data.periods, line_data.shifts, line_data.multiplier, x);
                
                let point = {
                    x:x,
                    y:y
                };
                points.push(point);
            }
            
            // transform the points
            let trans_points = points.map(point => line_data.transform.point(point));
            line_data.orig_points = points;
            line_data.trans_points = trans_points;

            let shape = new Konva.Line({
                points: flatten_points(trans_points),
                stroke: "white",
                strokeWidth: 2,
                lineJoin: "round"
            });

            main_layer.add(shape);

            // method 1 for generating aurora - create many duplicate lines above base line
            for (let j = 0; j < num_up_lines; j++) {

                let up_points = line_data.trans_points.map(point => {return {x:point.x, y:point.y-(j * up_dist / num_up_lines)}})
                let up_line = new Konva.Line({
                    points: flatten_points(up_points),
                    stroke: colors[j],
                    strokeWidth: 4,
                    lineJoin: "round",
                    lineCap: "round",
                    closed:false,
                });

                main_layer.add(up_line);
            }

            // method 2 for generating aurora - create rects for top and base line, then fill with gradient
            // for (let i = 0; i < trans_points.length -2; i++) {
            //     let point1 = trans_points[i];
            //     let point2 = trans_points[i + 1];
            //     let point3 = trans_points[i + 2];
    
            //     let rect_path = [
            //         {x:point1.x, y:point1.y-num_up_lines},
            //         {x:point2.x, y:point2.y-num_up_lines},
            //         point2,
            //         point1
            //     ];
    
            //     let rect_path2 = [
            //         calc_midpoint({x:point1.x, y:point1.y-num_up_lines}, {x:point2.x, y:point2.y-num_up_lines}),
            //         calc_midpoint({x:point2.x, y:point2.y-num_up_lines}, {x:point3.x, y:point3.y-num_up_lines}),
            //         calc_midpoint(point2, point3),
            //         calc_midpoint(point1, point2)
            //     ];
    
            //     let rect = new Konva.Line({
            //         points: flatten_points(rect_path),
            //         lineJoin: "round",
            //         closed:true,
            //         fillLinearGradientStartPoint: calc_midpoint(rect_path[2], rect_path[3]),
            //         fillLinearGradientEndPoint: calc_midpoint(rect_path[0], rect_path[1]),
            //         fillLinearGradientColorStops: [0, 'rgba(0,255,0,0.90)', 1, 'rgba(255,255,255,0.5)'],
            //     });
            //     main_layer.add(rect);
    
            //     rect = new Konva.Line({
            //         points: flatten_points(rect_path2),
            //         lineJoin: "round",
            //         closed:true,
            //         fillLinearGradientStartPoint: calc_midpoint(rect_path2[2], rect_path2[3]),
            //         fillLinearGradientEndPoint: calc_midpoint(rect_path2[0], rect_path2[1]),
            //         fillLinearGradientColorStops: [0, 'rgba(0,255,0,0.90)', 1, 'rgba(255,255,255,0.6)'],
            //     });
            //     main_layer.add(rect);
            // }
        }   
        
    }, main_layer);
    
    anim.start();
}


// create initial lines
function initialize_lines() {

    let num_lines = 1;
   
    for (let li = 0; li < num_lines; li++) {

        // define sin function variables
        let amps = [2, 0.5];
        let periods = [0.05, 0.1];
        let shifts = [0, 0];
        let mult = 3;
        
        // get points using the sin function
        let points = [];
        for (let i = 0; i < num_points; i++) {
            
            let x = max_dist * i / num_points;
            let y = calc_sins(amps, periods, shifts, mult, x);
            
            let point = {
                x:x,
                y:y
            };
            points.push(point);
        }
        
        // transform the points
        let transform = new Konva.Transform().skew(0, -1).rotate(30 * Math.PI / 180);
        let transformed_points = points.map(point => transform.point(point));

        // store data in an object
        let data = {
            orig_points: points,
            transform: transform,
            trans_points: transformed_points,
            amps: amps,
            periods: periods,
            shifts: shifts,
            multiplier: mult,
        };

        lines.push(data);
    }

}


// calculate a summed sin method with given amplitudes, periodicity factors, and x value
function calc_sins(amps, periods, shifts, a, x) {

    let result = 0;

    // if (amps.length !== periods.length !== shifts.length) {
    //     return result;
    // }

    for (let i = 0; i < amps.length; i++) {
        result += amps[i] * Math.sin(periods[i] * (shifts[i] + x));
    }

    result *= a;

    return result;
}
