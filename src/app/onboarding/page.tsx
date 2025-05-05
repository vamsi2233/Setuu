'use client';

import React, { useState } from 'react';

type Payload = {
  user: {
    name: string;
    email: string;
    password: string;
  };
  kyc: {
    pan_number: string;
    aadhaar: {
      number: string;
      linked_mobile?: string;
    };
    documents: {
      type: string;
      file_url: string;
    }[];
  };
  referral_code?: string;
};

const initialForm = {
  name: '',
  email: '',
  password: '',
  pan: '',
  aadhaar: '',
  addMobile: false,
  linkedMobile: '',
  passportUrl: '',
  referral: '',
};

export default function OnboardingForm() {
  const [form, setForm] = useState(initialForm);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [aiError, setAiError] = useState<{ reason: string; solution: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);



  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'addMobile' && !checked ? { linkedMobile: '' } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const out: Payload = {
      user: {
        name: form.name,
        email: form.email,
        password: form.password,
      },
      kyc: {
        pan_number: form.pan,
        aadhaar: {
          number: form.aadhaar,
          ...(form.addMobile && form.linkedMobile
            ? { linked_mobile: form.linkedMobile }
            : {}),
        },
        documents: [
          {
            type: 'passport',
            file_url: form.passportUrl,
          },
        ],
      },
      ...(form.referral.trim() ? { referral_code: form.referral.trim() } : {}),
    };

    try {
      const res = await fetch('http://0.0.0.0:8000/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(out),
      });
      console.log(res);
      if (!res.ok) {
        setSuccessMsg(null);
        if (res.status === 422) {
          const aiResp = await res.json();
          setAiError(aiResp); // { reason, solution }
        } else {
          throw new Error('Unexpected error');
        }
      } else {
        setPayload(out);  // show payload only on success
        setAiError(null); // clear AI errors
        setSuccessMsg('Your details are successfully updated!');
      }
    } catch (err) {
      setSuccessMsg(null);
      console.error(err);
      setAiError({
        reason: 'Server error',
        solution: 'Please try again later or contact support.',
      });
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-white p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-teal-100">
        <h2 className="text-3xl font-bold text-teal-700 text-center mb-8 tracking-tight">
          Onboarding
        </h2>
        {successMsg && (
          <div className="bg-green-100 border-l-4 border-green-400 text-green-700 p-4 mb-6 rounded">
            {successMsg}
          </div>
        )}
        <form className="space-y-7" onSubmit={handleSubmit} autoComplete="off">
          {/* User Details */}
          <div>
            <h3 className="text-lg font-semibold text-teal-600 mb-3">User Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          {/* KYC Section */}
          <div>
            <h3 className="text-lg font-semibold text-teal-600 mb-3">KYC</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="pan">
                  PAN Number
                </label>
                <input
                  id="pan"
                  name="pan"
                  type="text"
                  required
                  className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.pan}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="aadhaar">
                  Aadhaar Number
                </label>
                <input
                  id="aadhaar"
                  name="aadhaar"
                  type="text"
                  required
                  className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.aadhaar}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="addMobile"
                  name="addMobile"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-400"
                  checked={form.addMobile}
                  onChange={handleChange}
                />
                <label htmlFor="addMobile" className="text-sm text-gray-700">
                  Add Linked Mobile Number
                </label>
              </div>
              {form.addMobile && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="linkedMobile">
                    Linked Mobile Number
                  </label>
                  <input
                    id="linkedMobile"
                    name="linkedMobile"
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={form.linkedMobile}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold text-teal-600 mb-3">Documents</h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="passportUrl">
                Passport Document (URL)
              </label>
              <input
                id="passportUrl"
                name="passportUrl"
                type="url"
                required
                placeholder="https://..."
                className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.passportUrl}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* Referral Code */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="referral">
              Referral Code (Optional)
            </label>
            <input
              id="referral"
              name="referral"
              type="text"
              className="w-full border border-teal-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={form.referral}
              onChange={handleChange}
            />
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold py-2 rounded-lg shadow hover:from-teal-600 hover:to-blue-600 transition"
          >
            Submit
          </button>
        </form>
        {aiError && (
          <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 p-4 mt-6 rounded">
            <p className="font-semibold mb-1">AI Explanation:</p>
            <p className="mb-1"><strong>Reason:</strong> {aiError.reason}</p>
            <p><strong>Solution:</strong> {aiError.solution}</p>
          </div>
        )}
      </div>
    </div>
  );
}