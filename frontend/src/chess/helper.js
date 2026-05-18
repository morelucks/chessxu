export const getCharacter = (file) => String.fromCharCode(file + 96);
export const createPosition = () => {
  const position = new Array(8).fill("").map((x) => new Array(8).fill(""));

  for (let i = 0; i < 8; i++) {
    position[6][i] = "bp";
    position[1][i] = "wp";
  }

  position[0][0] = "wr";
  position[0][1] = "wn";
  position[0][2] = "wb";
  position[0][3] = "wq";
  position[0][4] = "wk";
  position[0][5] = "wb";
  position[0][6] = "wn";
  position[0][7] = "wr";

  position[7][0] = "br";
  position[7][1] = "bn";
  position[7][2] = "bb";
  position[7][3] = "bq";
  position[7][4] = "bk";
  position[7][5] = "bb";
  position[7][6] = "bn";
  position[7][7] = "br";

  return position;
};

export const copyPosition = (position) => {
  const newPosition = new Array(8).fill("").map((x) => new Array(8).fill(""));

  for (let rank = 0; rank < position.length; rank++) {
    for (let file = 0; file < position[0].length; file++) {
      newPosition[rank][file] = position[rank][file];
    }
  }

  return newPosition;
};

export const areSameColorTiles = (coords1, coords2) =>
  (coords1.x + coords1.y) % 2 === coords2.x + coords2.y;

export const findPieceCoords = (position, type) => {
  let results = [];
  position.forEach((rank, i) => {
    rank.forEach((pos, j) => {
      if (pos === type) results.push({ x: i, y: j });
    });
  });
  return results;
};

export const getNewMoveNotation = ({
  piece,
  rank,
  file,
  x,
  y,
  position,
  promotesTo,
}) => {
  let note = "";

  rank = Number(rank);
  file = Number(file);
  if (piece[1] === "k" && Math.abs(file - y) === 2) {
    if (file < y) return "O-O";
    else return "O-O-O";
  }

  if (piece[1] !== "p") {
    note += piece[1].toUpperCase();
    if (position[x][y]) {
      note += "x";
    }
  } else if (rank !== x && file !== y) {
    note += getCharacter(file + 1) + "x";
  }

  note += getCharacter(y + 1) + (x + 1);

  if (promotesTo) note += "=" + promotesTo.toUpperCase();

  return note;
};

export const createPuzzlePosition = () => {
  const puzzles = [
    // Puzzle 1: Anastasia's Mate in 3
    () => {
      const p = new Array(8).fill("").map(() => new Array(8).fill(""));
      p[7][5] = "br"; p[7][6] = "bk"; 
      p[6][5] = "bp"; p[6][6] = "bp"; p[6][7] = "bp";
      p[6][4] = "wn"; p[4][7] = "wq"; p[2][0] = "wr"; p[0][6] = "wk";
      return p;
    },
    // Puzzle 2: Back-rank mate in 2
    // White: Rd1, Qe5, Kg1 / Black: Kg8, pf7, pg7, ph7, Re8
    () => {
      const p = new Array(8).fill("").map(() => new Array(8).fill(""));
      p[7][4] = "br"; p[7][6] = "bk";
      p[6][5] = "bp"; p[6][6] = "bp"; p[6][7] = "bp";
      p[4][4] = "wq"; p[0][3] = "wr"; p[0][6] = "wk";
      return p;
    },
    // Puzzle 3: Queen and Knight mate in 2
    // White: Qh6, Ng5, Kg1 / Black: Kg8, pf7, pg7, ph7, Re8
    () => {
      const p = new Array(8).fill("").map(() => new Array(8).fill(""));
      p[7][4] = "br"; p[7][6] = "bk";
      p[6][5] = "bp"; p[6][6] = "bp"; p[6][7] = "bp";
      p[5][7] = "wq"; p[4][6] = "wn"; p[0][6] = "wk";
      return p;
    },
    // Puzzle 4: Arabian Mate theme in 2
    // White: Ne7, Rb7, Kg1 / Black: Kh8, ph7, Rg8
    () => {
      const p = new Array(8).fill("").map(() => new Array(8).fill(""));
      p[7][6] = "br"; p[7][7] = "bk";
      p[6][7] = "bp";
      p[6][4] = "wn"; p[6][1] = "wr"; p[0][6] = "wk";
      return p;
    }
  ];

  const randomIndex = Math.floor(Math.random() * puzzles.length);
  return puzzles[randomIndex]();
};
