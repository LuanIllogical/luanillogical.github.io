window.onload = function() {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      setInterval(function() {
            context.beginPath();
            context.fillStyle = "white";
            context.arc(Math.floor(Math.random * window.innerWidth), Math.floor(Math.random * window.innerHeight), 10, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
      }, 333);
};
