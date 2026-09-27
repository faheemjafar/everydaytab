import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "RSA Key Pair Generator Online – 1024, 2048 & 4096-bit PEM Keys",
  seoDescription:
    "Generate RSA public/private key pairs in your browser: 2048 or 4096-bit keys in PEM format for JWT signing, SSH, TLS testing and encryption. Keys are created locally and never uploaded.",
  intro:
    "Create an RSA key pair — a private key and its matching public key — in standard PEM format, ready to paste into a JWT library, an API's signing configuration, a test certificate workflow or an encryption example. Choose 2048-bit for everyday use or 4096-bit for extra margin. Generation runs entirely in your browser using the Web Crypto-backed node-forge library, so the private key is never transmitted.",
  sections: [
    {
      heading: "How RSA key pairs work",
      paragraphs: [
        "RSA is an asymmetric cipher: the two keys are mathematically linked, but knowing the public key does not reveal the private one. Anything encrypted with the public key can only be decrypted with the private key — that is how TLS bootstraps a secure session — and anything signed with the private key can be verified with the public key, which is how JWTs (RS256), code signing and SSH authentication prove identity. The security rests on the difficulty of factoring the product of two very large primes; key size is the length of that product in bits.",
      ],
    },
    {
      heading: "Which key size to choose",
      bullets: [
        "2048-bit — the current industry standard; recommended by NIST through at least 2030 and required as a minimum by most CAs, cloud providers and JWT libraries.",
        "4096-bit — roughly 8× slower for private-key operations, but future-proof for long-lived keys such as root CAs, SSH keys or code-signing identities.",
        "1024-bit — deprecated. Considered breakable by well-resourced attackers; use only to reproduce legacy behaviour in tests.",
      ],
    },
    {
      heading: "What to do with the keys",
      bullets: [
        "JWT signing (RS256/RS384/RS512): the private key signs tokens on your server; the public key is published (often via JWKS) so clients can verify them. Test with the JWT Generator.",
        "SSH: convert the PEM private key with ssh-keygen -y to derive the OpenSSH public key format, or generate directly with ssh-keygen for production.",
        "TLS and certificates: use the private key to create a CSR with OpenSSL, then have a CA sign it.",
        "Encryption: encrypt small payloads (or a symmetric key) with the public key; for bulk data use AES and protect the AES key with RSA.",
        "Webhook signature verification and license-file signing.",
      ],
    },
    {
      heading: "Handling private keys safely",
      paragraphs: [
        "Store the private key in a secrets manager or an encrypted file with restrictive permissions (chmod 600), never in a git repository, chat message or ticket. Rotate keys periodically and revoke any key that may have been exposed. For production systems that demand hardware-backed keys or auditing, generate the pair inside an HSM or cloud KMS instead of a browser.",
      ],
    },
  ],
  howTo: [
    { name: "Choose the key size", text: "Select 2048 bits (recommended) or 4096 bits." },
    { name: "Generate", text: "Click Generate. Large keys take a few seconds because prime search runs on your device." },
    { name: "Copy the keys", text: "Copy the public and private PEM blocks separately." },
    { name: "Store securely", text: "Save the private key somewhere protected; share only the public key." },
  ],
  faqs: [
    {
      question: "Is it safe to generate private keys in a browser?",
      answer:
        "The keys are generated on your device with cryptographically secure randomness and are never sent to a server. For development, testing and most application keys this is fine; for high-value production identities prefer generation inside an HSM or KMS.",
    },
    {
      question: "Which PEM format are the keys in?",
      answer:
        "The private key is PKCS#1 (-----BEGIN RSA PRIVATE KEY-----) and the public key is SubjectPublicKeyInfo (-----BEGIN PUBLIC KEY-----), the formats accepted by OpenSSL, Node's crypto module, Java, .NET and every major JWT library.",
    },
    {
      question: "Why does 4096-bit generation take so long?",
      answer: "Finding two 2048-bit primes requires many probabilistic primality tests; it can take 10–30 seconds on a laptop and longer on a phone.",
    },
    {
      question: "Should I use RSA or an elliptic-curve key?",
      answer:
        "Ed25519 and ECDSA P-256 offer equivalent security with much smaller, faster keys and are preferred for SSH and new JWT deployments (EdDSA/ES256). Choose RSA when the consuming system only supports RS256 or RSA certificates.",
    },
  ],
  related: ["jwt-debugger", "ssl-decoder", "aes-encryption", "hash-generator", "hmac-generator", "bcrypt"],
};

export default content;
