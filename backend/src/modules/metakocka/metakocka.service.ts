import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MetakockaCredentials, MetakockaResponse } from './interfaces';

/**
 * Base MetaKocka API Service
 * Handles authentication and common API operations
 * 
 * API Documentation: https://github.com/metakocka/metakocka_api_base
 * Base URL: https://main.metakocka.si/rest/eshop/v1/
 * Dev URL: https://devmainsi.metakocka.si/rest/eshop/v1/
 */
@Injectable()
export class MetakockaService {
  private readonly logger = new Logger(MetakockaService.name);
  private readonly baseUrl: string;
  private readonly credentials: MetakockaCredentials;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Use development environment if configured
    const isDev = this.configService.get<string>('METAKOCKA_ENV') === 'development';
    this.baseUrl = isDev
      ? 'https://devmainsi.metakocka.si/rest/eshop/v1'
      : 'https://main.metakocka.si/rest/eshop/v1';

    this.credentials = {
      secret_key: this.configService.get<string>('METAKOCKA_SECRET_KEY', ''),
      company_id: this.configService.get<string>('METAKOCKA_COMPANY_ID', ''),
    };
  }

  /**
   * Get API credentials
   */
  getCredentials(): MetakockaCredentials {
    return { ...this.credentials };
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Make a POST request to MetaKocka API
   * @param endpoint - API endpoint (e.g., 'json/product_list', 'put_document')
   * @param data - Request payload
   * @param searchGroup - Optional search group for parallel search requests
   */
  async post<T extends MetakockaResponse>(
    endpoint: string,
    data: Record<string, any>,
    searchGroup?: number,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const payload = {
      ...this.credentials,
      ...data,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add search group header for parallel search support
    if (searchGroup !== undefined) {
      headers['searchGroup'] = searchGroup.toString();
    }

    this.logger.debug(`POST ${url}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.post<T>(url, payload, { headers }),
      );

      if (response.data.opr_code !== '0') {
        this.logger.error(
          `MetaKocka API Error: ${response.data.opr_desc || 'Unknown error'}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`MetaKocka API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate API response
   * @param response - API response
   * @returns true if operation was successful
   */
  isSuccess(response: MetakockaResponse): boolean {
    return response.opr_code === '0';
  }

  /**
   * Get error message from response
   * @param response - API response
   * @returns Error description or default message
   */
  getErrorMessage(response: MetakockaResponse): string {
    return response.opr_desc || `Operation failed with code: ${response.opr_code}`;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use warehouse_list as a simple test call
      const response = await this.post<MetakockaResponse>('json/warehouse_list', {});
      return this.isSuccess(response);
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }
}
