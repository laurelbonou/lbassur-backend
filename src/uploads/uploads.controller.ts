import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

@Controller("uploads")
export class UploadsController {
  @Post()
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
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
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
}
