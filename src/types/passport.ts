export interface PassportAddress {
  address: string;
}

export interface LinkedAddresses {
  wallets?: PassportAddress[];
  error?: PassportApiError;
}

export interface PassportPrimaryAddress {
  primaryAddress?: string | null;
}

export type PrimaryAddresses = PassportPrimaryAddress & {
  error?: PassportApiError;
};

export type ApiError = {
  error: string;
};

export interface PassportApiError {
  name: string;
  message: string;
  code: string;
}

export type LinkedAddressesResponse = Record<string, LinkedAddresses>;
export type PrimaryAddressesResponse = Record<string, PrimaryAddresses>;

export interface PassportAddress {
  address: string;
}

export interface LinkedAddresses {
  wallets?: PassportAddress[];
  error?: PassportApiError;
}

export interface PassportPrimaryAddress {
  primaryAddress?: string | null;
}

export interface LinkAccountBody {
  platform_id: string;
  address: string;
  setAsPrimaryAccount?: boolean;
  setAsPrimaryAddress?: boolean;
}

export interface RequestProcessingError {
  name: string;
  message: string;
  code: string;
}

export interface LinkedAccountsResponse {
  accounts?: PlatformAccountResult[];
  error?: RequestProcessingError;
}

export type PrimaryAccountsResponse = PrimaryPlatformAccountsResult & {
  error?: RequestProcessingError;
};

export type PrimaryAddressResponse = PrimaryAddressType & {
  error?: RequestProcessingError;
};

export type VerifyLinkResponse =
  | {
      platform: string;
      accountId: string;
      address: string;
      isVerified: boolean;
    }
  | {
      error: RequestProcessingError;
    };

export interface PlatformAccountId {
  platform: Platform;
  accountId: string;
}

export interface PrismaWalletResult {
  address: string;
}

export interface PlatformAccountResult {
  accountId: string;
  platform: string;
}

export type PrimaryAccountTypes = keyof Omit<Wallet, "address">;
export type PrimaryAccountsRecordType = Record<
  PrimaryAccountTypes,
  string | null | undefined
>;

export type PrimaryPlatformAccountsResult = Partial<PrimaryAccountsRecordType>;

export interface PrimaryAddressType {
  primaryAddress?: string | null;
}

export const Platform: {
  DISCORD: "DISCORD";
  TWITTER: "TWITTER";
} = {
  DISCORD: "DISCORD",
  TWITTER: "TWITTER",
};

export type Platform = typeof Platform[keyof typeof Platform];

export type Wallet = {
  address: string;
  primaryDiscord: string | null;
  primaryTwitter: string | null;
};
