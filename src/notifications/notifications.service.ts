import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string, attachments?: any[]) {
    try {
      if (!process.env.SMTP_USER) {
        this.logger.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
        this.logger.debug(text);
        return;
      }

      const info = await this.transporter.sendMail({
        from: '"LBAssur" <contact@lbassur.bj>', // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html: html || text.replace(/\n/g, '<br>'), // html body
        attachments,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    // La fonctionnalité WhatsApp a été désactivée à la demande de l'équipe.
    // L'équipe recontactera les clients manuellement par téléphone.
    return;
  }

  // --- Specific Use Cases ---

  async notifyClientReceipt(clientEmail: string, clientPhone: string, receiptUrl: string) {
    const publicUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL : "http://localhost:3000";
    const fullReceiptUrl = receiptUrl.startsWith("http") ? receiptUrl : `${publicUrl}${receiptUrl}`;
    
    const message = `Bonjour,\n\nNous avons bien reçu votre demande et votre paiement.\nVotre quittance est disponible ici : ${fullReceiptUrl}\n\nUn conseiller LBAssur vous fera un retour dans 30 minutes.\n\nMerci de votre confiance.`;
    
    if (clientEmail) {
      await this.sendEmail(
        clientEmail, 
        'Confirmation de votre demande et quittance LBAssur', 
        message
      );
    }
    // Appel désactivé: await this.sendWhatsApp(clientPhone, message);
  }

  async notifyAdminNewQuote(adminEmail: string, quoteId: string) {
    const message = `Une nouvelle demande de souscription (ID: ${quoteId}) a été payée et attend d'être traitée.`;
    await this.sendEmail(adminEmail, 'Nouvelle Souscription LBAssur', message);
    // Appel désactivé: await this.sendWhatsApp(process.env.ADMIN_PHONE || '+22900000000', message);
  }

  async notifyAdminAbandonedCart(adminEmail: string, clientDetails: any) {
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">PANIER ABANDONNÉ</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Bonjour,</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Un prospect vient de commencer une demande de souscription mais ne l'a pas encore terminée. 
            C'est le moment idéal pour faire preuve de réactivité et l'appeler !
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Nom :</strong> ${clientDetails.fullName || 'Non renseigné'}</p>
            <p style="margin: 10px 0 0; font-size: 16px;"><strong>Téléphone :</strong> <a href="tel:${clientDetails.phone}" style="color: #e74c3c; font-weight: bold; text-decoration: none;">${clientDetails.phone}</a></p>
            ${clientDetails.email ? `<p style="margin: 10px 0 0; font-size: 16px;"><strong>Email :</strong> ${clientDetails.email}</p>` : ''}
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Vous pouvez consulter ce dossier dans votre tableau de bord sous l'onglet <strong>Souscriptions</strong>.
          </p>
        </div>
      </div>
    `;
    const textMessage = `Nouveau panier abandonné !\n\nNom: ${clientDetails.fullName}\nTéléphone: ${clientDetails.phone}`;
    await this.sendEmail(adminEmail, `ALERTE - Panier Abandonné : ${clientDetails.phone}`, textMessage, htmlMessage);
  }

  async sendQuoteToInsurer(insurerEmail: string, clientDetails: any, documents: any[], summaryPdfUrl?: string) {
    const textMessage = `Bonjour,\n\nVeuillez trouver ci-joint une nouvelle demande de souscription pour le client ${clientDetails.fullName}.\n\nMerci de nous générer le numéro de police correspondant.\n\nCordialement,\nLBAssur`;
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">LBASSUR</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #000; font-size: 20px; margin-top: 0;">Nouvelle Demande de Souscription</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Bonjour,</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Une nouvelle demande de souscription a été finalisée par le client <strong>${clientDetails.fullName}</strong>.
            Veuillez trouver ci-joint la <strong>Fiche de Cotation</strong> résumant les informations du client, ainsi que les documents justificatifs associés.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #000; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>ID Dossier :</strong> ${clientDetails.id}</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Type d'assurance :</strong> ${clientDetails.insuranceType || 'Non spécifié'}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Merci de bien vouloir générer le contrat et le numéro de police correspondants, puis de nous les faire parvenir.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #555; margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe LBAssur</strong>
          </p>
        </div>
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          © ${new Date().getFullYear()} LBAssur. Tous droits réservés.
        </div>
      </div>
    `;

    const path = require('path');
    const backendRoot = path.join(__dirname, '..', '..', '..');

    // Attachments formatted for nodemailer
    const attachments = documents.map(doc => {
      // Resolve path
      const relativePath = doc.url.replace(/^\//, '');
      return {
        filename: doc.filename,
        path: path.join(backendRoot, relativePath)
      };
    });

    if (summaryPdfUrl) {
      const relativeSummaryPath = summaryPdfUrl.replace(/^\//, '');
      attachments.push({
        filename: `Fiche_de_Cotation_${clientDetails.fullName.replace(/\s+/g, '_')}.pdf`,
        path: path.join(backendRoot, relativeSummaryPath)
      });
    }

    await this.sendEmail(insurerEmail, `Demande de Souscription - ${clientDetails.fullName}`, textMessage, htmlMessage, attachments);
  }

  async sendFinalContractToClient(clientEmail: string, clientPhone: string, contractUrl: string) {
    const message = `Bonjour,\n\nVotre contrat d'assurance est désormais prêt et validé. Vous pouvez le télécharger ici : ${contractUrl}\n\nCordialement,\nLBAssur`;
    
    if (clientEmail) {
      await this.sendEmail(
        clientEmail, 
        'Votre Contrat d\'Assurance Finalisé', 
        message
      );
    }
    // Appel désactivé: await this.sendWhatsApp(clientPhone, message);
  }
}
