import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Me from "./pages/Me";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <main className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/me" element={<Me />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <Route path="*" element={<NotFound />} />
    </main>
  );
}

export default App;
