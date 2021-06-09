window.onload = function() {
      // Initialise an empty canvas and place it on the page
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = 800;
      canvas.height = 500;
      document.body.appendChild(canvas);

      // Fill the canvas with a black background to show where it is
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw a square particle on the canvas
      context.fillStyle = "white";
      context.fillRect(300, 200, 10, 10);

      // Draw a circle particle on the canvas
      context.beginPath();
      context.fillStyle = "white";
      // After setting the fill style, draw an arc on the canvas
      context.arc(500, 200, 10, 0, Math.PI*2, true); 
      context.closePath();
      context.fill();
};
