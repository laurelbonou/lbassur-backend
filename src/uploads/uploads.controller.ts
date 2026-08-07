import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import * as fs from "fs";
import { MagicNumberValidationPipe } from "../common/pipes/file-validation.pipe";
import { uploadsPath } from "../config/storage";
import { CloudinaryService, STORAGE_FOLDERS } from "../storage/cloudinary.service";

/**
 * Types MIME acceptés à l'upload. Les notes vocales enregistrées dans le
 * navigateur varient selon la plateforme : `audio/webm` (Chrome, Firefox,
 * Android), `audio/mp4` (Safari, iOS), `audio/ogg` et `audio/mpeg` ailleurs.
 */
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Audio (notes vocales)
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/x-m4a",
]);

/**
 * 10 Mo : c'est le plafond de Cloudinary pour les images et les fichiers `raw`
 * sur le plan Free (relevé sur le compte, pas supposé). Refuser ici donne au
 * client un message clair, plutôt qu'un rejet distant après le transfert.
 */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * `MediaRecorder` produit des types paramétrés comme `audio/webm;codecs=opus`.
 * On ne compare que le type de base.
 */
function baseMimeType(mimetype: string): string {
  return mimetype.split(";")[0].trim().toLowerCase();
}

/** Dossiers autorisés à la destination, pour ne pas laisser le client choisir. */
const UPLOAD_FOLDERS: Record<string, string> = {
  sinistres: STORAGE_FOLDERS.claims,
  documents: STORAGE_FOLDERS.documents,
};

@Controller("uploads")
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      // En mémoire : le fichier part vers Cloudinary sans jamais toucher le
      // disque de l'hébergeur, qui est éphémère.
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(baseMimeType(file.mimetype))) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Format non supporté: ${file.mimetype}`), false);
        }
      },
      limits: {
        fileSize: MAX_FILE_BYTES,
      },
    })
  )
  async uploadFiles(
    @UploadedFiles(MagicNumberValidationPipe) files: Express.Multer.File[],
    @Query("folder") folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("Aucun fichier n'a été fourni.");
    }

    const destination = UPLOAD_FOLDERS[folder ?? ""] ?? STORAGE_FOLDERS.documents;

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const asset = await this.cloudinary.uploadBuffer(file.buffer, {
          folder: destination,
          mimeType: file.mimetype,
        });

        return {
          originalname: file.originalname,
          publicId: asset.publicId,
          resourceType: asset.resourceType,
          format: asset.format,
          mimeType: file.mimetype,
          // `size` est la taille après compression : c'est elle qui consomme
          // du stockage, pas celle du fichier d'origine.
          size: asset.bytes,
          // URL signée pour un aperçu immédiat. Elle expire : le client doit
          // renvoyer publicId/resourceType/format, jamais cette URL.
          url: this.cloudinary.signedUrl(asset),
        };
      }),
    );

    return { files: uploaded };
  }

  // ── Legacy ────────────────────────────────────────────────────────────────
  // Fichiers téléversés avant la bascule vers Cloudinary, référencés en base par
  // un chemin `/uploads/...`. Conservé pour ne pas casser l'affichage des vieux
  // dossiers. À retirer une fois ces lignes migrées ou purgées.

  @Get(":filename")
  getFile(@Param("filename") filename: string, @Res() res: Response) {
    if (filename.includes("..") || filename.includes("/")) throw new BadRequestException("Invalid filename");
    const filePath = uploadsPath(filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException("File not found");
    res.sendFile(filePath);
  }

  @Get(":folder/:filename")
  getFileFromFolder(@Param("folder") folder: string, @Param("filename") filename: string, @Res() res: Response) {
    if (filename.includes("..") || filename.includes("/") || folder.includes("..") || folder.includes("/")) throw new BadRequestException("Invalid path");
    const filePath = uploadsPath(folder, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException("File not found");
    res.sendFile(filePath);
  }
}
