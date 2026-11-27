/* A grid over the world's solid boxes, so "is this spot free?" looks only at the boxes
   nearby instead of every wall in every city. It follows a list of boxes that only grows
   (push); if the list is replaced or shrinks, it starts again from the new list. */
export type Box = { x0: number; x1: number; z0: number; z1: number };

const C = 24; // metres a cell
const key = (i: number, k: number) => (i + 32768) * 65536 + (k + 32768);

export class BoxIndex {
  private cells = new Map<number, Box[]>();
  /** boxes too big to file cell by cell (the sea, the desert edges) */
  private big: Box[] = [];
  private src: Box[] | null = null;
  private n = 0;

  /** Catch up with the list: file any boxes added since last time. */
  sync(list: Box[]) {
    if (list !== this.src || list.length < this.n) {
      this.cells.clear();
      this.big = [];
      this.src = list;
      this.n = 0;
    }
    for (; this.n < list.length; this.n++) this.file(list[this.n]);
    return this;
  }
  private file(b: Box) {
    const i0 = Math.floor(b.x0 / C),
      i1 = Math.floor(b.x1 / C),
      k0 = Math.floor(b.z0 / C),
      k1 = Math.floor(b.z1 / C);
    if ((i1 - i0 + 1) * (k1 - k0 + 1) > 64) {
      this.big.push(b);
      return;
    }
    for (let i = i0; i <= i1; i++)
      for (let k = k0; k <= k1; k++) {
        const id = key(i, k);
        const cell = this.cells.get(id);
        if (cell) cell.push(b);
        else this.cells.set(id, [b]);
      }
  }
  /** Is any box within r of the point (the same test as the old full scan)? */
  hitPoint(x: number, z: number, r: number) {
    for (const b of this.big) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true;
    const i0 = Math.floor((x - r) / C),
      i1 = Math.floor((x + r) / C),
      k0 = Math.floor((z - r) / C),
      k1 = Math.floor((z + r) / C);
    for (let i = i0; i <= i1; i++)
      for (let k = k0; k <= k1; k++) {
        const cell = this.cells.get(key(i, k));
        if (!cell) continue;
        for (const b of cell) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true;
      }
    return false;
  }
  /** Does any box overlap this rectangle? */
  hitBox(x0: number, x1: number, z0: number, z1: number) {
    for (const b of this.big) if (x0 < b.x1 && x1 > b.x0 && z0 < b.z1 && z1 > b.z0) return true;
    const i0 = Math.floor(x0 / C),
      i1 = Math.floor(x1 / C),
      k0 = Math.floor(z0 / C),
      k1 = Math.floor(z1 / C);
    for (let i = i0; i <= i1; i++)
      for (let k = k0; k <= k1; k++) {
        const cell = this.cells.get(key(i, k));
        if (!cell) continue;
        for (const b of cell) if (x0 < b.x1 && x1 > b.x0 && z0 < b.z1 && z1 > b.z0) return true;
      }
    return false;
  }
}
