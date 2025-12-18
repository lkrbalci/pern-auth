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

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    isError,
    isSuccess: isAuthenticated,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUserFn,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const registerMutation = useMutation({
    mutationFn: registerFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["auth", "user"], data.user);
      navigate("/me");
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["auth", "user"], data.user);
      navigate("/me");
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmailFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordFn,
    retry: smartRetry,
    retryDelay: backoffDelay,
    onSuccess: () => {
      // After resetting, force them to login with new password
      navigate("/login");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      setAccessToken(null);
      // Clear cache instantly
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear(); // Nuclear option if you want

      navigate("/login");
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
  };
};
