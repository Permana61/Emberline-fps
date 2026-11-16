// The look plan, in one place. Ember dusk: warm amber accent on a cool foundry
// floor, Vanguard teal against Cinder ember. The same names are the CSS custom
// properties in index.html.
export const PALETTE = {
  canvas: '#221a13',
  surface: '#33261b',
  hairline: '#54402e',
  ink: '#f2ead9',
  muted: '#a89a86',
  accent: '#f0a830',
  teal: '#2ec4b6',
  ember: '#e4572e',
};

export function shade(name) {
  return PALETTE[name];
}
