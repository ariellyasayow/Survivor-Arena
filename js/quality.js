// =============================================
//  quality.js — Level kualitas render (adaptive)
//  Di-set oleh adaptive quality system di main.js, dibaca saat menggambar
//  efek "mahal" (glow ekstra, detail halus) supaya bisa di-skip di device lemah.
// =============================================

let _quality = 'high'; // 'high' | 'medium' | 'low'

export function setRenderQuality(q) { _quality = q; }
export function getRenderQuality() { return _quality; }
export function isLowQuality() { return _quality === 'low'; }
