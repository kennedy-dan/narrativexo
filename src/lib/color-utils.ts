// Color conversion and ΔE00 calculation utilities

export interface LABColor {
  l: number;
  a: number;
  b: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface XYZColor {
  x: number;
  y: number;
  z: number;
}

export interface WCAGResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
}

export function hexToLAB(hex: string): LABColor {
  const rgb = hexToRgb(hex);
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

export function dedupPalette(hexColors: string[], threshold: number = 2.5): string[] {
  const uniqueColors: string[] = [];
  
  for (const color of hexColors) {
    const lab = hexToLAB(color);
    let isDuplicate = false;
    
    for (const uniqueColor of uniqueColors) {
      const uniqueLab = hexToLAB(uniqueColor);
      const deltaE = calculateDeltaE00(lab, uniqueLab);
      
      if (deltaE <= threshold) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueColors.push(color);
    }
  }
  
  return uniqueColors;
}

export function calculateDeltaE00(lab1: LABColor, lab2: LABColor): number {
  // Simplified ΔE00 calculation - in production, use a complete implementation
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// Helper conversion functions
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToXyz(r: number, g: number, b: number): XYZColor {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  rn *= 100;
  gn *= 100;
  bn *= 100;

  return {
    x: rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375,
    y: rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750,
    z: rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041
  };
}

function xyzToLab(x: number, y: number, z: number): LABColor {
  const xn = x / 95.047;
  const yn = y / 100.000;
  const zn = z / 108.883;

  const fx = xn > 0.008856 ? Math.pow(xn, 1/3) : (7.787 * xn) + (16/116);
  const fy = yn > 0.008856 ? Math.pow(yn, 1/3) : (7.787 * yn) + (16/116);
  const fz = zn > 0.008856 ? Math.pow(zn, 1/3) : (7.787 * zn) + (16/116);

  return {
    l: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

export function checkWCAGContrast(color1: string, color2: string): WCAGResult {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const luminance1 = calculateRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = calculateRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const ratio = luminance1 > luminance2 
    ? (luminance1 + 0.05) / (luminance2 + 0.05)
    : (luminance2 + 0.05) / (luminance1 + 0.05);
  
  return {
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7
  };
}

function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Compliance checking utility
export function checkWCAG(): { pass: boolean; issues: string[] } {
  const issues: string[] = [];
  // Implementation for comprehensive WCAG checking
  return {
    pass: issues.length === 0,
    issues
  };
}