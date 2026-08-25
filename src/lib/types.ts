export type Locale = "pt" | "es" | "en";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  hotmart_product_id: string;
  name: string;
  description: string | null;
  locale: Locale;
  created_at: string;
}

export interface BookPage {
  content: string; // HTML or Markdown content
}

export interface BookChapter {
  chapter: string;
  pages: string[]; // Array of HTML/Markdown strings
}

export interface Book {
  id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  content: BookChapter[];
  total_pages: number;
  locale?: string;
  show_chapters?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccess {
  id: string;
  user_id: string;
  book_id: string;
  product_id: string | null;
  granted_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  updated_at: string;
}

export interface BookWithProgress extends Book {
  reading_progress: ReadingProgress | null;
}

// Hotmart webhook payload types (based on real payload)
export interface HotmartWebhookPayload {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      ucode?: string;
      name: string;
    };
    buyer: {
      name: string;
      email: string;
      first_name?: string;
      last_name?: string;
      address?: {
        country?: string;
        country_iso?: string;
      };
    };
    purchase: {
      approved_date?: number;
      status?: string;
      transaction?: string;
      order_date?: number;
      full_price?: {
        value: number;
        currency_value: string;
      };
      price?: {
        value: number;
        currency_value: string;
      };
      checkout_country?: {
        name: string;
        iso: string;
      };
      payment?: {
        type: string;
        installments_number?: number;
      };
      offer?: {
        code?: string;
      };
    };
    commissions?: Array<{
      value: number;
      source: string;
      currency_value: string;
    }>;
    producer?: {
      name: string;
    };
    affiliates?: Array<{
      affiliate_code: string;
      name: string;
    }>;
  };
}
