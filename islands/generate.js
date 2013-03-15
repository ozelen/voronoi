function Island (canvas_id, settings) {
    settings = settings || {};
    var canvas = document.getElementById(canvas_id),
        colors = [],
        cellsNumber = settings.cells || 100,
        pointsImprove = settings.naturalize || 10,
        debugMode = settings.debug || false,
        cells,
        edges,
        verticesIndex = [],
        v = new Voronoi(),
        c = canvas.getContext("2d"),
        w = canvas.width = 500,  // = window.innerWidth,
        h = canvas.height = 500, // = window.innerHeight,
        points = [],

        init = function (new_settings) {
            if(new_settings) for(var i in new_settings){ settings[i]=new_settings[i]; }
            cellsNumber = settings.cells || 100;
            pointsImprove = settings.naturalize || 10;
            debugMode = settings.debug || false;
            redraw({});
            return this;
        },

        constructor = function() {
            seedPoints();
            init();
        },

        mouseX = function (e){	return e.clientX - e.target.offsetLeft;},
        mouseY = function(e){	return e.clientY - e.target.offsetTop; },


        seedPoints = function(){
            for(var i=0; i<cellsNumber; i++) {
                points.push(new Point(Math.random()*w, Math.random()*h));
                colors.push(rndCol());
            }

            for(var i = 0; i<=pointsImprove; i++) {
                improvePoints();
            }
        },

        onMouseMove = function(e) {
            var last = points[points.length-1];
            last.x = mouseX(e);
            last.y = mouseY(e);
            redraw();
        },

        onClick = function(e) {
            var last = points[points.length-1];
            last.x += Math.random();
            last.y += Math.random();
            points.push( new Point(mouseX(e), mouseY(e)));
            colors.push(rndCol());
            redraw();
        },

        resetPoints = function() {
            points = [points[points.length-1]];
            redraw();
        },

        drawPoint = function(x,y,color,text) {
            trace.point(x,y,color,text);
        },

        compute = function() {
            v.Compute(points, w, h);
            edges = v.GetEdges();
            cells = v.GetCells();
        },

        chooseCells = function(settings){
            var chosen = [], j=0;
            // choose polygons within measures
            for(var i in cells) {
                var cell = cells[i];
                var center = cells[i].centroid;
                if(settings.r > center.distance(new Point(settings.x, settings.y), center)){
                    chosen[j++] = i;
                }
            }
            return chosen;
        },


        addIsland = function(island_settings){
            var
                chosen = chooseCells(island_settings),
                i = 0,
                l = 0,
                verticesByCells = [];

            for (i in chosen){
                var cell = cells[chosen[i]];
                var p = cell.vertices;
                if(p.length == 0) continue;
                if(p.length == 4) {
                    //    console.log(cells[i].vs);
                    //    console.log(p);
                }
                c.fillStyle = "#094"; // colors[i];
                c.beginPath();
                c.moveTo(p[0].x, p[0].y);
                for(var j=1; j<p.length; j++) c.lineTo(p[j].x, p[j].y);
                c.closePath();
                c.fill();

                //trace.text("("+i+")", cell.centroid.x+20, cell.centroid.y, "#000");

                for (var f = 0; f < cell.vertices.length; f++){
                    var vertex = cell.vertices[f];

                    var next = (f < cell.vertices.length-1) ? cell.vertices[f+1] : cell.vertices[0];
                    var prev = (f > 0) ? cell.vertices[f-1] : cell.vertices[cell.vertices.length-1];

                    verticesIndex.push({id: verticesIndex.length, next: next, prev: prev, cell: chosen[i], vertex: f, x: vertex.x, y: vertex.y});
                    //console.log(verticesIndex[verticesIndex.length-1]);
                    //drawPoint(vertex.x, vertex.y, "red", f);
                }
            }

            for (var i in cells){
                //trace.text(i, cells[i].centroid.x, cells[i].centroid.y);
            }

            for (var v_i = 0; v_i < verticesIndex.length; v_i++) {
                //console.log(verticesIndex[v_i])
                if(!verticesIndex[v_i]) continue;
                var dubs = [];
                for (var v_j = 0; v_j < verticesIndex.length; v_j++) {
                    if(!verticesIndex[v_j] || !verticesIndex[v_i] || v_i == v_j || verticesIndex[v_i].cell == verticesIndex[v_j].cell) continue;
                    if(verticesIndex[v_i].x == verticesIndex[v_j].x && verticesIndex[v_i].y == verticesIndex[v_j].y){
                        dubs.push(v_j);
                    }
                }
                verticesIndex[v_i].neighbours = dubs.length;

                if(dubs.length == 1) {
                    verticesIndex[v_i].neighbour = verticesIndex[dubs[0]];
                }

                //drawPoint(verticesIndex[v_i].x, verticesIndex[v_i].y, 'red', verticesIndex[v_i].neighbours+'');

            }

            for(var i in verticesIndex){
                if(!verticesIndex[i]) continue;
                //drawPoint(verticesIndex[i].next.x, verticesIndex[i].next.y, 'red', verticesIndex[i].cell);
            }
            return this;
        },

        redraw = function(params){
            c.fillStyle = "#ffffff";
            c.fillRect (0, 0, w, h);
        },

        improvePoints = function(){
            compute();
            for(var i in v.cells){
                points[i] = v.cells[i].centroid;
            }
        },

        rndCol = function() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        },

        showOrder = function(i){
            i = i || 0 ;
            var cc;
            if(cc = v.cells[i]){
                drawPoint(cc.centroid.x, cc.centroid.y, "#ccc")
                setTimeout(function(){showOrder(i+1)},100);
            } else return;
        },

        trace = (function(context){
            var c = context;
            function traceText(text, x, y, color){
                c.textBaseline="middle";
                c.textAlign="center";
                c.fillStyle = color || "#000";
                c.fillText(text, x, y);
            }
            function tracePoint(x, y, color, text) {
                text = text || '';
                var size = text ? 10 : 3;
                c.fillStyle = color;
                c.beginPath();
                c.arc(x, y, size, 0, Math.PI*2, true);
                c.closePath();
                c.fill();
                if(text){
                    c.fillStyle = '#fff';
                    c.fillText(text, x, y);
                }
            }

            function edge(start, end){
                c.lineWidth = 0.1;
                c.strokeStyle = "#000";
                c.beginPath();
                c.moveTo(start.x, start.y);
                c.lineTo(end.x, end.y);
                c.closePath();
                c.stroke();
            }

            function _delaunay(i){

                i = i || 0;
                var e = edges[i];
                if(!e)return;

                c.lineWidth = 0.5;
                c.strokeStyle = "#000";
                var e = edges[i];
                c.beginPath();
                c.moveTo(e.left.x, e.left.y);
                c.lineTo(e.right.x, e.right.y);
                c.closePath();
                c.stroke();
                //redraw();
            }

            function traceEdges (a, b, delay){
                (function recursive(i){
                    var e = edges[i];
                    if(e)
                        edge(e[a], e[b]);
                    if(i < edges.length)
                        if(delay)
                            setTimeout(function(){recursive(i+1)}, delay);
                        else
                            recursive(i+1);
                })(0);
            };

            var api = {
                text        : traceText,
                point       : tracePoint,
                delaunay    : function (){traceEdges('left', 'right')},
                voronoi     : function (){traceEdges('start', 'end')},
                order       : showOrder
            }

        //    if(!debugMode) for(var i in api) { api[i] = function(){}; } // does nothing if !debug

            return api;
        })(c),

        Public = {
            init  : init,
            trace : trace,
            reset : resetPoints,
            add   : addIsland
        };

    constructor();
    return Public;

}