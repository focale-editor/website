/** One continuous gesture in the browser illustration. */
export interface WebDrawingShape {
  path: string
  className: string
  /** Filled regions are traced first, then filled from this point. */
  fillAt?: readonly [number, number]
}

export const webDrawingShapes: readonly WebDrawingShape[] = [
  { path: 'M42 44H278Q280 44 280 46V206Q280 208 278 208H42Q40 208 40 206V46Q40 44 42 44Z', className: 'web-sky', fillAt: [64, 56] },
  { path: 'M245 44a25 25 0 1 0 0 50a25 25 0 1 0 0 -50', className: 'web-sun-halo', fillAt: [245, 69] },
  { path: 'M245 54a15 15 0 1 0 0 30a15 15 0 1 0 0 -30', className: 'web-sun-fill', fillAt: [245, 69] },
  { path: 'M40 156L79 115L108 143L145 108L175 146L205 90L280 158V190H40Z', className: 'web-distant-mountains', fillAt: [199, 141] },
  { path: 'M192 108L205 90L216 105L209 102L204 110L200 104Z', className: 'web-snow', fillAt: [204, 101] },
  { path: 'M40 170L77 134L102 150L144 84L189 147L219 119L280 170V195H40Z', className: 'web-mountain-fill', fillAt: [144, 153] },
  { path: 'M144 84L189 147L174 153L160 136L164 121Z', className: 'web-mountain-shade', fillAt: [171, 136] },
  { path: 'M219 119L280 170L249 166L232 146Z', className: 'web-mountain-shade', fillAt: [246, 155] },
  { path: 'M123 117L144 84L165 113L153 107L147 118L138 106L132 119Z', className: 'web-snow', fillAt: [143, 102] },
  { path: 'M40 171Q82 151 122 171T204 170T280 166V208H40Z', className: 'web-foothills', fillAt: [120, 181] },
  { path: 'M40 185Q80 173 117 184Q149 193 181 183Q229 171 280 184V208H40Z', className: 'web-lake', fillAt: [160, 198] },
  { path: 'M40 190Q71 180 101 193L113 208H40Z', className: 'web-shore', fillAt: [69, 200] },
  { path: 'M280 186Q247 178 226 192L212 208H280Z', className: 'web-shore', fillAt: [250, 200] },
  { path: 'M40 170L77 134L102 150L144 84L189 147L219 119L280 170', className: 'web-drawing-stroke' },
  { path: 'M245 54a15 15 0 1 0 0 30a15 15 0 1 0 0 -30', className: 'web-sun-stroke' },
  { path: 'M58 79H72Q75 71 84 73Q89 62 99 71Q108 69 112 79H124', className: 'web-clouds' },
  { path: 'M83 88H111', className: 'web-clouds' },
  { path: 'M132 194H162', className: 'web-water-light' },
  { path: 'M112 202H151', className: 'web-water-light' },
  { path: 'M183 187H206', className: 'web-water-light' },
  { path: 'M188 200H199', className: 'web-water-light' },
  { path: 'M216 188H235', className: 'web-water-sun' },
  { path: 'M224 193H239', className: 'web-water-sun' },
  { path: 'M102 99Q106 94 110 99Q114 94 118 99', className: 'web-birds' },
  { path: 'M239 111Q242 107 245 111Q248 107 251 111', className: 'web-birds' },
  { path: 'M60 155L51 174H55L47 188H58V198H62V188H73L65 174H69Z', className: 'web-trees', fillAt: [60, 180] },
  { path: 'M83 173L76 188H79L73 199H82V205H85V199H94L87 188H90Z', className: 'web-trees', fillAt: [83, 194] },
  { path: 'M258 151L249 169H253L244 185H256V196H260V185H272L263 169H267Z', className: 'web-trees', fillAt: [258, 176] },
]
