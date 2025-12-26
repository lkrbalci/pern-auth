import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useLogin, useResendVerification } from "@/hooks/useAuth";
import { AxiosError } from "axios";

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
});

const Login = () => {
  const { mutate: login, isPending, error: loginError } = useLogin();
  const { mutate: resendVerification } = useResendVerification();

  const isUnverifiedError =
    loginError instanceof AxiosError &&
    loginError.response?.status === 403 &&
    loginError.response.data?.message === "Please verify your email address";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    login(values);
  }

  if (isPending) {
    return <div>Logging In</div>;
  }

  return (
    <section className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Please login for so many nice things
          </CardDescription>
          <CardAction>
            <NavLink to="/register" className="text-sm underline">
              Register instead
            </NavLink>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormDescription>Your Email Address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your password must be at least 8 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isUnverifiedError ? (
                <div className="border border-yellow-300 bg-yellow-50 p-3 rounded text-yellow-800 text-sm">
                  <p>Your account is not yet verified.</p>
                  <button
                    type="button"
                    onClick={() => {
                      resendVerification({ email: form.getValues("email") });
                    }}
                    className="mt-2 font-semibold underline"
                  >
                    Resend Verification Email
                  </button>
                </div>
              ) : (
                !!loginError &&
                !isUnverifiedError && (
                  <div className="text-sm font-medium text-destructive">
                    {loginError instanceof AxiosError
                      ? loginError.response?.data?.message ||
                        "Login failed. Please try again."
                      : "An unexpected error occurred."}
                  </div>
                )
              )}

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
};

export default Login;
