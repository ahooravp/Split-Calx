import { Link } from 'react-router-dom';
import Footer from '../components/Footer'; // Ensure this matches your path

export default function HomePage() {
  return (
    // 1. Restored overflow-hidden to act as a perfect frame, and updated min-h to account for the header.
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 relative flex flex-col overflow-hidden">

      {/* 2. Original Top/Middle Abstract Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-120 md:w-160 h-120 md:h-160 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-[10%] right-[-5%] w-120 md:w-160 h-120 md:h-160 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-[10%] left-[20%] w-120 md:w-160 h-120 md:h-160 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none z-0"></div>

      {/* 3. New Dedicated Footer Blobs (Removed the nested overflow-hidden, letting the parent handle it) */}
      <div className="absolute bottom-0 left-0 right-0 h-[30rem] pointer-events-none z-0">
        <div className="absolute bottom-[-40%] left-[-10%] w-[35rem] h-[30rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-85 rotate-45"></div>
        <div className="absolute bottom-[-5%] left-[10%] w-[25rem] h-[40rem] bg-teal-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 -rotate-12"></div>
        <div className="absolute bottom-[-15%] left-[20%] w-[45rem] h-[25rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[110px] opacity-80 rotate-12"></div>
        <div className="absolute bottom-[-40%] right-[5%] w-[40rem] h-[35rem] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[90px] opacity-90 -rotate-45"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
      </div>

      {/* 4. Main Page Content (flex-grow pushes the footer down naturally) */}
      <div className="px-6 lg:px-12 pt-16 pb-52 flex-grow relative z-10 flex items-center">
        
        {/* Two-Column Grid Layout */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Column: Typography & Actions */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 font-bold text-sm mb-8 shadow-xs border border-indigo-200">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
              The Ultimate Expense Tracker
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-snug">
              Group Expenses, <br className="hidden md:block" />
              <span className="inline-block mt-2 md:mt-4 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-teal-500">
                Simplified.
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Track group trip expenses, calculate precise debts, and settle up without the headache. No more spreadsheets, no more awkward conversations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 ease-out"
              >
                Create an Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:text-indigo-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out"
              >
                Log In to Continue
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="relative hidden lg:block w-full max-w-md mx-auto">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/60 transform -rotate-6 scale-95 translate-x-4 translate-y-4 z-0"></div>

            <div className="relative z-10 bg-white p-8 rounded-2xl shadow-[0_20px_50px_rgb(0,0,0,0.08)] border border-slate-100 transform rotate-2 hover:rotate-0 hover:-translate-y-3 transition-all duration-500 ease-out cursor-default group origin-center">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg transition-transform duration-500 ease-out">
                    JD
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-slate-800">Dinner at Miami Beach</p>
                    <p className="text-sm text-slate-400 mt-0.5">Paid by John</p>
                  </div>
                </div>
                <span className="font-extrabold text-xl text-slate-900">$120.00</span>
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Split Between</span>
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-200 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-teal-200 border-2 border-white"></div>
                    <div className="w-7 h-7 rounded-full bg-emerald-200 border-2 border-white"></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">You Owe</span>
                  <span className="text-lg font-extrabold text-teal-600">$40.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 5. Render the pure transparent lens Footer */}
      <Footer />
    </div>
  );
}