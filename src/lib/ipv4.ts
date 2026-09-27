/** IPv4 helpers on unsigned 32-bit integers. */

export const ipToInt = (ip: string): number | null => {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((x) => x > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
};

export const intToIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
export const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
export const toBin = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].map((x) => x.toString(2).padStart(8, "0")).join(".");

/** Accepts "/24" style prefixes or dotted masks like 255.255.255.0. */
export function parsePrefix(s: string): number | null {
  const t = s.trim().replace(/^\//, "");
  if (/^\d{1,2}$/.test(t)) return Number(t) <= 32 ? Number(t) : null;
  const n = ipToInt(t);
  if (n === null) return null;
  const inv = ~n >>> 0;
  if ((inv & (inv + 1)) !== 0) return null; // must be contiguous ones
  return 32 - Math.log2(inv + 1);
}

export interface Subnet {
  prefix: number;
  network: number;
  broadcast: number;
  mask: number;
  wildcard: number;
  total: number;
  usable: number;
  first: number;
  last: number;
}

export function subnet(ip: number, prefix: number): Subnet {
  const mask = maskOf(prefix);
  const network = (ip & mask) >>> 0;
  const total = 2 ** (32 - prefix);
  const broadcast = (network + total - 1) >>> 0;
  // /31 (RFC 3021 point-to-point) and /32 have no network/broadcast reservation.
  const usable = prefix >= 31 ? total : total - 2;
  return { prefix, network, broadcast, mask, wildcard: ~mask >>> 0, total, usable, first: prefix >= 31 ? network : network + 1, last: prefix >= 31 ? broadcast : broadcast - 1 };
}

export function classify(ip: number) {
  const a = ip >>> 24;
  const b = (ip >>> 16) & 255;
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return "Private (RFC 1918)";
  if (a === 127) return "Loopback";
  if (a === 169 && b === 254) return "Link-local";
  if (a === 100 && b >= 64 && b <= 127) return "Carrier-grade NAT (RFC 6598)";
  if (a >= 224 && a <= 239) return "Multicast";
  if (a === 0 || a >= 240) return "Reserved";
  return "Public";
}

/** Smallest set of CIDR blocks exactly covering [start, end]. */
export function rangeToCidrs(start: number, end: number): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    let size = 32;
    while (size > 0) {
      const m = maskOf(size - 1);
      if (((cur & m) >>> 0) !== cur || cur + 2 ** (32 - (size - 1)) - 1 > end) break;
      size--;
    }
    out.push(`${intToIp(cur)}/${size}`);
    cur += 2 ** (32 - size);
    if (cur > 0xffffffff) break;
  }
  return out;
}

/** Parses "10.0.0.0/24", "10.0.0.1-10.0.0.9", "10.0.0.1-9" or a single IP into [start, end]. */
export function parseRange(s: string): [number, number] | null {
  const t = s.trim();
  const cidr = t.match(/^([\d.]+)\/(\d{1,2})$/);
  if (cidr) {
    const ip = ipToInt(cidr[1]);
    const p = Number(cidr[2]);
    if (ip === null || p > 32) return null;
    const sn = subnet(ip, p);
    return [sn.network, sn.broadcast];
  }
  const dash = t.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
  if (dash) {
    const a = ipToInt(dash[1]);
    let b = ipToInt(dash[2]);
    if (b === null && /^\d{1,3}$/.test(dash[2]) && a !== null) b = ((a & 0xffffff00) | Number(dash[2])) >>> 0;
    return a !== null && b !== null && b >= a ? [a, b] : null;
  }
  const one = ipToInt(t);
  return one === null ? null : [one, one];
}
