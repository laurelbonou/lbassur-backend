import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

/**
 * Deuxième barrière après le filtre MIME : un fichier peut annoncer n'importe
 * quel type dans son en-tête multipart, seuls ses premiers octets ne mentent
 * pas. Les fichiers étant désormais en mémoire (avant envoi vers Cloudinary),
 * la vérification porte sur le buffer et non plus sur un fichier écrit sur
 * disque : rien de douteux n'atteint le disque ni le réseau.
 */
@Injectable()
export class MagicNumberValidationPipe implements PipeTransform {
  async transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return files;
    }

    for (const file of files) {
      if (!this.isValidMagicNumber(file.buffer)) {
        throw new BadRequestException(
          `Signature de fichier invalide pour : ${file.originalname}`,
        );
      }
    }

    return files;
  }

  isValidMagicNumber(buffer?: Buffer): boolean {
    // 12 octets : les conteneurs ISO BMFF (MP4/M4A) portent leur signature
    // `ftyp` aux octets 4 à 8, pas au début du fichier.
    if (!buffer || buffer.length < 4) return false;
    const head = buffer.subarray(0, 12);
    const hex = head.toString('hex').toUpperCase();

    // ── Images et documents ──
    if (hex.startsWith('25504446')) return true; // PDF
    if (hex.startsWith('89504E47')) return true; // PNG
    if (hex.startsWith('FFD8FF')) return true; // JPEG
    if (hex.startsWith('504B0304')) return true; // XLSX/ZIP

    // ── Audio (notes vocales) ──
    if (hex.startsWith('1A45DFA3')) return true; // WebM/Matroska (EBML) — Chrome, Firefox, Android
    if (hex.startsWith('4F676753')) return true; // Ogg ("OggS")
    if (hex.startsWith('494433')) return true; // MP3 avec tag ID3

    // MP4/M4A : la taille de la box occupe les 4 premiers octets, le type suit.
    if (head.length >= 8 && head.toString('latin1', 4, 8) === 'ftyp') return true;

    // MP3 sans tag ID3 : trame MPEG audio, 11 bits de synchro à 1.
    if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return true;

    return false;
  }
}
