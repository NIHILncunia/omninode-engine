import nodemailer from 'nodemailer';

export interface AdminCredentialMailerConfig {
  host: string | undefined;
  port: number | string | undefined;
  secure: boolean | string | undefined;
  user: string | undefined;
  password: string | undefined;
  from: string | undefined;
}

export interface AdminCredentialMailer {
  isConfigured(): boolean;
  sendInitialPassword(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<void>;
}

const hasText = (value: string | undefined): value is string => value !== undefined && value.trim().length > 0;

export function createAdminCredentialMailer(config: AdminCredentialMailerConfig): AdminCredentialMailer {
  const isConfigured = (): boolean => hasText(config.host)
    && hasText(config.user)
    && hasText(config.password)
    && hasText(config.from)
    && Number.isInteger(Number(config.port));

  return {
    isConfigured,

    async sendInitialPassword(input): Promise<void> {
      if (!isConfigured()) {
        throw new Error('SMTP is not configured.');
      }

      const transport = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: config.secure === true || config.secure === 'true',
        auth: {
          user: config.user,
          pass: config.password,
        },
      });
      await transport.sendMail({
        from: config.from,
        to: input.email,
        subject: 'Omninode 관리자 초기 비밀번호',
        text: `${input.name}님, 초기 비밀번호는 ${input.password}입니다. 로그인 후 즉시 비밀번호를 변경해 주세요.`,
      });
    },
  };
}
