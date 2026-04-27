"use client"

import { useState, ChangeEvent, FormEvent } from "react"
import {
  FRIENDLY_SUBMISSION_ERROR_MESSAGE,
  type RfdFormData as FormData,
  type RfdFormErrors as FormErrors,
  validateRfdForm,
} from "@/app/lib/formValidation"

const PRODUCT_OPTIONS = [
  "Cloud Services",
  "Cybersecurity",
  "AI Analytics"
]

export default function RfdPage() {
  const [formData, setFormData] = useState<FormData>({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    budget: "",
    products: [],
    message: ""
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const { name, value } = target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errorMessage) {
      setErrorMessage("")
    }
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleProductChange = (product: string): void => {
    setFormData(prev => {
      const newProducts = prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
      return {
        ...prev,
        products: newProducts
      }
    })

    if (errorMessage) {
      setErrorMessage("")
    }
    
    if (errors.products) {
      setErrors(prev => ({
        ...prev,
        products: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors = validateRfdForm(formData)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (validateForm()) {
      setIsLoading(true)
      setSuccessMessage("")
      setErrorMessage("")

      try {
        const sessionId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("visitor_session_id="))
          ?.split("=")[1]

        const response = await fetch("/api/leads/submit-rfd", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, session_id: sessionId || null }),
        })

        const data = await response.json()

        if (!response.ok) {
          setErrorMessage(FRIENDLY_SUBMISSION_ERROR_MESSAGE)
          return
        }

        setSuccessMessage(data.message)
        setIsSubmitted(true)
        setFormData({
          company: "",
          contactPerson: "",
          email: "",
          phone: "",
          budget: "",
          products: [],
          message: ""
        })
        
        setTimeout(() => {
          setIsSubmitted(false)
          setSuccessMessage("")
        }, 5000)
      } catch (error) {
        setErrorMessage(FRIENDLY_SUBMISSION_ERROR_MESSAGE)
        console.error("Submission error:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClear = (): void => {
    setFormData({
      company: "",
      contactPerson: "",
      email: "",
      phone: "",
      budget: "",
      products: [],
      message: ""
    })
    setErrors({})
    setErrorMessage("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Demo</h1>
          <p className="text-gray-600 mb-8">
            Fill out the form below to schedule a demo with our team.
          </p>

          {isSubmitted && successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={errors.company ? "company-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.company ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your company name"
              />
              {errors.company && (
                <p id="company-error" className="text-red-500 text-sm mt-1">{errors.company}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.contactPerson)}
                aria-describedby={errors.contactPerson ? "contactPerson-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.contactPerson ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.contactPerson && (
                <p id="contactPerson-error" className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p id="phone-error" className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Budget Range */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budget Range <span className="text-red-500">*</span>
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={errors.budget ? "budget-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.budget ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a budget range</option>
                <option value="Under $10,000">Under $10,000</option>
                <option value="$10,000 - $50,000">$10,000 - $50,000</option>
                <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                <option value="Over $100,000">Over $100,000</option>
              </select>
              {errors.budget && (
                <p id="budget-error" className="text-red-500 text-sm mt-1">{errors.budget}</p>
              )}
            </div>

            {/* Products of Interest */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Products of Interest <span className="text-red-500">*</span>
              </label>
              <div
                aria-invalid={Boolean(errors.products)}
                aria-describedby={errors.products ? "products-error" : undefined}
                className={`space-y-2 rounded-lg border p-3 ${
                  errors.products ? "border-red-500" : "border-transparent"
                }`}
              >
                {PRODUCT_OPTIONS.map(product => (
                  <label key={product} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.products.includes(product)}
                      onChange={() => handleProductChange(product)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700">{product}</span>
                  </label>
                ))}
              </div>
              {errors.products && (
                <p id="products-error" className="text-red-500 text-sm mt-1">{errors.products}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                placeholder="Tell us about your specific needs or questions..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 font-medium py-2 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isLoading
                    ? "bg-blue-400 text-white cursor-not-allowed opacity-75"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                }`}
              >
                {isLoading ? "Submitting..." : "Submit Demo Request"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className={`font-medium py-2 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isLoading
                    ? "bg-gray-300 text-gray-800 cursor-not-allowed opacity-75"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-500"
                }`}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
