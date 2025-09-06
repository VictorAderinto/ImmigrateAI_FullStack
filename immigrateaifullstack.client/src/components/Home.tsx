import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare, FileCheck, Globe, AlertCircle, CheckCircle, Clock, Shield, Rocket, BadgeCheck, ShieldCheck, Users, DollarSign, Languages } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import { useTranslation } from "react-i18next";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();


  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[350px] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/canton-tower.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Red gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-red-800/80"></div>
        </div>
        
        <div className="pl-40 pr-4 py-12 md:py-20 relative z-10 flex items-start">
          <div className="md:max-w-3xl lg:max-w-4xl text-left w-full">
            <div className="inline-block mb-6 p-2 bg-white/10 backdrop-blur-sm rounded-full text-left">
              <span className="text-white font-medium text-sm px-4 py-1.5 rounded-full border border-white/30">
                {t("AI-Powered Immigration Assistance")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight text-left">
              {t("Simplify Your Canadian Immigration Journey")}
              <div className="h-1.5 w-32 mt-2 bg-red-400 rounded-full"></div>
            </h1>
            
            <p className="text-xl text-gray-100 max-w-3xl mb-10 leading-relaxed text-left">
            {t("Our AI assistant guides you through every step of the study permit application process, in your language, with precision and ease.")}
            </p>
            
            <div className="flex flex-wrap gap-4 text-left">
              <button 
                className="text-lg font-semibold px-8 py-6 h-auto bg-red-600 hover:bg-red-500 shadow-lg shadow-red-700/50 text-white rounded-lg flex items-center"
                onClick={() => {
                  if (isAuthenticated()) {
                    navigate('/application-select');
                  } else {
                    navigate('/login?redirect=/application-select');
                  }
                }}
              >
                {t("Get Started")} <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button 
                className="text-lg font-semibold px-8 py-6 h-auto border-white text-white hover:bg-white/10 backdrop-blur-sm rounded-lg border"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t("Learn More")}
              </button>
            </div>
          </div>
        </div>
        
        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full h-16 text-white fill-current">
            <path d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,69.3C1120,64,1280,32,1360,16L1440,0L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
          </svg>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center flex-wrap md:flex-nowrap">
            <div className="flex items-center justify-center w-1/2 md:w-auto mb-4 md:mb-0">
              <CheckCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">{t("IRCC Compliant")}</span>
            </div>
            <div className="flex items-center justify-center w-1/2 md:w-auto mb-4 md:mb-0">
              <Shield className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">{t("Data Secure")}</span>
            </div>
            <div className="flex items-center justify-center w-1/2 md:w-auto mb-0 md:mb-0">
              <Clock className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">{t("24/7 Support")}</span>
            </div>
            <div className="flex items-center justify-center w-1/2 md:w-auto mb-0 md:mb-0">
              <Globe className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm md:text-base text-gray-700 font-medium whitespace-nowrap">{t("Multiple Languages")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="our-features" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-red-700 font-medium text-sm px-4 py-1.5 rounded-full border border-red-200 bg-red-50">
                {t("Our Features")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("Our Features")}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t("Our comprehensive platform combines AI technology with immigration expertise to streamline your application process.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Intelligent Interviews")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Conversational AI asks all the right questions to gather your information, adapting to your responses in real-time")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <FileCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t("Automatic Form Filling")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("No more repetitive form completion - our system fills out all required forms with your information")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Multi-Language Support")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t("Access our platform in your preferred language with comprehensive translation support.")}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Error Tracking")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("AI identifies potential issues or inconsistencies in your application before submission")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-red-700 font-medium text-sm px-4 py-1.5 rounded-full border border-red-200 bg-red-50">
                {t("Why Choose Immentra")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("Why Choose Immentra")}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {t("Our platform offers unique advantages that make your immigration journey smooth and successful.")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Process 1: Fast & Efficient */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <Rocket className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Fast & Efficient")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Complete your application in hours instead of weeks. Our streamlined process eliminates delays.")}
              </p>
            </div>

            {/* Process 2: 100% Accurate */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("100% Accurate")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t("Our AI ensures all forms are filled correctly, reducing rejection risks due to common errors.")}
              </p>
            </div>

            {/* Process 3: Security First */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Security First")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Your data is protected with bank-level encryption and is never shared with third parties.")}
              </p>
            </div>

            {/* Process 4: Expert Support */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("Expert Support")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Connect with licensed immigration consultants for professional advice when needed.")}
              </p>
            </div>

            {/* Process 5: Affordable */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t("Affordable")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Save thousands compared to traditional immigration services while getting premium results.")}
              </p>
            </div>

            {/* Process 6: Multi-Language */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl mb-6 shadow-md">
                <Languages className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t("Multi-Language")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
              {t("Get assistance in your preferred language: English, French, Vietnamese, or Mandarin Chinese.")}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-red-700 font-medium text-sm px-4 py-1.5 rounded-full border border-red-200 bg-red-50">
                {t("Simple Process")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("How Immentra Works")}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t("Your journey to Canada made simple in just three easy steps.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute top-0 left-0 -mt-2 -ml-2 bg-red-100 rounded-full w-12 h-12 flex items-center justify-center text-red-600 font-bold text-xl">
                1
              </div>
              <div className="bg-white p-8 pt-10 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 mt-5 ml-5">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("Answer Simple Questions")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                {t("Our AI assistant will guide you through a series of easy-to-answer questions about your personal information, work experience, and immigration goals.")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute top-0 left-0 -mt-2 -ml-2 bg-red-100 rounded-full w-12 h-12 flex items-center justify-center text-red-600 font-bold text-xl">
                2
              </div>
              <div className="bg-white p-8 pt-10 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 mt-5 ml-5">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("Review Your Information")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                {t("Once you've provided all necessary details, our system will compile and organize your information for review, ensuring everything is accurate.")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute top-0 left-0 -mt-2 -ml-2 bg-red-100 rounded-full w-12 h-12 flex items-center justify-center text-red-600 font-bold text-xl">
                3
              </div>
              <div className="bg-white p-8 pt-10 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 mt-5 ml-5">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("Download Completed Forms")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                {t("After reviewing your information, our system generates properly filled application forms that you can download, print, and submit to Canadian immigration authorities.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-red-900 to-red-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-10">
            <span className="inline-block px-4 py-1 bg-white text-red-700 text-sm font-bold rounded-full mb-4 shadow-md">
              {t("Start Your Journey")}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white drop-shadow-sm">
          {t("Ready to make Canada your new home?")}
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto text-white/90 font-medium">
          {t("Get started with Immentra — a smarter way to complete your Canadian study permit application using AI-driven guidance and form automation.")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              className="w-full sm:w-auto text-lg font-semibold px-8 py-6 h-auto bg-white text-red-700 hover:bg-gray-100 shadow-lg rounded-lg flex items-center justify-center"
              onClick={() => {
                if (isAuthenticated()) {
                  navigate('/application-select');
                } else {
                  navigate('/login?redirect=/application-select');
                }
              }}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button 
              className="w-full sm:w-auto text-lg font-semibold px-8 py-6 h-auto border-white text-white hover:bg-white/10 rounded-lg border"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer banner */}
      <section className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-10 w-10 bg-red-600 rounded-lg mr-4 flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <p className="text-gray-600 text-sm">
                {t("Making Canadian immigration simple through AI assistance")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="text-gray-600 hover:text-red-600 bg-transparent border-none cursor-pointer"
                onClick={() => document.getElementById('our-features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                About Us
              </button>
              <span className="text-gray-400 cursor-not-allowed bg-transparent border-none px-4">Privacy</span>
              <span className="text-gray-400 cursor-not-allowed bg-transparent border-none px-4">Terms</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 