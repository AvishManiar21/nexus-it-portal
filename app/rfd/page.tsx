"use client"

import Link from "next/link"
import { useState, ChangeEvent, FormEvent } from "react"
import {
  FRIENDLY_SUBMISSION_ERROR_MESSAGE,
  type RfdFormData as FormData,
  type RfdFormErrors as FormErrors,
  validateRfdForm,
} from "@/app/lib/formValidation"

const PRODUCT_OPTIONS = [
  "Cloud Infrastructure Suite",
  "Cybersecurity Shield",
  "AI Analytics Dashboard"
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
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || ""

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
          body: JSON.stringify({ ...formData, session_id: sessionId || null, website }),
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
    <>
      <section className="border-b border-line bg-canvas">
        <div className="container-page py-14 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">Request a demo</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">Tell us about your team and what you are looking for. We will tailor the walkthrough to your setup.</p>
        </div>
      </section>
      <section className="py-14 sm:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">1</span><span className="pt-0.5">We review your request within one business day.</span></li>
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">2</span><span className="pt-0.5">We schedule a walkthrough around your use case.</span></li>
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">3</span><span className="pt-0.5">You receive a written proposal and rollout plan.</span></li>
            </ol>
          </div>
          <div className="rounded-lg border border-line p-5">
            <p className="font-semibold text-ink">Just have a question?</p>
            <p className="mt-1">Send us a message instead. <Link href="/contact" className="font-semibold text-brand hover:text-brand-hover">Contact us</Link></p>
          </div>
        </aside>
        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">

          {isSubmitted && successMessage && (
            <div role="status" className="mb-6 rounded-md border border-green-300 bg-green-50 p-4">
              <p className="font-medium text-green-900">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="mb-6 rounded-md border border-red-300 bg-red-50 p-4">
              <p className="font-medium text-red-900">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Honeypot: visually hidden, so only bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            {/* Company Name */}
            <div>
              <label htmlFor="company" className="field-label">
                Company Name <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={errors.company ? "company-error" : undefined}
                className="field-input"
                placeholder="Enter your company name"
              />
              {errors.company && (
                <p id="company-error" className="field-error">{errors.company}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="field-label">
                Contact Person <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.contactPerson)}
                aria-describedby={errors.contactPerson ? "contactPerson-error" : undefined}
                className="field-input"
                placeholder="Enter your full name"
              />
              {errors.contactPerson && (
                <p id="contactPerson-error" className="field-error">{errors.contactPerson}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="field-label">
                Email <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="field-input"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p id="email-error" className="field-error">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="field-label">
                Phone <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className="field-input"
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p id="phone-error" className="field-error">{errors.phone}</p>
              )}
            </div>

            {/* Budget Range */}
            <div>
              <label htmlFor="budget" className="field-label">
                Budget Range <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={errors.budget ? "budget-error" : undefined}
                className="field-input"
              >
                <option value="">Select a budget range</option>
                <option value="Under $10,000">Under $10,000</option>
                <option value="$10,000 - $50,000">$10,000 - $50,000</option>
                <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                <option value="Over $100,000">Over $100,000</option>
              </select>
              {errors.budget && (
                <p id="budget-error" className="field-error">{errors.budget}</p>
              )}
            </div>

            {/* Products of Interest */}
            <fieldset>
              <legend className="field-label">Products of interest <span className="required-mark" aria-hidden="true">*</span></legend>
              <div
                aria-invalid={Boolean(errors.products)}
                aria-describedby={errors.products ? "products-error" : undefined}
                className={`space-y-1 rounded-md border p-2 ${errors.products ? "border-red-600" : "border-line"}`}
              >
                {PRODUCT_OPTIONS.map(product => (
                  <label key={product} className="flex min-h-11 cursor-pointer items-center rounded px-2 hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={formData.products.includes(product)}
                      onChange={() => handleProductChange(product)}
                      className="h-4 w-4 cursor-pointer accent-brand"
                    />
                    <span className="ml-3 text-ink">{product}</span>
                  </label>
                ))}
              </div>
              {errors.products && (
                <p id="products-error" className="field-error">{errors.products}</p>
              )}
            </fieldset>

            {/* Message */}
            <div>
              <label htmlFor="message" className="field-label">
                Message <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="field-input resize-y"
                placeholder="Tell us about your specific needs or questions..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? "Submitting..." : "Submit Demo Request"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
        </div>
      </section>
    </>
  )
}
