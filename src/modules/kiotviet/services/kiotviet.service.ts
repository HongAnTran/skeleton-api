import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Telegraf } from 'telegraf';
import { firstValueFrom } from 'rxjs';
import { VoucherConditionType, VoucherRule } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { SearchInvoiceDto } from '../dto/search-invoice.dto';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import { WarrantyInfoDto } from '../dto/warranty.dto';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { GetUsersResponseDto, KiotVietUserDto } from '../dto/user-response.dto';
import { GetInvoicesByUserQueryDto } from '../dto/get-invoices-by-user.dto';
import {
  GetInvoicesByUserResponseDto,
  IphoneSalesReportDto,
  UserInvoicesReportDto,
} from '../dto/get-invoices-by-user.dto';
import {
  KiotVietWebhookExampleDto,
  KiotVietWebhookInvoiceDataDto,
  KiotVietWebhookInvoiceDetailDto,
} from 'src/modules/kiotviet/dto/kiotviet-webhook.dto';
import {
  VoucherResponseDto,
  VoucherCandidateDto,
  VoucherDto,
} from '../dto/voucher-response.dto';

interface KiotVietTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface KiotVietInvoiceResponse {
  data: InvoiceResponseDto[];
  total: number;
}

/** Raw invoice từ API KiotViet (có thêm soldById) */
interface KiotVietRawInvoice extends InvoiceResponseDto {
  soldById?: number;
}

interface KiotVietUsersApiResponse {
  total: number;
  pageSize: number;
  data: Array<
    KiotVietUserDto & {
      isAdmin?: boolean;
    }
  >;
  removeIds?: number[];
}


/** GET /trademark — danh mục thương hiệu (tài liệu 2.25). */
interface KiotVietTrademarkListResponse {
  total: number;
  pageSize: number;
  data: Array<{
    tradeMarkId: number;
    tradeMarkName: string;
    createdDate?: string;
    modifiedDate?: string;
  }>;
}

type IphoneMarketKind = 'lock' | 'international' | 'unknown';

interface IphoneReportAgg {
  totalIphoneUnits: number;
  byMarket: { lock: number; international: number; unknown: number };
  byModel: Map<
    string,
    {
      quantity: number;
      lock: number;
      international: number;
      unknown: number;
    }
  >;
  byStorage: Map<string, number>;
  byColor: Map<string, number>;
  detailRows: Map<
    string,
    {
      modelName: string;
      storage: string;
      color: string;
      marketType: IphoneMarketKind;
      productGroup?: string;
      quantity: number;
    }
  >;
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
  /** Telegraf chỉ dùng `telegram.sendMessage` (không `launch`). */
  private telegramBot: Telegraf | null = null;
  private telegramBotToken: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

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
   * Xử lý payload sau khi đã xác minh chữ ký: gửi thông báo bán hàng vào group Telegram (nếu đã cấu hình).
   */
  async handleWebhookPayload(body: KiotVietWebhookExampleDto): Promise<void> {
    try {
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      const chatId = this.configService.get<string>('TELEGRAM_GROUP_CHAT_ID');
      const chatId2 = this.configService.get<string>('TELEGRAM_GROUP_CHAT_ID_2');
      if (!token?.trim() || !chatId?.trim()) {
        this.logger.warn(
          'Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_GROUP_CHAT_ID — bỏ qua gửi Telegram',
        );
        return;
      }

      this.logger.log('handleWebhookPayload', body.Notifications[0].Data[0].InvoiceDetails);

      // check xem PurchaseDate phải là thuộc ngày hôm nay thì mới xử lí


      /** 1: hoàn thành, 2: đã hủy (KiotVietWebhookInvoiceDataDto). */
      const NOTIFY_STATUSES = new Set([1, 2]);

      for (const notification of body.Notifications ?? []) {
        for (const invoice of notification.Data ?? []) {
          if (!NOTIFY_STATUSES.has(invoice.Status)) {
            continue;
          }
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const purchaseDate = new Date(invoice.PurchaseDate);
          purchaseDate.setHours(0, 0, 0, 0);
          if (purchaseDate.getTime() !== today.getTime()) {
            continue;
          }
          const html =
            invoice.Status === 2
              ? this.buildCancelledInvoiceTelegramHtml(invoice)
              : await this.buildSaleNotificationTelegramHtml(invoice);
          await this.sendTelegramMessage(token.trim(), chatId.trim(), html, chatId2.trim());
        }
      }
    } catch (error) {
      this.logger.error('handleWebhookPayload failed', error);
    }
  }

  private getTelegraf(botToken: string): Telegraf {
    if (this.telegramBotToken !== botToken || !this.telegramBot) {
      this.telegramBot = new Telegraf(botToken);
      this.telegramBotToken = botToken;
    }
    return this.telegramBot;
  }

  private escapeTelegramHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Rich text KiotViet (thường bọc &lt;p&gt;…&lt;/p&gt;) — bỏ thẻ, giữ nội dung đọc được trên Telegram. */
  private stripHtmlToPlainText(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /** dd/mm/yyyy theo Asia/Ho_Chi_Minh */
  private formatSaleDateVi(isoDate: string | undefined): string {
    const d = isoDate ? new Date(isoDate) : new Date();
    if (Number.isNaN(d.getTime())) return this.formatSaleDateVi(undefined);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  }

  private lineImeiOrSerial(detail: KiotVietWebhookInvoiceDetailDto): string {
    const serials = detail.SerialNumbers?.filter(Boolean).join(', ');
    if (serials) return serials;
    const raw = detail as KiotVietWebhookInvoiceDetailDto & {
      SerialNumber?: string;
      IMEI?: string;
    };
    if (raw.SerialNumber?.trim()) return raw.SerialNumber.trim();
    if (raw.IMEI?.trim()) return raw.IMEI.trim();
    return detail.ProductCode?.trim() || '—';
  }

  /** Chỉ sản phẩm chính (máy): bỏ gói bảo hành và phụ kiện — cùng tiêu chí phần bảo hành/phụ kiện. */
  private filterMainProductLines(
    details: KiotVietWebhookInvoiceDetailDto[],
  ): KiotVietWebhookInvoiceDetailDto[] {
    return details.filter((d) => {
      if (this.isWarrantyProduct(d.ProductName || '')) return false;
      const code = String(d.ProductCode ?? '').trim();
      if (!this.isImeiLike(code)) return false;
      return true;
    });
  }


  /**
   * GET /trademark (phân trang), luôn gọi API mới — tra `tradeMarkId`, dừng khi tìm thấy.
   */
  private async fetchTrademarkNameById(tradeMarkId: number): Promise<string> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      return '';
    }
    try {
      const pageSize = 100;
      let currentItem = 0;
      let total = Number.POSITIVE_INFINITY;
      const token = await this.getAccessToken();
      const headers = {
        Retailer: this.retailer,
        Authorization: `Bearer ${token}`,
      };

      while (currentItem < total) {
        const res = await firstValueFrom(
          this.httpService.get<KiotVietTrademarkListResponse>(
            `${this.baseUrl}/trademark`,
            {
              headers,
              params: {
                pageSize,
                currentItem,
                orderBy: 'name',
                orderDirection: 'Asc',
              },
            },
          ),
        );
        const payload = res.data;
        total = payload?.total ?? 0;
        const rows = payload?.data ?? [];
        for (const row of rows) {
          const r = row as unknown as Record<string, unknown>;
          const idRaw = r.tradeMarkId ?? r.TradeMarkId;
          const nameRaw = r.tradeMarkName ?? r.TradeMarkName;
          const id =
            typeof idRaw === 'number' && Number.isFinite(idRaw)
              ? idRaw
              : undefined;
          const name =
            typeof nameRaw === 'string'
              ? nameRaw.trim()
              : nameRaw != null
                ? String(nameRaw).trim()
                : '';
          if (id === tradeMarkId && name) {
            return name;
          }
        }
        if (rows.length === 0) {
          break;
        }
        currentItem += rows.length;
        if (rows.length < pageSize) {
          break;
        }
      }
    } catch (err) {
      this.logger.error('Failed to fetch KiotViet trademark list', err);
    }
    return '';
  }

  /**
   * GET /products/{id} — mô tả + thương hiệu (tên từ GET /trademark theo tradeMarkId/brandId trên sản phẩm).
   */
  private async fetchProductDescriptionForLine(
    detail: KiotVietWebhookInvoiceDetailDto,
  ): Promise<{ brand: string, categoryName: string }> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      return { brand: '', categoryName: '' };
    }

    const product = await firstValueFrom(
      this.httpService.get<{ tradeMarkId: number, categoryName: string }>(
        `${this.baseUrl}/products/${detail.ProductId}`,
        {
          headers: {
            Retailer: this.retailer,
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
        },
      ),
    );

    const tradeMarkId = product.data?.tradeMarkId || 0

    let categoryName = product.data?.categoryName || '';


    let brand = '';
    if (tradeMarkId) {
      brand =
        (await this.fetchTrademarkNameById(tradeMarkId));
    }

    return { brand, categoryName };
  }

  private async buildProductSectionHtml(
    invoice: KiotVietWebhookInvoiceDataDto,
  ): Promise<string> {
    const allLines = invoice.InvoiceDetails ?? [];
    if (allLines.length === 0) return '—';

    const lines = this.filterMainProductLines(allLines);
    if (lines.length === 0) {
      return '';
    }

    const blocks = await Promise.all(
      lines.map(async (d) => {
        const name = this.escapeTelegramHtml(d.ProductName || '—');
        const imei = this.escapeTelegramHtml(this.lineImeiOrSerial(d));

        const price = d.Price - d.Discount;
        const priceStr = price > 0 ? `${price.toLocaleString('vi-VN')}k` : '—';
        const { brand, categoryName } =
          await this.fetchProductDescriptionForLine(d);
        let block =
          `<b>Tên Sản Phẩm:</b> ${name}\n` +
          `<b>Số IMEI:</b> ${imei}\n`;
        if (brand.trim()) {
          block += `<b>Mô Tả:</b> ${this.escapeTelegramHtml(brand.trim())}, ${categoryName.trim()}\n`;
        }
        block += `<b>Giá:</b> ${priceStr}\n`;
        return block;
      }),
    );

    return blocks.join('\n\n');
  }

  private async fetchCustomerInfo(
    customerId: number,
  ): Promise<string> {


    if (!this.retailer || !this.clientId || !this.clientSecret) {
      return '';
    }

    const customer = await firstValueFrom(
      this.httpService.get<{ name: string, contactNumber: string, email: string, address: string, code: string, birthDate: string }>(
        `${this.baseUrl}/customers/${customerId}`,
        {
          headers: {
            Retailer: this.retailer,
            Authorization: `Bearer ${await this.getAccessToken()}`,
          }
        },
      ),
    );

    const contactNumber = customer.data.contactNumber ? `${customer.data.contactNumber}` : '';
    const address = customer.data.address ? customer.data.address : '';
    const birthDate = customer.data.birthDate ? customer.data.birthDate : '';

    const birthDateStr = birthDate ? new Date(birthDate).toLocaleDateString('vi-VN') : '';




    return customer.data.name + '\n' + contactNumber + '\n' + address + '\n' + birthDateStr;
  }

  private async buildCustomerSectionHtml(invoice: KiotVietWebhookInvoiceDataDto): Promise<string> {
    if (invoice.CustomerId == null) {
      return invoice.CustomerName?.trim() ?? '';
    }
    return this.fetchCustomerInfo(invoice.CustomerId);
  }

  /** Hóa đơn đã hủy: chỉ báo mã HĐ + nhân viên. */
  private buildCancelledInvoiceTelegramHtml(
    invoice: KiotVietWebhookInvoiceDataDto,
  ): string {
    const code = this.escapeTelegramHtml(invoice.Code || '—');
    const staff = this.escapeTelegramHtml(invoice.SoldByName || '—');
    return (
      `Hóa đơn mã <b>${code}</b> được bán bởi <b>${staff}</b> đã bị hủy.`
    );
  }

  /**
   * Bảo hành + phụ kiện từ InvoiceDetails (cùng tiêu chí isWarrantyProduct / bậc ngày như calculateWarranty;
   * phụ kiện: dòng không phải bảo hành và mã không dạng IMEI, giống logic báo cáo).
   */
  private buildWarrantyAndAccessorySectionHtml(
    invoice: KiotVietWebhookInvoiceDataDto,
  ): string {
    const details = invoice.InvoiceDetails ?? [];
    const warrantyLines = details.filter((d) =>
      this.isWarrantyProduct(d.ProductName || ''),
    );
    const accessoryLines = details.filter((d) => {
      if (this.isWarrantyProduct(d.ProductName || '')) return false;
      const code = String(d.ProductCode ?? '').trim();
      if (this.isImeiLike(code)) return false;
      return true;
    });

    const parts: string[] = [];

    if (warrantyLines.length > 0) {
      for (const d of warrantyLines) {
        const name = this.escapeTelegramHtml(d.ProductName || '—');
        const qty = d.Quantity ?? 0;
        const price = d.Price ?? 0;
        const sub = price * qty;
        const discount = d.Discount ?? 0;
        const subAfterDiscount = sub - discount;
        const money =
          subAfterDiscount > 0 ? ` — ${subAfterDiscount.toLocaleString('vi-VN')}k` : '';
        parts.push(`${name} ${money}`);
      }

      if (accessoryLines.length > 0) {
        if (parts.length > 0) parts.push('');
        for (const d of accessoryLines) {
          const name = this.escapeTelegramHtml(d.ProductName || '—');
          const qty = d.Quantity ?? 0;
          const price = d.Price ?? 0;
          const sub = price * qty;
          const discount = d.Discount ?? 0;
          const subAfterDiscount = sub - discount;
          const money =
            subAfterDiscount > 0 ? ` — ${subAfterDiscount.toLocaleString('vi-VN')}k` : '';
          parts.push(`${name} ${money}`);
        }
      }

      if (parts.length === 0) {
        return (
          ''
        );
      }

      return parts.join('\n');
    }
    return '';
  }

  /**
   * Nội dung HTML (parse_mode HTML) theo mẫu tin bán hàng (💎 từng khối: NV — Đơn — KH).
   */
  private async buildSaleNotificationTelegramHtml(
    invoice: KiotVietWebhookInvoiceDataDto,
  ): Promise<string> {
    const saleDate = this.escapeTelegramHtml(
      this.formatSaleDateVi(invoice.PurchaseDate),
    );
    const staff = this.escapeTelegramHtml(invoice.SoldByName || '—');
    const products = await this.buildProductSectionHtml(invoice);
    const warrantyBlock = this.buildWarrantyAndAccessorySectionHtml(invoice);
    const invoiceNote = invoice.Description?.trim()
      ? this.escapeTelegramHtml(
        this.stripHtmlToPlainText(invoice.Description.trim()),
      )
      : '—';
    const customer = await this.buildCustomerSectionHtml(invoice);

    const invoiceCodeEsc = this.escapeTelegramHtml(invoice.Code || '—');
    const customerCodeEsc = this.escapeTelegramHtml(
      invoice.CustomerCode || '—',
    );

    const productBody = products.trim() ? products : '—';
    const orderBlock = [
      `<b>💎 THÔNG TIN ĐƠN HÀNG 💎</b>`,
      `- <b>MÃ HOÁ ĐƠN:</b> ${invoiceCodeEsc}`,
      productBody,
    ].join('\n');

    const warrantyText = String(warrantyBlock ?? '').trim();
    const totalRaw = invoice.Total ?? invoice.TotalPayment ?? 0;
    const totalStr =
      totalRaw > 0
        ? `${Number(totalRaw).toLocaleString('vi-VN')}k`
        : '—';

    const customerLines = customer.trim()
      ? this.escapeTelegramHtml(customer)
      : this.escapeTelegramHtml(invoice.CustomerName?.trim() || '—');

    const parts: string[] = [
      `<b>NGÀY BÁN HÀNG:</b> ${saleDate}`,
      '',
      `<b>💎 THÔNG TIN NHÂN VIÊN 💎</b>`,
      '',
      `<b>NHÂN VIÊN BÁN HÀNG:</b> ${staff}`,
      '',
      orderBlock,
    ];

    if (warrantyText) {
      parts.push('');
      parts.push(`<b>BẢO HÀNH / PHỤ KIỆN:</b>`);
      parts.push(warrantyText);
    }

    parts.push('');
    parts.push(`<b>TỔNG TIỀN:</b> ${totalStr}`);
    parts.push('');
    parts.push(`<b>💎 THÔNG TIN KHÁCH HÀNG 💎</b>`);
    parts.push('');
    parts.push(`- <b>MÃ KHÁCH HÀNG:</b> ${customerCodeEsc}`);
    parts.push(`<b>KHÁCH HÀNG:</b>`);
    parts.push(customerLines);
    parts.push('');
    parts.push(`<b>GHI CHÚ:</b> ${invoiceNote}`);

    return parts.join('\n');
  }

  private async sendTelegramMessage(
    botToken: string,
    chatId: string,
    text: string,
    chatId2: string,
  ): Promise<void> {

    try {
      const bot = this.getTelegraf(botToken);
      // vieets promise all cái nào lỗi thì bỏ qua
      await Promise.all([
        bot.telegram.sendMessage(chatId, text, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
        bot.telegram.sendMessage(chatId2, text, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
      ]);
    } catch (error) {
      this.logger.error('Gửi Telegram thất bại', error);
    }
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
   * Lấy danh sách người dùng của cửa hàng.
   * Chỉ trả về user đã xác nhận, không bao gồm Super Admin (isAdmin = true).
   */
  async getUsers(query: GetUsersQueryDto): Promise<GetUsersResponseDto> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'KiotViet chưa được cấu hình đầy đủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        Retailer: this.retailer,
        Authorization: `Bearer ${token}`,
      };

      const params: Record<string, string | number | boolean | undefined> = {};
      if (query.lastModifiedFrom != null)
        params.lastModifiedFrom = query.lastModifiedFrom;
      if (query.pageSize != null) params.pageSize = query.pageSize;
      if (query.currentItem != null) params.currentItem = query.currentItem;
      if (query.orderBy != null) params.orderBy = query.orderBy;
      if (query.orderDirection != null)
        params.orderDirection = query.orderDirection;
      if (query.includeRemoveIds != null)
        params.includeRemoveIds = query.includeRemoveIds;

      const response = await firstValueFrom(
        this.httpService.get<KiotVietUsersApiResponse>(
          `${this.baseUrl}/users`,
          { headers, params },
        ),
      );

      const rawData = response.data?.data ?? [];
      const total = response.data?.total ?? 0;
      const pageSize = response.data?.pageSize ?? query.pageSize ?? 20;

      // Loại bỏ Super Admin (isAdmin = true)
      const data = rawData
        .filter((user) => user.isAdmin !== true)
        .map(
          (user): KiotVietUserDto => ({
            id: user.id,
            userName: user.userName,
            givenName: user.givenName,
            address: user.address,
            mobilePhone: user.mobilePhone,
            email: user.email,
            description: user.description,
            retailerId: user.retailerId,
            birthDate: user.birthDate,
            createdDate: user.createdDate,
          }),
        );

      const result: GetUsersResponseDto = {
        total,
        pageSize,
        data,
      };
      if (response.data?.removeIds != null) {
        result.removeIds = response.data.removeIds;
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to get users', error);
      throw new HttpException(
        'Không thể lấy danh sách người dùng từ KiotViet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy toàn bộ hóa đơn trong khoảng thời gian (phân trang 100/item).
   * Nếu có userId thì lọc theo soldById; không có thì giữ toàn bộ và tính báo cáo trên tập đó.
   */
  async getInvoicesByUser(
    query: GetInvoicesByUserQueryDto,
  ): Promise<GetInvoicesByUserResponseDto> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'KiotViet chưa được cấu hình đầy đủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        Retailer: this.retailer,
        Authorization: `Bearer ${token}`,
      };

      const pageSize = 100;
      let currentItem = 0;
      const allInvoices: KiotVietRawInvoice[] = [];
      let totalFromApi: number | null = null;

      // Gọi API theo trang (tối đa 100/item) cho đến khi lấy hết
      do {
        const params: Record<string, string | number> = {
          format: 'json',
          pageSize,
          currentItem,
          status: 1, // đơn đã xác nhận
        };
        if (query.fromPurchaseDate)
          params.fromPurchaseDate = query.fromPurchaseDate;
        if (query.toPurchaseDate) params.toPurchaseDate = query.toPurchaseDate;

        const response = await firstValueFrom(
          this.httpService.get<{ data: KiotVietRawInvoice[]; total: number }>(
            `${this.baseUrl}/invoices`,
            { headers, params },
          ),
        );

        const pageData = response.data?.data ?? [];
        if (totalFromApi == null) totalFromApi = response.data?.total ?? 0;

        allInvoices.push(...pageData);

        if (
          pageData.length < pageSize ||
          allInvoices.length >= (totalFromApi || 0)
        ) {
          break;
        }
        currentItem += pageSize;
      } while (true);

      // Lọc theo userId khi có (API không hỗ trợ filter soldById nên lọc phía backend)
      const invoicesForReport =
        query.userId != null
          ? allInvoices.filter((inv) => {
            const soldBy = (inv as any).soldById;
            return (
              soldBy != null && Number(soldBy) === Number(query.userId)
            );
          })
          : allInvoices;

      const exchangeInvoiceCount = invoicesForReport.filter((inv) =>
        this.isExchangeInvoiceCode(inv.code),
      ).length;
      const invoicesEligible = invoicesForReport.filter(
        (inv) => !this.isExchangeInvoiceCode(inv.code),
      );

      // Tính report từ invoiceDetails trước khi calculateWarranty (vì calculateWarranty sẽ loại bỏ sản phẩm bảo hành)
      let accessoryRevenue = 0;
      let warrantyRevenue = 0;
      let warrantyQuantity = 0;
      let iphoneQuantity = 0;
      const iphoneAgg = this.createEmptyIphoneReportAgg();
      const warrantyBreakdownMap = new Map<
        string,
        {
          warrantyType: string;
          quantity: number;
          revenue: number;
          orderIds: Set<number>;
        }
      >();

      const data: InvoiceResponseDto[] = invoicesEligible.map((inv) => {
        const details = (inv as any).invoiceDetails ?? [];

        const warrantyLines = details.filter((d: any) =>
          this.isWarrantyProduct(d?.productName || ''),
        );
        const nonWarrantyLines = details.filter(
          (d: any) => !this.isWarrantyProduct(d?.productName || ''),
        );

        // Tổng số lượng iPhone bán ra (1 hoá đơn có thể bán nhiều máy)
        iphoneQuantity += nonWarrantyLines.reduce((sum: number, d: any) => {
          const code = String(d?.productCode ?? '').trim();
          if (!this.isImeiLike(code)) return sum;
          return sum + Number(d?.quantity ?? 0);
        }, 0);

        for (const d of nonWarrantyLines) {
          this.accumulateIphoneReportLine(d, iphoneAgg);
        }

        warrantyRevenue += warrantyLines.reduce(
          (sum: number, d: any) => sum + Number(d?.subTotal ?? 0),
          0,
        );
        warrantyQuantity += warrantyLines.reduce(
          (sum: number, d: any) => sum + Number(d?.quantity ?? 0),
          0,
        );

        // Breakdown theo từng loại bảo hành
        for (const d of warrantyLines) {
          const type = this.getWarrantyTypeFromProductName(
            d?.productName || '',
          );
          if (!type) continue;
          const key = type;
          const existing = warrantyBreakdownMap.get(key) ?? {
            warrantyType: key,
            quantity: 0,
            revenue: 0,
            orderIds: new Set<number>(),
          };

          existing.quantity += Number(d?.quantity ?? 0);
          existing.revenue += Number(d?.subTotal ?? 0);
          if ((inv as any).id != null)
            existing.orderIds.add(Number((inv as any).id));

          warrantyBreakdownMap.set(key, existing);
        }

        // Sản phẩm chính: dòng non-warranty có subTotal lớn nhất; phụ kiện: phần còn lại
        if (nonWarrantyLines.length > 0) {
          accessoryRevenue += nonWarrantyLines.reduce((sum: number, d: any) => {
            // Product code dạng IMEI (chuỗi số dài) => không phải phụ kiện
            const code = String(d?.productCode ?? '').trim();
            if (this.isImeiLike(code)) return sum;

            return sum + Number(d?.subTotal ?? 0);
          }, 0);
        }

        return this.calculateWarranty(inv as InvoiceResponseDto);
      });

      const totalValue = data.reduce(
        (sum, inv) => sum + (inv.total ?? 0),
        0,
      );
      const warrantyOrderCount = data.filter(
        (inv) => inv.warranty != null,
      ).length;

      const report: UserInvoicesReportDto = {
        totalOrders: iphoneQuantity,
        totalValue,
        accessoryRevenue,
        warrantyRevenue,
        warrantyOrderCount,
        exchangeInvoiceCount,
        warrantyQuantity,
        warrantyBreakdown: Array.from(warrantyBreakdownMap.values()).map(
          (x) => ({
            warrantyType: x.warrantyType,
            quantity: x.quantity,
            revenue: x.revenue,
            orderCount: x.orderIds.size,
          }),
        ),
        revenue: totalValue,
        iphoneReport: this.finalizeIphoneReport(iphoneAgg),
      };

      return { data, report };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to get invoices by user', error);
      throw new HttpException(
        'Không thể lấy danh sách hóa đơn từ KiotViet',
        HttpStatus.INTERNAL_SERVER_ERROR,
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
   * Kiểm tra input có giống IMEI không (chuỗi số dài, ví dụ 357137340314839)
   */
  private isImeiLike(input: string): boolean {
    const cleaned = String(input ?? '').replace(/[\s\-\(\)]/g, '');
    // IMEI thường là 15 số; thực tế có thể gặp dải 14-18 (tuỳ nguồn dữ liệu)
    return /^\d{14,18}$/.test(cleaned);
  }

  /**
   * Hóa đơn đổi: mã bắt đầu bằng HDD và có hậu tố _TH + chuỗi số (ví dụ HDD_TH000073).
   */
  private isExchangeInvoiceCode(code: string | undefined | null): boolean {
    const c = String(code ?? '').trim();
    return /^hdd.*_th\d+$/i.test(c);
  }

  private createEmptyIphoneReportAgg(): IphoneReportAgg {
    return {
      totalIphoneUnits: 0,
      byMarket: { lock: 0, international: 0, unknown: 0 },
      byModel: new Map(),
      byStorage: new Map(),
      byColor: new Map(),
      detailRows: new Map(),
    };
  }

  /**
   * Parse productName dạng "iPhone 16 Pro Max 256GB Desert Titanium"
   * → model, dung lượng, màu (phần sau dung lượng).
   * Chấp nhận cả "Phone …" (nhập thiếu chữ "i") và chuẩn hoá modelName thành "iPhone …".
   */
  private parseIphoneProductName(productName: string): {
    modelName: string;
    storage: string;
    color: string;
  } | null {
    const raw = (productName || '').trim();
    if (!/^i?phone\s/i.test(raw)) return null;
    // Chuẩn hoá: đảm bảo bắt đầu bằng "iPhone" (thêm "i" nếu thiếu)
    const normalised = /^phone\s/i.test(raw) ? `iPhone ${raw.slice(6)}` : raw;
    // Chuẩn hoá storage token: "1T GB" → "1TB", "256 GB" → "256GB", "1 TB" → "1TB"
    const preprocessed = normalised
      .replace(/(\d(?:\.\d+)?)\s*T\s+GB/gi, '$1TB')
      .replace(/(\d(?:\.\d+)?)\s+(GB|TB)/gi, '$1$2');
    const storageMatch = preprocessed.match(/(\d+(?:\.\d+)?)(GB|TB)/i);
    if (!storageMatch) return null;
    const storageToken = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
    const idx = preprocessed.indexOf(storageMatch[0]);
    if (idx <= 0) return null;
    const modelName = preprocessed.slice(0, idx).trim();
    const color = preprocessed.slice(idx + storageMatch[0].length).trim();
    if (!modelName || !color) return null;
    return { modelName, storage: storageToken, color };
  }

  /**
   * Lock: nhóm New L / Used L. Quốc tế: New Q / Used Q (theo productGroup KiotViet).
   */
  private classifyIphoneMarketFromGroup(
    productGroup: string,
  ): IphoneMarketKind {
    const norm = (productGroup || '').trim().replace(/\s+/g, ' ');
    if (!norm) return 'unknown';
    const lockRe = /(?:^|[\s,/])(?:new|used)\s+L(?=\s|$|,|\/)/i;
    const intlRe = /(?:^|[\s,/])(?:new|used)\s+Q(?=\s|$|,|\/)/i;
    if (lockRe.test(norm)) return 'lock';
    if (intlRe.test(norm)) return 'international';
    if (/\block\b/i.test(norm) && !/(quốc\s*tế|quoc\s*te)/i.test(norm)) {
      return 'lock';
    }
    if (/(quốc\s*tế|quoc\s*te)/i.test(norm)) return 'international';
    return 'unknown';
  }

  private accumulateIphoneReportLine(
    d: any,
    agg: IphoneReportAgg,
  ): void {
    const code = String(d?.productCode ?? '').trim();
    if (!this.isImeiLike(code)) return;

    const productName = String(d?.productName ?? '');

    const parsed = this.parseIphoneProductName(productName);
    if (!parsed) return;

    const qty = Number(d?.quantity ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) return;

    const productGroup = String(
      d?.categoryName ?? '',
    ).trim();
    const market = this.classifyIphoneMarketFromGroup(productGroup);

    agg.totalIphoneUnits += qty;
    if (market === 'lock') agg.byMarket.lock += qty;
    else if (market === 'international') agg.byMarket.international += qty;
    else agg.byMarket.unknown += qty;

    const m = agg.byModel.get(parsed.modelName) ?? {
      quantity: 0,
      lock: 0,
      international: 0,
      unknown: 0,
    };
    m.quantity += qty;
    if (market === 'lock') m.lock += qty;
    else if (market === 'international') m.international += qty;
    else m.unknown += qty;
    agg.byModel.set(parsed.modelName, m);

    const stKey = parsed.storage;
    agg.byStorage.set(stKey, (agg.byStorage.get(stKey) ?? 0) + qty);

    const cKey = parsed.color;
    agg.byColor.set(cKey, (agg.byColor.get(cKey) ?? 0) + qty);

    const dKey = [parsed.modelName, parsed.storage, parsed.color, market].join(
      '\0',
    );
    const existing = agg.detailRows.get(dKey);
    if (existing) {
      existing.quantity += qty;
      if (!existing.productGroup && productGroup) {
        existing.productGroup = productGroup;
      }
    } else {
      agg.detailRows.set(dKey, {
        modelName: parsed.modelName,
        storage: parsed.storage,
        color: parsed.color,
        marketType: market,
        productGroup: productGroup || undefined,
        quantity: qty,
      });
    }
  }

  private finalizeIphoneReport(agg: IphoneReportAgg): IphoneSalesReportDto {
    const byModel = Array.from(agg.byModel.entries())
      .map(([modelName, v]) => ({
        modelName,
        quantity: v.quantity,
        lockQuantity: v.lock,
        internationalQuantity: v.international,
        unknownMarketQuantity: v.unknown,
      }))
      .sort((a, b) => a.modelName.localeCompare(b.modelName, 'vi'));

    const byStorage = Array.from(agg.byStorage.entries())
      .map(([storage, quantity]) => ({ storage, quantity }))
      .sort(
        (a, b) =>
          b.quantity - a.quantity || a.storage.localeCompare(b.storage, 'vi'),
      );

    const byColor = Array.from(agg.byColor.entries())
      .map(([color, quantity]) => ({ color, quantity }))
      .sort(
        (a, b) =>
          b.quantity - a.quantity || a.color.localeCompare(b.color, 'vi'),
      );

    const detailRows = Array.from(agg.detailRows.values()).sort((a, b) => {
      const m = a.modelName.localeCompare(b.modelName, 'vi');
      if (m !== 0) return m;
      const s = a.storage.localeCompare(b.storage, 'vi');
      if (s !== 0) return s;
      const c = a.color.localeCompare(b.color, 'vi');
      if (c !== 0) return c;
      return a.marketType.localeCompare(b.marketType);
    });

    return {
      totalIphoneUnits: agg.totalIphoneUnits,
      byMarket: {
        lockQuantity: agg.byMarket.lock,
        internationalQuantity: agg.byMarket.international,
        unknownMarketQuantity: agg.byMarket.unknown,
      },
      byModel,
      byStorage,
      byColor,
      detailRows,
    };
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

      try {
        // Nếu không tìm thấy từ KiotViet, tìm trong Google Apps Script
        if (invoices.length === 0) {
          const googleScriptInvoices =
            await this.searchInvoicesFromGoogleScript(searchValue);
          return googleScriptInvoices;
        }
      } catch {
        return [];
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

      const allInvoices = response.data?.data || [];

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
        'https://script.google.com/macros/s/AKfycbxccioFGEPfzL0yRc51iokwjr0NeizWn3VOLDGlfRt8KV4-UVLqm0oZPLJGWn4j_XBN/exec';

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
      customerId: 0,
      customerCode: '',
      customerName: data.customer.name || '',
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

  private getWarrantyTypeFromProductName(productName: string): string | null {
    const warrantyTypes = [
      'Bảo Hành CARE⁺ PRO MAX',
      'Bảo Hành CARE⁺ PRO',
      'Bảo Hành Mở Rộng',
      'Bảo Hành Tiết Kiệm',
    ];

    const productNameLower = (productName || '').toLowerCase();
    const matched = warrantyTypes.find((type) =>
      productNameLower.includes(type.toLowerCase()),
    );
    return matched ?? null;
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

  // ---------------------------------------------------------------------------
  // Voucher rules — đánh giá từng rule dựa trên conditionType + conditionParams
  // ---------------------------------------------------------------------------

  /**
   * Kiểm tra một rule có thoả điều kiện với context hiện tại không.
   * - INVOICE_COUNT_TIER: conditionValue là số (vd "1", "4"), parse sang Int → so sánh totalInvoices >=
   * - WARRANTY_ACTIVE  : conditionValue là tên gói bảo hành (vd "Bảo Hành CARE⁺ PRO MAX")
   * Mở rộng: thêm case mới khi thêm conditionType mới trong enum.
   */
  private evaluateVoucherRule(
    rule: VoucherRule,
    context: { totalInvoices: number; enrichedInvoices: InvoiceResponseDto[] },
  ): boolean {
    switch (rule.conditionType) {
      case VoucherConditionType.INVOICE_COUNT_TIER: {
        const minInvoices = parseInt(rule.conditionValue, 10);
        if (Number.isNaN(minInvoices)) {
          this.logger.warn(
            `Rule ${rule.id} INVOICE_COUNT_TIER có conditionValue không phải số: "${rule.conditionValue}"`,
          );
          return false;
        }
        return context.totalInvoices >= minInvoices;
      }
      case VoucherConditionType.WARRANTY_ACTIVE: {
        const warrantyType = rule.conditionValue;
        if (!warrantyType) return false;
        return context.enrichedInvoices.some(
          (inv) =>
            inv.warranty?.warrantyType === warrantyType &&
            inv.warranty?.status === 'Còn hiệu lực',
        );
      }
      default: {
        this.logger.warn(
          `Unknown voucher conditionType: ${rule.conditionType as string} (rule ${rule.id})`,
        );
        return false;
      }
    }
  }

  /**
   * Với conditionType = INVOICE_COUNT_TIER và nhiều rule cùng match (vd khách 4 đơn
   * thoả tier 1,2,3,4), chỉ giữ lại rule có discountVnd cao nhất trong nhóm để
   * tránh "spam candidate". Các loại khác giữ tất cả.
   */
  private dedupeInvoiceCountTier(
    rules: VoucherRule[],
    context: { totalInvoices: number; enrichedInvoices: InvoiceResponseDto[] },
  ): VoucherRule[] {
    const tierMatches = rules
      .filter((r) => r.conditionType === VoucherConditionType.INVOICE_COUNT_TIER)
      .filter((r) => this.evaluateVoucherRule(r, context));
    const otherMatches = rules
      .filter((r) => r.conditionType !== VoucherConditionType.INVOICE_COUNT_TIER)
      .filter((r) => this.evaluateVoucherRule(r, context));

    const bestTier = tierMatches.reduce<VoucherRule | null>((best, cur) => {
      if (!best) return cur;
      if (cur.discountVnd > best.discountVnd) return cur;
      return best;
    }, null);

    return [...(bestTier ? [bestTier] : []), ...otherMatches];
  }

  // ---------------------------------------------------------------------------
  // Lấy toàn bộ hóa đơn của khách theo SĐT (có phân trang)
  // ---------------------------------------------------------------------------

  private async fetchAllInvoicesByPhone(
    phone: string,
    headers: Record<string, string>,
  ): Promise<{
    customerId: number | null;
    customerName: string | null;
    invoices: InvoiceResponseDto[];
  }> {
    // Bước 1: tìm khách hàng theo SĐT
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

    const customers: Array<{ id: number; name: string; code: string }> =
      customerResponse.data?.data || [];

    if (customers.length === 0) {
      return { customerId: null, customerName: null, invoices: [] };
    }

    const customerIds = customers.map((c) => c.id).join(',');
    const primaryCustomer = customers[0];

    // Bước 2: lấy toàn bộ hóa đơn với phân trang
    const pageSize = 100;

    const { data } = await firstValueFrom(
      this.httpService.get<KiotVietInvoiceResponse>(
        `${this.baseUrl}/invoices`,
        {
          headers,
          params: {
            format: 'json',
            pageSize,
            customerIds,
            status: 1,
          },
        },
      ),
    );

    return {
      customerId: primaryCustomer.id,
      customerName: primaryCustomer.name,
      invoices: data?.data ?? [],
    };
  }

  // ---------------------------------------------------------------------------
  // Tính voucher theo SĐT (public entry point)
  // ---------------------------------------------------------------------------

  async calculateVoucherByPhone(phone: string): Promise<VoucherResponseDto> {
    if (!this.retailer || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'KiotViet chưa được cấu hình đầy đủ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!phone?.trim()) {
      throw new HttpException(
        'Vui lòng cung cấp số điện thoại',
        HttpStatus.BAD_REQUEST,
      );
    }

    const trimmed = phone.trim();

    // Load rules song song với fetch token để giảm latency
    const [rules, token] = await Promise.all([
      this.prisma.voucherRule.findMany({
        where: { isActive: true },
        orderBy: { discountVnd: 'desc' },
      }),
      this.getAccessToken(),
    ]);

    const headers = {
      Retailer: this.retailer,
      Authorization: `Bearer ${token}`,
    };

    const { customerId, customerName, invoices } =
      await this.fetchAllInvoicesByPhone(trimmed, headers);

    if (!customerId) {
      return {
        phone: trimmed,
        customerId: undefined,
        customerName: undefined,
        totalInvoices: 0,
        voucher: null,
        candidates: [],
      };
    }

    // Enrich warranty info
    const enrichedInvoices = invoices.map((inv) => this.calculateWarranty(inv));
    const totalInvoices = enrichedInvoices.length;

    // Đánh giá tất cả rule, dedupe nhóm INVOICE_COUNT_TIER (chỉ giữ tier cao nhất)
    const matchedRules = this.dedupeInvoiceCountTier(rules, {
      totalInvoices,
      enrichedInvoices,
    });

    const candidates: VoucherCandidateDto[] = matchedRules.map((r) => ({
      ruleId: r.id,
      conditionType: r.conditionType,
      discountVnd: r.discountVnd,
      label: r.name,
      flags: r.flags ?? [],
    }));

    // Chọn voucher tốt nhất: discountVnd cao nhất.
    // Hoà giá trị → giữ rule đầu tiên match (theo orderBy discountVnd desc của query).
    let bestRule: VoucherRule | null = null;
    for (const r of matchedRules) {
      if (!bestRule || r.discountVnd > bestRule.discountVnd) {
        bestRule = r;
      }
    }

    const bestVoucher: VoucherDto | null = bestRule
      ? {
        ruleId: bestRule.id,
        discountVnd: bestRule.discountVnd,
        label: bestRule.name,
        conditionType: bestRule.conditionType,
        flags: bestRule.flags ?? [],
      }
      : null;

    return {
      phone: trimmed,
      customerId,
      customerName: customerName ?? undefined,
      totalInvoices,
      voucher: bestVoucher,
      candidates,
    };
  }
}
