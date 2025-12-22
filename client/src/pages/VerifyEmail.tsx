import { useEffect } from "react";
import { useVerifyEmail } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const {
    mutate: verifyEmail,
    isPending,
    isSuccess,
    isError,
  } = useVerifyEmail();

  // 1. Fire on Mount
  useEffect(() => {
    if (!token) {
      return;
    }
    // Fire the mutation
    verifyEmail(token);
  }, [token, verifyEmail]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {!token && (
            <p className="text-destructive">Invalid Link (Missing Token)</p>
          )}

          {isPending && <p>Verifying your email...</p>}
          {isSuccess && (
            <>
              <p className="text-green-600">Successfully verified!</p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </>
          )}
          {isError && (
            <>
              <p className="text-sm text-muted-foreground">
                The link might be expired or invalid.
              </p>
              <Button variant="outline" onClick={() => navigate("/register")}>
                Back to Register
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
