(function(){
    var canvas=document.getElementById("body");
    var ctx=canvas.getContext("2d");
    var spawnLineY=25;
    var spawnRate=1500;
    var spawnRateOfDescent=0.50;
    var lastSpawn=-1;
    var objects=[];
    var startTime=Date.now();
    animate();
    function spawnRandomObject(){
        var t;
        if(Math.random()<0.50){t="red";}else{t="blue";}
        var object={
            type:t,
            x:Math.random()*(canvas.width-30)+15,
            y:spawnLineY,
        }
        objects.push(object);
    }
    function animate(){
        var time=Date.now();
        if(time>(lastSpawn+spawnRate)){
            lastSpawn=time;
            spawnRandomObject();
        }
        requestAnimationFrame(animate);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
        ctx.moveTo(0,spawnLineY);
        ctx.lineTo(canvas.width,spawnLineY);
        ctx.stroke();
        for(var i=0;i<objects.length;i++){
            var object=objects[i];
            object.y+=spawnRateOfDescent;
            ctx.beginPath();
            ctx.arc(object.x,object.y,8,0,Math.PI*2);
            ctx.closePath();
            ctx.fillStyle=object.type;
            ctx.fill();
        }
    }
});
