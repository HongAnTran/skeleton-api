import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchInvoiceDto } from '../dto/search-invoice.dto';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import { WarrantyInfoDto } from '../dto/warranty.dto';

interface KiotVietTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KiotVietInvoiceResponse {
  data: InvoiceResponseDto[];
  total: number;
}

interface GoogleScriptInvoiceResponse {
  id: number | null;
  code: string | null;
  createdDate: string;
  total: number;
  totalPayment: number;
  status: number | null;
  customer: {
    name: string;
    phone: string;
    address?: string;
  };
  invoiceDetails: Array<{
    productName: string;
    productGroup?: string;
    brand?: string;
    serialOrSku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  note?: string;
  warranty?: {
    packageName: string;
    date: string;
  };
}

@Injectable()
export class KiotVietService {
  private readonly logger = new Logger(KiotVietService.name);
  private readonly baseUrl = 'https://public.kiotapi.com';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get retailer(): string {
    return this.configService.get<string>('KIOTVIET_RETAILER');
  }

  private get clientId(): string {
    return this.configService.get<string>('KIOTVIET_CLIENT_ID');
  }

  private get clientSecret(): string {
    return this.configService.get<string>('KIOTVIET_CLIENT_SECRET');
  }

  /**
   * Lấy access token từ KiotViet
   */
  private async getAccessToken(): Promise<string> {
    // Kiểm tra token còn hợp lệ không
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<KiotVietTokenResponse>(
          `https://id.kiotviet.vn/connect/token`,
          new URLSearchParams({
            scopes: 'PublicApi.Access',
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      // Lưu thời gian hết hạn (trừ 60 giây để đảm bảo an toàn)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

      this.logger.log('Successfully obtained KiotViet access token');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get KiotViet access token', error);
      throw new HttpException(
        'Không thể kết nối tới KiotViet API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Kiểm tra xem input có phải là số điện thoại không
   */
  private isPhoneNumber(input: string): boolean {
    // Loại bỏ khoảng trắng và ký tự đặc biệt
    const cleaned = input.replace(/[\s\-\(\)]/g, '');
    // Kiểm tra nếu chỉ chứa số và có độ dài từ 9-11 ký tự
    return /^\d{9,11}$/.test(cleaned);
  }

  /**
   * Tìm hóa đơn theo số điện thoại hoặc serial/IMEI
   * Tự động nhận diện loại input và tìm kiếm tương ứng
   * Nếu không tìm thấy từ KiotViet, sẽ tìm trong Google Apps Script
   */
  async searchInvoices(
    searchDto: SearchInvoiceDto,
  ): Promise<InvoiceResponseDto[]> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'KiotViet chưa được cấu hình đầy đủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!searchDto.phoneOrSerial || !searchDto.phoneOrSerial.trim()) {
      throw new HttpException(
        'Vui lòng cung cấp số điện thoại hoặc serial/IMEI',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        Retailer: this.retailer,
        Authorization: `Bearer ${token}`,
      };

      const searchValue = searchDto.phoneOrSerial.trim();
      let invoices: InvoiceResponseDto[] = [];

      // Tự động nhận diện loại input
      if (this.isPhoneNumber(searchValue)) {
        // Tìm theo số điện thoại
        this.logger.log(`Searching by phone: ${searchValue}`);
        invoices = await this.searchInvoicesByPhone(searchValue, headers);
      } else {
        // Tìm theo serial/IMEI
        this.logger.log(`Searching by serial: ${searchValue}`);
        invoices = await this.searchInvoicesBySerial(searchValue, headers);
      }

      // Nếu không tìm thấy từ KiotViet, tìm trong Google Apps Script
      if (invoices.length === 0) {
        this.logger.log(
          `No invoices found in KiotViet, searching in Google Apps Script`,
        );
        const googleScriptInvoices =
          await this.searchInvoicesFromGoogleScript(searchValue);
        return googleScriptInvoices;
      }

      // Tính toán thông tin bảo hành cho mỗi hóa đơn
      return invoices.map((invoice) => this.calculateWarranty(invoice));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Failed to search invoices', error);
      throw new HttpException(
        'Không thể tra cứu hóa đơn từ KiotViet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tìm hóa đơn theo số điện thoại khách hàng
   */
  private async searchInvoicesByPhone(
    phone: string,
    headers: Record<string, string>,
  ): Promise<InvoiceResponseDto[]> {
    try {
      // Tìm khách hàng theo số điện thoại
      const customerResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/customers`, {
          headers,
          params: {
            includeRemoveIds: false,
            pageSize: 100,
            currentItem: 0,
            orderBy: 'CreatedDate',
            orderDirection: 'Desc',
            contactNumber: phone,
          },
        }),
      );

      const customers = customerResponse.data?.data || [];
      if (customers.length === 0) {
        return [];
      }

      // Lấy danh sách ID khách hàng
      const customerIds = customers.map((c: any) => c.id).join(',');

      // Tìm hóa đơn theo danh sách khách hàng
      const invoiceResponse = await firstValueFrom(
        this.httpService.get<KiotVietInvoiceResponse>(
          `${this.baseUrl}/invoices`,
          {
            headers,
            params: {
              format: 'json',
              pageSize: 100,
              currentItem: 0,
              customerIds: customerIds,
              status: 1,
            },
          },
        ),
      );

      return invoiceResponse.data?.data || [];
    } catch (error) {
      this.logger.error('Failed to search invoices by phone', error);
      throw error;
    }
  }

  /**
   * Tìm hóa đơn theo serial/IMEI
   */
  private async searchInvoicesBySerial(
    serial: string,
    headers: Record<string, string>,
  ): Promise<InvoiceResponseDto[]> {
    try {
      // Thử tìm bằng searchText trước (có thể API hỗ trợ tìm theo serial)
      const response = await firstValueFrom(
        this.httpService.get<KiotVietInvoiceResponse>(
          `${this.baseUrl}/invoices`,
          {
            headers,
            params: {
              format: 'json',
              pageSize: 100,
              currentItem: 0,
              searchText: serial,
              status: 1,
            },
          },
        ),
      );

      let allInvoices = response.data?.data || [];

      // Lọc các hóa đơn có chứa serial trong invoiceDetails
      const filteredInvoices = allInvoices.filter((invoice: any) => {
        if (!invoice.invoiceDetails || !Array.isArray(invoice.invoiceDetails)) {
          return false;
        }

        return invoice.invoiceDetails.some((detail: any) => {
          // Kiểm tra trong serialNumbers
          if (detail.serialNumbers && Array.isArray(detail.serialNumbers)) {
            return detail.serialNumbers.some(
              (s: string) =>
                s.toLowerCase().includes(serial.toLowerCase()) ||
                serial.toLowerCase().includes(s.toLowerCase()),
            );
          }
          // Kiểm tra trong productCode hoặc productName (nếu có)
          if (detail.productCode) {
            return detail.productCode
              .toLowerCase()
              .includes(serial.toLowerCase());
          }
          return false;
        });
      });

      return filteredInvoices;
    } catch (error) {
      this.logger.error('Failed to search invoices by serial', error);
      throw error;
    }
  }

  /**
   * Tìm hóa đơn từ Google Apps Script
   */
  private async searchInvoicesFromGoogleScript(
    phoneOrSerial: string,
  ): Promise<InvoiceResponseDto[]> {
    try {
      const googleScriptUrl =
        'https://script.google.com/macros/s/AKfycbzL-UWgvfzNM6F5gZ0-4E6mmjSFFWPZxu4NzHlD410wTj533yScbH4l6W5IFEEZv0Y/exec';

      const response = await firstValueFrom(
        this.httpService.get<GoogleScriptInvoiceResponse>(googleScriptUrl, {
          params: {
            phoneOrSerial: phoneOrSerial,
          },
        }),
      );

      // Kiểm tra nếu có lỗi hoặc không có dữ liệu
      if (!response.data || (response.data as any).error) {
        return [];
      }

      // Map response sang InvoiceResponseDto
      const invoice = this.mapGoogleScriptResponseToInvoiceDto(response.data);
      return invoice ? [invoice] : [];
    } catch (error) {
      this.logger.error(
        'Failed to search invoices from Google Apps Script',
        error,
      );
      // Không throw error, chỉ log và trả về mảng rỗng
      return [];
    }
  }

  /**
   * Map response từ Google Apps Script sang InvoiceResponseDto
   */
  private mapGoogleScriptResponseToInvoiceDto(
    data: GoogleScriptInvoiceResponse,
  ): InvoiceResponseDto | null {
    if (!data || !data.customer || !data.invoiceDetails) {
      return null;
    }

    // Map invoiceDetails
    const invoiceDetails = data.invoiceDetails.map((detail) => ({
      productId: 0, // Google Script không có productId
      productName: detail.productName || '',
      productCode: detail.serialOrSku || '',
      quantity: detail.quantity || 1,
      price: detail.price || 0,
      subTotal: detail.total || 0,
      serialNumbers: detail.serialOrSku ? [detail.serialOrSku] : [],
    }));

    // Map customer
    const customer = {
      id: 0, // Google Script không có customer id
      name: data.customer.name || '',
      contactNumber: data.customer.phone || '',
      email: undefined,
    };

    // Map warranty nếu có
    let warranty: WarrantyInfoDto | undefined;
    if (data.warranty && data.warranty.packageName && data.warranty.date) {
      const warrantyDays = parseInt(data.warranty.date, 10) || 0;
      const purchaseDate = new Date(data.createdDate);
      const warrantyStartDate = new Date(purchaseDate);
      warrantyStartDate.setHours(0, 0, 0, 0);

      const warrantyEndDate = new Date(warrantyStartDate);
      warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const remainingDays = Math.max(
        0,
        Math.ceil(
          (warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      warranty = {
        warrantyDays,
        warrantyStartDate: warrantyStartDate.toISOString(),
        warrantyEndDate: warrantyEndDate.toISOString(),
        remainingDays,
        warrantyType: data.warranty.packageName,
        status: remainingDays > 0 ? 'Còn hiệu lực' : 'Hết hạn',
      };
    }

    return {
      id: data.id || 0,
      code: data.code || '',
      createdDate: data.createdDate,
      total: data.total || 0,
      totalPayment: data.totalPayment || 0,
      status: data.status || undefined,
      customer,
      invoiceDetails,
      note: data.note,
      warranty,
    };
  }

  /**
   * Kiểm tra xem một sản phẩm có phải là sản phẩm bảo hành không
   */
  private isWarrantyProduct(productName: string): boolean {
    const warrantyTypes = [
      'Bảo Hành CARE⁺ PRO MAX',
      'Bảo Hành CARE⁺ PRO',
      'Bảo Hành Mở Rộng',
      'Bảo Hành Tiết Kiệm',
    ];

    const productNameLower = (productName || '').toLowerCase();
    return warrantyTypes.some((type) =>
      productNameLower.includes(type.toLowerCase()),
    );
  }

  /**
   * Tính toán thông tin bảo hành dựa trên sản phẩm trong hóa đơn
   */
  private calculateWarranty(invoice: InvoiceResponseDto): InvoiceResponseDto {
    // Định nghĩa các loại bảo hành và số ngày tương ứng
    // Sắp xếp theo thứ tự ưu tiên (số ngày cao nhất trước)
    const warrantyTypes: Array<{ name: string; days: number }> = [
      { name: 'Bảo Hành CARE⁺ PRO MAX', days: 365 },
      { name: 'Bảo Hành CARE⁺ PRO', days: 180 },
      { name: 'Bảo Hành Mở Rộng', days: 90 },
      { name: 'Bảo Hành Tiết Kiệm', days: 0 },
    ];

    // Tìm sản phẩm bảo hành trong hóa đơn
    let warrantyDays = 0;
    let warrantyType = '';

    // Duyệt qua tất cả sản phẩm trong hóa đơn
    for (const detail of invoice.invoiceDetails || []) {
      const productName = (detail.productName || '').toLowerCase();

      // Kiểm tra từng loại bảo hành (ưu tiên loại có số ngày cao nhất)
      for (const warranty of warrantyTypes) {
        const warrantyNameLower = warranty.name.toLowerCase();

        // Kiểm tra nếu tên sản phẩm chứa tên bảo hành
        if (productName.includes(warrantyNameLower)) {
          // Chỉ cập nhật nếu loại bảo hành này có số ngày cao hơn
          if (warranty.days > warrantyDays) {
            warrantyDays = warranty.days;
            warrantyType = warranty.name;
          }
          break; // Đã tìm thấy match, không cần kiểm tra các loại khác
        }
      }
    }

    // Lọc bỏ các sản phẩm bảo hành khỏi invoiceDetails
    const filteredInvoiceDetails = (invoice.invoiceDetails || []).filter(
      (detail) => !this.isWarrantyProduct(detail.productName || ''),
    );

    // Nếu không tìm thấy sản phẩm bảo hành hoặc bảo hành = 0 ngày, chỉ lọc invoiceDetails
    if (warrantyDays === 0) {
      return {
        ...invoice,
        invoiceDetails: filteredInvoiceDetails,
      };
    }

    // Tính toán thông tin bảo hành
    const purchaseDate = new Date(invoice.createdDate);
    const warrantyStartDate = new Date(purchaseDate);
    warrantyStartDate.setHours(0, 0, 0, 0);

    const warrantyEndDate = new Date(warrantyStartDate);
    warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const remainingDays = Math.max(
      0,
      Math.ceil(
        (warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const status = remainingDays > 0 ? 'Còn hiệu lực' : 'Hết hạn';

    // Tạo thông tin bảo hành
    const warrantyInfo: WarrantyInfoDto = {
      warrantyDays,
      warrantyStartDate: warrantyStartDate.toISOString(),
      warrantyEndDate: warrantyEndDate.toISOString(),
      remainingDays,
      warrantyType,
      status,
    };

    // Thêm thông tin bảo hành vào hóa đơn và loại bỏ sản phẩm bảo hành khỏi invoiceDetails
    return {
      ...invoice,
      invoiceDetails: filteredInvoiceDetails,
      warranty: warrantyInfo,
    };
  }
}
