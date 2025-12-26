import axiosClient from "../lib/axios-client";

export const getUserFn = async () => (await axiosClient.get("/users/me")).data;

export const registerFn = async (data: { email: string; password: string }) =>
  (await axiosClient.post("/auth/register-with-verification", data)).data;

export const loginFn = async (data: { email: string; password: string }) =>
  (await axiosClient.post("/auth/login", data)).data;

export const logoutFn = async () =>
  (await axiosClient.post("/auth/logout")).data;

export const verifyEmailFn = async (token: string) =>
  (await axiosClient.get(`/auth/verify-email?token=${token}`)).data;

export const forgotPasswordFn = async (data: { email: string }) =>
  (await axiosClient.post("/auth/forgot-password", data)).data;

export const resetPasswordFn = async (data: {
  token: string;
  newPassword: string;
}) => (await axiosClient.post("/auth/reset-password", data)).data;

export const resendVerificationFn = async (data: { email: string }) =>
  (await axiosClient.post("/auth/resend-verification", data)).data;
