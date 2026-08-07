import { Global, Module } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";

/**
 * Global : le stockage est utilisé par les uploads, les devis (signatures) et
 * les documents générés (reçus, contrats). L'exposer partout évite de répéter
 * l'import dans chaque module.
 */
@Global()
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class StorageModule {}
