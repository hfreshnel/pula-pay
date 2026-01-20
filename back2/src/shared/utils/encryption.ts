import forge from 'node-forge';

/**
 * Chiffre l'entity secret avec RSA-OAEP pour l'API Circle
 * @param entitySecretHex - Entity secret en hexadécimal (64 caractères = 32 bytes)
 * @param publicKeyPem - Clé publique RSA au format PEM
 * @returns Ciphertext encodé en base64
 */
export function encryptEntitySecret(
  entitySecretHex: string,
  publicKeyPem: string
): string {
  // Convertir hex → bytes
  const entitySecret = forge.util.hexToBytes(entitySecretHex);

  if (entitySecret.length !== 32) {
    throw new Error('Entity secret must be 32 bytes (64 hex characters)');
  }

  // Charger la clé publique RSA
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

  // Chiffrer avec RSA-OAEP SHA-256
  const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha256.create(),
    },
  });

  // Retourner en base64
  return forge.util.encode64(encryptedData);
}
