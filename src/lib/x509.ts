/**
 * Minimal X.509 certificate / CSR decoder on top of node-forge's generic ASN.1
 * parser. Unlike forge.pki.certificateFromPem it handles EC and Ed25519 keys.
 */
import forge from "node-forge";

type A = forge.asn1.Asn1;
const { asn1 } = forge;

const NAMES: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.5": "serialNumber",
  "1.2.840.113549.1.9.1": "emailAddress", "2.5.4.97": "organizationIdentifier", "1.3.6.1.4.1.311.60.2.1.3": "jurisdictionC", "2.5.4.15": "businessCategory",
};
const ALGS: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA", "1.2.840.10045.2.1": "EC", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption", "1.2.840.113549.1.1.12": "sha384WithRSAEncryption", "1.2.840.113549.1.1.13": "sha512WithRSAEncryption", "1.2.840.113549.1.1.5": "sha1WithRSAEncryption", "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256", "1.2.840.10045.4.3.3": "ecdsa-with-SHA384", "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
};
const CURVES: Record<string, [string, number]> = { "1.2.840.10045.3.1.7": ["P-256", 256], "1.3.132.0.34": ["P-384", 384], "1.3.132.0.35": ["P-521", 521], "1.3.132.0.10": ["secp256k1", 256] };
const EKU: Record<string, string> = { "1.3.6.1.5.5.7.3.1": "TLS server", "1.3.6.1.5.5.7.3.2": "TLS client", "1.3.6.1.5.5.7.3.3": "Code signing", "1.3.6.1.5.5.7.3.4": "Email protection", "1.3.6.1.5.5.7.3.8": "Time stamping", "1.3.6.1.5.5.7.3.9": "OCSP signing" };
const KU = ["Digital signature", "Non-repudiation", "Key encipherment", "Data encipherment", "Key agreement", "Certificate signing", "CRL signing", "Encipher only", "Decipher only"];

const oid = (a: A) => asn1.derToOid(a.value as string);
const kids = (a: A) => a.value as A[];
const hex = (s: string) => forge.util.bytesToHex(s);
/** Contents of a BIT/OCTET STRING as ASN.1 — forge sometimes pre-decodes them into child nodes. */
const inner = (a: A, bitString = false): A => (Array.isArray(a.value) ? (a.value as A[])[0] : asn1.fromDer(bitString ? (a.value as string).slice(1) : (a.value as string)));

function name(a: A): { text: string; fields: [string, string][] } {
  const fields: [string, string][] = [];
  for (const set of kids(a)) for (const atv of kids(set)) {
    const [o, v] = kids(atv);
    const key = NAMES[oid(o)] ?? oid(o);
    let val = v.value as string;
    try { val = forge.util.decodeUtf8(val); } catch { /* latin1 */ }
    fields.push([key, val]);
  }
  return { text: fields.map(([k, v]) => `${k}=${v}`).join(", "), fields };
}

function time(a: A): Date {
  return a.type === asn1.Type.UTCTIME ? asn1.utcTimeToDate(a.value as string) : asn1.generalizedTimeToDate(a.value as string);
}

function publicKey(spki: A) {
  const [alg, bits] = kids(spki);
  const [algOid, params] = kids(alg);
  const type = ALGS[oid(algOid)] ?? oid(algOid);
  if (type === "RSA") {
    const rsa = inner(bits, true);
    const n = kids(rsa)[0].value as string;
    const e = parseInt(hex(kids(rsa)[1].value as string), 16);
    return { type: "RSA", size: (n.charCodeAt(0) === 0 ? n.length - 1 : n.length) * 8, detail: `e=${e}` };
  }
  if (type === "EC" && params) {
    const [curve, size] = CURVES[oid(params)] ?? [oid(params), 0];
    return { type: "EC", size, detail: curve };
  }
  return { type, size: type === "Ed25519" ? 256 : 0, detail: "" };
}

export interface Decoded {
  kind: "certificate" | "csr";
  subject: { text: string; fields: [string, string][] };
  issuer?: { text: string; fields: [string, string][] };
  serial?: string;
  notBefore?: Date;
  notAfter?: Date;
  sigAlg: string;
  key: { type: string; size: number; detail: string };
  san: string[];
  keyUsage: string[];
  extKeyUsage: string[];
  ca?: boolean;
  pathLen?: number;
  selfSigned?: boolean;
  sha256: string;
  sha1: string;
}

function extensions(exts: A[], d: Decoded) {
  for (const ext of exts) {
    const parts = kids(ext);
    const id = oid(parts[0]);
    const val = inner(parts[parts.length - 1]);
    if (id === "2.5.29.17") {
      for (const gn of kids(val)) {
        const v = gn.value as string;
        if (gn.type === 2) d.san.push(`DNS:${v}`);
        else if (gn.type === 1) d.san.push(`email:${v}`);
        else if (gn.type === 6) d.san.push(`URI:${v}`);
        else if (gn.type === 7) d.san.push(`IP:${v.length === 4 ? Array.from(v, (c) => c.charCodeAt(0)).join(".") : (hex(v).match(/.{4}/g) ?? []).join(":")}`);
      }
    } else if (id === "2.5.29.15") {
      const b = val.value as string;
      const unused = b.charCodeAt(0);
      const bits = Array.from(b.slice(1), (c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join("").slice(0, (b.length - 1) * 8 - unused);
      d.keyUsage = KU.filter((_, i) => bits[i] === "1");
    } else if (id === "2.5.29.37") d.extKeyUsage = kids(val).map((o) => EKU[oid(o)] ?? oid(o));
    else if (id === "2.5.29.19") {
      const [first, second] = kids(val) ?? [];
      d.ca = first?.type === asn1.Type.BOOLEAN ? (first.value as string).charCodeAt(0) !== 0 : false;
      const pl = first?.type === asn1.Type.INTEGER ? first : second;
      if (pl) d.pathLen = parseInt(hex(pl.value as string), 16);
    }
  }
}

function digest(der: string) {
  const s256 = forge.md.sha256.create().update(der).digest().toHex();
  const s1 = forge.md.sha1.create().update(der).digest().toHex();
  const colon = (h: string) => h.toUpperCase().match(/.{2}/g)!.join(":");
  return { sha256: colon(s256), sha1: colon(s1) };
}

export function decodePem(input: string): Decoded[] {
  const blocks = [...input.matchAll(/-----BEGIN ((?:NEW )?CERTIFICATE(?: REQUEST)?)-----([\s\S]*?)-----END \1-----/g)];
  if (!blocks.length) throw new Error("No PEM certificate or CSR found (expected -----BEGIN CERTIFICATE-----).");
  return blocks.map(([, label, body]) => {
    const der = forge.util.decode64(body.replace(/\s+/g, ""));
    const root = asn1.fromDer(der);
    const [tbs, sigAlg] = kids(root);
    const t = kids(tbs);
    const base = { san: [], keyUsage: [], extKeyUsage: [], sigAlg: ALGS[oid(kids(sigAlg)[0])] ?? oid(kids(sigAlg)[0]), ...digest(der) };
    if (label.includes("REQUEST")) {
      // CSR: SEQ { version, subject, spki, [0] attributes }
      const d: Decoded = { kind: "csr", subject: name(t[1]), key: publicKey(t[2]), ...base };
      const attrs = t[3] ? kids(t[3]) : [];
      for (const a of attrs) if (oid(kids(a)[0]) === "1.2.840.113549.1.9.14") extensions(kids(kids(kids(a)[1])[0]), d);
      return d;
    }
    const off = t[0].tagClass === asn1.Class.CONTEXT_SPECIFIC ? 1 : 0;
    const [serial, , issuer, validity, subject, spki] = t.slice(off);
    const d: Decoded = {
      kind: "certificate",
      subject: name(subject),
      issuer: name(issuer),
      serial: hex(serial.value as string).replace(/^00/, "").toUpperCase().match(/.{1,2}/g)!.join(":"),
      notBefore: time(kids(validity)[0]),
      notAfter: time(kids(validity)[1]),
      key: publicKey(spki),
      ...base,
    };
    const extWrap = t.slice(off + 6).find((x) => x.tagClass === asn1.Class.CONTEXT_SPECIFIC && x.type === 3);
    if (extWrap) extensions(kids(kids(extWrap)[0]), d);
    d.selfSigned = d.subject.text === d.issuer?.text;
    return d;
  });
}
