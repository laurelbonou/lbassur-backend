import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { BrokerAuthGuard } from '../auth/broker-auth.guard';
import { BrokerPortalService } from './broker-portal.service';

/** Ce que BrokerAuthGuard dépose sur la requête après vérification du jeton. */
type RequeteCourtier = Request & { broker?: { id: string; acabNumber?: string } };

/**
 * Espace partenaires — routes du cabinet connecté.
 *
 * Le garde s'applique au contrôleur entier, et non route par route : une route
 * ajoutée plus tard est protégée d'office. C'est délibéré — l'oubli d'un
 * décorateur est l'erreur la plus banale et la plus coûteuse ici.
 *
 * Toutes les routes sont en « /me » : aucune n'accepte d'identifiant de
 * cabinet. Le seul `brokerId` qui circule vient du jeton signé.
 *
 * Le préfixe est « partenaires » et non « brokers » à dessein : BrokersController
 * expose « /brokers/:slug », qui capturait « /brokers/me » et renvoyait le
 * parcours vers ApiKeyGuard. Un ordre de déclaration bien choisi suffirait à
 * le corriger, mais adosser le cloisonnement à l'ordre des contrôleurs, c'est
 * accepter qu'un réagencement anodin le rompe en silence.
 */
@ApiExcludeController()
@UseGuards(BrokerAuthGuard)
@Controller('partenaires/me')
export class BrokerPortalController {
  constructor(private readonly portal: BrokerPortalService) {}

  /** Le garde garantit la présence du courtier ; ce typage l'assume. */
  private static id(req: RequeteCourtier): string {
    return req.broker!.id;
  }

  @Get()
  profil(@Req() req: RequeteCourtier) {
    return this.portal.profil(BrokerPortalController.id(req));
  }

  @Get('contrats')
  contrats(@Req() req: RequeteCourtier) {
    return this.portal.contrats(BrokerPortalController.id(req));
  }

  @Get('commissions')
  commissions(@Req() req: RequeteCourtier) {
    return this.portal.commissions(BrokerPortalController.id(req));
  }

  @Get('synthese')
  synthese(@Req() req: RequeteCourtier) {
    return this.portal.synthese(BrokerPortalController.id(req));
  }
}
