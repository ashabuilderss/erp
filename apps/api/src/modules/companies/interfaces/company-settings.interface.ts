export interface SystemSettings {
  debugLogging?: boolean;
  sessionTimeoutMinutes?: number;
  passwordMinLength?: number;
  passwordRequireSpecialChar?: boolean;
  maxLoginAttempts?: number;
  encryptSensitiveFields?: boolean;
  allowedIpAddresses?: string[];
  mfaRequired?: boolean;
}
