import { Home, ArrowLeft } from "lucide-react";

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="text-center">
        {/* ORG Logo */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute flex items-center justify-center inset-6">
            <img
              src="https://organization.org/wp-content/uploads/nso-logo-round_500-400x400.png"
              alt="ORG Logo"
              className="w-20 h-20"
            />
          </div>
        </div>

        {/* 404 Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-800">404</h1>
          
          <p className="text-lg font-medium text-gray-700">
            Page Not Found
          </p>

          <p className="max-w-md mx-auto text-sm text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 mt-8 sm:flex-row">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Home size={16} />
              Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;