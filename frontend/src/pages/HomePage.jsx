import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Split the Bill, <span className="text-blue-600">Not the Friendship.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          The bulletproof way to track group trip expenses, calculate debts, and settle up without the headache.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Log In to Continue
          </Link>
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}