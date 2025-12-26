import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VerificationEmailSent = () => {
  return (
    <section className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verification Mail Sent</CardTitle>
          <CardDescription>Please Check Your Email</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <h2>A verification mail has been sent. Please check your email.</h2>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default VerificationEmailSent;
