import nodemailer from "nodemailer";
import logger from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
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
