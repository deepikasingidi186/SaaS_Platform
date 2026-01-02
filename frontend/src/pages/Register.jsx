import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: "",
    subdomain: "",
    adminEmail: "",
    adminFullName: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };


const submit = async (e) => {
  e.preventDefault();
  setError("");

  // frontend-only guards (safe)
  if (!form.organizationName || !form.subdomain) {
    return setError("Organization name and subdomain are required");
  }

  if (!/^[a-z0-9]+$/.test(form.subdomain)) {
    return setError("Subdomain must be lowercase letters and numbers only");
  }

  if (form.password !== form.confirmPassword) {
    return setError("Passwords do not match");
  }

  if (!form.agree) {
    return setError("You must agree to terms & conditions");
  }

  setLoading(true);

  const payload = {
    tenantName: form.organizationName,
    subdomain: form.subdomain,
    adminEmail: form.adminEmail,
    adminFullName: form.adminFullName,
    adminPassword: form.password,
  };

  try {
    await api.post("/auth/register-tenant", payload);

    setSuccess("Registration successful. Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500);
  } catch (err) {
    console.error("REGISTER ERROR:", err.response?.data);
    setError(
      err.response?.data?.message ||
        "Registration failed. Please check inputs."
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <div
        style={{
        maxWidth: "480px",
        margin: "50px auto",
        padding: "25px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        }}
    >
        <h2 style={{ textAlign: "center" }}>Register Organization</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <form onSubmit={submit}>
        <div style={{ marginBottom: "12px" }}>
            <label>Organization Name</label>
            <input
            style={{ width: "100%" }}
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
            required
            />
        </div>

        <div style={{ marginBottom: "12px" }}>
            <label>Subdomain</label>
            <input
            style={{ width: "100%" }}
            name="subdomain"
            value={form.subdomain}
            onChange={handleChange}
            required
            />
            <small style={{ color: "#555" }}>
            Your workspace URL: <b>{form.subdomain || "yourorg"}.yourapp.com</b>
            </small>
        </div>

        <div style={{ marginBottom: "12px" }}>
            <label>Admin Email</label>
            <input
            style={{ width: "100%" }}
            type="email"
            name="adminEmail"
            placeholder="admin@company.com"
            value={form.adminEmail}
            onChange={handleChange}
            required
            />
        </div>

        <div style={{ marginBottom: "12px" }}>
            <label>Admin Full Name</label>
            <input
            style={{ width: "100%" }}
            name="adminFullName"
            value={form.adminFullName}
            onChange={handleChange}
            required
            />
        </div>

        <div style={{ marginBottom: "12px" }}>
            <label>Password</label>
            <input
            style={{ width: "100%" }}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            />
        </div>

        <div style={{ marginBottom: "12px" }}>
            <label>Confirm Password</label>
            <input
            style={{ width: "100%" }}
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "flex",
              flexDirection:"column-reverse",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
            />
            <span>I agree to Terms & Conditions</span>
          </label>
        </div>


        <button style={{ width: "100%" }} disabled={loading}>
            {loading ? "Registering..." : "Register"}
        </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "15px" }}>
        Already have an account? <Link to="/login">Login</Link>
        </p>
    </div>
    );

}
