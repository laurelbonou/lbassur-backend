import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFiles, BadRequestException, NotFoundException } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import * as fs from "fs";
import { MagicNumberValidationPipe } from "../common/pipes/file-validation.pipe";

@Controller("uploads")
export class UploadsController {
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept images, pdf, xlsx
        if (file.mimetype.match(/\/(jpg|jpeg|png|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Format non supporté: ${file.mimetype}`), false);
        }
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    })
  )
  uploadFiles(@UploadedFiles(MagicNumberValidationPipe) files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException("Aucun fichier n'a été fourni.");
    }

    // Return the URLs relative to the server root
    const fileUrls = files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    }));

    return { files: fileUrls };
  }

  @Get(":filename")
  getFile(@Param("filename") filename: string, @Res() res: Response) {
    if (filename.includes("..") || filename.includes("/")) throw new BadRequestException("Invalid filename");
    const filePath = join(__dirname, "..", "..", "..", "uploads", filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException("File not found");
    res.sendFile(filePath);
  }

  @Get(":folder/:filename")
  getFileFromFolder(@Param("folder") folder: string, @Param("filename") filename: string, @Res() res: Response) {
    if (filename.includes("..") || filename.includes("/") || folder.includes("..") || folder.includes("/")) throw new BadRequestException("Invalid path");
    const filePath = join(__dirname, "..", "..", "..", "uploads", folder, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException("File not found");
    res.sendFile(filePath);
  }
}
