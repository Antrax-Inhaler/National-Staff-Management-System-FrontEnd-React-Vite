export default function Home() {
  return (
    <div className="max-w-2xl mx-auto text-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Welcome to Organization Member Portal</h1>
      <p className="text-lg text-gray-600 mb-6">
        Please log in to access your dashboard.
      </p>
      <a
        href="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go to Login
      </a>
    </div>
  );
}
