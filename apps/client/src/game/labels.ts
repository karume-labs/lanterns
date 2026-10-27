import { Container, Text, TextStyle } from "pixi.js";

const styleCache = new Map<number, TextStyle>();

const styleFor = (color: number, size: number): TextStyle => {
  const key = color * 100 + size;
  let style = styleCache.get(key);
  if (!style) {
    style = new TextStyle({
      fill: color,
      fontFamily: "monospace",
      fontSize: size,
      fontWeight: "bold",
    });
    styleCache.set(key, style);
  }
  return style;
};

/**
 * Reused pool of Text nodes. Call `begin` once per frame, `put` for each
 * label, then `end` to hide the rest - no per-frame allocation.
 */
export class LabelLayer {
  readonly container = new Container();
  #pool: Text[] = [];
  #cursor = 0;

  begin(): void {
    this.#cursor = 0;
  }

  put(text: string, x: number, y: number, color = 0xffffff, size = 8): void {
    let label = this.#pool[this.#cursor];
    if (!label) {
      label = new Text({ text: "", style: styleFor(color, size) });
      this.#pool.push(label);
      this.container.addChild(label);
    }
    this.#cursor += 1;
    label.visible = true;
    label.text = text;
    label.style = styleFor(color, size);
    label.anchor.set(0.5, 0.5);
    label.position.set(Math.round(x), Math.round(y));
  }

  end(): void {
    for (let index = this.#cursor; index < this.#pool.length; index++) {
      const label = this.#pool[index];
      if (label) label.visible = false;
    }
  }
}
