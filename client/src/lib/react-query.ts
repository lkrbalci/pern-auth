import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const smartRetry = (failureCount: number, error: unknown) => {
  const axiosError = error as AxiosError;
  if (failureCount >= 3) return false;

  if (
    axiosError.response?.status &&
    axiosError.response.status >= 400 &&
    axiosError.response.status < 500
  ) {
    return false;
  }

  return true;
};

export const backoffDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};
