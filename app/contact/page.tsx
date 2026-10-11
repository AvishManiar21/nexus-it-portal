"use client"

import Link from "next/link"
import { useState, ChangeEvent, FormEvent } from "react"
import {
  FRIENDLY_SUBMISSION_ERROR_MESSAGE,
  type ContactFormData as FormData,
  type ContactFormErrors as FormErrors,
  validateContactForm,
} from "@/app/lib/formValidation"

const BUDGET_OPTIONS = [
  "$1,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000+"
]

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    budget: "",
    subject: "",
    message: ""
  })

  const [errors, setErrors] = useState<FormErrors>({})
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

  const validateForm = (): boolean => {
    const newErrors = validateContactForm(formData)
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

        const response = await fetch("/api/contact/submit", {
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
        setFormData({
          name: "",
          email: "",
          company: "",
          phone: "",
          budget: "",
          subject: "",
          message: ""
        })
        
        setTimeout(() => {
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
      name: "",
      email: "",
      company: "",
      phone: "",
      budget: "",
      subject: "",
      message: ""
    })
    setErrors({})
    setErrorMessage("")
  }

  return (
    <>
      <section className="border-b border-line bg-canvas">
        <div className="container-page py-14 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">Contact us</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">Questions about a solution, pricing or an existing deployment? Send us a message and we will get back to you.</p>
        </div>
      </section>
      <section className="py-14 sm:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">How we respond</h2>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">1</span><span className="pt-0.5">Every message is reviewed within one business day.</span></li>
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">2</span><span className="pt-0.5">You hear back from someone who can answer, not a ticket bot.</span></li>
              <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line font-heading text-sm font-semibold text-ink">3</span><span className="pt-0.5">We send a confirmation email as soon as you submit.</span></li>
            </ol>
          </div>
          <div className="rounded-lg border border-line p-5">
            <p className="font-semibold text-ink">Want to see a solution in action?</p>
            <p className="mt-1">Book a tailored walkthrough. <Link href="/rfd" className="font-semibold text-brand hover:text-brand-hover">Request a demo</Link></p>
          </div>
        </aside>
        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">

          {successMessage && (
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
            {/* Name */}
            <div>
              <label htmlFor="name" className="field-label">
                Name <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="field-input"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p id="name-error" className="field-error">{errors.name}</p>
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

            {/* Subject */}
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

            <div>
              <label htmlFor="phone" className="field-label">
                Phone <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
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
                <option value="">Select your budget range</option>
                {BUDGET_OPTIONS.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget}
                  </option>
                ))}
              </select>
              {errors.budget && (
                <p id="budget-error" className="field-error">{errors.budget}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="field-label">
                Subject <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? "subject-error" : undefined}
                className="field-input"
                placeholder="What is this about?"
              />
              {errors.subject && (
                <p id="subject-error" className="field-error">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="field-label">
                Message <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className="field-input"
                placeholder="Enter your message here..."
              />
              {errors.message && (
                <p id="message-error" className="field-error">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? "Sending..." : "Send Message"}
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
