import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  forgotPasswordFn,
  getUserFn,
  loginFn,
  logoutFn,
  registerFn,
  resetPasswordFn,
  verifyEmailFn,
} from "@/services/auth";
import { setAccessToken } from "@/lib/axios-client";
import { backoffDelay, smartRetry } from "@/lib/react-query";

export const useUser = () => {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUserFn,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["auth", "user"], data.user);
      navigate("/me");
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: (data) => {
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        queryClient.setQueryData(["auth", "user"], data.user);
        navigate("/me");
      } else {
        navigate("/verify-email-sent");
      }
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
      navigate("/login");
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: verifyEmailFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPasswordFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPasswordFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: () => {
      navigate("/login");
    },
  });
};
