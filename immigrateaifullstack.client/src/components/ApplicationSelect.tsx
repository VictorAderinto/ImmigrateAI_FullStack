import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAuthenticated } from "../utils/auth";
import { GraduationCap, Briefcase, Home, ArrowRight } from "lucide-react";

const ApplicationSelect: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('study_permit');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleApplicationSelect = async (type: string) => {
    try {
      setIsCreating(true);
      
      if (!isLoggedIn) {
        console.log("User not authenticated. Redirecting to login");
        navigate("/login");
        return;
      }
      
      // For now, just navigate to a placeholder chat page
      // In a full implementation, this would create an application and navigate to the chat
      console.log("Creating new application of type:", type);
      navigate(`/chat/${type}`);
      
    } catch (error) {
      console.error("Failed to process application selection:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t("Select Application Type")}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          {t("Choose the type of immigration application you'd like to start. Each type has different requirements and processes.")}
        </p>
        
        {/* Show login prompt if user isn't authenticated */}
        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <h3 className="text-amber-800 font-semibold mb-2">{t("Please Login")}</h3>
            <p className="text-amber-700 mb-4">
              {t("You need to be logged in to create or continue an application. Please login with your account or register if you don't have one.")}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => navigate("/register")}
              >
                {t("Register")}
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => navigate("/login")}
              >
                {t("Login to Continue")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application type cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Study Permit */}
        <div className={`border border-gray-200 rounded-lg p-6 cursor-pointer transition-all ${selectedType === 'study_permit' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`} 
              onClick={() => setSelectedType('study_permit')}>
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-500 rounded-lg mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("Study Permit")}</h3>
          <p className="text-gray-600 mb-4">{t("For international students who want to study in Canada")}</p>
          <p className="text-sm text-gray-500 mb-4">
          {t("Navigate the Study permit application process with AI assistance.")}
          </p>
          <button 
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
            onClick={() => handleApplicationSelect('study_permit')}
            disabled={isCreating || !isLoggedIn}
            title={!isLoggedIn ? t("Please login first") : ""}
          >
            {isCreating && selectedType === 'study_permit' ? t('Creating...') : t('Select')}
          </button>
        </div>

        {/* Work Permit - Coming Soon */}
        <div className="border border-gray-200 rounded-lg p-6 opacity-75">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-500 rounded-lg mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("Work Permit")}</h3>
          <p className="text-gray-600 mb-4">{t("For temporary work opportunities in Canada")}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t("Navigate the work permit application process with AI assistance.")}
          </p>
          <button className="w-full px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed" disabled>
            {t("Coming Soon")}
          </button>
        </div>

        {/* Permanent Residence - Coming Soon */}
        <div className="border border-gray-200 rounded-lg p-6 opacity-75">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-500 rounded-lg mb-4">
            <Home className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("Permanent Residence")}</h3>
          <p className="text-gray-600 mb-4">{t("For long-term immigration to Canada")}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t("Comprehensive guidance for permanent residence applications.")}
          </p>
          <button className="w-full px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed" disabled>
            {t("Coming Soon")}
          </button>
        </div>
      </div>

      {/* Start/Continue button */}
      {selectedType && (
        <div className="flex flex-col items-center mt-12">
          <button 
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center"
            onClick={() => handleApplicationSelect(selectedType)}
            disabled={isCreating}
          >
            {isCreating 
              ? t('Starting Process...') 
              : t('Start Process')
            } 
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationSelect; 