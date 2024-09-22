const makeGrid = (w, h, val) => {
  let col = [];
  while (col.length < h) col.push(val);
  let output = [col];
  while (output.length < w) {
    output.push([...col]);
  }
  return output;
};
