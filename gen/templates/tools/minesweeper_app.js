(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'wrong.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAIRSURBVDhPhZNNaBNBFIC/pH/RVCtSlVBbjW3BnwoqgohQ8SDKhurNFr15U2OlP0LwpB6MVqOIFxHxoBVURHrQpeCl9Sp4UUQq/tRcU0ihadpkk/XN7iSbFYofDPve23lfZiczgXdsthHqRk+BLWEgoNL/UrrzynlWBQojl4agBLWOZRlFN6RRRh2Y4XY3FwKTo8N2xaYYj/fR1KhmQrlQ4KzRz+G9B52VvZx6y5qBQeedYipx2hUcu5byWY37V6QhyKeFLC+yGfIli7LUY6nX7gTBsNIMJUacBcsHQXjiiRMqzEs3yBWX2RcKM9YW5UFHt695Mhl3P01wBRbsinYycbnfSRXTI7fJYbNgWSJM6io8HTzB+d7j1X1xBWWb1vZt2FaRrltDTkkxPTzGBxFVeHwhxsXYANu7dsqPunvvChRWieaW9fxaWsS4m9BFj5+PrvPm5kMO9eyH/KKu1grKJbo2tTG7lIdVIV30iPedgbl5WXpBV1xqBGW6N0T4Lvttnruqix5mpFNHfnwr2LIxwpHkuC7IX/X7izMqmFt7dOThCYpFfvSe1Ik0z37VkSuq8K+kKjCju3Ukx+L5PWhwT2OFlSSOwGztcBJF4VmKj98+Q6hJVzx8Et0TrL0HRjbNgR17yMzPMTMjk9e1QPNa3zAyf/RsOCq91dv4Xl1noaG+nnBoNTk5D0U5hSuhmgH+AtvZsefaHBl+AAAAAElFTkSuQmCC',
  'bigmine.png': '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',
  'icon.png': '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',
  'flag.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAG6SURBVDhPpZPLK0RxFMe/d8xlRAiNUt6N8X6/YjN5LVigZmOykvLIWlIepWzsxB8gbCxsJFnIKAuUSCmvGI+pKZrk2WD8nPu7P5ObqRGf+t5z7jnn972/371daQRg+AfcYHj9EuzDC0kOBt7fRCswkiUZUAyY3aHsgvW0dvLokySx0a4B5l7c41L6ufnlvDczMqXOfBkUmnN5gSVl+DQZEcNSqBZLiiPZJB3bjjKqc+KhOrpwmivrRAa4ve9cHZHROEs044bkIs0lmGDUy0hIzxGTgM+gpriKR8ebB3qeAU+MwU3v5o7kpZyOhKxbJ8Zs3WLim0FVTjGPW54XyDSoYKAYrQtCKOXdznNIF4cY7B1Cm6WR9xV8BgpRxnjsPj9BBi0M0mP18R7ll0cwXJ/CVd0AOjf6re1iWuVrt5yitAzsb65DL8soOTvADm1kZWIe9XllYuInmh2UpGZig3kx7rrCTogBbM0hFqtH8ofGoNSUjQeKfc/3YCuHapGjfDH/aAys9S08Hs+u8fgbNAZ49SA8NAyTC9OiEBitAWGrbcLyll3cBeaHgaWgAidOB2btS6ISAPE7/1Fgn0obtXAUb6MyAAAAAElFTkSuQmCC',
  'face-dead-happy.png': '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',
  'face-happy.png': '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',
  'face-win.png': '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',
  'n8.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAFnSURBVDhPnZMxi8JAEIVfYkQLERQUBO3T2ClYWYgI/mKDFhb+AlECgo2IaKdoY0hi7t5k1/OyXuF9ECY72X0z+3ZjXS6XZLVa4b9Yi8Uiabfbavg5fwocDges12t5fzweqFQq6PV6Mn7FVvEX2+0W3JZlWcjn8/Lcbjd4nqdm/PBWYLPZoFgsYjQaYTAYYDgcwnVd2Lb97EpjCOz3eziOg2azqTIprVYLSZLI1l552wErXa9XNUqhD8wzvmIINBoNiefzWXxgxd1uh/l8Lp3VajX5rjEEuHfCycfjEcvlEr7vS/uk0+lI1BgCdJquB0EgYwrlcjlpvVAoYDabSV7jqPiEE6MokkrValVlU6bTqRztZDLBeDyWnNGBNiq7mPBY9VY0hkAYhlKFQlm+/xv5pn0ixlWm86fTSSZmj4x+3O939Pt9lEolyRllKFav16WTOI7FDz585+Jut/tcTD76G8vlcuaCAV8YOaETqZAj8wAAAABJRU5ErkJggg==',
  'boom.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAIUSURBVDhPnZNPiFJxEMe/+1TQEET3Euy6sLom/RFRAtljy572aAnZLZHQW9ApQrzpKfa0dOog7OYhKzp56SD4KMFOuoH0djPNIqHEiymKvpp5v7dq26kPvPeb38yb+c3Mm99Kv99X6/U6/peVcrmsXone5Y3h+D2vxGAwQDqdhtVqhcFgQCqVEhaN6bXrvC4FIPQg3W4XXq+XZeJPpkKaOxMSvRZP1o02mw12ux2hUAjBYBC1Wo31i87kxxn4fD5Eo1Ec1hVhArYvSPD7/XA4HJjNZmi323j24VRYgYvdFmRZ1jKIx+MoFotY7ZywkXj3a8ZljMdjTCaTJWf6jnSRSEQLUCgU2EDN2ltbZZl49ekbWq0WHr+RhQZ4uLfDmXk8HuRyOS0ANSibzWI6nXKQWx4nf0w8/9gWEnD/xjaXQ1SrVQQCAS0AkUwmee31epAkaSkIEbm0gWaziUajAVVVOTPiLICOoigwmUwoKF+ERoMyMRqN/BB0CK/8Frjdbi7j6HjezNuXN4UEvDjp8OnD4RBOp5bhUoBMJoOf61tipzlTt29urQsN8PL0K2KxmNj9FWD3wSMhab+KajabzZw29UDn3sFTLpU4G6TFCVv70cFoNBI78ERaLBa4XC68/vxdaIG3T/bP3wV9mCqVCkqlEuim0jSGw2H+bYlEAgfyfPTP3cZ8Ps8Tpnf7X9C9uHqH+gD8BsWR33380pBTAAAAAElFTkSuQmCC',
  'mine.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAIMSURBVDhPnVO7ampREF0an1ERMTaCNkGsfCM2JkUQ8gUBxc7OIk1qxcpH6ydY2dj5ARY2QoqgNklEVNBCkBCIQXzunBmPBq/3NnfBPjNzZs/Mmtl7Kz4/P0W328X/QtFsNoXH45HNX3x/fyOXy8FoNOLi4gLZbFb2nOKfCabTKdxut2wBElNZO4VSlmcwm82wWCyIRCIIBoPodDqy5xTHBIlEAuPxmPWnpyfc3t4iFovB7/cjFAohn8/j/v4eGo0G7XYbNpsNb29v+xbK5TJqtRoH39zcYL1eQ6vVQgiB6+trlgqFArvdjpm8vLzwXqfTuWdwCKZhrVYr6PV6DiCMRiPWaSmVSoTDYfh8PrhcLlQqlX0CGlCxWMR2u+UkB6hUKmYzHA4xm82w2WyYBeH5+RmBQOB3Bul0muXHxwdXoopfX1+QWsT7+zvm8zkGgwFeX1+5JWJGODuFXq8HtVrNOklidHV1xTYxokWgIiz5K4MGRm1MJhMOpEHe3d3BarUeqVP1xWIBh8PB9kmCQqHAkq72crk8zuAQTKAhp1Ip2fojAZ2zwWBgnXqnnnU6HSciylSd7Ewmw60eNgp6UI1GQ0imMJlMQtrE+mFJN1LY7XYRjUZP/tfrdXFM0O/3T5ytVkuUSiWRTCbF4+MjF6B98Xic/ZeXl2yfPaZqtYqHh4fjtP8Guo1er1fSgB/xxgFSN/7nogAAAABJRU5ErkJggg==',
  'face-gasp.png': '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',
  'hidden.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALEoAACxKAXd6dE0AAAA1SURBVDhPY3zx4sV/BgoA2IDbt29DuaSBvXv3MjBB2WSDUQNGDQCBUQOAubGhoYGC7MzAAACmlQ7TF3VNNQAAAABJRU5ErkJggg==',
  'pressed.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALEoAACxKAXd6dE0AAAA0SURBVDhPYzx8+PB/BgoA2ABVVVUolzQwffp0BiYom2wwasCoASAwagAwN9bX11OQnRkYAJPcC17GTB+KAAAAAElFTkSuQmCC',
  'face-dead.png': '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',
  'clock.png': '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',
  'n6.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAHuSURBVDhPpZPLTxNRFMa/6YMGMLZoQ0IXZKQuQKhGFzzCFrsw6Ab/ARe60v/ChTvCip0LFhrCjmDcYJQ0oYQEJbQWLI+0IWl8VDvURzqdtuN370yHKbBBf8mZx5l7zvnuuWcUTdPMVCqFf0VJJBJmLBazX8+Px76fYj7/BXff53B97QCDyX1MbebxLFuwvx5zSsH65yImd0uoGg3LodgXUcqk1RrQJvqFU9KiYIFV4+kiqnUTw8EAnl8NYan/EmbUi4i0ea1kPg8epQ+tANKiILSSpUdBNODFxkif9Lm59yGH/UodQa8Hq8NXpM9RsFL4BjSokTanBm1vK4s3VXwcizrBAidB8pfBNwU+r4KH+TJCb3Zon47tXRb32ciTOAmOGlbTfLTM7yoiHX6MdwVwJ9yO3k6/VLZ8pMvEbpwEzYcKu5wcDCNDqa9uqXhxoxdbo31YHQqjjQpFE+MbOXu1K0FdXNgClZUHui9Ln5tr9D2gGsH6z6q8C5wEYXZWkKvUcFD8IZ/dbH/9jrcM9PCUZLNtWo+RjfKziQa30cVzH73gh8G1OgMSZVYVW+CAPeVcPI72yBhHgeAlB8fQuRlWKTHJ65KOZU23ggWmiVmuaQYLzvyZpvcK2PxTQ5kTqTNInMxtTuYTV2CT//wbgb/Q276SN/TzNAAAAABJRU5ErkJggg==',
  'n7.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAC6SURBVDhPrZLtCYUgGIXtTuAigbSB/5pAaIDWcgF3kEAnqL8N0QbezBOGHxTd+4D0HMLDq9Vs2+aWZSFvaYwxrm1bxBf4Aj+FX3t8vM49nz38xH8L9pGyRSnF28g0TbCbCZRSR8kVnxljSDcF4zjCAlprWKRakG7u+550XYcUqf4H6dnTo5wUJ5BSwgLDMMByigXWWlhACAHLKRas6woLcM5hOcWCeZ5h91S/wlOKBf7GnXPHs3b7AUK+SJlkn5BYqNwAAAAASUVORK5CYII=',
  'qmark.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALEoAACxKAXd6dE0AAAEaSURBVDhPpZMhjoQwGIXfkE1QIxFkHAbFDcAhUSAmmRtwBQw4joAeQxCEA5AQErAYNBcguJEg2A3lD0szYbO7fIb3/rYvpf176fv+EydgAV3Xkf0bRVHgg/QbbduiLEtM04Tr9QrXdWmE520HnuehrmtyPFmWQZIkcusOBNIM0zS3xbqu4/l8wvd9CMI6zbZt9t2zBeR5jnEcyQFhGEJRFBY6zzNVwc1Z2AJkWSb1zTAMsCyL3IooiqRWtgBN09hB3e93pGnKao7j4PV6Mb38UlVVTO/hbuHxeJAC4jgmBSRJgtvtRo6HO8Q9URSRwuHihcOA3/JjJzZNw5pIVVWq8Cx9cBhgGAYpHDbWWyP9h9OP6RIEwYnnDHwBPWRyq2Pybi8AAAAASUVORK5CYII=',
  'n5.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAACuSURBVDhPY/zw4cP/y5cvM5ALGA8fPvxfV1cXyiUdoBgwIUAATBMDCjZ8ANNMYJICQLEBWL0Acx4xgAVKYwBc4YFuOFYv4AtMkBzL/59QHoEwEFPUBdsIwsKyGlBRBoaeQHEoi8R0sDjXguHt4xtgds2uHwxfvv0gLRZiJ5+AshjAmkEAxQCQ/0AYZBM2gE2cuikROaDwAeSoRDEA5MfaPX9wGgQSR08HFOZGBgYAAkBOCdhK3cUAAAAASUVORK5CYII=',
  'n4.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAACSSURBVDhPY/zw4cP/y5cvM5ALGA8fPvxfV1cXyiUdMEFpnMDCYgIcYwN4DUDXxMvLC2UhAE4DsNn4/fsfKAsBsBqAy7mMjFAGEsAwAFlzSoo1lAUBv39/h7IQAG4AGxsniub2dn+gAaZQHm4Aj0ZczsYFTpwoANN4Y4EYQLEBBFMistdgzkYGA+8F2ocBfsDAAAC4UC0Smu4lqwAAAABJRU5ErkJggg==',
  'n0.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAAxSURBVDhPY/zw4cP/y5cvM5ALGA8fPvxfV1cXyiUdMEFpssGoAaMGgMCoARQbwMAAACVQCjY4hL5JAAAAAElFTkSuQmCC',
  'n1.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAABoSURBVDhPY/zw4cP/y5cvM5ALGA8fPvxfV1cXyiUdMEFprMBzCj8c4wI4DcCnCRlgNYBYzSCA1wvEAKwGbM/5CMbEANq4gBQwDAzAmpTxpQP02BmkXuDi4mdgQjP6/38I/vYN2QsMDABKOySWGfX8UgAAAABJRU5ErkJggg==',
  'n3.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAAHwSURBVDhPnZM9aBRBFMd/s3e3JubOnIEkmgREY5rAGrAIWAQLsbHxo5M0WqTSwspGCwVBbGKR+JEiWAlKJMh1ogTkWpPmIIWCIMTP3JHz7pLc3d7OODc3aHYvhfqD3Zn35r03b2b/K4rFosrlcvwvIpvNKs/zrPnvxO0YovzqNe6zFzhrn6ERgO8jR4YJxjz2Xrtqo1q0dbB98zZ7Zh+jUilEvQ5S6m3iKNc1c1Gr4fz4ZKPBsaOhtLyikx+iensJjo+xOf+ISmaBrfv3kEODulAM1bMfOTBsMyIdBEdGEcWfCFnVY8H4dlK/eInYuxXEeh6n+MX4Qh00UeluZE+/tcI47z/oXRqogYPWEykQ+7j6+2lSvX6DYGiE4KiH7DuEKJVMcmx12aw3aetgJ8pNICplxMYG6DlODPH1u11tESpQeZmh/GbJWtB555Y+6zecwhqbczOmIErhT5y2EZFLVOm0fsepPJkndf6s8UWRBw4jqhV9yevGjhwhgewfpGN61tph/FNnUMkufcl91hNRYm1yEncxgxMENI6NE5wY19/ON0pMLL3F6exAFPJszT0gaXPalFibukJiYRHVvQ8RSJRo+c1cq3F7+i7JC+daTs2uP1NTke7T54h8QcvZR2kFNk5O0DV12Ub8YdcCfw/8AiZewYZ0Su9zAAAAAElFTkSuQmCC',
  'n2.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAADmSURBVDhPY/zw4cP/y5cvM5ALGA8fPvxfV1cXyiUdYDUgdHcow+Ovj6E8BPj7/y/D6cDTUB4EMEFpOLDYYIFVMwgwMzIzNJxpgPIgAMUAdMkTASfgGAZ2PNkBZUEAigHIksiaQCBRLRHKQgUYXsAFJLkkoSxUQHQsgMIGBpBdh9cFNz/cZOi/3I+iOVAhEMqCAKwuOPLiCEPN6RqGH39/QEUggIOZg+GA7wEoDwIwXACyseRECYpmKS4phiT1JAzNIIDhAmTn+sv7M1QaVkJ52AGKAcia8QGiA5EYQLEBRKcD7ICBAQD85mDJg92bPQAAAABJRU5ErkJggg==',
});

const SIZES = {
  EASY: [12, 7],
  MEDIUM: [16, 16],
  HARD: [30, 16],
};

const HEADER_HEIGHT = 48;
const TILE_SIZE = 16;

const MINE_COUNT = {
  // TODO: verify these numbers
  EASY: 10,
  MEDIUM: 40,
  HARD: 99,
};
const initializeGame = (game) => {
  let slots = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.cols; x++) {
      game.grid[x][y] = {
        count: null, // lazy init
        hasMine: false,
        state: 'HIDDEN', // HIDDEN | FLAGGED | CLEARED
      };
      slots.push([x, y]);
    }
  }

  for (let i = 0; i < slots.length; i++) {
    let j = Math.floor(slots.length * Math.random());
    let t = slots[i];
    slots[i] = slots[j];
    slots[j] = t;
  }

  let mineCount = MINE_COUNT[game.difficulty];
  for (let i = 0; i < mineCount; i++) {
    let [x, y] = slots[i];
    game.grid[x][y].hasMine = true;
  }
  game.minesTotal = mineCount;
};

let safetySwap = (game, x, y) => {
  let choices = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.cols; x++) {
      if (!game.grid[x][y].hasMine) {
        choices.push([x, y]);
      }
    }
  }
  let [tx, ty] = choices[Math.floor(Math.random() * choices.length)];
  game.grid[tx][ty].hasMine = true;
  game.grid[x][y].hasMine = false;
};

let propagateClick = (game, x, y) => {
  let visited = {};
  let q = [[x, y]];
  let { cols, rows } = game;
  let neighbors = [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1], [0, -1], [0, 1]];
  while (q.length) {
    let current = q.pop();
    if (getCellCount(game, ...current) === 0) {
      for (let [ox, oy] of neighbors) {
        let nx = current[0] + ox;
        let ny = current[1] + oy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) {
          let k = `${nx}:${ny}`;
          if (!visited[k]) {
            let xy = [nx, ny];
            visited[k] = xy;
            q.push(xy);
          }
        }
      }
    }
  }
  Object.values(visited).forEach(xy => {
    let cell = game.grid[xy[0]][xy[1]];
    if (cell.state === 'HIDDEN') {
      cell.state = 'SHOWN';
    }
  });
};

let setCellState = (game, cell, newState) => {
  if (cell.state === newState) return;
  if (cell.state === 'FLAGGED') game.minesMarked--;
  if (newState === 'FLAGGED') game.minesMarked++;
  cell.state = newState;
};

let applyClick = (game, x, y, isRightClick) => {
  if (game.state === 'NOT_STARTED') {
    game.state = 'PLAYING';
    if (game.grid[x][y].hasMine) {
      safetySwap(game, x, y);
    }
    game.startTime = Util.getTime();
    // TODO: animate timer
  }
  if (game.state !== 'PLAYING') return;

  let cell = game.grid[x][y];

  if (isRightClick) {
    if (cell.state === 'HIDDEN') {
      cell.state = 'FLAGGED';
      game.minesMarked++;
      updateHeader(game);
      cell.wasClicked = true;
    } else if (cell.state === 'FLAGGED') {
      cell.state = 'QMARK';
      game.minesMarked--;
      updateHeader(game);
      cell.wasClicked = false;
    } else if (cell.state === 'QMARK') {
      cell.state = 'HIDDEN';
      cell.wasClicked = false;
    }
  } else if (cell.state !== 'HIDDEN') {
    return;
  } else if (cell.hasMine) {
    cell.wasClicked = true;
    game.state = 'FAIL';
    game.timeFinished = Util.getTime();
  } else {
    cell.state = 'SHOWN';
    cell.wasClicked = true;
    if (getCellCount(game, x, y) === 0) {
      propagateClick(game, x, y);
    }
  }

  if (game.state === 'PLAYING') {

    let cleared = 0;

    for (let x = 0; x < game.cols; x++) {
      for (let y = 0; y < game.rows; y++) {
        cell = game.grid[x][y];
        if (cell.state === 'SHOWN' && !cell.hasMine) {
          cleared++;
        }
      }
    }

    if (cleared + game.minesTotal === game.cols * game.rows) {
      game.state = 'WIN';
      game.timeFinished = Util.getTime();
    }
  }
};

const createGameUi = (difficulty, newGameCb, szOut, onFlagBtnPushed, isFlagModeEnabled) => {
  const { button, div, span } = HtmlUtil;
  let [cols, rows] = SIZES[difficulty];
  let canvas = createCanvas(TILE_SIZE * cols, TILE_SIZE * rows);

  let game = {
    difficulty,
    cols,
    rows,
    startTime: null,
    grid: makeGrid(cols, rows),
    canvas,
    pressed: null,
    state: 'NOT_STARTED',
    remainingHost: span(),
    timeHost: span(),
    minesMarked: 0,
    minesTotal: 0,
    startTime: Util.getTime(),
    newGameBtn: button(':)', () => newGameCb()),
    timeFinished: null,
  };

  initializeGame(game);

  render(game);

  let getCoord = (e) => {
    let rect = game.canvas.getBoundingClientRect();
    let x = e.pageX - rect.left;
    let y = e.pageY - rect.top;
    let col = Math.floor(x / TILE_SIZE);
    let row = Math.floor(y / TILE_SIZE);
    if (col < 0 || row < 0 || col >= game.cols || row >= game.rows) return null;
    return [col, row];
  };

  let initialPress = null;

  canvas.addEventListener('pointerdown', e => {
    if (game.state === 'FAIL' || game.state === 'WIN') return;
    e.preventDefault();
    let xy = getCoord(e);
    if (!xy) return;
    let [x, y] = xy;
    initialPress = xy;
    game.pressed = xy;

    render(game);
    updateHeader(game);
  });
  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    game.pressed = null;
    if (!initialPress) return;
    let xy = getCoord(e);
    if (!xy) return;
    let [x, y] = xy;
    initialPress = null;
    applyClick(game, x, y, e.button === 2 || isFlagModeEnabled());
    onFlagBtnPushed(false);
    render(game);
    updateHeader(game);
  });
  canvas.addEventListener('pointermove', e => {
    e.preventDefault();
    if (!initialPress) return;
    let xy = getCoord(e);
    if (!xy) {
      game.pressed = null;
      return;
    }
    let [x, y] = xy;
    game.pressed = (x === initialPress[0] && y === initialPress[1]) ? xy : null;

    render(game);
  });
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

  let uiWidth = TILE_SIZE * cols;
  let uiHeight = TILE_SIZE * rows + HEADER_HEIGHT;

  szOut[0] = uiWidth;

  updateHeader(game);

  let mineImg = Util.copyImage(APP_RAW_IMAGE_DATA['bigmine.png'].canvas);
  let timeImg = Util.copyImage(APP_RAW_IMAGE_DATA['clock.png'].canvas);

  game.mineBtn = button(
    Util.copyImage(APP_RAW_IMAGE_DATA['flag.png'].canvas).set({ size: 24, userSelect: 'none', pointerEvents: 'none' }),
    () => onFlagBtnPushed(),
    { backgroundColor: '#fff' });
  let output = div(
    {
      position: 'absolute',
      size: [uiWidth, uiHeight],
    },
    div(
      { northDock: HEADER_HEIGHT },
      div(
        {
          position: 'absolute',
          top: 10,
          width: 100,
        },
        mineImg.set({ size: 24 }), ' ', game.remainingHost.set({ position: 'relative', top: -4 }),
      ),
      div(
        {
          position: 'absolute',
          left: '40%',
          width: 0,
          top: 2,
        },
        game.newGameBtn.set({ position: 'absolute', left: -15, padding: 4, boxSizing: 'border-box', paddingBottom: 2 }),
      ),
      div(
        {
          position: 'absolute',
          right: 0,
          top: 10,
          width: 120,
          textAlign: 'right',
        },
        timeImg.set({ size: 16 }), ' ', game.timeHost,
        game.mineBtn.set({ padding: 2, boxSizing: 'border-box', marginLeft: 3 }),
      ),
    ),
    canvas.set({ position: 'absolute', top: HEADER_HEIGHT, width: '100%' })
  );

  output.GAME_INSTANCE = game;

  return output;
};

let getFaceImage = (game, type) => {
  if (!game.cachedFaces) game.cachedFaces = {};
  if (!game.cachedFaces[type]) {
    let file = 'face-' + type.toLowerCase() + '.png';
    let img = Util.copyImage(APP_RAW_IMAGE_DATA[file].canvas);
    img.set({ size: 25, userSelect: 'none', pointerEvents: 'none' });
    game.cachedFaces[type] = img;
  }
  return game.cachedFaces[type];
};

let updateHeader = (game) => {
  let mines = game.minesTotal - game.minesMarked;
  let renderedRemaining = mines >= 0
    ? Util.ensureNumLen(mines, 3)
    : ('-' + Util.ensureNumLen(mines, 2));
  if (game.lastRenderedMines !== renderedRemaining) {
    game.remainingHost.innerText = renderedRemaining;
    game.lastRenderedMines = renderedRemaining;
  }

  let end = game.timeFinished || Util.getTime();
  let timeRemaining = Math.floor(end - game.startTime);
  let mins = Math.floor(timeRemaining / 60);
  let secs = timeRemaining - mins * 60;
  let renderTime = mins + ':' + Util.ensureNumLen(secs, 2);
  if (game.state === 'NOT_STARTED') renderTime = '0:00';
  if (game.lastRenderedTime !== renderTime) {
    game.lastRenderedTime = renderTime;
    game.timeHost.innerText = renderTime;
  }

  let expectedFace;
  if (game.state === 'FAIL') expectedFace = 'DEAD';
  else if (game.state === 'WIN') expectedFace = 'WIN';
  else if (game.pressed) expectedFace = 'GASP';
  else expectedFace = 'HAPPY';
  let faceImg = getFaceImage(game, expectedFace);
  if (game.newGameBtn.firstChild !== faceImg) {
    game.newGameBtn.clear().set(faceImg);
  }
};

const getCellCount = (game, x, y) => {
  if (x < 0 || y < 0 || x >= game.cols || y >= game.rows) throw new Error();
  let cell = game.grid[x][y];
  if (cell.count !== null) return cell.count;
  if (cell.hasMine) throw new Error();

  let left = Math.max(0, x - 1);
  let right = Math.min(game.cols - 1, x + 1);
  let top = Math.max(0, y - 1);
  let bottom = Math.min(game.rows - 1, y + 1);

  let total = 0;
  for (let col = left; col <= right; col++) {
    for (let row = top; row <= bottom; row++) {
      total += +game.grid[col][row].hasMine;
    }
  }
  cell.count = total;
  return total;
};
const createCanvas = (w, h) => {
  let canvas = HtmlUtil.canvas();
  canvas.width = w;
  canvas.height = h;
  return canvas.set({ size: [w, h] });
};

const render = (game) => {
  let { grid, cols, rows, canvas } = game;
  let g = canvas.getContext('2d');
  let cell;
  let palette = APP_RAW_IMAGE_DATA;
  let nums = [];
  for (let i = 0; i <= 8; i++) {
    nums.push(palette['n' + i + '.png'].canvas);
  }
  let images = {
    hidden: palette['hidden.png'].canvas,
    flag: palette['flag.png'].canvas,
    qmark: palette['qmark.png'].canvas,
    mine: palette['mine.png'].canvas,
    wrong: palette['wrong.png'].canvas,
    boom: palette['boom.png'].canvas,
    pressed: palette['pressed.png'].canvas,
    nums,
  };

  let img;
  let overrideState = (game.state === 'FAIL' || game.state === 'WIN') ? 'SHOWN' : null;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cell = grid[x][y];
      switch (overrideState || cell.state) {
        case 'HIDDEN':
          img = images.hidden;
          if (game.pressed && game.pressed[0] === x && game.pressed[1] === y) {
            img = images.pressed;
          }
          break;
        case 'FLAGGED':
          img = images.flag;
          break;
        case 'SHOWN':
          if (cell.hasMine) {
            img = images.mine;
            if (cell.state === 'FLAGGED') img = images.flag;
            else if (cell.wasClicked) img = images.boom;
          } else {
            img = images.nums[cell.count === null ? getCellCount(game, x, y) : cell.count];
            if (cell.state === 'FLAGGED') img = images.wrong;
          }
          break;
        case 'QMARK':
          img = images.qmark;
          break;
        default:
          throw new Error();
      }
      g.drawImage(img, x * TILE_SIZE, y * TILE_SIZE);
    }
  }
};
const makeGrid = (w, h, val) => {
  let col = [];
  while (col.length < h) col.push(val);
  let output = [col];
  while (output.length < w) {
    output.push([...col]);
  }
  return output;
};
const TITLE = "Minesweeper";
const APP_ID = 'io.plexi.apps.minesweeper';

const APP_MAIN = async (os, procInfo, args) => {
  const { div } = HtmlUtil;
  const { pid } = procInfo;

  const WAT = 2; // There's a rogue 1-pixel border being added to the window chrome somewhere and I don't know how to get rid of it.

  let resizer = null;
  let tryCloseWindow = Util.noop;
  let settings = os.AppSettings.getScope(APP_ID);
  let mobileFriendlyEnabled = await settings.getBoolean('mobilefriendly');
  let flagButtonPushed = false;
  let toggleFlagButton = (optValue) => {
    flagButtonPushed = optValue === undefined ? !flagButtonPushed : !!optValue;
    refreshMineButton();
  };

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let sz = [0, 0];

  let currentDifficulty = 'MEDIUM';

  let getSize = () => {
    let [cols, rows] = SIZES[currentDifficulty];
    let width = cols * TILE_SIZE + 16 + WAT;
    let height = rows * TILE_SIZE + HEADER_HEIGHT + 16 + WAT;
    return [width, height];
  };

  let game = null;
  let createGame = () => {
    let gameUi = createGameUi(currentDifficulty, createGame, sz, toggleFlagButton, () => flagButtonPushed);
    game = gameUi.GAME_INSTANCE;
    if (resizer) resizer(...getSize());
    content.clear().set(gameUi);
    refreshMineButton();
  };

  let refreshMineButton = () => {
    game.mineBtn.style.display = mobileFriendlyEnabled ? 'inline-block' : 'none';
    game.mineBtn.set({ backgroundColor: flagButtonPushed ? '#f00' : '#fff' });
  };

  let content = div({
    fullSize: true,
    backgroundColor: '#ccc',
    color: '#000',
    padding: 8,
    overflow: 'hidden',
  });

  let actions = {
    newGame: () => createGame(),
    showScores: () => console.log("TODO: score tracking"),
    exit: () => tryCloseWindow(),
    setDifficulty: lvl => { currentDifficulty = lvl; createGame(); },
    howToPlay: () => {
      os.Shell.showWindow(pid, {
        title: TITLE + ': ' + "How to Play",
        menuBuilder: (id) => buildMenu(os, id),
        innerWidth: 350,
        innerHeight: 500,
        onInit: (contentHost, winData) => {
          contentHost.set(div(
            {
              fullSize: true,
              overflowX: 'hidden',
              overflowY: 'auto',
              backgroundColor: '#fff',
            },
            div({ padding: 10 }, generateHowToPlay())
            )
          );
        },
      });
    },
    about: () => console.log("TODO: about minesweeper"),
    toggleSound: () => console.log("TODO: sound"),
  };

  let buildMenu = (os, idChain) => {
    let {
      createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
    } = os.Shell.MenuBuilder;

    switch (idChain.join('|')) {
      case '':
        return createMenu(
          createMenuItem('game', '_Game'),
          createMenuItem('settings', '_Settings'),
          createMenuItem('help', '_Help'),
        );

      case 'game':
        return createMenu(
          createMenuItem('new', '_New').withShortcut('F2'),
          createMenuItem('scores', '_High Scores'),
          createMenuItem('exit', '_Exit'),
        );
      case 'settings':
        return createMenu(
          createMenuItem('easy', '_Easy').withShortcut('CTRL', '1'),
          createMenuItem('intermediate', '_Intermediate').withShortcut('CTRL', '2'),
          createMenuItem('hard', '_Hard').withShortcut('CTRL', '3'),
          createMenuSep(),
          createMenuItem('minebtn', mobileFriendlyEnabled ? "Disable mobile-friendly button" : "Enable mobile-friendly button"),
          //createMenuItem('sound', 'Sound')
        );
      case 'help':
        return createMenu(
          createMenuItem('how', '_How to play').withShortcut('F1'),
          //createMenuItem('about', '_About'),
        );

      case 'game|new': return createCommand(actions.newGame);
      case 'game|scores': return createCommand(actions.showScores);
      case 'game|exit': return createCommand(actions.exit);

      case 'settings|easy': return createCommand(() => actions.setDifficulty('EASY'));
      case 'settings|intermediate': return createCommand(() => actions.setDifficulty('MEDIUM'));
      case 'settings|hard': return createCommand(() => actions.setDifficulty('HARD'));
      case 'settings|sound': return createCommand(actions.toggleSound);
      case 'settings|minebtn': return createCommand(() => {
        mobileFriendlyEnabled = !mobileFriendlyEnabled;
        settings.setBoolean('mobilefriendly', mobileFriendlyEnabled);
        flagButtonPushed = false;
        refreshMineButton();
      });

      case 'help|how': return createCommand(actions.howToPlay);
      case 'help|about': return createCommand(actions.about);
    }
  };

  actions.newGame();
  os.ProcessManager.setInterval(pid, () => { if (game) updateHeader(game); }, 100);

  let [ innerWidth, innerHeight ] = getSize();
  os.Shell.showWindow(pid, {
    title: TITLE,
    menuBuilder: (id) => buildMenu(os, id),
    innerWidth,
    innerHeight,
    hideMaximize: true,
    disableResize: true,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost, winData) => {
      tryCloseWindow = () => winData.closeHandler();
      resizer = winData.setInteriorSize;
      contentHost.append(content);
      refreshMineButton();

      winData.shortcutKeyRouter
        .addKey('F2', actions.newGame)
        .addKey('CTRL+1', () => actions.setDifficulty('EASY'))
        .addKey('CTRL+2', () => actions.setDifficulty('MEDIUM'))
        .addKey('CTRL+3', () => actions.setDifficulty('HARD'))
        .addKey('F1', actions.howToPlay)
    },
  });
  return promise;
};
let generateHowToPlay = () => {
  let { h1, div, p } = HtmlUtil;
  return [
    h1("How to play Minesweeper", { fontSize: 14 }),
    p("Minesweeper is a game of logic."),
    p("You are given a grid. Underneath each square is either a landmine, or nothing (i.e. it's \"safe\")."),
    p("If you click on a square, you can see what's hidden underneath."),
    p("If it's a mine, you lose the game and must start over (click the face)."),
    p("If it's not a mine, you may be shown a number from 1 to 8. This number indicates how many mines touch the current square (even diagonally)"),
    p("For example, if you click on a square and see a 2, this means that of the 8 squares around it, two of them are mines."),
    p("If you think a square is a mine, you can right-click on it to mark it with a flag. (For mobile users, there is an option in the settings menu to enable a toggle button instead)"),
    p("The game is won when you have revealed all non-mine squares."),
    h1("Other notes and tips"),
    p("If there are ZERO mines around the square you click on, the game will recursively click the squares around it until it sees a number. This saves you some clicking."),
    p("You never have to worry about the first square you click on being a mine, it will always be clear."),
    p("If the game is too easy or too hard, adjust the difficulty mode. This basically just changes the size of the board and density of mines."),
  ];
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.minesweeper', APP_MAIN);
})();
