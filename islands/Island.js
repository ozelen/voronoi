/**
 * Created with JetBrains WebStorm.
 * User: ozelen
 * Date: 21.03.13
 * Time: 12:06
 * To change this template use File | Settings | File Templates.
 */

function Island(map, settings) {
    this.map = map;
    this.settings = settings;
    this.cells = [];
    this.chosen = this.defineLand(settings);
    this.handleElements(this.chosen);
    this.drawCells(this.chosen);
    this.strokeCoastline();

}


Island.prototype.defineLand = function(settings){
    var
        chosen = [],
        center = new Point(settings.x, settings.y),
        j=0
        ;
    // choose polygons within measures
    for(var i in this.map.cells) {
        var cell = this.map.cells[i];
        if(settings.r > center.distanceTo(cell.centroid)){
            chosen[j++] = i;
            this.cells.push(cell);
        }
    }

    for (i in chosen){
        // linear approach setting altitude, the closer to the center the higher
        cell = this.map.cells[chosen[i]];
        cell.altitude = Math.round(settings.r - center.distanceTo(cell.centroid));
        cell.type = 'land';
    }

    return chosen;
};

Island.prototype.handleElements = function(chosen) {
    var cells = this.map.cells,
        edges = this.map.edges,
        vIndex= this.map.verticesIndex
    ;
    for (var i in chosen){
        var cell  = cells[chosen[i]],
            p     = cell.vertices
            ;
        if(p.length == 0) continue;
        if(p.length == 4) {
            //    console.log(cells[i].vs);
            //    console.log(p);
        }

        for (var f = 0; f < cell.vertices.length; f++){
            var vertex = cell.vertices[f];
            var next = (f < cell.vertices.length-1) ? cell.vertices[f+1] : cell.vertices[0];
            var prev = (f > 0) ? cell.vertices[f-1] : cell.vertices[cell.vertices.length-1];
            vIndex.push({id: vIndex.length, point:vertex, next: next, prev: prev, cell: chosen[i], vertex: f, x: vertex.x, y: vertex.y});
            for(var e = 0; e < edges.length; e++){
                if(
                    (edges[e].start == cell.vertices[f] && edges[e].end == cell.vertices[f+1])
                        ||(edges[e].start == cell.vertices[f] && edges[e].end == cell.vertices[0])
                        ||(edges[e].end == cell.vertices[f] && edges[e].start == cell.vertices[f+1])
                        ||(edges[e].end == cell.vertices[f] && edges[e].start == cell.vertices[0])
                    ) {
                    if(!(function(){ // check duplicates
                        for(var ed in cell.edges){ if(cell.edges[ed] == edges[e]) return true;  }
                        return false;
                    })()) {
                        cell.edges.push(edges[e]);
                        this.addNoise(edges[e]);
                    }
                }
            }

        }
    }

    this.indexNeighbours();
};


Island.prototype.indexNeighbours = function() {
    var vIndex = this.map.verticesIndex;
    for (var v_i = 0; v_i < vIndex.length; v_i++) {
        var dubs = [];
        for (var v_j = 0; v_j < vIndex.length; v_j++) {
            if(!vIndex[v_j] || !vIndex[v_i] || v_i == v_j || vIndex[v_i].cell == vIndex[v_j].cell) continue;
            if(vIndex[v_i].point == vIndex[v_j].point){
                dubs.push(v_j);
            }
        }
        vIndex[v_i].neighbours = dubs.length;
        if(dubs.length == 1) {
            vIndex[v_i].neighbour = vIndex[dubs[0]];
            vIndex[v_i].point.type = 'coast';
            //console.log('coast');
        }
        //drawPoint(verticesIndex[v_i].x, verticesIndex[v_i].y, 'red', verticesIndex[v_i].neighbours+'');
    }
};

Island.prototype.addNoise = function (edge) {
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
};


Island.prototype.drawCell = function(cell, type) {
    var c = this.map.context;
    function reverseRect(r){
        return {
            a:r.d, b:r.c, c:r.b, d:r.a, e:r.f, f:r.e, g:r.i, h:r.h, i:r.g
        }
    }

    var prev_endpoint;
    (function recursive(i){
        var e = cell.edges[i], r = e.rect, reverse = false;
        if(i==0){
            reverse = !((cell.edges[i+1].start == e.end)||(cell.edges[i+1].end == e.end)); // if endpoint isn't common with next edge points, so this is reverse line
            c.beginPath();
            reverse
                ? c.moveTo(e.end.x, e.end.y)
                : c.moveTo(e.start.x, e.start.y);
        }
        else{
            reverse = !(prev_endpoint == e.start);
            reverse
                ? c.lineTo(e.end.x, e.end.y)
                : c.lineTo(e.start.x, e.start.y)
            ;
        }

        prev_endpoint = reverse ? e.start : e.end; // store previous endpoint
        if(r){
            //if(r.a.distanceTo(r.c) < r.h.distanceTo(r.d)){
            reverse
                ? c.bezierCurveTo(r.f.x, r.f.y, r.e.x, r.e.y, r.a.x, r.a.y)
                : c.bezierCurveTo(r.e.x, r.e.y, r.f.x, r.f.y, r.c.x, r.c.y)
            ;
//                } else {
//                    c.bezierCurveTo(r.e.x, r.e.y, r.g.x, r.g.y, r.h.x, r.h.y);
//                    c.bezierCurveTo(r.i.x, r.i.y, r.f.x, r.f.y, r.c.x, r.c.y);
//                }
        } else {
            reverse
                ? c.lineTo(e.start.x, e.start.y)
                : c.lineTo(e.end.x, e.end.y)
        }

        if(i==cell.edges.length-1){
            c.lineWidth = type.lineWidth;
            c.strokeStyle = type.strokeStyle;
            c.fillStyle = type.fillStyle;
            c.closePath();
            c.stroke();
            c.fill();
        }
        if(i < cell.edges.length - 1) recursive(i+1);
    })(0)
};

Island.prototype.strokeCoastline = function() {
    var
        island_cell = {edges: []},
        center = new Point(this.settings.x, this.settings.y)
    ;

    for(var i in this.map.points){
        var point = this.map.points[i];
        if(point.type) console.log('coast');
    }

    /*
    for(var i in this.map.cells){
        var cell = this.map.cells[i];
        for(var j in cell.edges) {
            var edge = cell.edges[j];
            if(edge.left.distanceTo(center) > 150 || edge.right.distanceTo(center) > 150)// console.log('coast');
                this.map.trace.edge(edge.start, edge.end);
        }
    }
    */


    /*
     for(var j in edges){
     var e = edges[j], n = 0;
     for(var k in verticesIndex){
     var v = verticesIndex[k];
     if(v.neighbour && (e.start == v.point || e.end == v.point)){
     n++;
     }
     }
     console.log(n);
     //trace.edge(e.start, e.end);
     if(n==1) {
     island_cell.edges.push(e);
     trace.edge(e.start, e.end);
     }
     //if(cells[j].edges[i].rect.a)
     }

     */
    /*
     drawCell(island_cell, {
     lineWidth   : 10,
     strokeStyle : '#1b1f33',
     fillStyle   : '#1b1f33'
     });
     */

};

Island.prototype.cellStyle = function(altitude){
    var
        m = 200/this.map.cellStyles.length,
        p = Math.round(altitude/m);
    ;
    return p;
};

Island.prototype.drawCells = function(chosen){
    var cells = this.map.cells;
    for(var i in chosen){
        var cc = cells[chosen[i]];
        this.drawCell(cells[chosen[i]], this.map.cellStyles[this.cellStyle(cc.altitude)]);
    }
};