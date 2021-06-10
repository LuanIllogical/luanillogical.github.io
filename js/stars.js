window.onresize = function() {
      var canvas = document.getElementById("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
};

window.onload = function() {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      var posX = 20,
          posY = canvas.height / 2;

      // No longer setting velocites as they will be random
      // Set up object to contain particles and set some default values
      var particles = {},
          particleIndex = 0,
          settings = {
            density: 20,
            particleSize: 10,
          };

      // Set up a function to create multiple particles
      function Particle() {
        // Establish starting positions and velocities
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = Math.floor(Math.random() * canvas.height);

        // Add new particle to the index
        // Object used as it's simpler to manage that an array
        particleIndex ++;
        particles[particleIndex] = this;
        this.id = particleIndex;
        this.life = 0;
        this.maxLife = 100;
      }

      // Some prototype methods for the particle's "draw" function
      Particle.prototype.draw = function() {
        // Age the particle
        this.life++;

        // If Particle is old, it goes in the chamber for renewal
        if (this.life >= this.maxLife) {
          delete particles[this.id];
        }

        // Create the shapes
        context.clearRect(settings.leftWall, settings.groundLevel, canvas.width, canvas.height);
        context.beginPath();
        context.fillStyle="#ffffff";
        // Draws a circle of radius 20 at the coordinates 100,100 on the canvas
        context.arc(this.x, this.y, settings.particleSize, 0, Math.PI*2, true); 
        context.closePath();
        context.fill();

      }

      setInterval(function() {
        context.fillStyle = "rgba(10,10,10,0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the particles
        for (var i = 0; i < settings.density; i++) {
          if (Math.random() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            new Particle();
          }
        }

        for (var i in particles) {
          particles[i].draw();
        }
      }, 30);

};
