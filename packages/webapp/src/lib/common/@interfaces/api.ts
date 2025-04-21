export interface SuccessResponse<T> {
	data: T;
	message: string;
}
export interface ErrorResponse {
	message: string;
	[key: string]: any;
}
export type Response<T> = SuccessResponse<T> | ErrorResponse;
