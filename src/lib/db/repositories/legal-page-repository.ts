import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { LegalPage, RiskDisclaimer, SYSTEM_LEGAL_PAGES, DEFAULT_PAGE_TITLES } from '../models/legal-page';

export class LegalPageRepository {
  private tenantId: string;
  private collection: Collection<LegalPage> | null = null;
  private disclaimerCollection: Collection<RiskDisclaimer> | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getCollection(): Promise<Collection<LegalPage>> {
    if (!this.collection) {
      this.collection = await getCollection<LegalPage>(this.tenantId, 'legal_pages');
      // Create indexes
      await this.collection.createIndex({ tenantId: 1, slug: 1 }, { unique: true });
      await this.collection.createIndex({ tenantId: 1, showInFooter: 1, footerOrder: 1 });
    }
    return this.collection;
  }

  private async getDisclaimerCollection(): Promise<Collection<RiskDisclaimer>> {
    if (!this.disclaimerCollection) {
      this.disclaimerCollection = await getCollection<RiskDisclaimer>(this.tenantId, 'risk_disclaimers');
    }
    return this.disclaimerCollection;
  }

  // Initialize default legal pages if they don't exist
  async initializeDefaults(impressum: { companyName: string; address: string; email: string; phone?: string; vatId?: string }): Promise<void> {
    const collection = await this.getCollection();
    
    for (const slug of SYSTEM_LEGAL_PAGES) {
      const existing = await collection.findOne({ tenantId: this.tenantId, slug });
      if (!existing) {
        const defaultContent = this.getDefaultContent(slug, impressum);
        await collection.insertOne({
          tenantId: this.tenantId,
          slug,
          title: DEFAULT_PAGE_TITLES[slug] || { de: slug, en: slug },
          content: defaultContent,
          type: 'legal',
          showInFooter: ['impressum', 'datenschutz', 'agb', 'hilfe'].includes(slug),
          footerOrder: SYSTEM_LEGAL_PAGES.indexOf(slug),
          isActive: true,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  private getDefaultContent(slug: string, impressum: { companyName: string; address: string; email: string; phone?: string; vatId?: string }): { de: string; en: string } {
    const templates: Record<string, { de: string; en: string }> = {
      impressum: {
        de: `<h1>Impressum</h1>
<h2>Angaben gemäß § 5 TMG</h2>
<p><strong>${impressum.companyName}</strong></p>
<p>${impressum.address}</p>
<h2>Kontakt</h2>
<p>E-Mail: ${impressum.email}</p>
${impressum.phone ? `<p>Telefon: ${impressum.phone}</p>` : ''}
${impressum.vatId ? `<h2>Umsatzsteuer-ID</h2><p>${impressum.vatId}</p>` : ''}`,
        en: `<h1>Legal Notice</h1>
<h2>Information according to § 5 TMG</h2>
<p><strong>${impressum.companyName}</strong></p>
<p>${impressum.address}</p>
<h2>Contact</h2>
<p>Email: ${impressum.email}</p>
${impressum.phone ? `<p>Phone: ${impressum.phone}</p>` : ''}
${impressum.vatId ? `<h2>VAT ID</h2><p>${impressum.vatId}</p>` : ''}`,
      },
      datenschutz: {
        de: `<h1>Datenschutzerklärung</h1>
<h2>1. Verantwortlicher</h2>
<p>${impressum.companyName}<br>${impressum.address}<br>E-Mail: ${impressum.email}</p>
<h2>2. Erhebung personenbezogener Daten</h2>
<p>Beim Besuch unserer Website werden automatisch Informationen gespeichert.</p>
<h2>3. Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung.</p>`,
        en: `<h1>Privacy Policy</h1>
<h2>1. Controller</h2>
<p>${impressum.companyName}<br>${impressum.address}<br>Email: ${impressum.email}</p>
<h2>2. Collection of Personal Data</h2>
<p>When you visit our website, information is automatically stored.</p>
<h2>3. Your Rights</h2>
<p>You have the right to access, rectification, deletion, and restriction of processing.</p>`,
      },
      agb: {
        de: `<h1>Allgemeine Geschäftsbedingungen</h1>
<h2>§ 1 Geltungsbereich</h2>
<p>Diese AGB gelten für alle Verträge zwischen ${impressum.companyName} und dem Nutzer.</p>
<h2>§ 2 Vertragsschluss</h2>
<p>Der Vertrag kommt durch Klicken auf "Artikel entsperren" und Bestätigung der Zahlung zustande.</p>
<h2>§ 3 Preise</h2>
<p>Die angegebenen Preise sind Endpreise inkl. MwSt.</p>`,
        en: `<h1>Terms and Conditions</h1>
<h2>§ 1 Scope</h2>
<p>These T&C apply to all contracts between ${impressum.companyName} and the user.</p>
<h2>§ 2 Conclusion of Contract</h2>
<p>The contract is concluded by clicking "Unlock article" and confirming the payment.</p>
<h2>§ 3 Prices</h2>
<p>The prices shown are final prices including VAT.</p>`,
      },
      widerrufsbelehrung: {
        de: `<h1>Widerrufsbelehrung</h1>
<h2>Widerrufsrecht</h2>
<p>Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
<h2>Folgen des Widerrufs</h2>
<p>Wenn Sie widerrufen, werden alle Zahlungen unverzüglich zurückerstattet.</p>`,
        en: `<h1>Cancellation Policy</h1>
<h2>Right of Withdrawal</h2>
<p>You have the right to cancel this contract within 14 days without giving any reason.</p>
<h2>Consequences of Cancellation</h2>
<p>If you cancel, all payments will be refunded immediately.</p>`,
      },
      hilfe: {
        de: `<h1>Hilfe & Support</h1>
<p>Haben Sie Fragen? Kontaktieren Sie uns:</p>
<p>E-Mail: ${impressum.email}</p>
${impressum.phone ? `<p>Telefon: ${impressum.phone}</p>` : ''}`,
        en: `<h1>Help & Support</h1>
<p>Do you have questions? Contact us:</p>
<p>Email: ${impressum.email}</p>
${impressum.phone ? `<p>Phone: ${impressum.phone}</p>` : ''}`,
      },
      kundenportal: {
        de: `<h1>Kundenportal</h1>
<p>Um Ihre Käufe einzusehen, kontaktieren Sie uns unter: ${impressum.email}</p>`,
        en: `<h1>Customer Portal</h1>
<p>To view your purchases, contact us at: ${impressum.email}</p>`,
      },
      kuendigung: {
        de: `<h1>Kündigung</h1>
<p>Da es sich um Einzelkäufe handelt, ist keine Kündigung erforderlich.</p>`,
        en: `<h1>Termination</h1>
<p>Since these are individual purchases, no cancellation is required.</p>`,
      },
    };

    return templates[slug] || { de: '<p>Inhalt folgt...</p>', en: '<p>Content coming soon...</p>' };
  }

  // Get all legal pages
  async findAll(options?: { activeOnly?: boolean; footerOnly?: boolean }): Promise<LegalPage[]> {
    const collection = await this.getCollection();
    const filter: Record<string, unknown> = { tenantId: this.tenantId };
    
    if (options?.activeOnly) {
      filter.isActive = true;
    }
    if (options?.footerOnly) {
      filter.showInFooter = true;
    }
    
    return collection.find(filter).sort({ footerOrder: 1 }).toArray();
  }

  // Get footer links
  async getFooterLinks(): Promise<LegalPage[]> {
    const collection = await this.getCollection();
    return collection
      .find({ tenantId: this.tenantId, showInFooter: true, isActive: true })
      .sort({ footerOrder: 1 })
      .toArray();
  }

  // Get a single page by slug
  async findBySlug(slug: string): Promise<LegalPage | null> {
    const collection = await this.getCollection();
    return collection.findOne({ tenantId: this.tenantId, slug });
  }

  // Get a single page by ID
  async findById(id: string): Promise<LegalPage | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id), tenantId: this.tenantId });
  }

  // Create a new page
  async create(page: Omit<LegalPage, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<LegalPage> {
    const collection = await this.getCollection();
    const now = new Date();
    const newPage = {
      ...page,
      tenantId: this.tenantId,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(newPage);
    return { ...newPage, _id: result.insertedId };
  }

  // Update a page
  async update(id: string, updates: Partial<LegalPage>): Promise<LegalPage | null> {
    const collection = await this.getCollection();
    const { _id, tenantId, createdAt, ...updateData } = updates;
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId: this.tenantId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  // Delete a page (only non-system pages)
  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const page = await this.findById(id);
    
    if (!page || page.isSystem) {
      return false; // Can't delete system pages
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id), tenantId: this.tenantId });
    return result.deletedCount > 0;
  }

  // Update footer order
  async updateFooterOrder(orderedIds: string[]): Promise<void> {
    const collection = await this.getCollection();
    
    for (let i = 0; i < orderedIds.length; i++) {
      await collection.updateOne(
        { _id: new ObjectId(orderedIds[i]), tenantId: this.tenantId },
        { $set: { footerOrder: i, updatedAt: new Date() } }
      );
    }
  }

  // Toggle footer visibility
  async toggleFooterVisibility(id: string, show: boolean): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id), tenantId: this.tenantId },
      { $set: { showInFooter: show, updatedAt: new Date() } }
    );
  }

  // Risk Disclaimer methods
  async getRiskDisclaimer(): Promise<RiskDisclaimer | null> {
    const collection = await this.getDisclaimerCollection();
    return collection.findOne({ tenantId: this.tenantId });
  }

  async saveRiskDisclaimer(content: { de: string; en: string }, isActive: boolean): Promise<RiskDisclaimer> {
    const collection = await this.getDisclaimerCollection();
    const existing = await this.getRiskDisclaimer();
    
    if (existing) {
      await collection.updateOne(
        { tenantId: this.tenantId },
        { $set: { content, isActive, updatedAt: new Date() } }
      );
      return { ...existing, content, isActive, updatedAt: new Date() };
    } else {
      const newDisclaimer: RiskDisclaimer = {
        tenantId: this.tenantId,
        content,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await collection.insertOne(newDisclaimer);
      return { ...newDisclaimer, _id: result.insertedId };
    }
  }
}

// Singleton instances per tenant
const repositories = new Map<string, LegalPageRepository>();

export function getLegalPageRepository(tenantId: string): LegalPageRepository {
  if (!repositories.has(tenantId)) {
    repositories.set(tenantId, new LegalPageRepository(tenantId));
  }
  return repositories.get(tenantId)!;
}
