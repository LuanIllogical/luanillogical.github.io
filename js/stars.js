window.onload = function() {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var starSpawnTick = 0;
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
      
      var particles = {},
          particleIndex = 0;

      function Particle() {
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = Math.floor(Math.random() * canvas.height);

        particleIndex ++;
        particles[particleIndex] = this;
        this.id = particleIndex;
        this.life = 0;
        this.lifeTick = 0;
        this.lifeMax = Math.floor(Math.random() * 20) + 16;
        this.dying = false;
        this.yeaCat = Math.floor(Math.random() * 2) + 5;
      }

      Particle.prototype.draw = function() {
        if (this.life < this.lifeMax && this.dying == false) {
            this.lifeTick++;
            if (this.lifeTick >= 3) {
                  this.life++;
                  this.lifeTick = 0;
            }
        }
        else {
              this.dying = true;
              this.lifeTick++;
              if (this.lifeTick >= 3) {
                    this.life--;
                    this.lifeTick = 0;
            }
        }
        if (this.life <= 0 && this.dying == true) {
          delete particles[this.id];
        }
        context.beginPath();
        context.fillStyle="#ffffff";
        context.moveTo(this.x + this.life, this.y);
        context.lineTo(this.x + (this.life / this.yeaCat), this.y + (this.life / this.yeaCat));
        context.lineTo(this.x, this.y + this.life);
        context.lineTo(this.x -(this.life / this.yeaCat), this.y + (this.life / this.yeaCat));
        context.lineTo(this.x - this.life, this.y);
        context.lineTo(this.x -(this.life / this.yeaCat), this.y - (this.life / this.yeaCat));
        context.lineTo(this.x, this.y - this.life);
        context.lineTo(this.x + (this.life / this.yeaCat), this.y - (this.life / this.yeaCat));
        context.closePath();
        context.fill();
      }

      setInterval(function() {
        starSpawnTick++;
        if (starSpawnTick >= 16 && Math.random() > 0.35) {
              starSpawnTick -= 16;
              new Particle();
        }
        for (var i in particles) {
          particles[i].draw();
        }
      }, 24);
};
