"use client"

import { useState, ChangeEvent, FormEvent } from "react"

interface FormData {
  company: string
  contactPerson: string
  email: string
  phone: string
  budget: string
  products: string[]
  message: string
}

interface FormErrors {
  company?: string
  contactPerson?: string
  email?: string
  phone?: string
  budget?: string
  products?: string
  message?: string
}

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
    
    if (errors.products) {
      setErrors(prev => ({
        ...prev,
        products: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required"
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required"
    }

    if (!formData.budget) {
      newErrors.budget = "Budget range is required"
    }

    if (formData.products.length === 0) {
      newErrors.products = "Please select at least one product"
    }

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
        const response = await fetch("/api/leads/submit-rfd", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setErrorMessage(data.detail || "Failed to submit form. Please try again.")
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
        setErrorMessage("An error occurred while submitting the form. Please try again.")
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.company ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your company name"
              />
              {errors.company && (
                <p className="text-red-500 text-sm mt-1">{errors.company}</p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.contactPerson ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
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
                <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
              )}
            </div>

            {/* Products of Interest */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Products of Interest <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
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
                <p className="text-red-500 text-sm mt-1">{errors.products}</p>
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