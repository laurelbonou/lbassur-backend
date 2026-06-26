import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class MagicNumberValidationPipe implements PipeTransform {
  async transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return files;
    }

    for (const file of files) {
      if (!this.isValidMagicNumber(file.path)) {
        // Delete the file since it's already written by diskStorage
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
        throw new BadRequestException(`File signature (magic number) mismatch for file: ${file.originalname}`);
      }
    }

    return files;
  }

  private isValidMagicNumber(filePath: string): boolean {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    // Signatures
    // PDF: 25504446
    // PNG: 89504E47
    // JPEG: FFD8FFE0, FFD8FFE1, FFD8FFE2, FFD8FFE3, FFD8FFE8, FFD8FFDB
    // ZIP/XLSX: 504B0304
    
    if (hex.startsWith('25504446')) return true; // PDF
    if (hex.startsWith('89504E47')) return true; // PNG
    if (hex.startsWith('FFD8FF')) return true; // JPEG
    if (hex.startsWith('504B0304')) return true; // XLSX/ZIP

    return false;
  }
}
