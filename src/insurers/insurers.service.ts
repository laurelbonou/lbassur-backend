import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { slugify } from "../common/slugify";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";

@Injectable()
export class InsurersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.insurer.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { offers: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const insurer = await this.prisma.insurer.findUnique({
      where: { slug },
      include: {
        offers: {
          where: { status: "ACTIVE" },
          orderBy: { premium: "asc" },
        },
      },
    });

    if (!insurer) {
      throw new NotFoundException("Insurer not found");
    }

    return insurer;
  }

  create(dto: CreateInsurerDto) {
    return this.prisma.insurer.create({
      data: {
        ...dto,
        slug: dto.slug ?? slugify(dto.name),
      },
    });
  }

  async update(id: string, dto: UpdateInsurerDto) {
    await this.ensureExists(id);

    return this.prisma.insurer.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ?? (dto.name ? slugify(dto.name) : undefined),
      },
    });
  }

  private async ensureExists(id: string) {
    const insurer = await this.prisma.insurer.findUnique({ where: { id }, select: { id: true } });
    if (!insurer) {
      throw new NotFoundException("Insurer not found");
    }
  }
}
