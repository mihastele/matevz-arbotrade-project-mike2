import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  Partner,
  PartnerListResponse,
  PartnerContact,
  PartnerDeliveryAddress,
  MetakockaResponse,
} from '../interfaces';

/**
 * MetaKocka Partner Service
 * 
 * Handles all partner/customer-related API operations:
 * - get_partner: Search and retrieve partners
 * - add_partner: Create new partners
 * - update_partner: Update existing partners
 * - search_blacklist_partner: Search blacklisted partners
 * 
 * API Documentation: /docs/get_partner.md, /docs/add_partner.md, /docs/update_partner.md
 */
@Injectable()
export class MetakockaPartnerService {
  private readonly logger = new Logger(MetakockaPartnerService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  /**
   * Search for partners
   * 
   * @param options - Search options
   * @returns Partner list response
   * 
   * @example
   * // Search by name
   * const partners = await partnerService.getPartners({ partner_name: 'Janez' });
   * 
   * // Search by tax number
   * const partners = await partnerService.getPartners({ partner_tax_number: 'SI12345678' });
   */
  async getPartners(options: {
    partner_id?: string;
    partner_name?: string;
    partner_tax_number?: string;
    partner_email?: string;
    partner_phone_number?: string;
    show_partner_discount?: boolean;
  }): Promise<PartnerListResponse> {
    const payload: Record<string, any> = {};

    if (options.partner_id) payload.partner_id = options.partner_id;
    if (options.partner_name) payload.partner_name = options.partner_name;
    if (options.partner_tax_number) payload.partner_tax_number = options.partner_tax_number;
    if (options.partner_email) payload.partner_email = options.partner_email;
    if (options.partner_phone_number) payload.partner_phone_number = options.partner_phone_number;
    if (options.show_partner_discount) payload.show_partner_discount = 'true';

    return this.metakockaService.post<PartnerListResponse>('get_partner', payload);
  }

  /**
   * Get a single partner by ID
   * 
   * @param partnerId - Partner mk_id
   * @returns Partner or null
   */
  async getPartner(partnerId: string): Promise<Partner | null> {
    const response = await this.getPartners({ partner_id: partnerId });

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    return response.partner_list?.[0] || null;
  }

  /**
   * Get partner by tax number
   * 
   * @param taxNumber - Tax ID number (e.g., 'SI12345678')
   * @returns Partner or null
   */
  async getPartnerByTaxNumber(taxNumber: string): Promise<Partner | null> {
    const response = await this.getPartners({ partner_tax_number: taxNumber });

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    return response.partner_list?.[0] || null;
  }

  /**
   * Get partner by email
   * 
   * @param email - Partner email
   * @returns Partner or null
   */
  async getPartnerByEmail(email: string): Promise<Partner | null> {
    const response = await this.getPartners({ partner_email: email });

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    return response.partner_list?.[0] || null;
  }

  /**
   * Add a new partner
   * 
   * @param partner - Partner data
   * @returns Response with mk_id, mk_contact_id, mk_address_id_list
   * 
   * @example
   * const result = await partnerService.addPartner({
   *   business_entity: 'false',
   *   taxpayer: 'false',
   *   buyer: 'true',
   *   foreign_county: 'false',
   *   customer: 'New Customer',
   *   street: 'Street 1',
   *   post_number: '1000',
   *   place: 'Ljubljana',
   *   country: 'Slovenia',
   *   partner_contact: {
   *     name: 'Contact Name',
   *     email: 'contact@example.com',
   *     gsm: '040123456',
   *   },
   * });
   */
  async addPartner(partner: {
    business_entity: string;
    taxpayer?: string;
    buyer?: string;
    supplier?: string;
    foreign_county?: string;
    tax_id_number?: string;
    registration_number?: string;
    customer: string;
    street: string;
    post_number: string;
    place: string;
    province?: string;
    country: string;
    partner_contact?: {
      useCustomerAsContact?: string;
      contact?: string;
      name?: string;
      email?: string;
      gsm?: string;
      phone?: string;
      fax?: string;
    };
    partner_delivery_address?: PartnerDeliveryAddress;
  }): Promise<MetakockaResponse & {
    mk_id: string;
    mk_contact_id?: string;
    mk_address_id_list?: { mk_id: string; street: string }[];
  }> {
    return this.metakockaService.post('add_partner', { partner });
  }

  /**
   * Update an existing partner
   * 
   * @param partner - Partner data with mk_id
   * @returns Response
   */
  async updatePartner(partner: {
    mk_id: string;
    business_entity?: string;
    taxpayer?: string;
    buyer?: string;
    supplier?: string;
    foreign_county?: string;
    tax_id_number?: string;
    registration_number?: string;
    customer?: string;
    street?: string;
    post_number?: string;
    place?: string;
    province?: string;
    country?: string;
    partner_contact?: {
      mk_id?: string;
      useCustomerAsContact?: string;
      contact?: string;
      name?: string;
      email?: string;
      gsm?: string;
      phone?: string;
      fax?: string;
    };
    partner_delivery_address?: PartnerDeliveryAddress & { mk_id?: string };
  }): Promise<MetakockaResponse> {
    if (!partner.mk_id) {
      throw new BadRequestException('Partner mk_id is required for update');
    }

    return this.metakockaService.post('update_partner', { partner });
  }

  /**
   * Search blacklisted partners
   * 
   * @param options - Search options
   * @returns Blacklist search response
   */
  async searchBlacklistPartner(options: {
    partner_name?: string;
    partner_tax_number?: string;
    partner_email?: string;
    partner_phone_number?: string;
  }): Promise<MetakockaResponse & { is_blacklisted: boolean; blacklist_reason?: string }> {
    return this.metakockaService.post('search_blacklist_partner', options);
  }

  /**
   * Find or create partner
   * Helper method that searches for existing partner and creates if not found
   * 
   * @param partner - Partner data
   * @param searchBy - Field to search by ('email' | 'tax_number' | 'name')
   * @returns Partner mk_id
   */
  async findOrCreatePartner(
    partner: Parameters<typeof this.addPartner>[0],
    searchBy: 'email' | 'tax_number' | 'name' = 'email',
  ): Promise<string> {
    let existingPartner: Partner | null = null;

    // Search for existing partner
    switch (searchBy) {
      case 'email':
        if (partner.partner_contact?.email) {
          existingPartner = await this.getPartnerByEmail(partner.partner_contact.email);
        }
        break;
      case 'tax_number':
        if (partner.tax_id_number) {
          existingPartner = await this.getPartnerByTaxNumber(partner.tax_id_number);
        }
        break;
      case 'name':
        const response = await this.getPartners({ partner_name: partner.customer });
        existingPartner = response.partner_list?.[0] || null;
        break;
    }

    if (existingPartner?.mk_id) {
      return existingPartner.mk_id;
    }

    // Create new partner
    const result = await this.addPartner(partner);

    if (!this.metakockaService.isSuccess(result)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(result));
    }

    return result.mk_id;
  }
}
