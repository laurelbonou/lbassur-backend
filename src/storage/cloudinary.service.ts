import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

/**
 * Cloudinary range les fichiers en trois familles. Le piège classique : l'audio
 * n'a pas de famille à lui, il passe par `video`. Un fichier audio téléversé en
 * `image` ou `raw` est accepté puis inexploitable.
 */
export type ResourceType = "image" | "video" | "raw";

export type StoredAsset = {
  publicId: string;
  resourceType: ResourceType;
  format: string;
  bytes: number;
};

/** Dossiers de la médiathèque, un par nature de fichier. */
export const STORAGE_FOLDERS = {
  claims: "lbassur/sinistres",
  documents: "lbassur/documents",
  signatures: "lbassur/signatures",
  receipts: "lbassur/recus",
  contracts: "lbassur/contrats",
} as const;

/**
 * Durée de validité des URLs signées. Assez long pour consulter un dossier sans
 * que les images expirent sous les yeux, assez court pour qu'une URL qui fuite
 * dans un historique ou un log ne serve plus longtemps.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Compression appliquée aux images à l'upload. Mesuré sur une image du projet :
 * 2,13 Mo -> 185 Ko, sans perte visible. C'est ce qui rend le budget de
 * stockage tenable, les photos de sinistre étant l'essentiel du volume.
 */
const IMAGE_UPLOAD_TRANSFORM: UploadApiOptions = {
  quality: "auto:good",
  width: 2000,
  crop: "limit",
  fetch_format: "auto",
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // Le SDK lit CLOUDINARY_URL tout seul ; on force `secure` pour ne jamais
    // produire d'URL en http.
    cloudinary.config({ secure: true });
  }

  /**
   * Détermine la famille Cloudinary depuis le type MIME. Voir le commentaire sur
   * `ResourceType` pour le cas de l'audio.
   */
  resourceTypeFor(mimeType: string): ResourceType {
    const base = mimeType.split(";")[0].trim().toLowerCase();
    if (base.startsWith("image/")) return "image";
    if (base.startsWith("audio/") || base.startsWith("video/")) return "video";
    return "raw";
  }

  async uploadBuffer(
    buffer: Buffer,
    options: { folder: string; mimeType: string; publicId?: string },
  ): Promise<StoredAsset> {
    const resourceType = this.resourceTypeFor(options.mimeType);

    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: resourceType,
      // Accès restreint : sans URL signée, Cloudinary répond 401.
      type: "authenticated",
      ...(resourceType === "image" ? IMAGE_UPLOAD_TRANSFORM : {}),
    };

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) return reject(new Error("Cloudinary n'a renvoyé aucun résultat."));
        resolve(uploaded);
      });
      stream.end(buffer);
    }).catch((error) => {
      this.logger.error(`Échec du téléversement Cloudinary: ${error?.message ?? error}`);
      throw new InternalServerErrorException("Le téléversement du fichier a échoué.");
    });

    return {
      publicId: result.public_id,
      resourceType: result.resource_type as ResourceType,
      // Les fichiers `raw` n'ont pas de format renvoyé par Cloudinary.
      format: result.format ?? "",
      bytes: result.bytes,
    };
  }

  /**
   * URL de consultation à durée limitée. À générer au moment de la lecture : une
   * URL stockée en base serait périmée avant d'être servie.
   */
  signedUrl(asset: { publicId: string; resourceType: string; format?: string | null }): string {
    return cloudinary.utils.private_download_url(asset.publicId, asset.format || "", {
      resource_type: asset.resourceType,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
    });
  }

  /**
   * URL signée SANS expiration. Réservée aux documents envoyés au client par
   * email ou SMS — reçus, contrats — qu'il peut ouvrir des jours plus tard :
   * un lien expirant serait mort à l'ouverture du message. Non devinable, mais
   * valable indéfiniment ; pour tout ce qui se consulte depuis une session
   * authentifiée, utiliser `signedUrl`.
   */
  permanentSignedUrl(asset: {
    publicId: string;
    resourceType: string;
    format?: string | null;
  }): string {
    return cloudinary.url(asset.publicId, {
      type: "authenticated",
      resource_type: asset.resourceType,
      format: asset.format || undefined,
      sign_url: true,
      secure: true,
    });
  }

  /**
   * Récupère le contenu d'un asset. Sert à réintégrer la signature manuscrite
   * dans les PDF générés, qui n'ont plus de fichier local à lire.
   */
  async downloadBuffer(asset: {
    publicId: string;
    resourceType: string;
    format?: string | null;
  }): Promise<Buffer> {
    const response = await fetch(this.signedUrl(asset));
    if (!response.ok) {
      throw new Error(`Cloudinary a répondu ${response.status} pour ${asset.publicId}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async destroy(publicId: string, resourceType: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: "authenticated",
        invalidate: true,
      });
    } catch (error: any) {
      // Un fichier qu'on n'arrive pas à supprimer ne doit pas faire échouer
      // l'opération métier qui l'accompagne ; on le trace pour le rattraper.
      this.logger.warn(
        `Suppression Cloudinary impossible pour ${publicId}: ${error?.message ?? error}`,
      );
    }
  }
}
