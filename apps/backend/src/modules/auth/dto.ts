export interface LoginRequestDto {
  readonly phoneNumber: string;
  readonly otp: string;
}

export interface LoginResponseDto {
  readonly token: string;
  readonly userId: string;
}
