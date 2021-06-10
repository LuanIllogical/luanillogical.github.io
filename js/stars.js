window.onload = function() {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.style.width = window.innerWidth;
      canvas.style.height = window.innerHeight;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      
      window.addEventListener('resize', onresize, false);
      function onresize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
      }
      //Placeholder
      context.fillRect(0, 0, canvas.width, canvas.height);
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
        this.oldScale = 1;

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

        context.clearRect(settings.leftWall, settings.groundLevel, canvas.width, canvas.height);
        context.beginPath();
        context.fillStyle="#ffffff";
        context.moveTo(this.x + Math.round(20 * this.life / this.lifeMax), this.y);
        context.lineTo(this.x, this.y + 20);
        context.lineTo(this.x - 20, this.y);
        context.lineTo(this.x, this.y - 20);   
        context.closePath(); 
        context.fill();
        this.oldScale = 2;
        console.log(Math.round(20 * this.life / this.lifeMax));
      }

      setInterval(function() {
        context.fillStyle = "rgba(10,10,10,0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
 
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

/*
      var particles = {},
          particleIndex = 0;

      function Particle() {
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = Math.floor(Math.random() * canvas.height);

        particleIndex++;
        particles[particleIndex] = this;
        this.id = particleIndex;
        this.life = 0;
        this.maxLife = 100;
        this.dying = false;
      }

      // Some prototype methods for the particle's "draw" function
      Particle.prototype.draw = function() {
        if (this.life < this.maxlife && this.dying == false) {
              this.life++;
        }
        else {
              this.dying = true;
              this.life--;
        }

        // If Particle is old, it goes in the chamber for renewal
        if (this.life <= 0 && this.dying == true) {
          delete particles[this.id];
        }

        // Create the shapes
        context.clearRect(settings.leftWall, settings.groundLevel, canvas.width, canvas.height);
        context.beginPath();
        context.fillStyle="#ffffff";
        //context.arc(this.x, this.y, settings.particleSize, 0, Math.PI*2, true); 
        context.moveTo(this.x + 20, this.y);
        context.lineTo(this.x, this.y + 20);
        context.lineTo(this.x - 20, this.y);
        context.lineTo(this.x, this.y - 20);
        context.closePath();
        context.fill();

      }

      setInterval(function() {
        context.fillStyle = "rgba(10,10,10,0.8)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        new Particle();
        for (var i in particles) {
          particles[i].draw();
        }
      }, 333);
*/
};
