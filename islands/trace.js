/**
 * Created with JetBrains WebStorm.
 * User: ozelen
 * Date: 21.03.13
 * Time: 12:20
 * To change this template use File | Settings | File Templates.
 */
IslandFactory.prototype.trace = (function(c){
    var
        c = this.context,
        traceOrder = function(i){
            i = i || 0 ;
            var cc;
            if(cc = v.cells[i]){
                tracePoint(cc.centroid.x, cc.centroid.y, "#f90", i+'');
                setTimeout(function(){traceOrder(i+1)},10);
            } else return;
        },

        //edges = this.map.edges,

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
        };

        return {
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
        };
})();