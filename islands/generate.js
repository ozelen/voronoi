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
                for (var f = 0; f < cell.vertices.length; f++){
                    var vertex = cell.vertices[f];
                    var next = (f < cell.vertices.length-1) ? cell.vertices[f+1] : cell.vertices[0];
                    var prev = (f > 0) ? cell.vertices[f-1] : cell.vertices[cell.vertices.length-1];
                    verticesIndex.push({id: verticesIndex.length, next: next, prev: prev, cell: chosen[i], vertex: f, x: vertex.x, y: vertex.y});
                    for(var e = 0; e < edges.length; e++){
                        if(
                            (edges[e].start == cell.vertices[f] && edges[e].end == cell.vertices[f+1])
                          ||(edges[e].start == cell.vertices[f] && edges[e].end == cell.vertices[0])
                          ||(edges[e].end == cell.vertices[f] && edges[e].start == cell.vertices[f+1])
                          ||(edges[e].end == cell.vertices[f] && edges[e].start == cell.vertices[0])
                            ) {
                            if(!(function(){ // check on duplicates
                                for(var ed in cell.edges){ if(cell.edges[ed] == edges[e]) return true;  }
                                return false;
                            })()) {
                                cell.edges.push(edges[e]);
                                addNoise(edges[e]);
                            }
                        }
                    }

                }

            }

            if(debugMode)
                for (var i in cells){ trace.text(i, cells[i].centroid.x, cells[i].centroid.y); }

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

        addNoise = function (edge) {
            // Convenience: random number in a range
            function random(low, high) {
                return low + (high-low) * Math.random();
            }

            // Interpolate between two points
            function interpolate (p, q, f) {
                var point = new Point(0,0);
                return point.interpolate(p, q, 1.0-f);
            }

            function drawLine (A,B,C,D){

                var
                // Subdivide the quadrilateral
                    p = random(0.3, 0.7),
                    q = random(0.3, 0.7),

                // midpoints
                    E = interpolate(A, D, p),
                    F = interpolate(B, C, p),
                    G = interpolate(A, B, q),
                    I = interpolate(D, C, q),

                // Central point
                    H =  interpolate(E, F, q),
                    s = random(-0.4, 0.4),
                    t = random(-0.4, 0.4)
                    ;

                return {
                    a: A,
                    b: B,
                    c: C,
                    d: D,
                    e: E,
                    f: F,
                    g: G,
                    h: H,
                    i: I
                }
/*
                 return drawLine(A, interpolate(G, B, s), H, interpolate(E, D, t))
                 + drawLine(H, interpolate(F, C, s), C, interpolate(I, D, t));
*/
            }

            edge.rect = drawLine(edge.start, edge.right, edge.end, edge.left);

            return this;
        },

        drawCell = function(cell) {
            function reverseRect(r){
                return {
                    a:r.d, b:r.c, c:r.b, d:r.a, e:r.f, f:r.e, g:r.i, h:r.h, i:r.g
                }
            }


            (function recursive(i){
                var e = cell.edges[i], r = e.rect, reverse = false;
                //console.log(r);
                if(i==0){
                    c.beginPath();
                    c.moveTo(r.a.x, r.a.y);
                }
                else{
                    reverse = !(cell.edges[i-1].rect.c == e.rect.a);
                    reverse
                        ? c.lineTo(r.c.x, r.c.y)
                        : c.lineTo(r.a.x, r.a.y)
                    ;
                }

                //if(r.a.distanceTo(r.c) < r.h.distanceTo(r.d)){
                    reverse
                        ? c.bezierCurveTo(r.f.x, r.f.y, r.e.x, r.e.y, r.a.x, r.a.y)
                        : c.bezierCurveTo(r.e.x, r.e.y, r.f.x, r.f.y, r.c.x, r.c.y)
                    ;
//                } else {
//                    c.bezierCurveTo(r.e.x, r.e.y, r.g.x, r.g.y, r.h.x, r.h.y);
//                    c.bezierCurveTo(r.i.x, r.i.y, r.f.x, r.f.y, r.c.x, r.c.y);
//                }

                if(i==cell.edges.length-1){
                    c.lineWidth = 0.5;
                    c.strokeStyle = 'black';
                    c.stroke();
                }
                if(i < cell.edges.length - 1) recursive(i+1);
            })(0)





        }


        rndCol = function() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        },

        trace = (function(context){
            var
                c = context,
                traceOrder = function(i){
                    i = i || 0 ;
                    var cc;
                    if(cc = v.cells[i]){
                        drawPoint(cc.centroid.x, cc.centroid.y, "#f90", i+'')
                        setTimeout(function(){traceOrder(i+1)},10);
                    } else return;
                },

                traceCell = function(id) {
                    drawCell(cells[id]);
                    /*
                    (function recursive(j){
                        var e = cells[id].edges[j];
                        if(e){

                            edge(e.start, e.end);
                            edge(cells[id].edges[j].left, cells[id].edges[j].right);
                            var mid  = new Point(
                                e.start.x + (e.end.x - e.start.x) / 2 ,
                                e.start.y + (e.end.y - e.start.y) / 2
                            );
                            tracePoint(mid.x, mid.y, "#999", j+'');


                            addNoise(e);
                        }
                        var func = cells[id].edges[j] ? function(){setTimeout(function(){recursive(j+1)}, 500)} : function(){recursive(j+1);};
                        if( j < cells[id].edges.length) func();
                    })(0);
                    */
                },

                traceText = function(text, x, y, color){
                    c.textBaseline="middle";
                    c.textAlign="center";
                    c.fillStyle = color || "#000";
                    c.fillText(text, x, y);
                },

                tracePoint = function(x, y, color, text) {
                    text = text || '';
                    var size = text ? 10 : 3;
                    c.fillStyle = color;
                    c.beginPath();
                    c.arc(x, y, size, 0, Math.PI*2, true);
                    c.closePath();
                    c.fill();
                    if(text) traceText(text, x, y, '#fff');
                },

                edge = function(start, end){
                    //alert(start+ ' ' +end);
                    c.lineWidth = 0.5;
                    c.strokeStyle = "#000";
                    c.beginPath();
                    c.moveTo(start.x, start.y);
                    c.lineTo(end.x, end.y);
                    c.closePath();
                    c.stroke();
                },

                traceEdges = function(a, b, delay){
                    (function recursive(i){
                        var e = edges[i];
                        if(e){
                            edge(e[a], e[b]);
                        }
                        if(i < edges.length)
                            if(delay)
                                setTimeout(function(){recursive(i+1)}, delay);
                            else
                                recursive(i+1);
                    })(0);
                },

                api = {
                    text        : traceText,
                    point       : tracePoint,
                    delaunay    : function (){traceEdges('left', 'right')},
                    voronoi     : function (){traceEdges('start', 'end')},
                    custom      : function (){
                        traceEdges('start', 'right');
                        traceEdges('left', 'end');
                    },
                    edge        : edge,
                    order       : traceOrder,
                    cell        : traceCell
                }
            ;
        //    if(!debugMode) for(var i in api) { api[i] = function(){}; } // does nothing if !debug

            return api;
        })(c),

        Public = {
            init  : init,
            trace : trace,
            reset : resetPoints,
            add   : addIsland,
            v     : v
        };

    constructor();
    return Public;

}