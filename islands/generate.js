function IslandFactory (canvas_id, settings) {
    settings = settings || {};
    var canvas = document.getElementById(canvas_id),

        pointsImprove = settings.naturalize || 10,
        debugMode = settings.debug || false,

        MAP = this.map = {
            canvas          : document.getElementById(canvas_id),
            voronoi         : new Voronoi(),
            context         : canvas.getContext("2d"),
            width           : canvas.width = 500,
            height          : canvas.height = 500,
            colors          : [],
            points          : [],
            cells           : [],
            edges           : [],
            verticesIndex   : [],
            cellsNumber     : settings.cells || 100,
            islands         : [],
            trace           : this.trace,
            cellStyles      : [
                {
                    name        : 'TROPICAL SEASONAL FOREST',
                    lineWidth   : 4,
                    strokeStyle : '#a9cca4',
                    fillStyle   : '#a9cca4'
                },

                {
                    name        : 'GRASSLAND',
                    lineWidth   : 4,
                    strokeStyle : '#c4d4aa',
                    fillStyle   : '#c4d4aa'
                },

                {
                    name        : 'TUNDRA',
                    lineWidth   : 4,
                    strokeStyle : '#ddddbb',
                    fillStyle   : '#ddddbb'
                }
            ]
        },

        trace = this.trace,

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

        seed = function(w, h, num){
            var arr = [];
            for(var i=0; i<num; i++) {
                arr.push(new Point(Math.random()*w, Math.random()*h));
            }
            return arr;
        },

        seedPoints = function(){
            MAP.points = seed(MAP.width, MAP.height, MAP.cellsNumber);
            for(var i = 0; i<=pointsImprove; i++) {
                improvePoints();
            }
        },

        resetPoints = function() {
            var points = MAP.points;
            points = [points[points.length-1]];
            redraw();
        },

        compute = function() {
            MAP.voronoi.Compute(MAP.points, MAP.width, MAP.height);
            MAP.edges = MAP.voronoi.GetEdges();
            MAP.cells = MAP.voronoi.GetCells();
        },

        addIsland = function(island_settings){
            MAP.islands.push(new Island(MAP, island_settings));
            return this;
        },

        redraw = function(params){
            MAP.context.fillStyle = "#343a5e";
            MAP.context.fillRect (0, 0, MAP.width, MAP.height);
        },

        improvePoints = function(){
            compute();
            for(var i in MAP.voronoi.cells){
                MAP.points[i] = MAP.voronoi.cells[i].centroid;
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

        Public = {
            init  : init,
            trace : trace,
            reset : resetPoints,
            add   : addIsland,
            v     : MAP.voronoi
        };

    constructor();
    return Public;

}