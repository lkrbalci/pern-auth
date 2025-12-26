import { useUser } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoute = () => {
  const { isSuccess: isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
