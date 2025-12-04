import nodemailer from "nodemailer";
import logger from "../utils/logger";
import CircuitBreaker from "opossum";
import retry from "async-retry";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendWithRetry = async (mailOptions: any) => {
  return retry(
    async (bail) => {
      logger.info(`Attempting to send email to ${mailOptions.to}`);
      return await transporter.sendMail(mailOptions);
    },
    {
      // Try 3 times
      retries: 3,
      // Wait for 1s first retry
      minTimeout: 1000,
      // Retry timeout exp. 1s, 2s, 4s
      factor: 2,
      // Max 5s
      maxTimeout: 5000,
      onRetry: (err: any) =>
        logger.warn(`Email failed, retrying... (${err.message})`),
    }
  );
};

const breakerOptions = {
  // if takes more than 10 sec, fail.
  timeout: 10000,
  // if %50 of reqs fail, open circuit.
  errorThresholdPercentage: 50,
  // wait 30s to retry.
  resetTimeout: 30000,
};

const breaker = new CircuitBreaker(sendWithRetry, breakerOptions);

breaker.fallback(() => {
  logger.error("Email service is currently unavailable.");
});

breaker.on("open", () => logger.warn("Email circuit breaker opened"));
breaker.on("close", () => logger.info("Email circuit breaker closed"));

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  };

  try {
    await breaker.fire(mailOptions);
    logger.info(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error}`);
  }
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const subject = "Welcome to BeeNest Digital - Verify Your Email";
  const html = `
    <h3>Verify your email</h3>
    <p>Click the link below to verify your email:</p>
    <a href="${verificationLink}">${verificationLink}</a>
    <p>This link expires in 24 hours.</p>
  `;
  await sendEmail(to, subject, html);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const subject = "BeeNest Digital - Password Reset Request";
  const html = `
    <h3>Reset your password</h3>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>This link expires in 1 hour.</p>
  `;
  await sendEmail(to, subject, html);
};
