import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NavLink } from "react-router";

const Home = () => {
  return (
    <section className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Home</CardTitle>
          <CardDescription>This is the home page. You Can</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <ul className="pb-4">
              <li>
                <NavLink className="text-blue-700" to="/register" end>
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink className="text-blue-700" to="/login" end>
                  Login
                </NavLink>
              </li>
              <li>Logout</li>
              <li>
                Visit{" "}
                <NavLink className="text-blue-700" to="/me" end>
                  "Me"{" "}
                </NavLink>
                Page if logged in
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Home;
