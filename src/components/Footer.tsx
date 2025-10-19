import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="text-xs text-gray-500 mt-6 text-center">
      Click here to see our{" "}
      <a
        href="/terms_of_service.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-700"
      >
        Terms of Service and Privacy Policy
      </a>
      .
    </footer>
  );
};

export default Footer;