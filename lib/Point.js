

function Point(x, y)
{
	this.x = x;
	this.y = y;
}

Point.prototype.distance = function(a, b)
{
   return(Math.sqrt( (b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y) ));
}

Point.prototype.distanceToNearest = function(points) {
    var nearestDistance;
    for(var i in points){
        var dist = this.distanceTo(points[i]);
        if(!nearestDistance || dist < nearestDistance)
            nearestDistance = dist;
    }
}

Point.prototype.distanceTo = function(point) {
    return this.distance(this, point)
}

Point.prototype.interpolate = function(pt1, pt2, f){
    var x = f * pt1.x + (1 - f) * pt2.x;
    var y = f * pt1.y + (1 - f) * pt2.y;
    return new Point(x, y);
}

Point.prototype.subtract = new function(v){
    if(v)
    return new Point(this.x - v.x, this.y - v.y);
}