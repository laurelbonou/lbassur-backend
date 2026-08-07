import { mkdirSync } from "fs";
import { isAbsolute, join } from "path";

/**
 * Racine unique du stockage des fichiers uploadés (justificatifs, signatures,
 * reçus, contrats, pièces de sinistre).
 *
 * Sans `UPLOADS_DIR`, les fichiers atterrissent dans `<cwd>/uploads`, c'est-à-dire
 * sur le disque éphémère de l'hébergeur : ils sont effacés à chaque redéploiement.
 * En production, pointer `UPLOADS_DIR` vers un disque persistant monté
 * (ex. `/var/data/uploads` sur Render) pour que les pièces jointes survivent.
 */
export const UPLOADS_ROOT = resolveUploadsRoot();

function resolveUploadsRoot(): string {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (!configured) return join(process.cwd(), "uploads");
  return isAbsolute(configured) ? configured : join(process.cwd(), configured);
}

/** Sous-dossier de `UPLOADS_ROOT`, pour les fichiers rangés par catégorie. */
export function uploadsPath(...segments: string[]): string {
  return join(UPLOADS_ROOT, ...segments);
}

/**
 * Crée le dossier s'il n'existe pas. Multer exige une destination existante, et
 * un disque persistant fraîchement monté est vide au premier démarrage.
 */
export function ensureUploadsDir(...segments: string[]): string {
  const dir = uploadsPath(...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

ensureUploadsDir();
