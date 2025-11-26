'use client';

import { useState } from 'react';
import { isValidEmail, isValidPhone, formatPhone } from '@/lib/utils/formatters';

interface ContactFormProps {
  reportId: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onSuccess: () => void;
}

export default function ContactForm({
  reportId,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  onSuccess,
}: ContactFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone ? formatPhone(defaultPhone) : '');
  const [preferredTime, setPreferredTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // For now, we'll just simulate the submission
      // In production, this would call an API to send an email
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setErrors({ form: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      setPhone(digits);
    } else if (digits.length <= 6) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
    } else {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-emerald-500/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Request Sent!</h3>
        <p className="text-emerald-100">
          We&apos;ll be in touch within 24 hours to schedule your inspection.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-slate-300 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 transition-all
                     ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="John Smith"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-slate-300 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="contact-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 transition-all
                     ${errors.email ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="john@example.com"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-red-400 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-300 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="contact-phone"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 transition-all
                     ${errors.phone ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="(555) 123-4567"
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Preferred Time */}
      <div>
        <label htmlFor="contact-time" className="block text-sm font-medium text-slate-300 mb-1">
          Preferred Contact Time <span className="text-slate-500">(optional)</span>
        </label>
        <select
          id="contact-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          disabled={isSubmitting}
        >
          <option value="">Any time</option>
          <option value="morning">Morning (8am - 12pm)</option>
          <option value="afternoon">Afternoon (12pm - 5pm)</option>
          <option value="evening">Evening (5pm - 8pm)</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-slate-300 mb-1">
          Additional Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2
                     focus:ring-emerald-500 transition-all resize-none"
          placeholder="Any specific concerns or questions?"
          disabled={isSubmitting}
        />
      </div>

      {/* Form error */}
      {errors.form && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errors.form}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600
                   text-white font-semibold rounded-lg shadow-lg
                   shadow-emerald-500/25 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Inspection
          </>
        )}
      </button>
    </form>
  );
}
