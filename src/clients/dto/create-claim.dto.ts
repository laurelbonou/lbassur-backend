import { ClaimAttachmentKind, ClaimType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

/** Plafond de Cloudinary pour les images et les fichiers `raw` (plan Free). */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Nombre de fichiers acceptés par POST /uploads en une requête. */
const MAX_ATTACHMENTS = 10;

export class ClaimAttachmentDto {
  @IsEnum(ClaimAttachmentKind)
  kind: ClaimAttachmentKind;

  @IsString()
  @MaxLength(255)
  filename: string;

  /**
   * Identifiant Cloudinary produit par POST /uploads. Contraint au préfixe
   * `lbassur/` : le client ne peut pas rattacher à son sinistre un asset
   * quelconque de la médiathèque. On ne reçoit jamais d'URL — elle est signée
   * côté serveur au moment de la lecture.
   */
  @Matches(/^lbassur\/(?!.*\.\.)[A-Za-z0-9._\-/]+$/, {
    message: "publicId doit désigner un fichier téléversé via /uploads",
  })
  @MaxLength(255)
  publicId: string;

  @IsIn(["image", "video", "raw"], {
    message: "resourceType doit valoir image, video ou raw",
  })
  resourceType: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  format?: string;

  @IsString()
  @MaxLength(150)
  mimeType: string;

  @IsInt()
  @Min(0)
  @Max(MAX_ATTACHMENT_BYTES)
  size: number;
}

export class CreateClaimDto {
  /**
   * L'appartenance du contrat au client est revérifiée côté service : un ID
   * valide ne suffit pas, il doit être l'un de ses contrats.
   */
  @IsOptional()
  @IsString()
  quoteRequestId?: string;

  @IsEnum(ClaimType)
  claimType: ClaimType;

  @IsDateString()
  incidentDate: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "incidentTime doit être au format HH:mm",
  })
  incidentTime?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  locationCity: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationDetails?: string;

  @IsString()
  @MinLength(10, {
    message: "Décrivez le sinistre en quelques mots (10 caractères minimum).",
  })
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsBoolean()
  hasInjuries?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAmicableReport?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPoliceReport?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  policeReportRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  thirdPartyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  thirdPartyPlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  thirdPartyInsurer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  thirdPartyPolicy?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => ClaimAttachmentDto)
  attachments?: ClaimAttachmentDto[];
}
