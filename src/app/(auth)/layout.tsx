// app/(auth)/layout.tsx — Auth layout (login/register)
// No Navbar/Footer — clean auth experience
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
