/**
 * Chỗ giữ tạm cho các chức năng chưa nối backend.
 *
 * Mỗi hàm service chưa nối API gọi `pending()` (trả dữ liệu rỗng) hoặc `notConnected()`
 * (báo lỗi), kèm endpoint backend cần gọi. Khi nối API thật, thay lời gọi đó bằng `apiClient`
 * và bỏ các tham số chỉ được truyền vào để giữ chữ ký hàm.
 */
export const NO_BACKEND_API = 'BE chưa có API';

export class ApiNotConnectedError extends Error {
  readonly endpoint: string;
  readonly args: unknown[];

  constructor(endpoint: string, args: unknown[]) {
    super(
      endpoint === NO_BACKEND_API
        ? 'Chức năng này chưa có API backend.'
        : `Chức năng này chưa nối API backend (${endpoint}).`,
    );
    this.name = 'ApiNotConnectedError';
    this.endpoint = endpoint;
    this.args = args;
  }
}

/** Chức năng đọc chưa nối API: trả dữ liệu rỗng để trang vẫn hiển thị được. */
export function pending<T>(empty: T, endpoint: string, ...args: unknown[]): T {
  if (import.meta.env.DEV) console.info('[chưa nối API]', endpoint, ...args);
  return empty;
}

/** Chức năng ghi hoặc gọi AI chưa nối API: báo lỗi để người dùng biết. */
export function notConnected(endpoint: string, ...args: unknown[]): never {
  throw new ApiNotConnectedError(endpoint, args);
}
