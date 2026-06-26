# LBAssur Backend - Production Guide

L'application a été entièrement auditée et préparée pour être un backend de niveau **production-grade**, sécurisé, performant, maintenable et avec une haute observabilité.

## Sommaire des implémentations

1. **Sécurité (Phase 1, 4 & 5)**
   - Les Fallbacks peu sécurisés (`JWT_SECRET`, etc.) ont été retirés.
   - **Joi** assure la validation stricte des variables d'environnement au démarrage : l'application crashera proprement si des secrets manquent.
   - **Helmet** et **CORS** stricts ont été mis en place pour se prémunir contre les attaques communes.
   - La validation de fichiers est robuste : au-delà des extensions, les `Magic Numbers` (signatures binaires) sont vérifiés (seul le vrai format PNG/PDF/JPG etc. passe).
   - Les `ValidationPipe` sont globaux, filtrant les requêtes suspectes ou non-déclarées (`whitelist: true`, `forbidNonWhitelisted: true`).

2. **Performance (Phase 4)**
   - Implémentation du caching en mémoire (`@nestjs/cache-manager`) sur les endpoints de lecture massive (`Insurers`, `Offers`, `Tariffs`).
   - Requêtes de base de données optimisées : les indexes prisma sont appropriés pour les lectures/filtrages courants.

3. **Agrégateur de Paiement (FeexPay) (Phase 6)**
   - Une logique stricte pour valider la signature cryptographique du webhook FeexPay via `FeexPayWebhookGuard`.
   - L'idempotence des paiements est respectée en base de données avec des `$transaction` de Prisma, prévenant ainsi les double-paiements.

4. **Monitoring et Observabilité (Phase 7 & 8)**
   - Un endpoint de métriques au format Prometheus (`/api/v1/metrics`) a été mis en place, qui exporte les informations de performance (utilisation du CPU, mémoire, requêtes HTTP par défaut).
   - Un endpoint de health check pour s'assurer que la base de données est accessible (`/api/v1/health`).
   - Le fichier `docker-compose.monitoring.yml` et `prometheus.yml` est disponible pour un déploiement clé-en-main de **Prometheus** et **Grafana**.

## Comment déployer le Monitoring

Lancez l'environnement de supervision via Docker à la racine du projet backend :

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Vous aurez accès à :
- **Prometheus** sur http://localhost:9090
- **Grafana** sur http://localhost:3000 (identifiants par défaut: `admin` / `admin`)

Vous pourrez ensuite ajouter la source de données Prometheus dans Grafana (url `http://prometheus:9090`) et importer un dashboard officiel de "Node.js application" depuis le catalogue Grafana.

## Scripts de démarrage

- **Build de production :** `npm run build`
- **Démarrage :** `npm run start` ou via PM2 : `pm2 start dist/src/main.js --name "lbassur-api"`
