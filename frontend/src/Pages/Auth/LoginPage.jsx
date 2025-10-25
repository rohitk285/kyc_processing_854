import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
      });

      if (!res.ok) {
        alert("Invalid username or password");
        return;
      }

      const data = await res.json();
      login(username, data.token, data.user_id); // store in context file
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6">
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/login-authentication-illustration-download-in-svg-png-gif-file-formats--access-sign-in-computer-security-pack-user-interface-illustrations-3851050.png"
          alt="Login Illustration"
          className="w-3/4 max-w-sm md:w-2/3"
        />
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-orange-500 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center md:text-left">
            Hello!
          </h2>
          <p className="text-gray-500 mb-6 text-center md:text-left">
            Login to Get Started
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors"
            >
              Login
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don’t have an account?{" "}
                <Link
                  to="/sign-up"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
