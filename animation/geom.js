class Vec2 {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  plus(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  minus(other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }
}

function triangleCenter(p1, p2, p3) {
    return new Vec2((p1.x + p2.x + p3.x) / 3, (p1.y + p2.y + p3.y) / 3);
}

function orientationDeterminant(p1, p2, p3) {
  let vec1 = p2.minus(p1);
  let vec2 = p3.minus(p2);
  return vec1.x * vec2.y - vec1.y * vec2.x;
}

function isRightTurn(p1, p2, p3) {
  return orientationDeterminant(p1, p2, p3) < 0;
}

function numPointsInTriangle(stripes, points, p1, p2, p3, color) {
  const sortedByX = [p1, p2, p3];
  sortedByX.sort((a, b) => points[a].x - points[b].x);
  [p1, p2, p3] = sortedByX;
  //console.log(stripes)
  let result = Math.abs(stripes[p1][p2] + stripes[p2][p3] - stripes[p1][p3]);
  if (!isRightTurn(points[p1], points[p3], points[p2]) && points[p2].color === color)
    result -= 1;
  return result;
}

function pCompatible(points, p1, p2, p3) {
  return !isRightTurn(points[p1], points[p2], points[p3]);
}