import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "SSL Certificate Decoder – Decode PEM / X.509 Certificates Online",
  seoDescription:
    "Paste a PEM certificate to see its subject, issuer, validity dates, serial number and SHA-256 fingerprint. Free X.509 decoder that runs in your browser — nothing uploaded.",
  intro:
    "Paste a certificate in PEM format (-----BEGIN CERTIFICATE-----) and read everything inside it in plain language: who it was issued to, who issued it, when it expires, and its serial number and SHA-256 fingerprint. Handy for checking a cert you have been sent, debugging a chain, or confirming which certificate is actually deployed. Decoding happens locally in your browser.",
  sections: [
    {
      heading: "What's inside an X.509 certificate",
      bullets: [
        "Subject — the entity the certificate identifies: Common Name (CN, usually the domain), Organisation and location fields.",
        "Issuer — the Certificate Authority that signed it. For a self-signed cert, issuer equals subject.",
        "Validity — Not Before and Not After timestamps; browsers reject certificates outside this window, and public certs are now limited to 398 days.",
        "Serial number — a unique identifier assigned by the CA, used in revocation lists.",
        "Fingerprint — a SHA-256 hash of the whole certificate, used to pin or compare certificates exactly.",
        "Extensions (not shown here) — Subject Alternative Names, key usage and CRL/OCSP endpoints; view them with openssl x509 -text if you need the full SAN list.",
      ],
    },
    {
      heading: "Typical reasons to decode a certificate",
      bullets: [
        "Confirming the expiry date before a renewal deadline.",
        "Checking that the Common Name matches the hostname you're deploying (for the full SAN list use openssl x509 -text).",
        "Identifying which CA issued a cert during a chain-building or trust-store problem.",
        "Comparing fingerprints to verify a certificate has not been swapped (certificate pinning).",
        "Reading a certificate embedded in a Kubernetes Secret, a Java keystore export or a config file.",
      ],
    },
    {
      heading: "Getting a certificate into PEM",
      paragraphs: [
        "PEM is Base64-encoded DER wrapped in BEGIN/END lines, and it is what most tools output. If you have a binary .der or .cer file, convert it with openssl x509 -inform der -in cert.der -out cert.pem. To grab a live site's certificate, run openssl s_client -connect example.com:443 -servername example.com </dev/null | openssl x509 and paste the result. PKCS#12 (.pfx/.p12) bundles need to be exported first with openssl pkcs12 -in bundle.pfx -clcerts -nokeys.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the certificate", text: "Drop the PEM block, including the BEGIN and END lines, into the input." },
    { name: "Read the details", text: "Subject, issuer, validity, serial number and fingerprint are decoded instantly." },
    { name: "Act", text: "Check expiry, hostnames and issuer, and copy the fingerprint or serial if you need to record them." },
  ],
  faqs: [
    {
      question: "Can I paste a private key or a CSR?",
      answer:
        "This tool decodes certificates only. Never paste private keys into web tools. Certificate Signing Requests have a different structure; decode them with openssl req -text -noout.",
    },
    {
      question: "Why does decoding fail?",
      answer:
        "Make sure the whole block from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE----- is included, that line breaks were not mangled by an email client, and that it is a certificate rather than a key or a PKCS#7 bundle. Paste one certificate at a time.",
    },
    {
      question: "Is my certificate sent anywhere?",
      answer: "No. Parsing is done in your browser with the node-forge library. Certificates are public by nature, but nothing is transmitted regardless.",
    },
    {
      question: "How do I check the certificate of a live website?",
      answer:
        "Click the padlock in your browser and view the certificate, or export it with openssl s_client and paste the PEM here to see the full details.",
    },
  ],
  related: ["rsa-generator", "jwt-debugger", "hash-generator", "base64", "url-parser", "http-status-codes"],
};

export default content;
