
let canvas = null;
let ctx = null;

// execute when the document is ready
document.addEventListener("DOMContentLoaded", function() { 

    // get the canvas and it's context
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    load_preset_image("/static/assets/img/rubiks_cube.png")
});


// draw an image on the canvas
function draw_image(img_url) {
    let img = new Image();
    img.onload = function() {

        // reset the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // get drawing dimensions
        let scale = img.width > img.height ? canvas.width / img.width : canvas.height / img.height;
        let width = img.width * scale;
        let height = img.height * scale;
        let offset_x = width < canvas.width ? (canvas.width - width) / 2 : 0;
        let offset_y = height < canvas.height ? (canvas.height - height) / 2 : 0;

        // draw the image on the canvas
        ctx.drawImage(img, offset_x, offset_y, width, height);
    };
    img.src = img_url;
}


// load a preset image
function load_preset_image(img_fn) {

    fetch(img_fn)
    .then(res => res.blob())
    .then(blob => {
        console.log(blob)
        let data_url = URL.createObjectURL(blob)
        draw_image(data_url);
    })
}


// handler for submitting an uploaded image
function submit_uploaded_image(event) {

    let input = event.target;
    let reader = new FileReader();
    reader.onload = function () {
        draw_image(reader.result);
    };
    reader.readAsDataURL(input.files[0]);
}
