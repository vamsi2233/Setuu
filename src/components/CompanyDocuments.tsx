'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import ChatBox from './ChatBox';
import '../styles/responsive.css';

interface DocumentResponse {
  type: string;
  name_of_entity: string;
  names_of_directors?: string[];
  reason_of_verification_failure?: string;
}

interface ExtractedText {
  documents: DocumentResponse;
}

const CompanyDocuments = () => {
  const [gstSubmitted, setgstSubmitted] = useState(false);
  const [proofSubmitted, setproofSubmitted] = useState(false);
  const [gstCertificate, setGSTCertificate] = useState<File | null>(null);
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const [gstUploading, setgstUploading] = useState(false);
  const [proofUploading, setproofUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gstExtractedText, setGstExtractedText] = useState<ExtractedText | null>(null);
  const [proofExtractedText, setProofExtractedText] = useState<ExtractedText | null>(null);
  const [gstSaved, setGstSaved] = useState(false);
  const [proofSaved, setProofSaved] = useState(false);
  const [chatContext, setChatContext] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'gst' | 'proof') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size should be less than 5MB');
      return;
    }

    if (type === 'gst') {
      setGSTCertificate(file);
      setgstUploading(true);
      setUploadError(null);
      setgstSubmitted(false);
      setGstExtractedText(null);
      setGstSaved(false);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', 'GST certificate');

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === "success") {
          if (result.text) {
            try {
              let cleanText = result.text;
              if (cleanText.startsWith("```json")) {
                cleanText = cleanText.replace(/```json\n?/, "").replace(/\n?```$/, "");
              }
              const jsonObj = JSON.parse(cleanText) as ExtractedText;
              setGstExtractedText(jsonObj);
              setgstSubmitted(true);
            } catch (parseError) {
              console.error('JSON parsing error:', parseError);
              setUploadError("Error parsing the response");
            }
          } else {
            setUploadError("No text extracted or an error occurred.");
          }
        } else {
          setUploadError("Error: Something went wrong.");
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      } finally {
        setgstUploading(false);
      }
    } else {
      setProofDocument(file);
      setproofUploading(true);
      setUploadError(null);
      setproofSubmitted(false);
      setProofExtractedText(null);
      setProofSaved(false);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', 'Registration certificate');

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === "success") {
          if (result.text) {
            try {
              let cleanText = result.text;
              if (cleanText.startsWith("```json")) {
                cleanText = cleanText.replace(/```json\n?/, "").replace(/\n?```$/, "");
              }
              const jsonObj = JSON.parse(cleanText) as ExtractedText;
              setProofExtractedText(jsonObj);
              setproofSubmitted(true);
            } catch (parseError) {
              console.error('JSON parsing error:', parseError);
              setUploadError("Error parsing the response");
            }
          } else {
            setUploadError("No text extracted or an error occurred.");
          }
        } else {
          setUploadError("Error: Something went wrong.");
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      } finally {
        setproofUploading(false);
      }
    }
  };

  const handleSave = (section: 'gst' | 'proof') => {
    if (section === 'gst') {
      setGstSaved(true);
      // Reset verification display
      setgstSubmitted(false);
    } else {
      setProofSaved(true);
      // Reset verification display
      setproofSubmitted(false);
    }
  };

  const handleTalkToSetu = (documentType: 'gst' | 'proof') => {
    setIsChatboxOpen(true);
    const extractedText = documentType === 'gst' ? gstExtractedText : proofExtractedText;
    const fileName = documentType === 'gst' ? gstCertificate?.name : proofDocument?.name;
    const documentTypeDisplay = documentType === 'gst' ? 'GST certificate' : 'proof of business document';
    
    const context = `I uploaded ${fileName} as ${documentTypeDisplay} but the verification failed. ${extractedText?.documents.reason_of_verification_failure ? `Reason: ${extractedText.documents.reason_of_verification_failure}` : ''}`;
    setChatContext(context);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Mobile menu buttons */}
      <div className="lg:hidden fixed top-4 left-4 z-50 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsChatboxOpen(!isChatboxOpen)}
          className="bg-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Button>
      </div>

      <div className="flex">
        {/* Left sidebar */}
        <div className={`sidebar fixed left-0 top-0 w-64 bg-white border-r border-gray-200 p-4 min-h-screen shadow-sm ${isSidebarOpen ? 'active' : ''}`}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Mobile verification</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Company registration details</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Authorised signatory</span>
            </div>
            <div className="flex items-center space-x-2 text-teal-500 bg-teal-50 p-2 rounded">
              <span>Company docs</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span>Business address</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span>Bank accounts</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="main-content flex-1 flex flex-col items-center bg-white">
          <h1 className="text-2xl font-semibold mb-8 w-full max-w-3xl px-8 pt-8">Company Documents</h1>
            
          {/* First Box */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl px-8"
          >
            <div className="bg-gray-50 shadow rounded-lg p-8 mb-6">
              <div className="space-y-6">

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-sm font-medium text-gray-600">Upload GST certificate</Label>
                        <Button variant="link" className="text-teal-500 p-0 h-auto font-normal text-sm">
                          Sample
                        </Button>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.docx"
                          onChange={(e) => handleFileUpload(e, 'gst')}
                          className="hidden"
                          id="gstCertificate"
                          disabled={gstUploading}
                        />
                        <div className="flex-1 bg-white rounded-md p-3 text-sm text-gray-600 border border-gray-200">
                          {gstUploading ? (
                            <div className="flex items-center space-x-2">
                              <svg className="animate-spin h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            gstCertificate?.name || 'No file chosen'
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          className="text-teal-500 border-teal-500 hover:bg-teal-50 h-12 bg-white" 
                          type="button"
                          disabled={gstUploading}
                          onClick={() => document.getElementById('gstCertificate')?.click()}
                        >
                          {gstUploading ? 'Uploading...' : 'Add file'}
                        </Button>
                      </div>
                      {uploadError && (
                        <p className="text-xs text-red-500 mt-1">
                          {uploadError}
                        </p>
                      )}
                        {gstSaved && (
                          <div className="mt-4 p-4 rounded-md bg-green-100 text-gray-800">
                            <p className="font-semibold flex items-center gap-2">
                              <span>✓</span> Document saved successfully
                            </p>
                          </div>
                        )}
                        {!gstSaved && gstSubmitted && gstExtractedText && (
                          gstExtractedText.documents.type === "unknown" || 
                          (gstExtractedText.documents.reason_of_verification_failure && gstExtractedText.documents.type !== "GST") ? (
                            <div className="mt-4 p-4 rounded-md bg-red-100 text-gray-800 relative">
                              <div className="pr-32">
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                  <span>❌</span> The verification was unsuccessful
                                </p>
                                <ul className="list-disc pl-8 text-sm space-y-1 mt-2">
                                  <li>
                                    <span className="font-medium">Document Identified:</span> {gstExtractedText.documents.type === "unknown" ? "Failed" : gstExtractedText.documents.type}
                                  </li>
                                  <li>
                                    <span className="font-medium">Fields Extracted:</span> {gstExtractedText.documents.name_of_entity ? "Name" : "None"}
                                  </li>
                                  {gstExtractedText.documents.reason_of_verification_failure && (
                                    <li className="break-words">
                                      <span className="font-medium">Reason:</span> {gstExtractedText.documents.reason_of_verification_failure}
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <button 
                                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-700"
                                onClick={() => handleTalkToSetu('gst')}
                              >
                                Talk to Setu
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 p-4 rounded-md bg-orange-100 text-gray-800 relative">
                              <p className="font-semibold mb-2 flex items-center gap-2">
                                <span>💡</span> The verification was successful
                              </p>
                              <p className="mb-1 text-sm pl-8 mt-2">
                                ☑️ <span className="font-medium">Document Identified:</span> {gstExtractedText.documents.type}
                              </p>
                              <p className="mb-1 text-sm pl-8">
                                ☑️ <span className="font-medium">Fields Extracted</span>
                              </p>
                              <p className="ml-6 text-sm pl-8">
                                <span className="font-medium">Name:</span> {gstExtractedText.documents.name_of_entity || "N/A"}
                              </p>
                              {gstExtractedText.documents.names_of_directors && gstExtractedText.documents.names_of_directors.length > 0 && (
                                <p className="ml-6 text-sm pl-8">
                                  <span className="font-medium">Directors:</span>{" "}
                                  {gstExtractedText.documents.names_of_directors.join(", ")}
                                </p>
                              )}
                            </div>
                          )
                        )}

                        {!gstCertificate && (
                        <p className="text-xs text-gray-500 mt-1">
                            Upload PDF, PNG, JPG or DOCX file with size less than 5MB
                        </p>
                        )}
                    </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    className="bg-teal-500 hover:bg-teal-600 text-white h-11 px-6 rounded-md"
                    onClick={() => handleSave('gst')}
                  >
                    Save
                  </Button>
                </div>
              </div>

            {/* <div className="bg-gray-50 shadow rounded-lg p-8 mb-8"> */}
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Proof of business</Label>
                  <Select defaultValue="registration">
                    <SelectTrigger className="w-full mt-1 h-12 text-base bg-white border-gray-200">
                      <SelectValue placeholder="Select proof of business" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registration">
                        Registration certificate, incl. Udyam Registration certificate
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-sm font-medium text-gray-600">Proof of business document</Label>
                    <Button variant="link" className="text-teal-500 p-0 h-auto font-normal text-sm">
                      Sample
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.docx"
                      onChange={(e) => handleFileUpload(e, 'proof')}
                      className="hidden"
                      id="proofDocument"
                      disabled={proofUploading}
                    />
                    <div className="flex-1 bg-white rounded-md p-3 text-sm text-gray-600 border border-gray-200">
                      {proofUploading ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        proofDocument?.name || 'No file chosen'
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-teal-500 border-teal-500 hover:bg-teal-50 h-12 bg-white" 
                      type="button"
                      disabled={proofUploading}
                      onClick={() => document.getElementById('proofDocument')?.click()}
                    >
                      {proofUploading ? 'Uploading...' : 'Add file'}
                    </Button>
                  </div>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadError}
                    </p>
                  )}
                    {proofSaved && (
                      <div className="mt-4 p-4 rounded-md bg-green-100 text-gray-800">
                        <p className="font-semibold flex items-center gap-2">
                          <span>✓</span> Document saved successfully
                        </p>
                      </div>
                    )}
                    {!proofSaved && proofSubmitted && proofExtractedText && (
                      proofExtractedText.documents.type === "unknown" || 
                      (proofExtractedText.documents.reason_of_verification_failure && !["COI", "Registration certificate"].includes(proofExtractedText.documents.type)) ? (
                        <div className="mt-4 p-4 rounded-md bg-red-100 text-gray-800 relative">
                          <div className="pr-32">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                              <span>❌</span> The verification was unsuccessful
                            </p>
                            <ul className="list-disc pl-8 text-sm space-y-1 mt-2">
                              <li>
                                <span className="font-medium">Document Identified:</span> {proofExtractedText.documents.type === "unknown" ? "Failed" : proofExtractedText.documents.type}
                              </li>
                              <li>
                                <span className="font-medium">Fields Extracted:</span> {proofExtractedText.documents.name_of_entity ? "Name" : "None"}
                              </li>
                              {proofExtractedText.documents.reason_of_verification_failure && (
                                <li className="break-words">
                                  <span className="font-medium">Reason:</span> {proofExtractedText.documents.reason_of_verification_failure}
                                </li>
                              )}
                            </ul>
                          </div>
                          <button 
                            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-700"
                            onClick={() => handleTalkToSetu('proof')}
                          >
                            Talk to Setu
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 rounded-md bg-orange-100 text-gray-800 relative">
                          <p className="font-semibold mb-2 flex items-center gap-2">
                            <span>💡</span> The verification was successful
                          </p>
                          <p className="mb-1 text-sm pl-8 mt-2">
                            ☑️ <span className="font-medium">Document Identified:</span> {proofExtractedText.documents.type}
                          </p>
                          <p className="mb-1 text-sm pl-8">
                            ☑️ <span className="font-medium">Fields Extracted</span>
                          </p>
                          <p className="ml-6 text-sm pl-8">
                            <span className="font-medium">Name:</span> {proofExtractedText.documents.name_of_entity || "N/A"}
                          </p>
                          {proofExtractedText.documents.names_of_directors && proofExtractedText.documents.names_of_directors.length > 0 && (
                            <p className="ml-6 text-sm pl-8">
                              <span className="font-medium">Directors:</span>{" "}
                              {proofExtractedText.documents.names_of_directors.join(", ")}
                            </p>
                          )}
                        </div>
                      )
                    )}

                        {!proofDocument && (
                        <p className="text-xs text-gray-500 mt-1">
                            Upload PDF, PNG, JPG or DOCX file with size less than 5MB
                        </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    className="bg-teal-500 hover:bg-teal-600 text-white h-11 px-6 rounded-md"
                    onClick={() => handleSave('proof')}
                  >
                    Save
                  </Button>
                </div>
              </div>
            {/* </div> */}
          </motion.div>
        </main>

        {/* ChatBox component */}
        <div className={`chatbox ${isChatboxOpen ? 'active' : ''}`}>
          <ChatBox initialMessage={chatContext} />
        </div>
      </div>
    </div>
  );
};

export default CompanyDocuments; 