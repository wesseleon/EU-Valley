export const PIN_SIZE = 48;
export const PIN_PADDING = 2;
export const PIN_BORDER_WIDTH = 1;
export const PIN_BORDER_RADIUS = 6;
export const PIN_INNER_RADIUS = 4;

export const createFallbackImage = (name: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = PIN_SIZE;
  canvas.height = PIN_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Background color derived from name
  const hue = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
  ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
  ctx.beginPath();
  ctx.roundRect(0, 0, PIN_SIZE, PIN_SIZE, PIN_BORDER_RADIUS);
  ctx.fill();

  // Inner rounded area
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(PIN_PADDING, PIN_PADDING, PIN_SIZE - PIN_PADDING * 2, PIN_SIZE - PIN_PADDING * 2, PIN_INNER_RADIUS);
  ctx.fill();

  // Letter
  ctx.fillStyle = 'black';
  ctx.font = `500 18px "TASA Orbiter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase(), PIN_SIZE / 2, PIN_SIZE / 2);

  return canvas.toDataURL();
};
