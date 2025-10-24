import React, { FC } from 'react';
import { Link } from 'react-router-dom';

const UV_Error404: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-24">
      <div className="max-w-md mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          It seems like you've entered a wrong address or the page has been removed.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border-none text-sm font-medium rounded-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UV_Error404;